// 会议记录插件 · macOS 会议检测辅助程序
//
// 职责：只做采样，不做状态机/通知/路由（那些在 Host 的 detect.js 里）。
//   - 主信号：CoreAudio 进程对象（macOS 14.2+）——目标 app 此刻是否在跑输入/输出流；
//     只认「进程在此刻占用麦克风或播放音频」，不是「进程存在」，也不是设备级
//     IsRunningSomewhere（那会混入其它 app 的音频）。
//   - 辅助信号：CGWindowList 里该 pid 是否有 layer 0、宽高 > 100 的窗口（零权限，
//     不需要屏幕录制；读不到标题没关系，只要存在性）。
//
// 输出：stdout 保持空；stderr 每行一个 JSON 对象（JSONL，无其它输出）：
//   {"type":"ready","version":1,"intervalMs":500,"targets":["com.tencent.meeting"]}
//   {"type":"sample","at":1762862400123,"apps":[{"pid":123,"bundle":"…","executable":"…",
//     "input":true,"output":true,"window":true}]}
//   {"type":"error","message":"中文原因"}（随后 exit 1）
//
// 停止：stdin 收到 {"cmd":"stop"}（或 EOF）、SIGINT、SIGTERM → exit 0。
//
// 注意：CLI 没有 main run loop，停止由 stdin 线程 / 信号队列直接 exit(0)，
// 主线程只负责「采样 → 睡到下一个 tick」。

import CoreAudio
import CoreGraphics
import Darwin
import Foundation

// MARK: - 错误

struct DetectorFailure: Error {
    let message: String
    init(_ message: String) { self.message = message }
}

// MARK: - stderr JSON 日志

enum JSONLog {
    private static let lock = NSLock()

    /// 写一行 JSON 到 stderr。直接 write(2)，不用 stdio 缓冲，Host 能逐行实时读到。
    static func emit(_ object: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(object),
              var payload = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
        else { return }
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

    static func ready(intervalMs: Int, targets: [String]) {
        emit(["type": "ready", "version": 1, "intervalMs": intervalMs, "targets": targets])
    }

    static func sample(at: Int, apps: [[String: Any]]) {
        emit(["type": "sample", "at": at, "apps": apps])
    }

    static func failure(_ message: String) {
        emit(["type": "error", "message": message])
    }
}

private func nowMilliseconds() -> Int {
    Int((Date().timeIntervalSince1970 * 1000).rounded())
}

// MARK: - CoreAudio 进程对象

/// 全局作用域 / 主元素的属性地址。进程对象属性都在 global scope + main element 上。
private func propertyAddress(_ selector: AudioObjectPropertySelector) -> AudioObjectPropertyAddress {
    AudioObjectPropertyAddress(
        mSelector: selector,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
}

private let systemObjectID = AudioObjectID(kAudioObjectSystemObject)

/// 读一个 UInt32 属性；读取失败返回 nil（调用方跳过，不崩）。
private func readUInt32(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector) -> UInt32? {
    var address = propertyAddress(selector)
    var value: UInt32 = 0
    var size = UInt32(MemoryLayout<UInt32>.size)
    let status = AudioObjectGetPropertyData(object, &address, 0, nil, &size, &value)
    guard status == noErr, size == UInt32(MemoryLayout<UInt32>.size) else { return nil }
    return value
}

/// 读一个 CFString 属性；读取失败返回 nil。返回的 CFString 由调用方释放（takeRetainedValue）。
private func readString(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector) -> String? {
    var address = propertyAddress(selector)
    var raw: Unmanaged<CFString>?
    var size = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
    let status = AudioObjectGetPropertyData(object, &address, 0, nil, &size, &raw)
    guard status == noErr, let unmanaged = raw else { return nil }
    return unmanaged.takeRetainedValue() as String
}

/// 系统当前所有「已连接 HAL 的客户端进程」的对象列表。
private func processObjectList() -> [AudioObjectID] {
    var address = propertyAddress(kAudioHardwarePropertyProcessObjectList)
    var size: UInt32 = 0
    guard AudioObjectGetPropertyDataSize(systemObjectID, &address, 0, nil, &size) == noErr, size > 0 else {
        return []
    }
    var objects = [AudioObjectID](repeating: 0, count: Int(size) / MemoryLayout<AudioObjectID>.size)
    guard AudioObjectGetPropertyData(systemObjectID, &address, 0, nil, &size, &objects) == noErr else {
        return []
    }
    let count = Int(size) / MemoryLayout<AudioObjectID>.size
    return Array(objects.prefix(max(0, min(count, objects.count))))
}

/// 进程可执行文件路径（用于 bundle id 为空 / 二次匹配）。读不到返回空串。
private func executablePath(_ pid: pid_t) -> String {
    var buffer = [CChar](repeating: 0, count: 4_096) // PROC_PIDPATHINFO_MAXSIZE
    let length = proc_pidpath(pid, &buffer, UInt32(buffer.count))
    guard length > 0 else { return "" }
    return String(cString: buffer)
}

// MARK: - 窗口（存在性零权限）

/// 返回「拥有 layer 0 且宽高 > 100 的窗口」的 owner pid 集合。查不到（无权限/异常）返回空集合。
private func layerZeroWindowOwnerPIDs() -> Set<pid_t> {
    guard let windows = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] else {
        return []
    }
    var owners = Set<pid_t>()
    for window in windows {
        guard let layer = window[kCGWindowLayer as String] as? Int, layer == 0 else { continue }
        guard let owner = (window[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value else { continue }
        let bounds = window[kCGWindowBounds as String] as? NSDictionary
        let width = (bounds?["Width"] as? NSNumber)?.doubleValue ?? 0
        let height = (bounds?["Height"] as? NSNumber)?.doubleValue ?? 0
        guard width > 100, height > 100 else { continue }
        owners.insert(pid_t(owner))
    }
    return owners
}

// MARK: - 目标匹配

private let selfPID = ProcessInfo.processInfo.processIdentifier

/// bundle id 等于 target 或以 "<target>." 开头，或可执行路径包含 TencentMeeting.app / WeMeeting.app。
private func matchesTarget(bundle: String, executable: String, targets: [String]) -> Bool {
    let isolated = executable.isEmpty
        ? ""
        : "/" + executable.split(separator: "/").joined(separator: "/") + "/"
    if !bundle.isEmpty {
        for target in targets {
            if bundle == target || bundle.hasPrefix(target + ".") { return true }
        }
    }
    if isolated.contains("/TencentMeeting.app/") || isolated.contains("/WeMeeting.app/") { return true }
    return false
}

// MARK: - 采样

private func sampleOnce(targets: [String]) {
    let objects = processObjectList()
    var apps: [[String: Any]] = []
    var matchedPIDs = Set<pid_t>()

    for object in objects {
        guard let rawPID = readUInt32(object, kAudioProcessPropertyPID) else { continue }
        let pid = pid_t(rawPID)
        // pid 0 / 负数不可能是真实进程；排除自己，避免以后把自己也算成目标。
        guard pid > 0, pid != selfPID else { continue }
        let bundle = readString(object, kAudioProcessPropertyBundleID) ?? ""
        let executable = executablePath(pid)
        guard matchesTarget(bundle: bundle, executable: executable, targets: targets) else { continue }
        matchedPIDs.insert(pid)
        apps.append([
            "pid": Int(pid),
            "bundle": bundle,
            "executable": executable,
            "input": (readUInt32(object, kAudioProcessPropertyIsRunningInput) ?? 0) == 1,
            "output": (readUInt32(object, kAudioProcessPropertyIsRunningOutput) ?? 0) == 1,
            "window": false,
        ])
    }

    if !matchedPIDs.isEmpty {
        let windowOwners = layerZeroWindowOwnerPIDs()
        for index in apps.indices {
            guard let pid = apps[index]["pid"] as? Int, windowOwners.contains(pid_t(pid)) else { continue }
            apps[index]["window"] = true
        }
    }

    // 进程对象顺序不保证稳定；按 pid 排序让日志可对比、可测试。
    apps.sort { lhs, rhs in
        (lhs["pid"] as? Int ?? 0) < (rhs["pid"] as? Int ?? 0)
    }
    JSONLog.sample(at: nowMilliseconds(), apps: apps)
}

// MARK: - 命令行参数

struct Options {
    var intervalMs = 500
    var targets = ["com.tencent.meeting", "com.tencent.wemeet"]
    var showHelp = false
}

func parseArguments(_ arguments: [String]) throws -> Options {
    var options = Options()
    var bundles: [String] = []
    var index = 0

    func nextValue(for flag: String) throws -> String {
        index += 1
        guard index < arguments.count else {
            throw DetectorFailure("参数 \(flag) 缺少取值。")
        }
        return arguments[index]
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
        case "--interval-ms":
            let raw: String
            if let inlineValue { raw = inlineValue } else { raw = try nextValue(for: flag) }
            guard let interval = Int(raw), interval >= 100, interval <= 60_000 else {
                throw DetectorFailure("参数 --interval-ms 取值无效：\(raw)（支持 100-60000）")
            }
            options.intervalMs = interval
        case "--bundle":
            let raw: String
            if let inlineValue { raw = inlineValue } else { raw = try nextValue(for: flag) }
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else {
                throw DetectorFailure("参数 --bundle 取值不能为空。")
            }
            bundles.append(trimmed)
        default:
            throw DetectorFailure("未知参数：\(argument)")
        }
        index += 1
    }

    if !bundles.isEmpty {
        // 重复 --bundle 覆盖默认目标（按出现顺序去重）。
        var seen = Set<String>()
        options.targets = bundles.filter { seen.insert($0).inserted }
    }
    return options
}

// MARK: - 停止

private let stateLock = NSLock()
private var isStopping = false
private var signalSources: [DispatchSourceSignal] = []
private var stdinThread: Thread?

private func requestStop() {
    stateLock.lock()
    if isStopping {
        stateLock.unlock()
        return
    }
    isStopping = true
    stateLock.unlock()
    exit(0)
}

// MARK: - 输入（stdin / 信号）

private func installSignalHandlers() {
    signal(SIGPIPE, SIG_IGN)
    signal(SIGINT, SIG_IGN)
    signal(SIGTERM, SIG_IGN)

    let signalQueue = DispatchQueue(label: "meeting-detector.signals")
    for number in [SIGINT, SIGTERM] {
        let source = DispatchSource.makeSignalSource(signal: number, queue: signalQueue)
        source.setEventHandler { requestStop() }
        source.resume()
        signalSources.append(source)
    }
}

/// 读取 stdin 上的控制命令（每行一个 JSON，目前支持 {"cmd":"stop"}）；EOF 即停止
/// （Host 已不再控制，避免留下孤儿进程）。
private func installStdinReader() {
    let thread = Thread { readStdinLoop() }
    thread.name = "meeting-detector.stdin"
    thread.start()
    stdinThread = thread
}

private func readStdinLoop() {
    var buffer = [UInt8](repeating: 0, count: 4_096)
    var pending: [UInt8] = []
    while true {
        let count = read(STDIN_FILENO, &buffer, buffer.count)
        if count == 0 {
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

// MARK: - 入口

let helpText = """
用法：meeting-detector [--interval-ms 500] [--bundle com.tencent.meeting ...]

  --interval-ms  采样间隔毫秒（100-60000，默认 500）
  --bundle       目标 bundle id（可重复；给定后覆盖默认值）

默认目标：com.tencent.meeting、com.tencent.wemeet；
匹配规则：bundle id 等于目标或以 "<目标>." 开头，或可执行路径包含
TencentMeeting.app / WeMeeting.app。

stdout：空
stderr：JSON lines（ready / sample / error）
停止：stdin 收到 {"cmd":"stop"}、stdin EOF、SIGINT 或 SIGTERM
"""

let options: Options
do {
    options = try parseArguments(Array(CommandLine.arguments.dropFirst()))
} catch let failure as DetectorFailure {
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

// 进程对象 API（kAudioHardwarePropertyProcessObjectList / kAudioProcessPropertyIsRunning*）
// 从 macOS 14.2 起可用；更早的系统上属性读取会失败，直接报错退出比每 tick 输出空数组更诚实。
guard #available(macOS 14.2, *) else {
    JSONLog.failure("会议检测需要 macOS 14.2 或更高版本（CoreAudio 进程对象 API 不可用）。")
    exit(1)
}

installSignalHandlers()
installStdinReader()

JSONLog.ready(intervalMs: options.intervalMs, targets: options.targets)

let interval = DispatchTimeInterval.milliseconds(options.intervalMs)
while true {
    let tick = DispatchTime.now()
    sampleOnce(targets: options.targets)
    // 固定节拍：扣掉采样耗时，避免漂移；采样本身是毫秒级，睡够剩余时间即可。
    let elapsed = DispatchTime.now().uptimeNanoseconds &- tick.uptimeNanoseconds
    let budget = UInt64(max(0, options.intervalMs)) * 1_000_000
    if elapsed < budget {
        Thread.sleep(forTimeInterval: Double(budget - elapsed) / 1_000_000_000)
    }
}
