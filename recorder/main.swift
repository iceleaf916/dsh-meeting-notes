// 会议记录插件 · macOS 录音辅助程序
//
// 采集源：
//   - 系统音频：ScreenCaptureKit（SCStream，capturesAudio = true）
//   - 麦克风：AVAudioEngine inputNode tap
// 处理：逐源降混单声道 → 重采样到目标采样率（默认 16kHz）→ 逐样本相加并 clamp 到 [-1,1]
// 输出：stdout 裸 PCM（s16le，默认 16000 Hz 单声道，无任何分块头）
// 状态：stderr JSON lines（ready / level / error / stopped），每行一个合法 JSON 对象
//
// 注意：CLI 没有 main run loop，所以全部用 DispatchQueue + DispatchSemaphore，
// 不要用 DispatchQueue.main.asyncAfter（不会触发）。

import AVFoundation
import CoreGraphics
import CoreMedia
import Darwin
import Foundation
import ScreenCaptureKit

// MARK: - 错误

struct RecorderFailure: Error {
    let message: String
    init(_ message: String) { self.message = message }
}

// MARK: - stderr JSON 日志

enum JSONLog {
    private static let lock = NSLock()

    static func emit(_ object: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(object),
              let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
        else { return }
        var payload = data
        payload.append(0x0A)
        lock.lock()
        defer { lock.unlock() }
        payload.withUnsafeBytes { rawBuffer in
            guard let base = rawBuffer.baseAddress else { return }
            var offset = 0
            while offset < rawBuffer.count {
                let written = Darwin.write(STDERR_FILENO, base.advanced(by: offset), rawBuffer.count - offset)
                if written > 0 {
                    offset += written
                    continue
                }
                if written < 0 && errno == EINTR { continue }
                return
            }
        }
    }

    static func ready(system: Bool, mic: Bool, sampleRate: Int) {
        emit(["type": "ready", "system": system, "mic": mic, "sampleRate": sampleRate])
    }

    static func level(system: Double, mic: Double, rms: Double) {
        emit(["type": "level", "system": system, "mic": mic, "rms": rms])
    }

    static func failure(_ message: String) {
        emit(["type": "error", "message": message])
    }

    static func stopped() {
        emit(["type": "stopped"])
    }
}

private func roundLevel(_ value: Double) -> Double {
    guard value.isFinite else { return 0 }
    let clamped = min(1.0, max(0.0, value))
    return (clamped * 10_000).rounded() / 10_000
}

// MARK: - 采样队列

/// 线程安全的 Float32 采样 FIFO（供「采集回调写入 / 混音线程读取」跨线程使用）。
final class SampleQueue {
    private let lock = NSLock()
    private var storage: [Float] = []
    private var head = 0

    init() { storage.reserveCapacity(64 * 1024) }

    func append(_ samples: [Float]) {
        guard !samples.isEmpty else { return }
        lock.lock()
        storage.append(contentsOf: samples)
        compactLocked()
        lock.unlock()
    }

    var available: Int {
        lock.lock()
        defer { lock.unlock() }
        return storage.count - head
    }

    func take(_ count: Int) -> [Float] {
        lock.lock()
        defer { lock.unlock() }
        let n = min(max(count, 0), storage.count - head)
        guard n > 0 else { return [] }
        let result = Array(storage[head..<(head + n)])
        head += n
        compactLocked()
        return result
    }

    private func compactLocked() {
        if head >= 64 * 1024 || (head > 0 && head == storage.count) {
            storage.removeFirst(head)
            head = 0
        }
    }
}

// MARK: - 电平表

/// 累计平方和，约 10Hz 取出一次计算 RMS。
final class LevelMeter {
    private let lock = NSLock()
    private var sumSquares: Double = 0
    private var sampleCount: Int = 0

    func add(_ samples: [Float]) {
        guard !samples.isEmpty else { return }
        var sum = 0.0
        for value in samples {
            let d = Double(value)
            sum += d * d
        }
        lock.lock()
        sumSquares += sum
        sampleCount += samples.count
        lock.unlock()
    }

    func take() -> (sumSquares: Double, sampleCount: Int) {
        lock.lock()
        defer { lock.unlock() }
        let result = (sumSquares: sumSquares, sampleCount: sampleCount)
        sumSquares = 0
        sampleCount = 0
        return result
    }
}

// MARK: - 重采样（源采样率 → 目标采样率）

protocol Resampler: AnyObject {
    func process(_ input: [Float]) -> [Float]
}

/// 整数比降采样：每 factor 个样本取平均。48000 → 16000 即 factor = 3。
final class AverageDecimator: Resampler {
    private let factor: Int
    private var accumulator: Float = 0
    private var pending = 0

    init(factor: Int) {
        self.factor = max(1, factor)
    }

    func process(_ input: [Float]) -> [Float] {
        guard factor > 1 else { return input }
        var output: [Float] = []
        output.reserveCapacity(input.count / factor + 1)
        for value in input {
            accumulator += value
            pending += 1
            if pending == factor {
                output.append(accumulator / Float(factor))
                accumulator = 0
                pending = 0
            }
        }
        return output
    }
}

/// 非整数比重采样：线性插值。44100 → 16000 等场景使用。
final class LinearResampler: Resampler {
    private let step: Double
    private var pending: [Float] = []
    private var position: Double = 0

    init(step: Double) {
        self.step = step > 0 ? step : 1
    }

    func process(_ input: [Float]) -> [Float] {
        guard !input.isEmpty else { return [] }
        pending.append(contentsOf: input)
        var output: [Float] = []
        output.reserveCapacity(Int(Double(pending.count) / step) + 2)
        while true {
            let index = Int(position)
            if index + 1 >= pending.count { break }
            let fraction = Float(position - Double(index))
            output.append(pending[index] * (1 - fraction) + pending[index + 1] * fraction)
            position += step
        }
        let drop = Int(position)
        if drop > 0 && drop <= pending.count {
            pending.removeFirst(drop)
            position -= Double(drop)
        }
        return output
    }
}

func makeResampler(sourceRate: Double, destinationRate: Int) -> Resampler {
    guard sourceRate > 0, destinationRate > 0, abs(sourceRate - Double(destinationRate)) > 0.5 else {
        return AverageDecimator(factor: 1)
    }
    let ratio = sourceRate / Double(destinationRate)
    if ratio >= 1 {
        let rounded = ratio.rounded()
        if abs(ratio - rounded) < 1e-9 {
            return AverageDecimator(factor: Int(rounded))
        }
    }
    return LinearResampler(step: ratio)
}

// MARK: - 降混单声道

enum MonoDownmixer {
    /// 把任意 Float32 / Int16 PCM 缓冲降混成单声道 Float32（各声道取平均）。
    static func mono(_ buffer: AVAudioPCMBuffer) -> [Float]? {
        let frames = Int(buffer.frameLength)
        guard frames > 0 else { return [] }
        let format = buffer.format
        let channels = Int(format.channelCount)
        guard channels > 0 else { return nil }

        var output = [Float](repeating: 0, count: frames)

        switch format.commonFormat {
        case .pcmFormatFloat32:
            guard let data = buffer.floatChannelData else { return nil }
            if format.isInterleaved {
                let pointer = data[0]
                for frame in 0..<frames {
                    var sum: Float = 0
                    for channel in 0..<channels { sum += pointer[frame * channels + channel] }
                    output[frame] = sum / Float(channels)
                }
            } else {
                for channel in 0..<channels {
                    let pointer = data[channel]
                    for frame in 0..<frames { output[frame] += pointer[frame] }
                }
                let scale = 1 / Float(channels)
                for frame in 0..<frames { output[frame] *= scale }
            }
            return output

        case .pcmFormatInt16:
            guard let data = buffer.int16ChannelData else { return nil }
            let scale = 1 / Float(Int16.max)
            if format.isInterleaved {
                let pointer = data[0]
                for frame in 0..<frames {
                    var sum: Float = 0
                    for channel in 0..<channels { sum += Float(pointer[frame * channels + channel]) }
                    output[frame] = sum * scale / Float(channels)
                }
            } else {
                for channel in 0..<channels {
                    let pointer = data[channel]
                    for frame in 0..<frames { output[frame] += Float(pointer[frame]) * scale }
                }
                let scale2 = 1 / Float(channels)
                for frame in 0..<frames { output[frame] *= scale2 }
            }
            return output

        default:
            return nil
        }
    }
}

// MARK: - 单个采集源的转换管线

final class AudioPath {
    let queue = SampleQueue()
    let meter = LevelMeter()
    private let destinationRate: Int
    private var resampler: Resampler?
    private var sourceRate: Double = 0

    init(destinationRate: Int) {
        self.destinationRate = destinationRate
    }

    /// 返回 false 表示出现了不支持的音频格式。
    @discardableResult
    func feed(_ buffer: AVAudioPCMBuffer) -> Bool {
        guard let mono = MonoDownmixer.mono(buffer) else { return false }
        if mono.isEmpty { return true }
        meter.add(mono)
        let rate = buffer.format.sampleRate
        if resampler == nil || abs(rate - sourceRate) > 0.5 {
            sourceRate = rate
            resampler = makeResampler(sourceRate: rate, destinationRate: destinationRate)
        }
        guard let converted = resampler?.process(mono), !converted.isEmpty else { return true }
        queue.append(converted)
        return true
    }
}

// MARK: - stdout PCM 写入

final class PCMWriter {
    private let lock = NSLock()
    private(set) var framesWritten = 0
    var onError: (() -> Void)?

    /// 写入混音后的 Float32 样本（内部 clamp 到 [-1,1] 后转 s16le）。
    func write(_ samples: [Float]) {
        guard !samples.isEmpty else { return }
        var pcm = [Int16](repeating: 0, count: samples.count)
        for index in 0..<samples.count {
            var value = samples[index]
            if value.isNaN {
                value = 0
            } else if value > 1 {
                value = 1
            } else if value < -1 {
                value = -1
            }
            pcm[index] = Int16((value * 32_767.0).rounded())
        }
        let ok = writeAll(pcm)
        lock.lock()
        if ok { framesWritten += pcm.count }
        lock.unlock()
        if !ok { onError?() }
    }

    private func writeAll(_ pcm: [Int16]) -> Bool {
        var failed = false
        pcm.withUnsafeBufferPointer { buffer in
            guard let base = buffer.baseAddress else { return }
            let byteCount = buffer.count * MemoryLayout<Int16>.size
            base.withMemoryRebound(to: UInt8.self, capacity: byteCount) { bytes in
                var offset = 0
                while offset < byteCount {
                    let written = Darwin.write(STDOUT_FILENO, bytes + offset, byteCount - offset)
                    if written > 0 {
                        offset += written
                        continue
                    }
                    if written < 0 && errno == EINTR { continue }
                    failed = true
                    return
                }
            }
        }
        return !failed
    }
}

// MARK: - 混音线程

final class Mixer {
    private let systemQueue: SampleQueue?
    private let micQueue: SampleQueue?
    private let writer: PCMWriter
    private let stateLock = NSLock()
    private var draining = false
    let drained = DispatchSemaphore(value: 0)

    init(systemQueue: SampleQueue?, micQueue: SampleQueue?, writer: PCMWriter) {
        self.systemQueue = systemQueue
        self.micQueue = micQueue
        self.writer = writer
    }

    func beginDrain() {
        stateLock.lock()
        draining = true
        stateLock.unlock()
    }

    func run() {
        while true {
            stateLock.lock()
            let finish = draining
            stateLock.unlock()

            let systemAvailable = systemQueue?.available ?? 0
            let micAvailable = micQueue?.available ?? 0

            if finish {
                // 收尾阶段：有多少写完多少，缺的一路补 0，保证不丢尾音
                let frames = max(systemAvailable, micAvailable)
                if frames <= 0 { break }
                emit(frames: frames)
                continue
            }

            let frames: Int
            if systemQueue != nil && micQueue != nil {
                frames = min(systemAvailable, micAvailable)
            } else {
                frames = max(systemAvailable, micAvailable)
            }
            if frames <= 0 {
                usleep(2_000)
                continue
            }
            emit(frames: frames)
        }
        drained.signal()
    }

    private func emit(frames: Int) {
        var mixed = [Float](repeating: 0, count: frames)
        if let queue = systemQueue {
            let samples = queue.take(frames)
            for index in 0..<samples.count { mixed[index] += samples[index] }
        }
        if let queue = micQueue {
            let samples = queue.take(frames)
            for index in 0..<samples.count { mixed[index] += samples[index] }
        }
        writer.write(mixed)
    }
}

// MARK: - 录音器

final class Recorder: NSObject, SCStreamOutput, SCStreamDelegate {
    struct Config {
        let sampleRate: Int
        let captureSystem: Bool
        let captureMic: Bool
    }

    private let config: Config
    private let writer: PCMWriter
    private let systemPath: AudioPath?
    private let micPath: AudioPath?
    private let mixer: Mixer

    private let audioQueue = DispatchQueue(label: "meeting-recorder.audio", qos: .userInteractive)
    private let screenQueue = DispatchQueue(label: "meeting-recorder.screen", qos: .utility)
    private let controlQueue = DispatchQueue(label: "meeting-recorder.control")
    private let levelQueue = DispatchQueue(label: "meeting-recorder.level")
    private let stateLock = NSLock()

    private var isStopping = false
    private var didShutdown = false
    private var formatProblemReported = false
    private var mixerStarted = false
    private var captureStarted = false
    private var hasReady = false

    private var stream: SCStream?
    private var engine: AVAudioEngine?
    private var tapInstalled = false
    private var levelTimer: DispatchSourceTimer?
    private var sigintSource: DispatchSourceSignal?
    private var sigtermSource: DispatchSourceSignal?
    private var stdinThread: Thread?

    init(config: Config) {
        self.config = config
        let writer = PCMWriter()
        self.writer = writer
        let systemPath = config.captureSystem ? AudioPath(destinationRate: config.sampleRate) : nil
        let micPath = config.captureMic ? AudioPath(destinationRate: config.sampleRate) : nil
        self.systemPath = systemPath
        self.micPath = micPath
        self.mixer = Mixer(systemQueue: systemPath?.queue, micQueue: micPath?.queue, writer: writer)
        super.init()
        writer.onError = { [weak self] in
            // stdout 被对端关闭（EPIPE）：Host 已不需要数据，按停止处理
            self?.requestStop()
        }
    }

    // MARK: 启动

    func start() throws {
        // 先装信号处理器：启动过程中收到 SIGINT/SIGTERM 也能优雅退出
        installSignalHandlers()

        if config.captureSystem { try startSystemAudio() }
        if config.captureMic { try startMicrophone() }

        stateLock.lock()
        captureStarted = true
        let stoppingEarly = isStopping
        if !stoppingEarly { mixerStarted = true }
        stateLock.unlock()
        guard !stoppingEarly else { return }

        // 采集已起来后再接管 stdin：停止指令会先缓冲在管道里，不会丢
        installStdinReader()

        DispatchQueue.global(qos: .userInitiated).async { [mixer] in
            mixer.run()
        }

        stateLock.lock()
        hasReady = true
        stateLock.unlock()
        JSONLog.ready(system: config.captureSystem, mic: config.captureMic, sampleRate: config.sampleRate)
        startLevelTimer()
    }

    private func startSystemAudio() throws {
        if !CGPreflightScreenCaptureAccess() {
            _ = CGRequestScreenCaptureAccess()
        }

        let contentSemaphore = DispatchSemaphore(value: 0)
        var shareableContent: SCShareableContent?
        var contentError: Error?
        SCShareableContent.getExcludingDesktopWindows(false, onScreenWindowsOnly: false) { content, error in
            shareableContent = content
            contentError = error
            contentSemaphore.signal()
        }
        if contentSemaphore.wait(timeout: .now() + 15) == .timedOut {
            throw RecorderFailure("获取屏幕共享内容超时，请检查「系统设置 → 隐私与安全性 → 屏幕录制」权限。")
        }
        if let error = contentError {
            throw RecorderFailure("无法访问系统音频（屏幕录制权限未授权或 ScreenCaptureKit 不可用）：\(error.localizedDescription)")
        }
        guard let display = shareableContent?.displays.first else {
            throw RecorderFailure("没有找到可用的显示器，无法采集系统音频。")
        }

        let filter = SCContentFilter(display: display, excludingWindows: [])
        let configuration = SCStreamConfiguration()
        configuration.width = 16
        configuration.height = 16
        configuration.minimumFrameInterval = CMTime(value: 1, timescale: 1)
        configuration.showsCursor = false
        configuration.capturesAudio = true
        configuration.excludesCurrentProcessAudio = false
        configuration.sampleRate = 48_000
        configuration.channelCount = 2

        let stream = SCStream(filter: filter, configuration: configuration, delegate: self)
        do {
            try stream.addStreamOutput(self, type: .audio, sampleHandlerQueue: audioQueue)
            // 需要同时注册 screen 输出，否则部分系统上音频流不启动
            try stream.addStreamOutput(self, type: .screen, sampleHandlerQueue: screenQueue)
        } catch {
            throw RecorderFailure("注册系统音频输出失败：\(error.localizedDescription)")
        }

        let startSemaphore = DispatchSemaphore(value: 0)
        var startError: Error?
        stream.startCapture { error in
            startError = error
            startSemaphore.signal()
        }
        if startSemaphore.wait(timeout: .now() + 15) == .timedOut {
            throw RecorderFailure("启动系统音频采集超时，请检查「屏幕录制」权限。")
        }
        if let error = startError {
            throw RecorderFailure("启动系统音频采集失败：\(error.localizedDescription)")
        }
        self.stream = stream
    }

    private func startMicrophone() throws {
        let accessSemaphore = DispatchSemaphore(value: 0)
        var granted = false
        AVCaptureDevice.requestAccess(for: .audio) { allowed in
            granted = allowed
            accessSemaphore.signal()
        }
        if accessSemaphore.wait(timeout: .now() + 60) == .timedOut {
            throw RecorderFailure("等待麦克风权限超时，请在 系统设置 → 隐私与安全性 → 麦克风 中检查权限。")
        }
        guard granted else {
            throw RecorderFailure("未获得麦克风权限。请在 系统设置 → 隐私与安全性 → 麦克风 中允许当前应用后重试。")
        }

        let engine = AVAudioEngine()
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        guard format.channelCount > 0, format.sampleRate > 0 else {
            throw RecorderFailure("没有检测到可用的麦克风输入设备。")
        }

        input.installTap(onBus: 0, bufferSize: 4_800, format: format) { [weak self] buffer, _ in
            guard let self else { return }
            if self.micPath?.feed(buffer) == false {
                self.reportFormatProblem("不支持的麦克风音频格式（需要 Float32 或 Int16 PCM）。")
            }
        }
        engine.prepare()
        do {
            try engine.start()
        } catch {
            throw RecorderFailure("启动麦克风采集失败：\(error.localizedDescription)")
        }
        self.engine = engine
        self.tapInstalled = true
    }

    // MARK: 电平上报（约 10Hz）

    private func startLevelTimer() {
        let timer = DispatchSource.makeTimerSource(queue: levelQueue)
        timer.schedule(deadline: .now() + 0.1, repeating: 0.1, leeway: .milliseconds(5))
        timer.setEventHandler { [weak self] in self?.emitLevel() }
        timer.resume()
        levelTimer = timer
    }

    private func emitLevel() {
        let systemStats = systemPath?.meter.take() ?? (sumSquares: 0.0, sampleCount: 0)
        let micStats = micPath?.meter.take() ?? (sumSquares: 0.0, sampleCount: 0)
        let totalCount = systemStats.sampleCount + micStats.sampleCount
        let systemLevel = systemStats.sampleCount > 0
            ? (systemStats.sumSquares / Double(systemStats.sampleCount)).squareRoot()
            : 0
        let micLevel = micStats.sampleCount > 0
            ? (micStats.sumSquares / Double(micStats.sampleCount)).squareRoot()
            : 0
        let combined = totalCount > 0
            ? ((systemStats.sumSquares + micStats.sumSquares) / Double(totalCount)).squareRoot()
            : 0
        JSONLog.level(system: roundLevel(systemLevel), mic: roundLevel(micLevel), rms: roundLevel(combined))
    }

    // MARK: 输入（stdin / 信号）

    private func installSignalHandlers() {
        signal(SIGPIPE, SIG_IGN)
        signal(SIGINT, SIG_IGN)
        signal(SIGTERM, SIG_IGN)

        let signalQueue = DispatchQueue(label: "meeting-recorder.signals")
        let interruptSource = DispatchSource.makeSignalSource(signal: SIGINT, queue: signalQueue)
        interruptSource.setEventHandler { [weak self] in self?.requestStop() }
        interruptSource.resume()
        sigintSource = interruptSource

        let terminateSource = DispatchSource.makeSignalSource(signal: SIGTERM, queue: signalQueue)
        terminateSource.setEventHandler { [weak self] in self?.requestStop() }
        terminateSource.resume()
        sigtermSource = terminateSource
    }

    /// 读取 stdin 上的控制命令（每行一个 JSON，目前支持 {"cmd":"stop"}）；EOF 即停止。
    private func installStdinReader() {
        let thread = Thread { [weak self] in self?.readStdinLoop() }
        thread.name = "meeting-recorder.stdin"
        thread.start()
        stdinThread = thread
    }

    private func readStdinLoop() {
        var buffer = [UInt8](repeating: 0, count: 4_096)
        var pending: [UInt8] = []
        while true {
            let count = read(STDIN_FILENO, &buffer, buffer.count)
            if count == 0 {
                // stdin EOF：Host 已不再控制，按停止处理
                requestStop()
                return
            }
            if count < 0 {
                if errno == EINTR { continue }
                requestStop()
                return
            }
            pending.append(contentsOf: buffer[0..<count])
            while let newlineIndex = pending.firstIndex(of: 0x0A) {
                let lineBytes = Array(pending[0..<newlineIndex])
                pending.removeFirst(newlineIndex + 1)
                handleCommandLine(String(decoding: lineBytes, as: UTF8.self))
            }
            if pending.count > 65_536 { pending.removeAll(keepingCapacity: true) }
        }
    }

    private func handleCommandLine(_ line: String) {
        let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        guard let data = trimmed.data(using: .utf8),
              let raw = try? JSONSerialization.jsonObject(with: data),
              let object = raw as? [String: Any]
        else { return }
        if let command = object["cmd"] as? String, command == "stop" {
            requestStop()
        }
    }

    // MARK: 停止

    func requestStop() {
        stateLock.lock()
        if isStopping {
            stateLock.unlock()
            return
        }
        isStopping = true
        stateLock.unlock()
        controlQueue.async { [self] in shutdown(exitCode: 0, errorMessage: nil) }
    }

    func fail(_ message: String) {
        stateLock.lock()
        if isStopping {
            stateLock.unlock()
            return
        }
        isStopping = true
        stateLock.unlock()
        controlQueue.async { [self] in shutdown(exitCode: 1, errorMessage: message) }
    }

    private func reportFormatProblem(_ message: String) {
        stateLock.lock()
        if formatProblemReported {
            stateLock.unlock()
            return
        }
        formatProblemReported = true
        stateLock.unlock()
        fail(message)
    }

    private func shutdown(exitCode: Int32, errorMessage: String?) {
        stateLock.lock()
        let alreadyDone = didShutdown
        didShutdown = true
        stateLock.unlock()
        if alreadyDone {
            exit(exitCode)
        }

        stateLock.lock()
        let capturesStarted = captureStarted
        let readyEmitted = hasReady
        let shouldDrain = mixerStarted
        stateLock.unlock()

        levelTimer?.cancel()
        levelTimer = nil

        if let stream = self.stream {
            let semaphore = DispatchSemaphore(value: 0)
            stream.stopCapture { _ in semaphore.signal() }
            _ = semaphore.wait(timeout: .now() + 3)
            self.stream = nil
        }
        if let engine = self.engine {
            if tapInstalled {
                engine.inputNode.removeTap(onBus: 0)
                tapInstalled = false
            }
            engine.stop()
            self.engine = nil
        }

        if shouldDrain {
            mixer.beginDrain()
            _ = mixer.drained.wait(timeout: .now() + 5)
        }

        if let errorMessage {
            JSONLog.failure(errorMessage)
        } else {
            if capturesStarted && !readyEmitted {
                JSONLog.ready(system: config.captureSystem, mic: config.captureMic, sampleRate: config.sampleRate)
            }
            JSONLog.stopped()
        }
        exit(exitCode)
    }

    // MARK: SCStreamOutput / SCStreamDelegate

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of outputType: SCStreamOutputType) {
        guard outputType == .audio else { return }
        guard CMSampleBufferDataIsReady(sampleBuffer) else { return }
        guard let formatDescription = CMSampleBufferGetFormatDescription(sampleBuffer),
              let asbdPointer = CMAudioFormatDescriptionGetStreamBasicDescription(formatDescription)
        else { return }
        var asbd = asbdPointer.pointee
        let frameCount = CMSampleBufferGetNumSamples(sampleBuffer)
        guard frameCount > 0 else { return }
        guard let format = AVAudioFormat(streamDescription: &asbd),
              let pcm = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frameCount)),
              let systemPath = self.systemPath
        else {
            reportFormatProblem("系统音频格式无法解析（ScreenCaptureKit 返回了未知的音频格式）。")
            return
        }
        pcm.frameLength = AVAudioFrameCount(frameCount)
        let status = CMSampleBufferCopyPCMDataIntoAudioBufferList(
            sampleBuffer,
            at: 0,
            frameCount: Int32(frameCount),
            into: pcm.mutableAudioBufferList
        )
        guard status == noErr else { return }
        if systemPath.feed(pcm) == false {
            reportFormatProblem("不支持的系统音频格式（需要 Float32 或 Int16 PCM）。")
        }
    }

    func stream(_ stream: SCStream, didStopWithError error: Error) {
        stateLock.lock()
        let stopping = isStopping
        stateLock.unlock()
        if stopping { return }
        fail("系统音频采集中断：\(error.localizedDescription)")
    }
}

// MARK: - 命令行参数

struct Options {
    var sampleRate = 16_000
    var captureSystem = true
    var captureMic = true
    var showHelp = false
}

func parseArguments(_ arguments: [String]) throws -> Options {
    var options = Options()
    var index = 0

    func nextValue(for flag: String) throws -> String {
        index += 1
        guard index < arguments.count else {
            throw RecorderFailure("参数 \(flag) 缺少取值。")
        }
        return arguments[index]
    }

    func booleanValue(_ raw: String, flag: String) throws -> Bool {
        switch raw.lowercased() {
        case "1", "true", "yes", "on": return true
        case "0", "false", "no", "off": return false
        default: throw RecorderFailure("参数 \(flag) 只接受 0 或 1，收到：\(raw)")
        }
    }

    while index < arguments.count {
        let argument = arguments[index]
        var flag = argument
        var inlineValue: String?
        if let equals = argument.firstIndex(of: "=") {
            flag = String(argument[argument.startIndex..<equals])
            inlineValue = String(argument[argument.index(after: equals)...])
        }

        switch flag {
        case "-h", "--help":
            options.showHelp = true
        case "--system":
            let raw: String
            if let inlineValue { raw = inlineValue } else { raw = try nextValue(for: flag) }
            options.captureSystem = try booleanValue(raw, flag: flag)
        case "--mic":
            let raw: String
            if let inlineValue { raw = inlineValue } else { raw = try nextValue(for: flag) }
            options.captureMic = try booleanValue(raw, flag: flag)
        case "--sample-rate":
            let raw: String
            if let inlineValue { raw = inlineValue } else { raw = try nextValue(for: flag) }
            guard let rate = Int(raw), rate >= 8_000, rate <= 48_000 else {
                throw RecorderFailure("参数 --sample-rate 取值无效：\(raw)（支持 8000-48000）")
            }
            options.sampleRate = rate
        default:
            throw RecorderFailure("未知参数：\(argument)")
        }
        index += 1
    }
    return options
}

// MARK: - 入口

let helpText = """
用法：meeting-recorder [--sample-rate 16000] [--system 0|1] [--mic 0|1]

  --sample-rate  输出采样率（8000-48000，默认 16000）
  --system       是否采集系统音频（ScreenCaptureKit，默认 1）
  --mic          是否采集麦克风（AVAudioEngine，默认 1）

stdout：裸 PCM（s16le / 单声道 / --sample-rate 指定采样率）
stderr：JSON lines（ready / level / error / stopped）
停止：stdin 收到 {"cmd":"stop"}、stdin EOF、SIGINT 或 SIGTERM
"""

let options: Options
do {
    options = try parseArguments(Array(CommandLine.arguments.dropFirst()))
} catch let failure as RecorderFailure {
    JSONLog.failure(failure.message)
    exit(2)
} catch {
    JSONLog.failure("参数解析失败：\(error.localizedDescription)")
    exit(2)
}

if options.showHelp {
    FileHandle.standardError.write(Data(helpText.utf8))
    exit(0)
}

guard options.captureSystem || options.captureMic else {
    JSONLog.failure("系统音频与麦克风都被关闭，无法录音（--system 0 --mic 0）。")
    exit(2)
}

let recorder = Recorder(config: Recorder.Config(
    sampleRate: options.sampleRate,
    captureSystem: options.captureSystem,
    captureMic: options.captureMic
))

do {
    try recorder.start()
} catch let failure as RecorderFailure {
    JSONLog.failure(failure.message)
    exit(1)
} catch {
    JSONLog.failure("启动录音失败：\(error.localizedDescription)")
    exit(1)
}

// 主线程只负责挂住进程；停止由 stdin / 信号 / 错误在各自队列上触发后自行 exit。
let never = DispatchSemaphore(value: 0)
_ = never.wait(timeout: .distantFuture)
