window.__ModuleLoader__.load({
  id: '@iceleaf/dsh-meeting-notes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'dsh-meeting-notes';
    const API = '/dsh-meeting-notes';
    const HEADER = 'x-dsh-meeting-notes';

    const DICT_ZH = {
      nav: '会议记录',
      title: '会议记录',
      subtitle: '系统声音与麦克风混音录制 · 本地离线转写',
      refresh: '刷新',
      refreshing: '同步中',
      loading: '加载中…',
      retry: '重试',
      dismiss: '关闭',
      unknownError: '未知错误',
      requestFailed: '请求失败',
      loadStateFailed: '读取会议记录状态失败',
      platformUnsupported: '当前平台暂不支持录制系统声音与麦克风，只能浏览已有会议。',
      modelLabel: '识别模型',
      modelHint: '查看或切换转写模型',
      prepare: '下载模型',
      prepareRetry: '重新准备',
      prepareStarted: '已开始准备本地模型，进度见模型状态。',
      phaseUnprepared: '未准备',
      phaseDownloading: '下载中',
      phaseChecking: '校验中',
      phaseLoading: '加载中',
      phaseReady: '就绪',
      phaseStandby: '待机',
      phaseFailed: '准备失败',
      storageDir: '存储目录',
      pickDirectory: '选择目录',
      pickFailed: '选择目录失败',
      saveConfig: '保存配置',
      savingConfig: '保存中…',
      savedConfig: '配置已保存',
      storageRequired: '存储目录不能为空',
      chunkInvalid: '分块秒数需在 8 到 60 之间',
      configPanel: '识别与采集设置',
      configHint: '修改后点「保存配置」生效；转写模式在录音卡中切换即生效。',
      language: '识别语言',
      capture: '采集源',
      captureMic: '麦克风',
      captureSystem: '系统声音',
      chunkSeconds: '分块秒数',
      chunkHint: '实时转写每次识别的音频长度（秒）。',
      langAuto: '自动识别',
      langZh: '中文',
      langEn: '英语',
      langYue: '粤语',
      langJa: '日语',
      langKo: '韩语',
      recordTitle: '录音',
      mode: '转写模式',
      modeAfter: '结束后转写',
      modeRealtime: '实时转写',
      modeLocked: '录音中不可切换转写模式',
      start: '开始录音',
      stop: '停止录音',
      stopping: '正在停止…',
      cancel: '放弃本次录音',
      recordingIdle: '待录音',
      recordingActive: '录音中',
      elapsed: '已录制',
      micLevel: '麦克风',
      systemLevel: '系统声音',
      levelHint: '电平来自录制进程，静音时无输入。',
      liveTitle: '实时转写',
      liveEmpty: '开始录音后，这里会显示实时识别结果。',
      startOk: '已开始录音',
      stopOk: '已停止录音，正在保存音频',
      stopOkAfter: '已停止录音，音频保存后将在后台转写',
      stopOkRealtime: '已停止录音，正在补齐末尾片段',
      cancelOk: '已放弃本次录音，文件已删除',
      startFailed: '开始录音失败',
      stopFailed: '停止录音失败',
      cancelFailed: '放弃录音失败',
      recordFailed: '录音出错',
      captureNone: '至少选择一个采集源，否则无法开始录音。',
      meetings: '会议列表',
      meetingsEmptyTitle: '还没有会议记录',
      meetingsEmptyHint: '点「开始录音」记录第一场会议，结束后会自动转写。',
      statusRecorded: '已录制',
      statusTranscribing: '转写中',
      statusTranscribed: '已转写',
      statusFailed: '失败',
      hasMinutes: '有纪要',
      selectMeeting: '从左侧选择一场会议查看文稿与纪要。',
      meetingFallbackTitle: '未命名会议',
      transcriptTitle: '会议文稿',
      tabTranscript: '文稿',
      tabMinutes: '纪要',
      transcriptEmpty: '还没有转写文稿',
      transcriptEmptyHint: '录音结束后会自动转写，也可以点「重新转写」。',
      audioTitle: '录音回放',
      minutesTitle: '会议纪要',
      minutesEmpty: '还没有生成会议纪要',
      minutesHint: '点「生成会议纪要」会在工作区创建议会话，由模型阅读文稿并写入纪要，随后可继续对话。',
      minutesPending: '纪要会话已创建，生成完成后刷新可见。',
      generateMinutes: '生成会议纪要',
      regenerateMinutes: '重新生成纪要',
      generatingMinutes: '正在创建纪要会话…',
      minutesOk: '已打开纪要会话，生成结果稍后出现在会议纪要区。',
      minutesFailed: '生成会议纪要失败',
      retranscribe: '重新转写',
      retranscribing: '正在重新转写…',
      transcribeOk: '已开始重新转写',
      transcribeFailed: '重新转写失败',
      copyTranscript: '复制文稿',
      copied: '文稿已复制',
      copyFailed: '复制失败，请手动选择文本',
      deleteAction: '删除',
      deleting: '删除中…',
      deleteOk: '会议已删除',
      deleteFailed: '删除失败',
      confirmDeleteTitle: '删除这场会议？',
      confirmDeleteBody: '「{title}」的录音、文稿与纪要都会被移除，此操作无法撤销。',
      confirmDeleteGo: '删除会议',
      confirmCancelTitle: '放弃本次录音？',
      confirmCancelBody: '当前录音以及已经产生的实时转写都会被丢弃，此操作无法撤销。',
      confirmCancelGo: '放弃录音',
      detailLoadFailed: '读取会议详情失败',
      meetingPath: '会议目录',
      duration: '时长',
      sizeLabel: '文件大小',
      emptyGuideTitle: '开始记录你的第一场会议',
      emptyGuideBody: '选择转写模式后点「开始录音」：系统声音与麦克风会混音保存到本地，录音结束后自动转写。',
      sseGaveUp: '实时通道已断开，已切换为定时刷新。',
      transcribingHint: '转写进行中，完成后文稿会自动出现。',
      settings: '设置',
      settingsSubtitle: '识别模型、录音存储、语言、采集方式与会议提醒',
      closeDialog: '关闭',
      dialogCancel: '取消',
      sectionStorage: '存储',
      sectionRecognition: '识别',
      sectionCapture: '采集',
      sectionModels: '识别模型',
      storageHint: '每场会议一个子文件夹，存放录音 WAV、转写与纪要。',
      captureHint: '默认同时采集系统声音与麦克风，录音中不可更改。',
      modeHintAfter: '结束后转写：停止录音后整段识别，速度更快。',
      modeHintRealtime: '实时转写：录音时持续显示字幕，占用略高。',
      unsavedHint: '有未保存的修改',
      modelSectionNote: '需先下载到本机才能离线转写',
      modelEmpty: '没有检测到可用的本地语音识别服务，请确认 DSH 语音输入插件已开启。',
      modelsHint: '模型列表来自 DSH 语音服务：目前内置 SenseVoice，后续接入其他 ASR 模型会自动出现在这里。',
      modelCurrent: '当前使用',
      useModel: '使用该模型',
      modelSelected: '已切换识别模型',
      modelDownload: '下载并准备',
      modelRetry: '重试准备',
      modelCancel: '取消准备',
      modelCancelled: '已取消模型准备',
      modelPreparing: '正在准备模型，进度见上方状态。',
      modelSteps: '准备步骤',
      modelNotReady: '实时转写需要先准备好本地模型。',
      modelNotReadySettings: '去设置准备',
      stepCheck: '检查本地资源',
      stepModel: '准备语音识别模型',
      stepVad: '准备语音检测模型',
      stepVerify: '校验模型文件',
      stepLoad: '加载模型',
      stepPending: '未开始',
      stepRunning: '进行中',
      stepComplete: '已完成',
      stepFailed: '失败',
      stepCancelled: '已取消',
      downloadProgress: '下载进度',
      downloadBytes: '下载：{completed} / {total} MB，{percent}%',
      downloadUnknown: '已下载 {completed} MB',
      preparationFailed: '准备失败：{message}',
      downloadSource: '模型下载源',
      sourceAuto: '自动选择（推荐）',
      sourceHuggingFace: 'Hugging Face',
      sourceMirror: 'HF-Mirror（国内镜像）',
      sourceModelscope: 'ModelScope（国内推荐）',
      modelRealtimeHint: '该模型实时转写延迟较高，建议使用「结束后转写」。',
      modelRealtimeWarn: '当前模型实时转写延迟较高，录音不受影响，建议会后转写。',
      sourceAutoHelp: '优先使用响应较快的源，下载失败时自动尝试其他源。',
      sourceManualHelp: '仅从所选源下载；已下载并通过校验的文件会复用。',
      estimateDisk: '硬盘占用约 {gb} GB',
      estimateMemory: '运行时内存约 {gb} GB',
      estimateTime: '首次准备约 {min}–{max} 分钟',
      phaseUnprepare: '未准备',
      phaseWaking: '唤醒中',
      phaseCancelling: '取消中',
      phaseCancelled: '已取消',
      downloadReason: '下载失败：{reason}',
      reasonNetwork: '网络连接异常',
      reasonDns: '域名解析失败',
      reasonTimeout: '下载超时',
      reasonCertificate: '证书校验失败',
      reasonHttp: '下载服务器返回错误',
      reasonIntegrity: '模型文件校验失败',
      reasonStorage: '磁盘空间不足或不可写',
      reasonUnknown: '未知原因',
      adviceNetwork: '请检查网络连接后重试，或切换下载源。',
      adviceDns: '请确认网络可访问所选下载源，或切换下载源。',
      adviceTimeout: '网络较慢，可切换下载源后重试。',
      adviceCertificate: '系统时间或代理证书可能异常，请检查后重试。',
      adviceHttp: '下载源暂时不可用，请稍后重试或切换下载源。',
      adviceIntegrity: '已下载文件不完整，请重试；多次失败请切换下载源。',
      adviceStorage: '请清理磁盘空间，或检查模型目录权限。',
      adviceUnknown: '请稍后重试；若多次失败，请切换下载源。',
      sectionDetect: '会议提醒',
      detectHint: '只读取会议应用对麦克风、扬声器的占用状态，不读取音频内容，也不会自动开始录音。',
      detectSwitchEnabled: '检测会议开始与结束',
      detectSwitchNotify: '系统通知提醒',
      detectNotifyDenied: '系统通知权限已被拒绝，可在系统设置中重新允许；页面内提醒不受影响。',
      detectNotifyUnsupported: '当前环境不支持系统通知，只显示页面内提醒。',
      detectTestNotify: '发送测试通知',
      detectTestNotifyBody: '这是一条测试通知，用来确认系统能否显示来自 DeepSeek Harness 的会议提醒。',
      detectTestNotifySent: '测试通知已发送；如果没有看到通知，说明当前桌面环境不会显示渲染进程通知。',
      detectTestNotifyFailed: '测试通知发送失败。',
      suggestStartTitle: '检测到会议已开始',
      suggestStartBody: '{app}正在使用麦克风或扬声器，要现在开始记录吗？',
      suggestStartBodyNoApp: '有会议应用正在使用麦克风或扬声器，要现在开始记录吗？',
      suggestAcceptStart: '开始记录',
      suggestDismissStart: '先不记录',
      suggestEndTitle: '会议可能已结束',
      suggestEndBody: '检测到会议应用已释放麦克风与扬声器，要结束这场录音吗？',
      suggestAcceptEnd: '结束记录',
      suggestDismissEnd: '继续记录',
      suggestStartOk: '已开始记录',
      detectUnavailableHint: '会议检测仅支持 macOS 14.2 及以上版本。',
      suggestEndOk: '已结束记录',
    };

    const DICT_EN = {
      nav: 'Meeting Notes',
      title: 'Meeting Notes',
      subtitle: 'Record system audio and microphone · transcribe locally',
      refresh: 'Refresh',
      refreshing: 'Syncing',
      loading: 'Loading…',
      retry: 'Retry',
      dismiss: 'Dismiss',
      unknownError: 'Unknown error',
      requestFailed: 'Request failed',
      loadStateFailed: 'Failed to load meeting notes state',
      platformUnsupported: 'Recording system audio and microphone is not supported on this platform yet; browsing existing meetings still works.',
      modelLabel: 'Model',
      modelHint: 'View or switch transcription models',
      prepare: 'Download model',
      prepareRetry: 'Retry preparation',
      prepareStarted: 'Model preparation started; watch the model status.',
      phaseUnprepared: 'Not prepared',
      phaseDownloading: 'Downloading',
      phaseChecking: 'Verifying',
      phaseLoading: 'Loading',
      phaseReady: 'Ready',
      phaseStandby: 'Standby',
      phaseFailed: 'Failed',
      storageDir: 'Storage folder',
      pickDirectory: 'Choose folder',
      pickFailed: 'Failed to choose folder',
      saveConfig: 'Save settings',
      savingConfig: 'Saving…',
      savedConfig: 'Settings saved',
      storageRequired: 'Storage folder is required',
      chunkInvalid: 'Chunk seconds must be between 8 and 60',
      configPanel: 'Transcription and capture',
      configHint: 'Click "Save settings" to apply. The transcription mode in the recorder card applies immediately.',
      language: 'Language',
      capture: 'Capture sources',
      captureMic: 'Microphone',
      captureSystem: 'System audio',
      chunkSeconds: 'Chunk seconds',
      chunkHint: 'Audio length per realtime transcription step (seconds).',
      langAuto: 'Auto detect',
      langZh: 'Chinese',
      langEn: 'English',
      langYue: 'Cantonese',
      langJa: 'Japanese',
      langKo: 'Korean',
      recordTitle: 'Recorder',
      mode: 'Transcription mode',
      modeAfter: 'Transcribe after stop',
      modeRealtime: 'Realtime transcription',
      modeLocked: 'Transcription mode cannot change while recording',
      start: 'Start recording',
      stop: 'Stop recording',
      stopping: 'Stopping…',
      cancel: 'Discard recording',
      recordingIdle: 'Ready',
      recordingActive: 'Recording',
      elapsed: 'Elapsed',
      micLevel: 'Microphone',
      systemLevel: 'System audio',
      levelHint: 'Levels come from the recorder process; silence shows no input.',
      liveTitle: 'Realtime transcript',
      liveEmpty: 'Realtime results appear here once recording starts.',
      startOk: 'Recording started',
      stopOk: 'Recording stopped, saving audio',
      stopOkAfter: 'Recording stopped; transcription continues in the background',
      stopOkRealtime: 'Recording stopped; finishing the last segment',
      cancelOk: 'Recording discarded and files removed',
      startFailed: 'Failed to start recording',
      stopFailed: 'Failed to stop recording',
      cancelFailed: 'Failed to discard recording',
      recordFailed: 'Recording error',
      captureNone: 'Choose at least one capture source before recording.',
      meetings: 'Meetings',
      meetingsEmptyTitle: 'No meetings yet',
      meetingsEmptyHint: 'Click "Start recording" to capture your first meeting; it is transcribed after you stop.',
      statusRecorded: 'Recorded',
      statusTranscribing: 'Transcribing',
      statusTranscribed: 'Transcribed',
      statusFailed: 'Failed',
      hasMinutes: 'Minutes',
      selectMeeting: 'Select a meeting on the left to read its transcript and minutes.',
      meetingFallbackTitle: 'Untitled meeting',
      transcriptTitle: 'Transcript',
      tabTranscript: 'Transcript',
      tabMinutes: 'Minutes',
      transcriptEmpty: 'No transcript yet',
      transcriptEmptyHint: 'Transcription starts automatically after recording; you can also click "Transcribe again".',
      audioTitle: 'Audio playback',
      minutesTitle: 'Minutes',
      minutesEmpty: 'No minutes generated yet',
      minutesHint: 'Click "Generate minutes" to create a workspace session where the model reads the transcript and writes the minutes; you can keep chatting there.',
      minutesPending: 'The minutes session is open; results appear here after generation.',
      generateMinutes: 'Generate minutes',
      regenerateMinutes: 'Regenerate minutes',
      generatingMinutes: 'Creating minutes session…',
      minutesOk: 'Minutes session opened; results will appear in the minutes section.',
      minutesFailed: 'Failed to generate minutes',
      retranscribe: 'Transcribe again',
      retranscribing: 'Transcribing…',
      transcribeOk: 'Transcription restarted',
      transcribeFailed: 'Failed to restart transcription',
      copyTranscript: 'Copy transcript',
      copied: 'Transcript copied',
      copyFailed: 'Copy failed; select the text manually',
      deleteAction: 'Delete',
      deleting: 'Deleting…',
      deleteOk: 'Meeting deleted',
      deleteFailed: 'Failed to delete meeting',
      confirmDeleteTitle: 'Delete this meeting?',
      confirmDeleteBody: 'The audio, transcript and minutes of “{title}” will be removed permanently.',
      confirmDeleteGo: 'Delete meeting',
      confirmCancelTitle: 'Discard this recording?',
      confirmCancelBody: 'The current recording and any live transcript will be discarded permanently.',
      confirmCancelGo: 'Discard recording',
      detailLoadFailed: 'Failed to load meeting details',
      meetingPath: 'Meeting folder',
      duration: 'Duration',
      sizeLabel: 'Size',
      emptyGuideTitle: 'Record your first meeting',
      emptyGuideBody: 'Pick a transcription mode and click "Start recording": system audio and microphone are mixed and stored locally, then transcribed when you stop.',
      sseGaveUp: 'The realtime channel closed; falling back to periodic refresh.',
      transcribingHint: 'Transcription in progress; the transcript appears when it finishes.',
      settings: 'Settings',
      settingsSubtitle: 'Recognition models, storage, language, capture sources and meeting reminders',
      closeDialog: 'Close',
      dialogCancel: 'Cancel',
      sectionStorage: 'Storage',
      sectionRecognition: 'Recognition',
      sectionCapture: 'Capture',
      sectionModels: 'Recognition models',
      storageHint: 'One folder per meeting, holding the WAV recording, transcript and minutes.',
      captureHint: 'System audio and microphone are captured together; change before recording.',
      modeHintAfter: 'Transcribe after stop: recognize the whole recording once, fastest.',
      modeHintRealtime: 'Realtime: subtitles stream while recording, slightly more CPU.',
      unsavedHint: 'Unsaved changes',
      modelSectionNote: 'Downloaded locally before offline transcription',
      modelEmpty: 'No local speech recognition service detected. Make sure the DSH voice input plugin is enabled.',
      modelsHint: 'Models come from the DSH speech service: SenseVoice is built in, and future ASR providers appear here automatically.',
      modelCurrent: 'In use',
      useModel: 'Use this model',
      modelSelected: 'Recognition model switched',
      modelDownload: 'Download and prepare',
      modelRetry: 'Retry preparation',
      modelCancel: 'Cancel preparation',
      modelCancelled: 'Model preparation cancelled',
      modelPreparing: 'Preparing the model; watch the status above.',
      modelSteps: 'Preparation steps',
      modelNotReady: 'Realtime transcription needs a prepared local model.',
      modelNotReadySettings: 'Prepare in settings',
      stepCheck: 'Check local resources',
      stepModel: 'Prepare speech recognition model',
      stepVad: 'Prepare voice detection model',
      stepVerify: 'Verify model files',
      stepLoad: 'Load model',
      stepPending: 'Not started',
      stepRunning: 'In progress',
      stepComplete: 'Completed',
      stepFailed: 'Failed',
      stepCancelled: 'Cancelled',
      downloadProgress: 'Download progress',
      downloadBytes: 'Downloading: {completed} / {total} MB, {percent}%',
      downloadUnknown: 'Downloaded {completed} MB',
      preparationFailed: 'Preparation failed: {message}',
      downloadSource: 'Model download source',
      sourceAuto: 'Automatic (recommended)',
      sourceHuggingFace: 'Hugging Face',
      sourceMirror: 'HF-Mirror (China mirror)',
      sourceModelscope: 'ModelScope (China)',
      modelRealtimeHint: 'Realtime transcription is slower on this model; prefer transcribing after recording.',
      modelRealtimeWarn: 'This model is slow for realtime transcription. Recording still works; transcribing after the meeting is faster.',
      sourceAutoHelp: 'Uses the faster source first and falls back to others on failure.',
      sourceManualHelp: 'Downloads only from the selected source; already verified files are reused.',
      estimateDisk: 'About {gb} GB on disk',
      estimateMemory: 'About {gb} GB memory while running',
      estimateTime: 'First preparation takes about {min}–{max} minutes',
      phaseUnprepare: 'Not prepared',
      phaseWaking: 'Waking up',
      phaseCancelling: 'Cancelling',
      phaseCancelled: 'Cancelled',
      downloadReason: 'Download failed: {reason}',
      reasonNetwork: 'network error',
      reasonDns: 'DNS resolution failed',
      reasonTimeout: 'download timed out',
      reasonCertificate: 'certificate verification failed',
      reasonHttp: 'download server returned an error',
      reasonIntegrity: 'model file verification failed',
      reasonStorage: 'insufficient disk space or not writable',
      reasonUnknown: 'unknown reason',
      adviceNetwork: 'Check the network and retry, or switch the download source.',
      adviceDns: 'Make sure the selected source is reachable, or switch the download source.',
      adviceTimeout: 'The network is slow; switch the download source and retry.',
      adviceCertificate: 'Check the system clock or proxy certificate, then retry.',
      adviceHttp: 'The source is temporarily unavailable; retry later or switch the source.',
      adviceIntegrity: 'The downloaded file is incomplete; retry, and switch the source if it keeps failing.',
      adviceStorage: 'Free some disk space or check permissions of the model folder.',
      adviceUnknown: 'Retry later; switch the download source if it keeps failing.',
      sectionDetect: 'Meeting reminders',
      detectHint: 'Only the microphone and speaker usage of meeting apps is checked; audio is never read and recording never starts automatically.',
      detectSwitchEnabled: 'Detect meeting start and end',
      detectSwitchNotify: 'System notifications',
      detectNotifyDenied: 'System notification permission is denied. Re-enable it in System Settings; in-page reminders still work.',
      detectNotifyUnsupported: 'System notifications are not supported here; only in-page reminders are shown.',
      detectTestNotify: 'Send test notification',
      detectTestNotifyBody: 'This is a test notification to check whether the system shows reminders from DeepSeek Harness.',
      detectTestNotifySent: 'Test notification sent. If you cannot see it, this desktop environment does not display renderer notifications.',
      detectTestNotifyFailed: 'Failed to send the test notification.',
      suggestStartTitle: 'A meeting may have started',
      suggestStartBody: '{app} is using the microphone or speakers. Start recording this meeting?',
      suggestStartBodyNoApp: 'A meeting app is using the microphone or speakers. Start recording this meeting?',
      detectUnavailableHint: 'Meeting detection requires macOS 14.2 or later.',
      suggestAcceptStart: 'Start recording',
      suggestDismissStart: 'Not now',
      suggestEndTitle: 'The meeting may have ended',
      suggestEndBody: 'The meeting app released the microphone and speakers. Stop this recording?',
      suggestAcceptEnd: 'Stop recording',
      suggestDismissEnd: 'Keep recording',
      suggestStartOk: 'Recording started',
      suggestEndOk: 'Recording stopped',
    };

    const CSS = `
.mn-root{
  --mn-line:var(--dsw-alias-border-l1,#0000000a);
  --mn-line-strong:var(--dsw-alias-border-l2,#0000001a);
  --mn-text:var(--dsw-alias-label-primary,#0f1115);
  --mn-muted:var(--dsw-alias-label-secondary,#61666b);
  --mn-tertiary:var(--dsw-alias-label-tertiary,#81858c);
  --mn-accent:var(--dsw-alias-brand-primary,#0f1115);
  --mn-hot:var(--dsw-alias-state-error-primary,#dc2626);
  --mn-warn:var(--dsw-alias-state-warn-primary,#f59e0b);
  --mn-ok:var(--dsw-alias-state-success-primary,#22c55e);
  --mn-fill:var(--dsw-alias-bg-layer-1,#ffffff);
  --mn-fill-2:var(--dsw-alias-bg-layer-2,#ffffff);
  --mn-layer-3:var(--dsw-alias-bg-layer-3,#fff);
  --mn-module:var(--dsw-alias-bg-module-platform,#f5f6f7);
  --mn-hover:var(--dsw-alias-interactive-bg-hover,#2631480f);
  --mn-active:var(--dsw-alias-interactive-bg-active,#2631481a);
  --mn-skel:var(--dsw-alias-bg-skeleton,#0000000a);
  --mn-radius-sm:var(--dsw-radius-sm,8px);
  --mn-radius-md:var(--dsw-radius-md,12px);
  --mn-radius-lg:var(--dsw-radius-lg,16px);
  --mn-radius-panel:var(--dsw-radius-panel,28px);
  --mn-shadow-1:var(--dsw-shadow-lv1,0 2px 4px 0 rgba(0,0,0,.05));
  --mn-shadow-3:var(--dsw-shadow-lv3,0 0 1px 0 rgba(0,0,0,.2),0 12px 32px 0 rgba(0,0,0,.08));
  --mn-elevation:var(--dsw-elevation-prominent,0 3px 8px 0 rgba(0,0,0,.05),0 0 20px 0 rgba(0,0,0,.05));
  --mn-mask:var(--dsw-alias-bg-mask-1,#0000003d);
  --mn-blur:var(--dsw-mask-blur,none);
  --mn-tooltip-bg:var(--dsw-alias-tooltip-bg,#2c2c2e);
  --mn-toast-bg:var(--dsw-alias-toast-bg,#353638);
  --mn-toast-label:var(--dsw-alias-toast-label,#fff);
  --mn-ease:var(--ds-ease-in-out,cubic-bezier(.4,0,.2,1));
  --mn-dur:var(--ds-transition-duration,.2s);
  position:relative;
  min-height:100%;
  overflow:auto;
  background:var(--dsw-alias-bg-base,#fff);
  color:var(--mn-text);
  font-family:inherit;
  font-size:14px;
  line-height:22px;
  -webkit-font-smoothing:antialiased;
}
.mn-root *{box-sizing:border-box}
.mn-root button{font-family:inherit}
.mn-shell{max-width:1120px;margin:0 auto;padding:24px 24px 48px}

/* ---------- top bar ---------- */
.mn-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px}
.mn-brand{display:flex;align-items:center;gap:10px;min-width:0}
.mn-brand-mark{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:var(--mn-radius-sm);flex:0 0 auto;color:var(--mn-accent);background:var(--mn-module)}
.mn-title{margin:0;font-size:16px;line-height:24px;font-weight:600}
.mn-sub{margin:0;font-size:12px;line-height:18px;color:var(--mn-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mn-topbar-right{display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.mn-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:var(--mn-radius-sm);border:.5px solid var(--dsw-alias-border-l3,var(--mn-line-strong));background:transparent;color:var(--mn-muted);font-family:inherit;font-size:12px;line-height:18px;white-space:nowrap;max-width:100%;cursor:pointer;transition:background var(--mn-dur) var(--mn-ease)}
.mn-chip:hover{background:var(--mn-hover)}
.mn-chip b{font-weight:500;color:var(--mn-text);overflow:hidden;text-overflow:ellipsis}
.mn-chip .mn-sep{opacity:.5}

/* ---------- buttons ---------- */
.mn-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;height:36px;padding:0 14px;border:0;border-radius:var(--mn-radius-md);background:transparent;color:var(--mn-text);font-size:14px;line-height:22px;cursor:pointer;white-space:nowrap;transition:background var(--mn-dur) var(--mn-ease),box-shadow var(--mn-dur) var(--mn-ease),opacity var(--mn-dur) var(--mn-ease)}
.mn-btn:disabled{cursor:not-allowed;opacity:.4}
.mn-btn:focus-visible{outline:2px solid color-mix(in srgb,var(--mn-accent) 45%,transparent);outline-offset:1px}
.mn-btn[data-variant="primary"]{background:var(--dsw-alias-button-primary-fill,var(--mn-accent));color:var(--dsw-alias-label-primary-foreground,#fff)}
.mn-btn[data-variant="primary"]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,color-mix(in srgb,var(--mn-accent) 86%,#000))}
.mn-btn[data-variant="outline"]{box-shadow:inset 0 0 0 .5px var(--mn-line-strong)}
.mn-btn[data-variant="outline"]:hover:not(:disabled){background:var(--mn-hover)}
.mn-btn[data-variant="ghost"]{color:var(--mn-muted)}
.mn-btn[data-variant="ghost"]:hover:not(:disabled){background:var(--mn-hover);color:var(--mn-text)}
.mn-btn[data-tone="danger"]{color:var(--mn-hot)}
.mn-btn[data-tone="danger"]:hover:not(:disabled){background:color-mix(in srgb,var(--mn-hot) 8%,transparent);color:var(--mn-hot)}
.mn-btn[data-size="small"]{height:28px;padding:0 10px;border-radius:var(--mn-radius-sm);font-size:12px;line-height:18px}
.mn-btn[data-size="block"]{width:100%}
.mn-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--mn-radius-sm);background:transparent;color:var(--mn-muted);cursor:pointer;transition:background var(--mn-dur) var(--mn-ease),color var(--mn-dur) var(--mn-ease)}
.mn-icon-btn:hover:not(:disabled){background:var(--mn-hover);color:var(--mn-text)}
.mn-icon-btn:disabled{cursor:not-allowed;opacity:.4}
.mn-icon-btn-danger{color:var(--mn-tertiary)}
.mn-icon-btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--mn-hot) 9%,transparent);color:var(--mn-hot)}
.mn-icon-btn:focus-visible,.mn-chip:focus-visible{outline:2px solid color-mix(in srgb,var(--mn-accent) 45%,transparent);outline-offset:1px}

/* ---------- banners（只在需要常驻的错误/警告时使用） ---------- */
.mn-banner{display:flex;align-items:flex-start;gap:8px;margin-bottom:12px;padding:10px 12px;border-radius:var(--mn-radius-md);font-size:13px;line-height:20px}
.mn-banner[data-tone="error"]{color:var(--mn-hot);background:color-mix(in srgb,var(--mn-hot) 8%,transparent)}
.mn-banner[data-tone="warn"]{color:var(--mn-warn);background:color-mix(in srgb,var(--mn-warn) 8%,transparent)}
.mn-banner[data-tone="info"]{color:var(--mn-muted);background:var(--mn-module)}
.mn-banner span{flex:1;min-width:0;word-break:break-word}
.mn-banner button{flex:0 0 auto;border:0;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;opacity:.7;padding:0 2px}
.mn-banner button:hover{opacity:1}

/* ---------- layout ---------- */
.mn-layout{display:grid;grid-template-columns:minmax(0,332px) minmax(0,1fr);gap:24px;align-items:start}
.mn-rail{position:sticky;top:16px;display:flex;flex-direction:column;gap:20px;min-width:0}
@media (max-width:1020px){
  .mn-layout{grid-template-columns:minmax(0,1fr);gap:24px}
  .mn-rail{position:static}
  .mn-shell{padding:18px 16px 40px}
}

/* ---------- meeting detection suggestion ---------- */
.mn-detect{background:var(--mn-fill);border:.5px solid var(--dsw-alias-border-l3,var(--mn-line));border-radius:var(--mn-radius-lg);padding:16px}
.mn-detect-head{display:flex;align-items:flex-start;gap:10px}
.mn-detect-icon{display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:28px;height:28px;border-radius:var(--mn-radius-sm);background:var(--mn-module);color:var(--mn-accent)}
.mn-detect[data-kind="end"] .mn-detect-icon{color:var(--mn-warn)}
.mn-detect-main{flex:1 1 auto;min-width:0}
.mn-detect-title{margin:0;font-size:14px;line-height:22px;font-weight:600;color:var(--mn-text)}
.mn-detect-body{margin:2px 0 0;font-size:12px;line-height:18px;color:var(--mn-muted);word-break:break-word}
.mn-detect-actions{display:flex;align-items:center;gap:8px;margin-top:14px}
.mn-detect-actions .mn-btn{flex:1 1 0;min-width:0}
.mn-switch[data-disabled="1"]{opacity:.4;cursor:not-allowed}
.mn-switch[data-disabled="1"] input,.mn-switch input:disabled{cursor:not-allowed}

/* ---------- record panel ---------- */
.mn-record{background:var(--mn-fill);border:.5px solid var(--dsw-alias-border-l3,var(--mn-line));border-radius:var(--mn-radius-lg);padding:16px}
.mn-record-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mn-record-head h2{margin:0;font-size:12px;line-height:18px;font-weight:600;color:var(--mn-muted)}
.mn-seg{display:inline-grid;grid-auto-flow:column;align-items:center;gap:2px;padding:2px;border-radius:var(--mn-radius-md);background:var(--mn-module)}
.mn-seg button{height:24px;padding:0 8px;border:0;border-radius:calc(var(--mn-radius-md) - 4px);background:transparent;color:var(--mn-muted);font-size:12px;line-height:18px;font-family:inherit;cursor:pointer;white-space:nowrap;transition:background var(--mn-dur) var(--mn-ease),color var(--mn-dur) var(--mn-ease)}
.mn-seg button[data-active="1"]{background:var(--mn-layer-3);color:var(--mn-text);font-weight:500;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l3,var(--mn-line-strong))}
.mn-seg button:disabled{cursor:not-allowed;opacity:.5}
.mn-timer-row{display:flex;align-items:center;gap:10px;margin:16px 0 0}
.mn-timer{font-size:34px;line-height:38px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.mn-timer[data-active="1"]{color:var(--mn-hot)}
.mn-recstate{display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:18px;color:var(--mn-muted);white-space:nowrap}
.mn-recstate[data-active="1"]{color:var(--mn-hot)}
.mn-dot{width:7px;height:7px;border-radius:50%;flex:0 0 auto;background:var(--mn-muted);display:inline-block}
.mn-dot[data-tone="ok"]{background:var(--mn-ok)}
.mn-dot[data-tone="warn"]{background:var(--mn-warn)}
.mn-dot[data-tone="hot"]{background:var(--mn-hot)}
.mn-dot[data-tone="busy"]{background:var(--mn-accent);animation:mn-blink 1.2s ease-in-out infinite}
.mn-dot[data-tone="active"]{background:var(--mn-hot);animation:mn-pulse 1.8s ease-out infinite}
@keyframes mn-blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes mn-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--mn-hot) 45%,transparent)}70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
.mn-levels{display:flex;flex-direction:column;gap:8px;margin:16px 0 0}
.mn-level{display:grid;grid-template-columns:58px minmax(0,1fr) 36px;align-items:center;gap:8px;font-size:12px;line-height:18px;color:var(--mn-muted)}
.mn-level-pct{text-align:right;font-variant-numeric:tabular-nums}
.mn-level-track{height:4px;border-radius:999px;background:var(--mn-skel);overflow:hidden}
.mn-level-fill{height:100%;border-radius:999px;background:var(--mn-accent);transition:width .12s linear}
.mn-record-actions{display:flex;align-items:center;gap:8px;margin-top:16px}
.mn-record-actions .mn-btn[data-size="block"]{flex:1 1 auto}
.mn-record-actions .mn-btn[data-size="small"]{flex:0 0 auto}
.mn-hint{margin:12px 0 0;font-size:12px;line-height:18px;color:var(--mn-muted)}
.mn-live{margin-top:16px;padding-top:14px;border-top:1px solid var(--mn-line)}
.mn-live-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:12px;line-height:18px;color:var(--mn-muted);font-weight:600}
.mn-live-list{max-height:168px;overflow:auto;scrollbar-width:thin;display:flex;flex-direction:column;gap:6px}
.mn-live-line{display:flex;gap:8px;font-size:13px;line-height:20px}
.mn-live-ts{flex:0 0 auto;min-width:36px;color:var(--mn-tertiary);font-variant-numeric:tabular-nums;font-size:12px;padding-top:1px}
.mn-live-text{min-width:0;word-break:break-word}
.mn-live-partial{color:var(--mn-muted)}
.mn-live-empty{font-size:12px;line-height:18px;color:var(--mn-muted);padding:2px 0}

/* ---------- meetings list ---------- */
.mn-rail-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px;margin-bottom:4px}
.mn-rail-head h2{margin:0;font-size:12px;line-height:18px;font-weight:600;color:var(--mn-muted)}
.mn-count{font-size:12px;line-height:18px;color:var(--mn-muted);font-variant-numeric:tabular-nums;padding-right:10px}
.mn-items{display:flex;flex-direction:column;gap:2px;max-height:min(46vh,460px);overflow:auto;scrollbar-width:thin;margin:0 -8px;padding:0 8px}
.mn-item{display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;border:0;border-radius:var(--mn-radius-md);background:transparent;color:var(--mn-text);font-size:14px;line-height:22px;padding:8px 10px;cursor:pointer;transition:background var(--mn-dur) var(--mn-ease)}
.mn-item:hover{background:var(--mn-hover)}
.mn-item:focus-visible{outline:2px solid color-mix(in srgb,var(--mn-accent) 45%,transparent);outline-offset:-2px}
.mn-item[data-active="1"]{background:var(--mn-active)}
.mn-item-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.mn-item-title{font-weight:500;word-break:break-word;display:block}
.mn-item-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:var(--mn-muted);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.mn-item-meta .mn-sep{opacity:.5}
.mn-item-flag{flex:0 0 auto;color:var(--mn-tertiary);display:flex;align-items:center;padding-top:3px}

/* ---------- detail ---------- */
.mn-detail{min-width:0;padding-top:2px}
.mn-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.mn-detail-title{min-width:0;flex:1 1 320px}
.mn-detail-title h2{margin:0 0 4px;font-size:20px;line-height:28px;font-weight:600;letter-spacing:-.01em;word-break:break-word}
.mn-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:var(--mn-muted);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.mn-meta .mn-sep{opacity:.5}
.mn-detail-actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end;flex:0 0 auto}
.mn-audio{display:flex;align-items:center;gap:12px;margin:16px 0 4px;padding:8px 12px;border-radius:var(--mn-radius-md);border:.5px solid var(--dsw-alias-border-l3,var(--mn-line));background:var(--mn-fill)}
.mn-audio-label{flex:0 0 auto;font-size:12px;line-height:18px;font-weight:600;color:var(--mn-muted)}
.mn-audio-el{flex:1 1 auto;min-width:0;height:32px;display:block;color-scheme:inherit}
.mn-audio-el::-webkit-media-controls-panel{background:var(--mn-fill)}
.mn-path{display:block;margin-top:10px;font-size:12px;line-height:18px;color:var(--mn-tertiary);word-break:break-all}

/* ---------- tabs ---------- */
.mn-tabs{display:flex;align-items:center;gap:24px;margin-top:20px;border-bottom:1px solid var(--mn-line)}
.mn-tab{position:relative;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0;border:0;background:transparent;color:var(--mn-muted);font-size:14px;line-height:22px;font-weight:500;cursor:pointer}
.mn-tab:hover{color:var(--mn-text)}
.mn-tab[data-active="1"]{color:var(--mn-text);font-weight:600}
.mn-tab[data-active="1"]::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;background:var(--mn-accent)}
.mn-tab-count{font-size:12px;line-height:18px;font-weight:500;color:var(--mn-muted);font-variant-numeric:tabular-nums}
.mn-tab-dot{width:5px;height:5px;border-radius:50%;background:var(--mn-ok)}

/* ---------- document ---------- */
.mn-doc{margin-top:20px;max-width:76ch;font-size:14px;line-height:24px}
.mn-doc-h1{margin:2px 0 12px;font-size:18px;line-height:26px;font-weight:600;letter-spacing:-.01em}
.mn-doc-h2{margin:24px 0 8px;font-size:16px;line-height:24px;font-weight:600}
.mn-doc-h2:first-child{margin-top:2px}
.mn-doc-h3{margin:18px 0 6px;font-size:14px;line-height:22px;font-weight:600}
.mn-doc-p{margin:0 0 8px;white-space:pre-wrap;word-break:break-word}
.mn-doc-ul,.mn-doc-ol{margin:0 0 10px;padding-left:20px}
.mn-doc-ul li,.mn-doc-ol li{margin:0 0 4px;line-height:23px}
.mn-doc-quote{margin:0 0 10px;padding:2px 0 2px 12px;border-left:2px solid var(--mn-line-strong);color:var(--mn-muted)}
.mn-doc-line{display:flex;gap:12px;margin:0 0 4px}
.mn-doc-ts{flex:0 0 auto;min-width:38px;color:var(--mn-tertiary);font-variant-numeric:tabular-nums;font-size:12px;line-height:20px;padding-top:2px}
.mn-doc-text{min-width:0;word-break:break-word;white-space:pre-wrap}
.mn-doc b{font-weight:600}
.mn-doc code{padding:1px 5px;border-radius:var(--mn-radius-xs,4px);background:var(--mn-skel);font-size:13px}
.mn-table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:13px;line-height:20px}
.mn-table th{text-align:left;font-weight:600;color:var(--mn-muted);padding:8px 10px;border-bottom:1px solid var(--mn-line-strong);white-space:nowrap}
.mn-table td{padding:8px 10px;border-bottom:1px solid var(--mn-line);vertical-align:top}
.mn-doc-empty{color:var(--mn-muted);font-size:14px;line-height:22px;margin-top:20px}
.mn-doc-empty b{display:block;margin-bottom:4px;font-size:14px;line-height:22px;color:var(--mn-text);font-weight:600}

/* ---------- states ---------- */
.mn-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:56px 24px;color:var(--mn-muted)}
.mn-empty-mark{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:var(--mn-radius-md);background:var(--mn-fill);color:var(--mn-muted);margin-bottom:2px}
.mn-empty b{font-size:14px;line-height:22px;color:var(--mn-text);font-weight:600}
.mn-empty span{font-size:13px;line-height:20px;max-width:380px}
.mn-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:240px;color:var(--mn-muted);font-size:13px;line-height:20px}
.mn-spinner{width:20px;height:20px;border-radius:50%;border:2px solid color-mix(in srgb,var(--mn-accent) 22%,transparent);border-top-color:var(--mn-accent);animation:mn-spin .8s linear infinite}
@keyframes mn-spin{to{transform:rotate(360deg)}}
.mn-skel{height:44px;border-radius:var(--mn-radius-md);background:linear-gradient(100deg,var(--mn-skel) 20%,var(--mn-hover) 40%,var(--mn-skel) 60%);background-size:220% 100%;animation:mn-shimmer 1.4s linear infinite;margin-bottom:6px}
@keyframes mn-shimmer{to{background-position:-120% 0}}

/* ---------- modal（复制 DSH Dialog / ConfirmDialog 结构） ---------- */
.mn-modal-root{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}
.mn-modal-mask{position:absolute;inset:0;background:var(--mn-mask);backdrop-filter:var(--mn-blur);animation:mn-mask-in var(--mn-dur) var(--mn-ease)}
.mn-modal{position:relative;z-index:1;display:flex;flex-direction:column;width:min(380px,100%);max-height:calc(100dvh - 48px);overflow:hidden;border:0;border-radius:var(--mn-radius-panel);background:var(--mn-fill-2);box-shadow:var(--mn-elevation);animation:mn-modal-in var(--mn-dur) var(--mn-ease)}
.mn-modal:focus{outline:none}
.mn-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:22px 14px 12px 24px}
.mn-modal-head h2{margin:0;font-size:16px;line-height:24px;font-weight:500;color:var(--mn-text)}
.mn-modal-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--mn-radius-sm);background:transparent;color:var(--mn-muted);cursor:pointer}
.mn-modal-close:hover{background:var(--mn-hover);color:var(--mn-text)}
.mn-modal-desc{margin:0;padding:0 24px 12px;font-size:14px;line-height:22px;color:var(--mn-muted)}
.mn-modal-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 24px 4px;scrollbar-width:thin}
.mn-modal-foot{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:20px 24px 24px}
.mn-modal-foot .mn-modal-note{margin-right:auto;font-size:12px;line-height:18px;color:var(--mn-muted)}
.mn-modal-actions{display:flex;align-items:center;gap:8px}
.mn-modal-settings{width:min(560px,100%)}
.mn-modal-body>.mn-group:first-child{padding-top:4px}
.mn-confirm-warning{display:flex;align-items:flex-start;gap:10px;color:var(--mn-muted);font-size:14px;line-height:22px}
.mn-confirm-warning p{margin:0}
.mn-confirm-icon{flex:none;margin-top:2px;color:var(--mn-hot)}
.mn-confirm-action{min-width:136px}
@keyframes mn-mask-in{from{opacity:0}to{opacity:1}}
@keyframes mn-modal-in{from{opacity:0;transform:translateY(4px) scale(.99)}to{opacity:1;transform:none}}

/* ---------- tooltip（复制 DSH Tooltip bubble） ---------- */
.mn-tt{position:fixed;z-index:1100;display:inline-flex;align-items:center;gap:8px;width:max-content;max-width:min(50vw,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:3px 7px;border-radius:var(--mn-radius-sm);background:var(--mn-tooltip-bg);color:var(--dsw-static-neutral-bluish-00,#fff);font-size:13px;line-height:20px;white-space:pre-line;overflow-wrap:break-word;pointer-events:none;box-shadow:var(--mn-shadow-1);animation:mn-tt-in .1s var(--mn-ease)}
@keyframes mn-tt-in{from{opacity:0}to{opacity:1}}

/* ---------- toast（复制 DSH Toast：顶部居中、停留 3s 后淡出） ---------- */
.mn-toast{position:fixed;top:40px;left:50%;z-index:1100;pointer-events:none;display:flex;align-items:center;gap:10px;width:max-content;max-width:min(640px,calc(100vw - 48px));padding:12px 16px;border-radius:var(--mn-radius-lg);background:var(--mn-toast-bg);color:var(--mn-toast-label);font-size:14px;line-height:22px;box-shadow:var(--mn-shadow-3);transform:translate(-50%);animation:mn-toast-fade 1s var(--mn-ease) 3s forwards}
.mn-toast-icon{display:inline-flex;align-items:center;flex:0 0 auto;color:var(--dsw-alias-state-success-primary,#22c55e)}
.mn-toast-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@keyframes mn-toast-fade{0%,80%{opacity:1}100%{opacity:0}}

/* ---------- settings ---------- */
.mn-group{padding:16px 0 4px;border-top:1px solid var(--mn-line)}
.mn-group:first-child{border-top:0;padding-top:10px}
.mn-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.mn-group-head h3{margin:0;font-size:12px;line-height:18px;font-weight:600;color:var(--mn-muted)}
.mn-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.mn-field:last-child{margin-bottom:4px}
.mn-label{font-size:12px;line-height:18px;font-weight:500;color:var(--mn-muted)}
.mn-field-row{display:flex;align-items:center;gap:8px;min-width:0}
.mn-input{box-sizing:border-box;height:34px;min-width:0;border:.5px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));border-radius:var(--mn-radius-md);background:var(--mn-layer-3);color:var(--mn-text);font-family:inherit;font-size:13px;line-height:1.5;padding:0 12px;outline:none;transition:border-color var(--mn-dur) var(--mn-ease),box-shadow var(--mn-dur) var(--mn-ease)}
.mn-input:focus{border-color:var(--mn-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--mn-accent) 22%,transparent)}
.mn-input[type="number"]{width:88px}
.mn-field-row .mn-input{flex:1 1 auto}
.mn-select{box-sizing:border-box;height:34px;border:.5px solid var(--dsw-alias-border-l4,rgba(0,0,0,.16));border-radius:var(--mn-radius-md);background:var(--mn-layer-3);color:var(--mn-text);font-family:inherit;font-size:13px;line-height:1.5;padding:0 8px 0 12px;outline:none;cursor:pointer;min-width:120px}
.mn-select:focus{border-color:var(--mn-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--mn-accent) 22%,transparent)}
.mn-switch{display:inline-flex;align-items:center;gap:10px;font-size:14px;line-height:22px;cursor:pointer;color:var(--mn-text)}
.mn-switch input{position:absolute;opacity:0;width:0;height:0}
.mn-switch-track{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3,var(--mn-line-strong));transition:background var(--mn-dur) var(--mn-ease)}
.mn-switch-track::after{content:'';display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-switch-thumb,var(--mn-muted));transition:transform .12s ease}
.mn-switch input:checked+.mn-switch-track{background:var(--mn-accent);border-color:var(--mn-accent)}
.mn-switch input:checked+.mn-switch-track::after{transform:translate(16px)}
.mn-switch input:focus-visible+.mn-switch-track{outline:2px solid color-mix(in srgb,var(--mn-accent) 45%,transparent);outline-offset:2px}

/* ---------- models ---------- */
.mn-chip-btn{cursor:pointer;font:inherit;text-align:left;transition:background var(--mn-dur) var(--mn-ease),color var(--mn-dur) var(--mn-ease)}
.mn-link{border:0;background:none;padding:0;color:var(--mn-accent);font:inherit;font-size:13px;line-height:20px;cursor:pointer;white-space:nowrap}
.mn-link:hover{text-decoration:underline}
.mn-model-warn{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 11px;border-radius:var(--mn-radius-sm);background:color-mix(in srgb,var(--mn-warn) 8%,transparent);color:var(--mn-warn);font-size:12px;line-height:18px}
.mn-model{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:var(--mn-radius-md);border:.5px solid var(--dsw-alias-border-l3,var(--mn-line));background:var(--mn-layer-3)}
.mn-model + .mn-model{margin-top:10px}
.mn-model-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.mn-model-name{display:flex;align-items:center;gap:8px;font-size:14px;line-height:22px;color:var(--mn-text);min-width:0;flex-wrap:wrap}
.mn-model-name b{font-weight:600}
.mn-tag{padding:1px 8px;border-radius:999px;background:var(--mn-module);color:var(--mn-muted);font-size:11px;line-height:17px;font-weight:500}
.mn-model-meta{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;line-height:18px;color:var(--mn-muted);flex-wrap:wrap}
.mn-model-estimate{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;line-height:18px;color:var(--mn-muted)}
.mn-model-progress{display:flex;flex-direction:column;gap:5px}
.mn-progress{height:4px;border-radius:999px;background:var(--mn-skel);overflow:hidden}
.mn-progress-fill{height:100%;border-radius:999px;background:var(--mn-accent);transition:width .3s var(--mn-ease)}
.mn-model-progress .mn-hint{margin:0}
.mn-model-steps{font-size:12px;line-height:18px;color:var(--mn-muted)}
.mn-model-steps summary{cursor:pointer;user-select:none;list-style:none}
.mn-model-steps summary::-webkit-details-marker{display:none}
.mn-model-step-now{color:var(--mn-text)}
.mn-model-steps ol{list-style:none;margin:7px 0 0;padding:0;display:flex;flex-direction:column;gap:5px}
.mn-step{display:flex;align-items:center;gap:7px}
.mn-model-step-status{margin-left:auto}
.mn-model-error{padding:9px 11px;border-radius:var(--mn-radius-sm);background:color-mix(in srgb,var(--mn-hot) 8%,transparent);word-break:break-word}
.mn-model-error strong{display:block;font-size:12px;line-height:18px;color:var(--mn-hot);font-weight:600}
.mn-model-error .mn-hint{color:var(--mn-muted);margin:4px 0 0}
.mn-model-source{margin:0}
.mn-model-source .mn-hint{margin:0}
.mn-model-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mn-model-actions-hint{font-size:12px;line-height:18px;color:var(--mn-muted)}

@media (prefers-reduced-motion:reduce){
  .mn-spinner,.mn-skel,.mn-dot[data-tone="busy"],.mn-dot[data-tone="active"]{animation:none!important}
  .mn-modal-mask,.mn-modal,.mn-tt,.mn-toast{animation:none!important}
}
`;

    const pad2 = (value) => String(value).padStart(2, '0');

    const fmtClock = (seconds) => {
      const total = Math.max(0, Math.floor(Number(seconds) || 0));
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      return hours > 0
        ? `${hours}:${pad2(minutes)}:${pad2(secs)}`
        : `${pad2(minutes)}:${pad2(secs)}`;
    };

    const fmtDate = (value) => {
      if (!value) return '—';
      const date = new Date(String(value));
      if (Number.isNaN(date.getTime())) return String(value);
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    };

    const fmtBytes = (bytes) => {
      const size = Number(bytes) || 0;
      if (size <= 0) return '—';
      if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
      if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
      return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
    };

    const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

    const createStore = (initial) => {
      let state = initial;
      const listeners = new Set();
      return {
        get: () => state,
        set: (patch) => {
          state = { ...state, ...patch };
          for (const listener of [...listeners]) listener();
        },
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };
    };

    const LANG_KEY = {
      auto: 'langAuto',
      zh: 'langZh',
      en: 'langEn',
      yue: 'langYue',
      ja: 'langJa',
      ko: 'langKo',
    };

    const PHASE_KEY = {
      unprepare: 'phaseUnprepared',
      unprepared: 'phaseUnprepared',
      downloading: 'phaseDownloading',
      checking: 'phaseChecking',
      loading: 'phaseLoading',
      waking: 'phaseWaking',
      ready: 'phaseReady',
      standby: 'phaseStandby',
      failed: 'phaseFailed',
      cancelled: 'phaseCancelled',
      cancelling: 'phaseCancelling',
    };

    // DSH 语音服务按阶段上报准备步骤（check → model → vad → verify → load）。
    const STEP_KEY = {
      check: 'stepCheck',
      model: 'stepModel',
      vad: 'stepVad',
      verify: 'stepVerify',
      load: 'stepLoad',
    };

    const STEP_STATUS_KEY = {
      pending: 'stepPending',
      idle: 'stepPending',
      running: 'stepRunning',
      complete: 'stepComplete',
      completed: 'stepComplete',
      failed: 'stepFailed',
      cancelled: 'stepCancelled',
    };

    // 下载失败原因 → 中文/英文文案与建议（DSH 的 download.reason 是稳定枚举）。
    const DOWNLOAD_REASON_KEY = {
      network: 'reasonNetwork',
      dns: 'reasonDns',
      timeout: 'reasonTimeout',
      certificate: 'reasonCertificate',
      http: 'reasonHttp',
      integrity: 'reasonIntegrity',
      storage: 'reasonStorage',
      unknown: 'reasonUnknown',
    };
    const DOWNLOAD_ADVICE_KEY = {
      network: 'adviceNetwork',
      dns: 'adviceDns',
      timeout: 'adviceTimeout',
      certificate: 'adviceCertificate',
      http: 'adviceHttp',
      integrity: 'adviceIntegrity',
      storage: 'adviceStorage',
      unknown: 'adviceUnknown',
    };

    function MicIcon(props) {
      const size = Number(props?.size) || 20;
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          style: { display: 'block', flex: '0 0 auto', opacity: props?.active ? 1 : 0.86 },
        },
        h('rect', { x: 9, y: 2.5, width: 6, height: 11, rx: 3 }),
        h('path', { d: 'M5 11a7 7 0 0 0 14 0' }),
        h('path', { d: 'M12 18v3.5' }),
        h('path', { d: 'M8.5 21.5h7' }),
      );
    }

    return {
      inject: ['slots', 'locale', 'layout', 'uiWorkspace'],
      apply(ctx) {
        const t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICT_ZH));
        ctx.effect(() => ctx.locale.register(NS, 'en', DICT_EN));

        // -----------------------------------------------------------------
        // Store
        // -----------------------------------------------------------------
        const store = createStore({
          state: null,
          loading: true,
          refreshing: false,
          stateError: '',
          warning: '',
          sseDown: false,
          error: '',
          notice: '',
          selectedId: '',
          detail: null,
          detailLoading: false,
          detailError: '',
          live: { partial: '', segments: [] },
          busy: '',
          settingsOpen: false,
          cfgBase: null,
          docTab: 'transcript',
          cfgDraft: null,
          cfgDirty: false,
          cfgSaving: false,
          prepareId: '',
          confirm: '',
          noticeSeq: 0,
          detect: null,
          detectNotifiedId: '',
          detectFocusSeq: 0,
        });

        const useStore = () => React.useSyncExternalStore(store.subscribe, store.get);

        // -----------------------------------------------------------------
        // Small UI helpers
        // -----------------------------------------------------------------
        let noticeTimer = 0;

        const showError = (error, fallback) => {
          const message =
            error && typeof error === 'object' && error.message
              ? String(error.message)
              : error
                ? String(error)
                : fallback || t('unknownError');
          store.set({ error: message });
        };

        // 临时结果提示走 DSH Toast：出现即自动消失，不打断页面布局。
        const showNotice = (text) => {
          if (noticeTimer) window.clearTimeout(noticeTimer);
          store.set({ notice: String(text || ''), noticeSeq: store.get().noticeSeq + 1 });
          noticeTimer = window.setTimeout(() => {
            noticeTimer = 0;
            store.set({ notice: '' });
          }, 4000);
        };

        // 不可撤销的操作统一走 DSH ConfirmDialog，不再用「再点一次」的按钮变形。
        const closeConfirm = () => {
          if (store.get().confirm) store.set({ confirm: '' });
        };

        const cfgFrom = (config) => ({
          storageDir: String(config?.storageDir || ''),
          transcribeMode: config?.transcribeMode === 'realtime' ? 'realtime' : 'after',
          language: String(config?.language || 'zh'),
          providerId: String(config?.providerId || 'sensevoice-local'),
          captureSystemAudio: config?.captureSystemAudio !== false,
          captureMicrophone: config?.captureMicrophone !== false,
          chunkSeconds: Number(config?.chunkSeconds) || 25,
          detectEnabled: config?.detectEnabled !== false,
          detectNotify: config?.detectNotify !== false,
        });

        // 兼容旧版 /state：没有 models 数组时，用当前 provider 合成一个只读列表项。
        const modelList = (state) => {
          if (Array.isArray(state?.models) && state.models.length) return state.models;
          if (!state?.provider) return [];
          const phase = state.provider.preparation?.phase || (state.providerReady ? 'ready' : 'unprepare');
          return [
            {
              ...state.provider,
              preparation: state.provider.preparation || { phase },
              downloadSources: Array.isArray(state.provider.downloadSources) ? state.provider.downloadSources : [],
              setupEstimate: state.provider.setupEstimate || null,
              selected: true,
              ready: state.providerReady === true || phase === 'ready' || phase === 'standby',
              preparing: false,
              canPrepare: ['unprepare', 'unprepared', 'cancelled', 'failed'].includes(phase),
            },
          ];
        };

        const langLabel = (code) => (LANG_KEY[code] ? t(LANG_KEY[code]) : String(code || ''));
        const phaseLabel = (phase) => t(PHASE_KEY[phase] || 'phaseUnprepared');
        const phaseTone = (phase) => {
          if (phase === 'ready' || phase === 'standby') return 'ok';
          if (phase === 'failed' || phase === 'cancelled') return 'hot';
          if (phase === 'downloading' || phase === 'checking' || phase === 'loading' || phase === 'waking' || phase === 'cancelling') {
            return 'busy';
          }
          return 'muted';
        };

        // 设置页模型列表：未就绪的本地模型需要用户手动下载，避免打开页面就偷偷下载。
        const canPrepareModel = (model) => {
          if (!model || model.preparing) return false;
          if (model.canPrepare === true) return true;
          const phase = model.preparation?.phase || 'unprepare';
          return ['unprepare', 'unprepared', 'cancelled', 'failed'].includes(phase) && model.location !== 'cloud';
        };
        const preparingPhase = (phase) =>
          ['checking', 'downloading', 'loading', 'waking', 'cancelling'].includes(phase);
        const stepStatusLabel = (status) => t(STEP_STATUS_KEY[status] || 'stepPending');
        const stepLabel = (kind) => t(STEP_KEY[kind] || kind);
        const fmtMb = (bytes) => {
          const mb = (Number(bytes) || 0) / 1024 / 1024;
          if (!mb) return '0';
          return mb >= 100 ? String(Math.round(mb)) : mb.toFixed(1).replace(/\.0$/, '');
        };

        const statusInfo = (status) => {
          if (status === 'transcribing') return { label: t('statusTranscribing'), tone: 'warn' };
          if (status === 'transcribed') return { label: t('statusTranscribed'), tone: 'ok' };
          if (status === 'failed') return { label: t('statusFailed'), tone: 'hot' };
          return { label: t('statusRecorded'), tone: 'muted' };
        };

        // -----------------------------------------------------------------
        // HTTP
        // -----------------------------------------------------------------
        const apiFetch = async (path, options) => {
          const response = await fetch(API + path, options);
          let payload = null;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
          if (!response.ok || (payload && payload.ok === false)) {
            const detail = payload && payload.error ? String(payload.error) : '';
            throw new Error(detail || `${t('requestFailed')} (${response.status})`);
          }
          return payload || { ok: true };
        };

        const apiGet = (path) => apiFetch(path, { headers: { [HEADER]: '1' }, cache: 'no-store' });
        const apiPost = (path, body) =>
          apiFetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json', [HEADER]: '1' },
            body: JSON.stringify(body || {}),
          });
        const apiDelete = (path) => apiFetch(path, { method: 'DELETE', headers: { [HEADER]: '1' } });

        // -----------------------------------------------------------------
        // Timers: polling, elapsed tick, SSE
        // -----------------------------------------------------------------
        let subscribers = 0;
        let pollTimer = 0;
        let tickTimer = 0;
        let sseWanted = false;
        let sseController = null;
        let sseRetryTimer = 0;
        let sseAttempts = 0;
        let sseGivenUp = false;
        let seenRecordingActive = false;
        let lastLevelAt = 0;

        const clearUiTimers = () => {
          if (pollTimer) {
            window.clearTimeout(pollTimer);
            pollTimer = 0;
          }
          if (tickTimer) {
            window.clearInterval(tickTimer);
            tickTimer = 0;
          }
          if (noticeTimer) {
            window.clearTimeout(noticeTimer);
            noticeTimer = 0;
          }
        };

        const ensureTick = () => {
          const active = !!store.get().state?.recording?.active;
          if (active && !tickTimer) {
            tickTimer = window.setInterval(() => {
              const state = store.get().state;
              if (!state?.recording?.active) {
                if (tickTimer) {
                  window.clearInterval(tickTimer);
                  tickTimer = 0;
                }
                return;
              }
              const recording = state.recording;
              let seconds = Number(recording.seconds) || 0;
              if (recording.startedAt) {
                const started = Date.parse(recording.startedAt);
                if (Number.isFinite(started)) seconds = Math.max(seconds, (Date.now() - started) / 1000);
              }
              const next = Math.floor(seconds);
              if (next !== Math.floor(Number(recording.seconds) || 0)) {
                store.set({ state: { ...state, recording: { ...recording, seconds: next } } });
              }
            }, 500);
          }
          if (!active && tickTimer) {
            window.clearInterval(tickTimer);
            tickTimer = 0;
          }
        };

        const applyRecording = (recording) => {
          if (!recording || typeof recording !== 'object') return;
          const state = store.get().state;
          if (!state) return;
          const patch = { state: { ...state, recording } };
          store.set(patch);
          // 刷新页面/断线重连后，用服务端快照补回已产出的实时片段。
          seedLiveFromRecording(recording);
          ensureTick();
          ensureSse();
        };

        const appendSegment = (payload) => {
          const live = store.get().live;
          const text = String(payload.text || '').trim();
          if (!text) return;
          const fromSec = Number(payload.fromSec) || 0;
          const toSec = Number(payload.toSec) || 0;
          const index = Number.isFinite(Number(payload.index)) ? Number(payload.index) : null;
          const segments = live.segments.slice();
          const duplicate = segments.some((item) =>
            index === null
              ? item.text === text && Math.abs((item.fromSec || 0) - fromSec) < 0.01
              : item.index === index,
          );
          if (duplicate) return;
          segments.push({ index, text, fromSec, toSec });
          segments.sort((a, b) => (a.fromSec || 0) - (b.fromSec || 0));
          store.set({ live: { partial: '', segments } });
        };

        const updateLevel = (payload) => {
          const state = store.get().state;
          if (!state) return;
          const now = Date.now();
          if (now - lastLevelAt < 100) return;
          lastLevelAt = now;
          const recording = state.recording || {};
          store.set({
            state: {
              ...state,
              recording: {
                ...recording,
                seconds: Number(payload.seconds) || recording.seconds || 0,
                level: clamp01(payload.level),
                micLevel: clamp01(payload.micLevel),
                systemLevel: clamp01(payload.systemLevel),
              },
            },
          });
        };

        const handleSseChunk = (raw) => {
          const dataLines = [];
          for (const line of raw.split('\n')) {
            const text = line.replace(/\r$/, '');
            if (!text || text.startsWith(':')) continue;
            if (text.startsWith('data:')) dataLines.push(text.slice(5).trimStart());
          }
          if (dataLines.length === 0) return;
          const body = dataLines.join('\n');
          if (body === '[DONE]') return;
          let payload = null;
          try {
            payload = JSON.parse(body);
          } catch {
            return;
          }
          if (!payload || typeof payload !== 'object') return;
          if (payload.type === 'state') applyRecording(payload.recording);
          else if (payload.type === 'level') updateLevel(payload);
          else if (payload.type === 'partial') {
            store.set({ live: { ...store.get().live, partial: String(payload.text || '') } });
          } else if (payload.type === 'segment') appendSegment(payload);
          else if (payload.type === 'error') showError(payload.message || t('recordFailed'));
        };

        const scheduleSseRetry = () => {
          if (!sseWanted) return;
          sseAttempts += 1;
          if (sseAttempts > 3) {
            sseWanted = false;
            sseGivenUp = true;
            store.set({ sseDown: true });
            return;
          }
          const delay = 1000 * Math.pow(2, sseAttempts - 1);
          sseRetryTimer = window.setTimeout(() => {
            sseRetryTimer = 0;
            void openSse();
          }, delay);
        };

        const openSse = async () => {
          if (!sseWanted || sseController || sseRetryTimer) return;
          const controller = new AbortController();
          sseController = controller;
          try {
            const response = await fetch(`${API}/recordings/events`, {
              headers: { [HEADER]: '1' },
              cache: 'no-store',
              signal: controller.signal,
            });
            if (!response.ok) throw new Error(t('sseGaveUp'));
            if (!response.body || typeof response.body.getReader !== 'function') {
              throw new Error(t('sseGaveUp'));
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (sseWanted) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value && value.byteLength) {
                sseAttempts = 0;
                if (store.get().sseDown) store.set({ sseDown: false });
              }
              buffer += decoder.decode(value, { stream: true });
              let cut = buffer.indexOf('\n\n');
              while (cut >= 0) {
                const chunk = buffer.slice(0, cut);
                buffer = buffer.slice(cut + 2);
                handleSseChunk(chunk);
                cut = buffer.indexOf('\n\n');
              }
            }
            if (sseWanted) scheduleSseRetry();
          } catch {
            if (sseWanted && !controller.signal.aborted) scheduleSseRetry();
          } finally {
            if (sseController === controller) sseController = null;
          }
        };

        const startSse = () => {
          if (sseGivenUp) return;
          sseWanted = true;
          void openSse();
        };

        const stopSse = () => {
          sseWanted = false;
          sseAttempts = 0;
          if (store.get().sseDown) store.set({ sseDown: false });
          if (sseRetryTimer) {
            window.clearTimeout(sseRetryTimer);
            sseRetryTimer = 0;
          }
          if (sseController) {
            const controller = sseController;
            sseController = null;
            try {
              controller.abort();
            } catch {
              /* ignore */
            }
          }
        };

        function ensureSse() {
          const state = store.get().state;
          if (!state) return;
          if (state.recording?.active) {
            if (!seenRecordingActive) {
              seenRecordingActive = true;
              sseGivenUp = false;
              sseAttempts = 0;
            }
            startSse();
            return;
          }
          seenRecordingActive = false;
          const hadLive = store.get().live;
          stopSse();
          if (hadLive.partial || hadLive.segments.length > 0) {
            store.set({ live: { partial: '', segments: [] } });
          }
        }

        // -----------------------------------------------------------------
        // Meeting detection: SSE 常开 + 渲染进程系统通知
        // -----------------------------------------------------------------
        let detectWanted = false;
        let detectController = null;
        let detectRetryTimer = 0;
        let detectAttempts = 0;
        let detectGivenUp = false;
        let detectPermissionAsked = false;

        const canNotify = () =>
          typeof window !== 'undefined' && typeof window.Notification === 'function';

        const detectKind = (suggestion) => (suggestion && suggestion.kind === 'end' ? 'end' : 'start');
        const detectTitle = (kind) => t(kind === 'end' ? 'suggestEndTitle' : 'suggestStartTitle');
        const detectBody = (kind, suggestion) => {
          if (kind === 'end') return t('suggestEndBody');
          const app = String(suggestion?.appName || '').trim();
          return app ? t('suggestStartBody', { app }) : t('suggestStartBodyNoApp');
        };

        // 页面内卡片：开始建议在录音中不展示，结束建议只在录音中展示；
        // 系统通知不做这层过滤，是否该提醒由后端状态机判定。

        const maybeNotifyDetect = (detect) => {
          const suggestion = detect && detect.suggestion;
          if (!suggestion || !suggestion.id) return;
          // 是否该提醒由后端状态机判定；页面可能没打开（录音状态在本地是旧的），
          // 这里不再用本地 recording 过滤，否则离开页面后会漏掉结束提醒。
          if (detect.enabled === false) return;
          // 配置尚未加载时先不发通知，等 /state 回来（applyState 会再兜底一次）。
          const saved = store.get().state;
          if (!saved) return;
          if (!cfgFrom(saved.config).detectNotify) return;
          if (!canNotify()) return;
          if (store.get().detectNotifiedId === String(suggestion.id)) return;
          store.set({ detectNotifiedId: String(suggestion.id) });

          const kind = detectKind(suggestion);
          const heading = detectTitle(kind);
          const body = `${heading}：${detectBody(kind, suggestion)}`;
          const fire = () => {
            try {
              const notification = new window.Notification('DeepSeek Harness', {
                body,
                tag: suggestion.id,
              });
              // 无 actions：点击聚焦页面并让建议卡片可见。
              notification.onclick = () => {
                try {
                  window.focus();
                } catch {
                  /* ignore */
                }
                store.set({ detectFocusSeq: store.get().detectFocusSeq + 1 });
                try {
                  notification.close();
                } catch {
                  /* ignore */
                }
              };
            } catch {
              /* 权限或平台限制时只保留页面内卡片，不打扰用户 */
            }
          };

          const permission = window.Notification.permission;
          if (permission === 'granted') {
            fire();
            return;
          }
          if (permission === 'default' && !detectPermissionAsked) {
            detectPermissionAsked = true;
            try {
              const pending = window.Notification.requestPermission();
              if (pending && typeof pending.then === 'function') {
                pending
                  .then((result) => {
                    if (result === 'granted') fire();
                  })
                  .catch(() => {});
              }
            } catch {
              /* ignore */
            }
          }
        };

        const applyDetect = (detect) => {
          store.set({ detect: detect && typeof detect === 'object' ? detect : null });
          maybeNotifyDetect(detect);
        };

        const handleDetectChunk = (raw) => {
          const dataLines = [];
          for (const line of raw.split('\n')) {
            const text = line.replace(/\r$/, '');
            if (!text || text.startsWith(':')) continue;
            if (text.startsWith('data:')) dataLines.push(text.slice(5).trimStart());
          }
          if (dataLines.length === 0) return;
          let payload = null;
          try {
            payload = JSON.parse(dataLines.join('\n'));
          } catch {
            return;
          }
          if (!payload || typeof payload !== 'object') return;
          if (payload.type === 'detect') applyDetect(payload.detect);
        };

        const scheduleDetectRetry = () => {
          if (!detectWanted) return;
          detectAttempts += 1;
          if (detectAttempts > 3) {
            detectWanted = false;
            detectGivenUp = true;
            return;
          }
          const delay = 1000 * Math.pow(2, detectAttempts - 1);
          detectRetryTimer = window.setTimeout(() => {
            detectRetryTimer = 0;
            void openDetectSse();
          }, delay);
        };

        const openDetectSse = async () => {
          if (!detectWanted || detectController || detectRetryTimer) return;
          const controller = new AbortController();
          detectController = controller;
          try {
            const response = await fetch(`${API}/detect/events`, {
              headers: { [HEADER]: '1' },
              cache: 'no-store',
              signal: controller.signal,
            });
            if (!response.ok) throw new Error(t('sseGaveUp'));
            if (!response.body || typeof response.body.getReader !== 'function') {
              throw new Error(t('sseGaveUp'));
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (detectWanted) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value && value.byteLength) detectAttempts = 0;
              buffer += decoder.decode(value, { stream: true });
              let cut = buffer.indexOf('\n\n');
              while (cut >= 0) {
                const chunk = buffer.slice(0, cut);
                buffer = buffer.slice(cut + 2);
                handleDetectChunk(chunk);
                cut = buffer.indexOf('\n\n');
              }
            }
            if (detectWanted) scheduleDetectRetry();
          } catch {
            if (detectWanted && !controller.signal.aborted) scheduleDetectRetry();
          } finally {
            if (detectController === controller) detectController = null;
          }
        };

        const startDetectSse = () => {
          if (detectGivenUp) return;
          detectWanted = true;
          void openDetectSse();
        };

        const stopDetectSse = () => {
          detectWanted = false;
          detectAttempts = 0;
          if (detectRetryTimer) {
            window.clearTimeout(detectRetryTimer);
            detectRetryTimer = 0;
          }
          if (detectController) {
            const controller = detectController;
            detectController = null;
            try {
              controller.abort();
            } catch {
              /* ignore */
            }
          }
        };

        const applyDetail = (meetingId, data) => {
          if (store.get().selectedId !== meetingId) return;
          store.set({ detail: data, detailLoading: false, detailError: '' });
        };

        const loadDetail = async (meetingId, silent) => {
          if (!meetingId) return;
          if (!silent) store.set({ detailLoading: true, detailError: '' });
          try {
            const data = await apiGet(`/meetings/${encodeURIComponent(meetingId)}`);
            applyDetail(meetingId, data);
          } catch (error) {
            if (store.get().selectedId !== meetingId) return;
            const message = error?.message ? String(error.message) : t('unknownError');
            store.set({ detailLoading: false, detailError: message });
          }
        };

        // 服务端快照 → 实时面板（页面刷新或 SSE 断线重连后补齐已转写片段）。
        const seedLiveFromRecording = (recording) => {
          if (!recording || typeof recording !== 'object') return;
          if (store.get().live.segments.length > 0) return;
          if (!Array.isArray(recording.segments) || recording.segments.length === 0) return;
          const segments = recording.segments
            .map((segment) => ({
              index: Number.isFinite(Number(segment?.index)) ? Number(segment.index) : null,
              text: String(segment?.text || '').trim(),
              fromSec: Number(segment?.fromSec) || 0,
              toSec: Number(segment?.toSec) || 0,
            }))
            .filter((segment) => segment.text);
          if (segments.length === 0) return;
          store.set({ live: { partial: String(recording.partial || ''), segments } });
        };

        const applyState = (data) => {
          const previous = store.get().state;
          const meetings = Array.isArray(data.meetings) ? data.meetings : [];
          const patch = {
            state: data,
            loading: false,
            refreshing: false,
            stateError: '',
            warning: '',
          };
          // 提醒状态优先走 SSE；轮询快照兜底（SSE 未连通时仍能弹出建议卡片）。
          if (data.detect !== undefined) {
            patch.detect = data.detect && typeof data.detect === 'object' ? data.detect : null;
          }
          if (!store.get().cfgDirty) patch.cfgDraft = cfgFrom(data.config);
          store.set(patch);
          if (data.detect) maybeNotifyDetect(patch.detect);

          // Auto-select the newest meeting when nothing is selected yet.
          const selectedId = store.get().selectedId;
          if (!selectedId && meetings.length > 0) {
            store.set({ selectedId: meetings[0].id });
            void loadDetail(meetings[0].id, false);
          } else if (selectedId && !meetings.some((item) => item.id === selectedId)) {
            store.set({ selectedId: '', detail: null, detailError: '' });
          } else if (selectedId) {
            const before = previous?.meetings?.find((item) => item.id === selectedId);
            const now = meetings.find((item) => item.id === selectedId);
            const changed =
              !before ||
              before.status !== now.status ||
              before.hasMinutes !== now.hasMinutes ||
              before.transcriptChars !== now.transcriptChars;
            if (changed) void loadDetail(selectedId, true);
          }

          seedLiveFromRecording(data.recording);
          ensureTick();
          ensureSse();
        };

        const refreshState = async (silent) => {
          // 手动刷新时给实时通道一次重连机会（自动轮询不重置，避免无限重连）。
          if (!silent && sseGivenUp) {
            sseGivenUp = false;
            sseAttempts = 0;
          }
          if (!silent) store.set({ refreshing: true });
          try {
            const data = await apiGet('/state');
            applyState(data);
          } catch (error) {
            const message = error?.message ? String(error.message) : t('unknownError');
            const hasState = !!store.get().state;
            if (hasState) store.set({ refreshing: false, warning: message });
            else store.set({ loading: false, refreshing: false, stateError: message });
          }
        };

        const schedulePoll = () => {
          if (pollTimer) window.clearTimeout(pollTimer);
          pollTimer = window.setTimeout(async () => {
            pollTimer = 0;
            await refreshState(true);
            if (subscribers > 0) schedulePoll();
          }, pollDelay());
        };

        // 准备/下载模型时缩短轮询间隔，让进度条几秒内动起来。
        const pollDelay = () => {
          const models = modelList(store.get().state);
          const active = models.some((model) => model.preparing || preparingPhase(model.preparation?.phase));
          return active ? 1000 : 5000;
        };

        const startPolling = () => {
          subscribers += 1;
          if (subscribers === 1) {
            void refreshState(false);
            schedulePoll();
            // 启动早期 SSE 连不上（宿主还没就绪）时会在几次退避后放弃，
            // 页面打开/刷新时给检测订阅一次重新连接的机会。
            if (detectGivenUp) {
              detectGivenUp = false;
              detectAttempts = 0;
              startDetectSse();
            }
          }
          return () => {
            subscribers -= 1;
            if (subscribers <= 0) {
              subscribers = 0;
              clearUiTimers();
              stopSse();
            }
          };
        };

        // -----------------------------------------------------------------
        // Actions
        // -----------------------------------------------------------------
        // 设置弹窗里的草稿：打开时以当前落库值为基准，编辑只改草稿，保存才落库。
        const cfgEquals = (a, b) =>
          !!a &&
          !!b &&
          [
            'storageDir',
            'transcribeMode',
            'language',
            'providerId',
            'chunkSeconds',
            'captureSystemAudio',
            'captureMicrophone',
            'detectEnabled',
            'detectNotify',
          ].every((key) => String(a[key]) === String(b[key]));

        const applyDraft = (patch) => {
          store.set({ cfgDraft: { ...(store.get().cfgDraft || cfgFrom(null)), ...patch } });
        };

        const editDraft = (patch) => {
          const base = store.get().cfgBase || cfgFrom(store.get().state?.config);
          const draft = { ...(store.get().cfgDraft || base), ...patch };
          store.set({ cfgDraft: draft, cfgDirty: !cfgEquals(draft, base) });
        };

        const openSettings = () => {
          const base = cfgFrom(store.get().state?.config);
          store.set({ settingsOpen: true, cfgBase: base, cfgDraft: { ...base }, cfgDirty: false });
        };

        const closeSettings = () => {
          const base = store.get().cfgBase;
          store.set({ settingsOpen: false, cfgDraft: base, cfgDirty: false });
        };

        // 只把补丁里的字段落库，其它尚未保存的编辑（目录、采集源等）保持不动。
        const patchConfig = async (patch, options) => {
          store.set({ cfgDraft: { ...(store.get().cfgDraft || cfgFrom(null)), ...patch } });
          try {
            const data = await apiPost('/config', patch);
            const current = store.get();
            const draft = { ...(current.cfgDraft || cfgFrom(null)) };
            for (const key of Object.keys(patch)) {
              const saved = data.config ? data.config[key] : undefined;
              draft[key] = saved === undefined ? patch[key] : saved;
            }
            // 立即落库的字段同步更新基准值，避免把它算成「未保存的修改」。
            const base = { ...(current.cfgBase || cfgFrom(current.state?.config)) };
            for (const key of Object.keys(patch)) base[key] = draft[key];
            store.set({
              cfgDraft: draft,
              cfgBase: base,
              cfgDirty: !cfgEquals(draft, base),
              state: current.state
                ? { ...current.state, config: data.config || current.state.config, storage: data.storage || current.state.storage }
                : current.state,
            });
            if (options?.notice) showNotice(options.notice);
            return true;
          } catch (error) {
            showError(error);
            return false;
          }
        };

        // 系统通知权限只在用户点击「保存配置」的手势内申请一次；拒绝后不再打扰。
        const requestDetectPermission = () => {
          if (!canNotify()) return;
          try {
            if (window.Notification.permission !== 'default') return;
            const pending = window.Notification.requestPermission();
            if (pending && typeof pending.then === 'function') pending.catch(() => {});
          } catch {
            /* ignore */
          }
        };

        // 设置页的「发送测试通知」：验证当前桌面环境是否真的展示渲染进程通知。
        const sendTestNotification = async () => {
          if (!canNotify()) {
            showNotice(t('detectNotifyUnsupported'));
            return;
          }
          const fire = () => {
            try {
              new window.Notification('DeepSeek Harness', { body: t('detectTestNotifyBody') });
              showNotice(t('detectTestNotifySent'));
            } catch (error) {
              showError(error, t('detectTestNotifyFailed'));
            }
          };
          try {
            if (window.Notification.permission === 'default') {
              const result = await window.Notification.requestPermission();
              if (result !== 'granted') {
                showNotice(t('detectNotifyDenied'));
                return;
              }
            }
            if (window.Notification.permission !== 'granted') {
              showNotice(t('detectNotifyDenied'));
              return;
            }
            fire();
          } catch (error) {
            showError(error, t('detectTestNotifyFailed'));
          }
        };

        const saveConfig = async () => {
          const draft = store.get().cfgDraft || cfgFrom(null);
          const storageDir = String(draft.storageDir || '').trim();
          if (!storageDir) {
            showError(t('storageRequired'));
            return;
          }
          const chunkSeconds = Number(draft.chunkSeconds);
          if (!Number.isFinite(chunkSeconds) || chunkSeconds < 8 || chunkSeconds > 60) {
            showError(t('chunkInvalid'));
            return;
          }
          store.set({ cfgSaving: true });
          try {
            const data = await apiPost('/config', {
              storageDir,
              transcribeMode: draft.transcribeMode,
              language: draft.language,
              captureSystemAudio: !!draft.captureSystemAudio,
              captureMicrophone: !!draft.captureMicrophone,
              chunkSeconds,
              detectEnabled: !!draft.detectEnabled,
              detectNotify: !!draft.detectNotify,
            });
            const current = store.get();
            store.set({
              cfgSaving: false,
              cfgDirty: false,
              settingsOpen: false,
              cfgBase: cfgFrom(data.config),
              cfgDraft: cfgFrom(data.config),
              state: current.state
                ? { ...current.state, config: data.config || current.state.config, storage: data.storage || current.state.storage }
                : current.state,
            });
            showNotice(t('savedConfig'));
            if (draft.detectEnabled && draft.detectNotify) requestDetectPermission();
            void refreshState(true);
          } catch (error) {
            store.set({ cfgSaving: false });
            showError(error);
          }
        };

        // 建议卡片按钮：同意即开始/结束录音，不同意只忽略本次建议。
        const ackDetect = async (accept) => {
          const current = store.get();
          const suggestion = current.detect && current.detect.suggestion;
          if (!suggestion || !suggestion.id || current.busy) return;
          const kind = detectKind(suggestion);
          store.set({ busy: 'detect' });
          try {
            const data = await apiPost('/detect/ack', { id: String(suggestion.id), accept: !!accept });
            const nextDetect =
              data && data.detect && typeof data.detect === 'object'
                ? data.detect
                : { ...(store.get().detect || {}), suggestion: null };
            store.set({ busy: '', detect: nextDetect });
            if (accept) showNotice(kind === 'end' ? t('suggestEndOk') : t('suggestStartOk'));
            void refreshState(true);
          } catch (error) {
            store.set({ busy: '' });
            showError(error);
            void refreshState(true);
          }
        };

        const chooseStorageDir = async () => {
          if (!ctx.uiWorkspace || typeof ctx.uiWorkspace.pickDirectory !== 'function') {
            showError(t('pickFailed'));
            return;
          }
          try {
            const dir = await ctx.uiWorkspace.pickDirectory();
            if (dir) editDraft({ storageDir: String(dir) });
          } catch (error) {
            showError(error || t('pickFailed'));
          }
        };

        const prepareModel = async (providerId, downloadSource) => {
          const id = String(
            providerId || store.get().state?.provider?.id || store.get().cfgDraft?.providerId || '',
          );
          // 同一模型连续点击只发一次；不同模型允许并行（服务端 prepare 本身幂等）。
          if (!id || store.get().prepareId === id) return;
          store.set({ prepareId: id, error: '' });
          try {
            await apiPost('/prepare', { providerId: id, downloadSource: downloadSource || '' });
            showNotice(t('prepareStarted'));
            void refreshState(true);
          } catch (error) {
            showError(error);
          } finally {
            store.set({ prepareId: '' });
          }
        };

        const cancelModelPrepare = async (providerId) => {
          const id = String(providerId || '');
          if (!id) return;
          try {
            await apiPost('/prepare/cancel', { providerId: id });
            showNotice(t('modelCancelled'));
            void refreshState(true);
          } catch (error) {
            showError(error);
          }
        };

        const selectModel = async (providerId) => {
          const id = String(providerId || '');
          const current = store.get().state?.config?.providerId;
          if (!id || id === current) return;
          const saved = await patchConfig({ providerId: id }, { notice: t('modelSelected') });
          if (saved) void refreshState(true);
        };

        const startRecording = async () => {
          const draft = store.get().cfgDraft || cfgFrom(null);
          if (!draft.captureSystemAudio && !draft.captureMicrophone) {
            showError(t('captureNone'));
            return;
          }
          store.set({ busy: 'start', error: '', confirm: '' });
          try {
            await apiPost('/recordings', { mode: draft.transcribeMode });
            store.set({ live: { partial: '', segments: [] } });
            showNotice(t('startOk'));
            void refreshState(true);
          } catch (error) {
            showError(error, t('startFailed'));
          } finally {
            store.set({ busy: '' });
          }
        };

        const stopRecording = async () => {
          const mode = store.get().state?.recording?.mode;
          store.set({ busy: 'stop', error: '' });
          try {
            await apiPost('/recordings/stop', {});
            showNotice(mode === 'realtime' ? t('stopOkRealtime') : mode === 'after' ? t('stopOkAfter') : t('stopOk'));
            const meetingId = store.get().state?.recording?.meetingId;
            void refreshState(true);
            if (meetingId && store.get().selectedId === meetingId) void loadDetail(meetingId, true);
          } catch (error) {
            showError(error, t('stopFailed'));
          } finally {
            store.set({ busy: '' });
          }
        };

        const requestCancelRecording = () => {
          if (!store.get().state?.recording?.active || store.get().busy) return;
          store.set({ confirm: 'cancel' });
        };

        const cancelRecording = async () => {
          store.set({ confirm: '', busy: 'cancel', error: '' });
          try {
            await apiPost('/recordings/cancel', {});
            store.set({ live: { partial: '', segments: [] } });
            showNotice(t('cancelOk'));
            void refreshState(true);
          } catch (error) {
            showError(error, t('cancelFailed'));
          } finally {
            store.set({ busy: '' });
          }
        };

        const selectMeeting = (meetingId) => {
          if (store.get().selectedId === meetingId) return;
          closeConfirm();
          store.set({ selectedId: meetingId, detail: null, detailError: '' });
          void loadDetail(meetingId, false);
        };

        const generateMinutes = async () => {
          const meetingId = store.get().selectedId;
          if (!meetingId || store.get().busy) return;
          store.set({ busy: 'minutes', error: '' });
          try {
            const data = await apiPost(`/meetings/${encodeURIComponent(meetingId)}/minutes`, {});
            if (data && data.sessionId && ctx.uiWorkspace && typeof ctx.uiWorkspace.openSession === 'function') {
              ctx.uiWorkspace.openSession(data.sessionId);
              showNotice(t('minutesOk'));
            } else {
              showNotice(t('minutesPending'));
            }
            void refreshState(true);
          } catch (error) {
            showError(error, t('minutesFailed'));
          } finally {
            store.set({ busy: '' });
          }
        };

        const retranscribe = async () => {
          const meetingId = store.get().selectedId;
          if (!meetingId || store.get().busy) return;
          store.set({ busy: 'transcribe', error: '' });
          try {
            await apiPost(`/meetings/${encodeURIComponent(meetingId)}/transcribe`, {});
            showNotice(t('transcribeOk'));
            void refreshState(true);
            void loadDetail(meetingId, true);
          } catch (error) {
            showError(error, t('transcribeFailed'));
          } finally {
            store.set({ busy: '' });
          }
        };

        const copyTranscript = async () => {
          const transcript = store.get().detail?.transcript || '';
          if (!String(transcript).trim()) return;
          let copied = false;
          try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              await navigator.clipboard.writeText(transcript);
              copied = true;
            }
          } catch {
            copied = false;
          }
          if (!copied) {
            try {
              const area = document.createElement('textarea');
              area.value = transcript;
              area.style.position = 'fixed';
              area.style.opacity = '0';
              document.body.appendChild(area);
              area.select();
              copied = typeof document.execCommand === 'function' && document.execCommand('copy');
              area.remove();
            } catch {
              copied = false;
            }
          }
          if (copied) showNotice(t('copied'));
          else showError(t('copyFailed'));
        };

        const requestDeleteMeeting = () => {
          if (!store.get().selectedId || store.get().busy) return;
          store.set({ confirm: 'delete' });
        };

        const deleteMeeting = async () => {
          const meetingId = store.get().selectedId;
          if (!meetingId || store.get().busy) return;
          store.set({ confirm: '', busy: 'delete', error: '' });
          try {
            await apiDelete(`/meetings/${encodeURIComponent(meetingId)}`);
            store.set({ selectedId: '', detail: null, detailError: '' });
            showNotice(t('deleteOk'));
            void refreshState(true);
          } catch (error) {
            showError(error, t('deleteFailed'));
          } finally {
            store.set({ busy: '' });
          }
        };

        const changeMode = (value) => {
          const mode = value === 'realtime' ? 'realtime' : 'after';
          applyDraft({ transcribeMode: mode });
          void patchConfig({ transcribeMode: mode });
        };

        // -----------------------------------------------------------------
        // Components
        // -----------------------------------------------------------------
        function Icon({ name, size }) {
          const px = Number(size) || 16;
          const common = {
            viewBox: '0 0 24 24',
            width: px,
            height: px,
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.7,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': 'true',
            style: { display: 'block', flex: '0 0 auto' },
          };
          switch (name) {
            case 'mic':
              return h(
                'svg',
                common,
                h('rect', { x: 9, y: 2.5, width: 6, height: 11, rx: 3 }),
                h('path', { d: 'M5 11a7 7 0 0 0 14 0' }),
                h('path', { d: 'M12 18v3.5' }),
                h('path', { d: 'M8.5 21.5h7' }),
              );
            case 'stop':
              return h(
                'svg',
                { ...common, fill: 'currentColor', stroke: 'none' },
                h('rect', { x: 6.5, y: 6.5, width: 11, height: 11, rx: 2.5 }),
              );
            case 'gear':
              return h(
                'svg',
                common,
                h('circle', { cx: 12, cy: 12, r: 3 }),
                h('path', {
                  d: 'M19.4 14.6a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
                }),
              );
            case 'refresh':
              return h(
                'svg',
                common,
                h('path', { d: 'M3.5 12a8.5 8.5 0 0 1 14.4-6.1' }),
                h('path', { d: 'M18 3.5V8h-4.5' }),
                h('path', { d: 'M20.5 12a8.5 8.5 0 0 1-14.4 6.1' }),
                h('path', { d: 'M6 20.5V16h4.5' }),
              );
            case 'trash':
              return h(
                'svg',
                common,
                h('path', { d: 'M4 7h16' }),
                h('path', { d: 'M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7' }),
                h('path', { d: 'M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12' }),
                h('path', { d: 'M10.5 11v6M13.5 11v6' }),
              );
            case 'copy':
              return h(
                'svg',
                common,
                h('rect', { x: 9, y: 9, width: 11, height: 11, rx: 2.2 }),
                h('path', { d: 'M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15' }),
              );
            case 'close':
              return h('svg', common, h('path', { d: 'M6 6l12 12M18 6L6 18' }));
            case 'doc':
              return h(
                'svg',
                common,
                h('path', { d: 'M6 3.5h7.5L19 9v11.5H6z' }),
                h('path', { d: 'M13 3.5V9h5.5' }),
                h('path', { d: 'M9 13h6M9 16.5h6' }),
              );
            case 'spark':
              return h(
                'svg',
                common,
                h('path', { d: 'M12 3.5l1.9 4.9 4.9 1.9-4.9 1.9L12 17.1l-1.9-4.9L5.2 10.3l4.9-1.9z' }),
                h('path', { d: 'M18.4 16.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z' }),
              );
            case 'warn':
              return h(
                'svg',
                common,
                h('path', { d: 'M12 4.2 21 20H3z' }),
                h('path', { d: 'M12 10v4.6' }),
                h('path', { d: 'M12 17.4v.2' }),
              );
            case 'check':
              return h(
                'svg',
                common,
                h('circle', { cx: 12, cy: 12, r: 8.6 }),
                h('path', { d: 'M8.4 12.2l2.5 2.5 4.7-5' }),
              );
            default:
              return null;
          }
        }

        function StatusDot({ tone }) {
          return h('i', { className: 'mn-dot', 'data-tone': tone });
        }

        function StatusText({ status }) {
          const info = statusInfo(status);
          return h(
            'span',
            { style: { display: 'inline-flex', alignItems: 'center', gap: '5px' } },
            h(StatusDot, { tone: info.tone }),
            h('span', null, info.label),
          );
        }

        // ---- DSH 原语复刻：Tooltip / Modal / ConfirmDialog / Toast ----
        // 规格取自 DSH 自身的 tooltip、dialog、confirm 与 toast 实现：行为一致、class 换成 mn- 前缀、
        // 颜色只引用 --dsw-* 令牌（带 fallback），不向 document.body 挂 DOM。

        const TOOLTIP_HOVER_DELAY = 500;
        const TOOLTIP_FOCUS_DELAY = 0;

        function Tooltip({ label, side = 'bottom', align = 'center', gap = 8, disabled = false, children }) {
          const text = String(label == null ? '' : label).trim();
          const active = !!text && !disabled;
          const anchorRef = React.useRef(null);
          const bubbleRef = React.useRef(null);
          const timerRef = React.useRef(0);
          const stateRef = React.useRef({ hover: false, focus: false });
          const [open, setOpen] = React.useState(false);
          const [pos, setPos] = React.useState(null);

          const clearTimer = () => {
            if (timerRef.current) {
              window.clearTimeout(timerRef.current);
              timerRef.current = 0;
            }
          };
          const hide = () => {
            clearTimer();
            setOpen(false);
            setPos(null);
          };
          const show = () => {
            clearTimer();
            setOpen(true);
          };
          const showLater = (delay) => {
            clearTimer();
            if (!active) return;
            timerRef.current = window.setTimeout(() => {
              timerRef.current = 0;
              setOpen(true);
            }, delay);
          };

          // 打开后按锚点位置摆放气泡，并夹在视口内。
          React.useLayoutEffect(() => {
            if (!open) return;
            const anchor = anchorRef.current;
            const bubble = bubbleRef.current;
            if (!anchor || !bubble) return;
            const rect = anchor.getBoundingClientRect();
            const box = bubble.getBoundingClientRect();
            const vw = window.innerWidth || 0;
            const vh = window.innerHeight || 0;
            let left;
            let top;
            if (side === 'bottom' || side === 'top') {
              left = align === 'start' ? rect.left : align === 'end' ? rect.right - box.width : rect.left + rect.width / 2 - box.width / 2;
              top = side === 'bottom' ? rect.bottom + gap : rect.top - gap - box.height;
            } else {
              top = align === 'start' ? rect.top : align === 'end' ? rect.bottom - box.height : rect.top + rect.height / 2 - box.height / 2;
              left = side === 'right' ? rect.right + gap : rect.left - gap - box.width;
            }
            if (vw) left = Math.min(Math.max(8, left), Math.max(8, vw - box.width - 8));
            if (vh) top = Math.min(Math.max(8, top), Math.max(8, vh - box.height - 8));
            setPos({ left, top });
          }, [open, text, side, align, gap]);

          React.useEffect(() => clearTimer, []);
          React.useEffect(() => {
            if (!open) return undefined;
            const onKeyDown = (event) => {
              if (event.key === 'Escape') hide();
            };
            window.addEventListener('keydown', onKeyDown, true);
            window.addEventListener('scroll', hide, true);
            return () => {
              window.removeEventListener('keydown', onKeyDown, true);
              window.removeEventListener('scroll', hide, true);
            };
          }, [open]);

          const trigger = React.isValidElement(children)
            ? React.cloneElement(children, {
                ref: anchorRef,
                onPointerEnter: (event) => {
                  if (children.props.onPointerEnter) children.props.onPointerEnter(event);
                  if (event.pointerType === 'touch') return;
                  stateRef.current.hover = true;
                  showLater(TOOLTIP_HOVER_DELAY);
                },
                onPointerLeave: (event) => {
                  if (children.props.onPointerLeave) children.props.onPointerLeave(event);
                  stateRef.current.hover = false;
                  if (!stateRef.current.focus) hide();
                  else clearTimer();
                },
                onFocus: (event) => {
                  if (children.props.onFocus) children.props.onFocus(event);
                  stateRef.current.focus = true;
                  showLater(TOOLTIP_FOCUS_DELAY);
                },
                onBlur: (event) => {
                  if (children.props.onBlur) children.props.onBlur(event);
                  stateRef.current.focus = false;
                  if (!stateRef.current.hover) hide();
                },
              })
            : children;

          return h(
            React.Fragment,
            null,
            trigger,
            active && open
              ? h(
                  'span',
                  {
                    ref: bubbleRef,
                    role: 'tooltip',
                    className: 'mn-tt',
                    'data-side': side,
                    'data-align': align,
                    style: pos ? { left: `${pos.left}px`, top: `${pos.top}px` } : { left: '0px', top: '0px', visibility: 'hidden' },
                  },
                  text,
                )
              : null,
          );
        }

        const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

        function Modal({ open, title, description, children, footer, onClose, closeLabel, width, className }) {
          const boxRef = React.useRef(null);
          const restoreRef = React.useRef(null);

          React.useEffect(() => {
            if (!open) return undefined;
            const previous = document.activeElement;
            restoreRef.current = previous && typeof previous.focus === 'function' ? previous : null;
            const box = boxRef.current;
            const target = box && (box.querySelector('[data-modal-autofocus]') || box.querySelector(FOCUSABLE) || box);
            if (target && typeof target.focus === 'function') target.focus();
            return () => {
              const restore = restoreRef.current;
              if (restore && restore.isConnected && typeof restore.focus === 'function') restore.focus();
            };
          }, [open]);

          if (!open) return null;

          const onKeyDownCapture = (event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              if (onClose) onClose();
              return;
            }
            if (event.key !== 'Tab') return;
            const box = boxRef.current;
            if (!box) return;
            const items = Array.prototype.filter.call(box.querySelectorAll(FOCUSABLE), (el) => el.offsetParent !== null || el === document.activeElement);
            if (!items.length) {
              event.preventDefault();
              box.focus();
              return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const current = document.activeElement;
            if (event.shiftKey && (current === first || current === box)) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && (current === last || current === box)) {
              event.preventDefault();
              first.focus();
            }
          };

          return h(
            'div',
            { className: 'mn-modal-root', role: 'presentation', onKeyDownCapture },
            h('div', { className: 'mn-modal-mask', 'aria-hidden': 'true', onClick: onClose || undefined }),
            h(
              'div',
              {
                ref: boxRef,
                className: 'mn-modal' + (className ? ` ${className}` : ''),
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': typeof title === 'string' ? title : undefined,
                tabIndex: -1,
                style: width ? { width } : undefined,
              },
              h(
                'div',
                { className: 'mn-modal-head' },
                h('h2', { className: 'mn-modal-title' }, title),
                onClose
                  ? h(
                      'button',
                      { type: 'button', className: 'mn-modal-close', 'aria-label': closeLabel || t('closeDialog'), onClick: onClose },
                      h(Icon, { name: 'close', size: 14 }),
                    )
                  : null,
              ),
              description ? h('p', { className: 'mn-modal-desc' }, description) : null,
              h('div', { className: 'mn-modal-body' }, children),
              footer ? h('div', { className: 'mn-modal-foot' }, footer) : null,
            ),
          );
        }

        function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, busy, onCancel, onConfirm }) {
          return h(
            Modal,
            {
              open,
              title,
              className: 'mn-confirm',
              width: 'min(440px, 100%)',
              onClose: busy ? undefined : onCancel,
              closeLabel: cancelLabel || t('dialogCancel'),
              footer: h(
                React.Fragment,
                null,
                h(
                  'button',
                  { type: 'button', className: 'mn-btn', 'data-variant': 'outline', onClick: onCancel, disabled: !!busy },
                  cancelLabel || t('dialogCancel'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'mn-btn mn-confirm-action',
                    'data-variant': 'primary',
                    onClick: onConfirm,
                    disabled: !!busy,
                  },
                  busy ? t('deleting') : confirmLabel,
                ),
              ),
            },
            h(
              'div',
              { className: 'mn-confirm-warning' },
              h('span', { className: 'mn-confirm-icon' }, h(Icon, { name: 'warn', size: 18 })),
              h('p', null, body),
            ),
          );
        }

        function Toast({ text, seq }) {
          if (!text) return null;
          return h(
            'div',
            { key: seq, className: 'mn-toast', role: 'status', 'aria-live': 'polite' },
            h('span', { className: 'mn-toast-icon', 'aria-hidden': 'true' }, h(Icon, { name: 'check', size: 14 })),
            h('span', { className: 'mn-toast-text' }, text),
          );
        }

        function Banner({ tone, children, onClose }) {
          return h(
            'div',
            { className: 'mn-banner', 'data-tone': tone, role: tone === 'error' ? 'alert' : 'status' },
            h('span', null, children),
            onClose ? h('button', { type: 'button', onClick: onClose }, t('dismiss')) : null,
          );
        }

        // 轻量 markdown：标题 / 列表 / 表格 / 引用 / 加粗 / 行内代码，够渲染文稿与模型纪要。
        const renderInline = (text) => {
          const parts = String(text || '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          return parts.map((part, index) => {
            if (!part) return null;
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
              return h('b', { key: index }, part.slice(2, -2));
            }
            if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
              return h('code', { key: index }, part.slice(1, -1));
            }
            return part;
          });
        };

        // 文稿与纪要的首行一般是文档标题（如 `# 会议标题`），详情头部已显示会议标题，避免重复。
        const stripLeadingTitle = (raw, title) => {
          const wanted = String(title || '').trim();
          if (!wanted) return raw;
          const lines = raw.split(/\r?\n/);
          const first = lines.find((line) => line.trim());
          if (!first) return raw;
          const heading = /^#\s+(.*)$/.exec(first.trim());
          if (!heading) return raw;
          const text = heading[1].trim();
          if (text !== wanted && !text.startsWith(`${wanted} `) && !text.startsWith(`${wanted}·`) && !text.startsWith(`${wanted}：`)) {
            return raw;
          }
          return lines.filter((line) => line !== first).join('\n');
        };

        function DocView({ text, emptyText, emptyHint, skipTitle }) {
          const raw = stripLeadingTitle(String(text || ''), skipTitle);
          if (!raw.trim()) {
            return h(
              'div',
              { className: 'mn-doc-empty' },
              h('b', null, emptyText),
              emptyHint ? h('span', null, emptyHint) : null,
            );
          }
          const lines = raw.split(/\r?\n/);
          const nodes = [];
          let index = 0;
          let key = 0;
          while (index < lines.length) {
            const line = lines[index];
            if (!line.trim()) {
              index += 1;
              continue;
            }
            const trimmed = line.trim();
            // 表格块
            if (trimmed.startsWith('|')) {
              const rows = [];
              while (index < lines.length && lines[index].trim().startsWith('|')) {
                rows.push(lines[index].trim());
                index += 1;
              }
              const cells = rows.map((row) =>
                row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim()),
              );
              const isDivider = (row) => row.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')));
              const header = cells[0] && !isDivider(cells[0]) ? cells[0] : null;
              const body = cells.slice(header ? 1 : 0).filter((row) => !isDivider(row));
              nodes.push(
                h(
                  'table',
                  { key: key++, className: 'mn-table' },
                  header ? h('thead', null, h('tr', null, header.map((cell, i) => h('th', { key: i }, renderInline(cell))))) : null,
                  h('tbody', null, body.map((row, r) => h('tr', { key: r }, row.map((cell, c) => h('td', { key: c }, renderInline(cell)))))),
                ),
              );
              continue;
            }
            // 标题
            const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
            if (heading) {
              const level = Math.min(3, heading[1].length);
              nodes.push(h(`div`, { key: key++, className: `mn-doc-h${level}` }, renderInline(heading[2])));
              index += 1;
              continue;
            }
            // 列表
            if (/^[-*+]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
              const ordered = /^\d+[.)]\s+/.test(trimmed);
              const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/;
              const items = [];
              while (index < lines.length && pattern.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(pattern, ''));
                index += 1;
              }
              const asTask = (item) =>
                item.replace(/^\[ \]\s*/, '☐ ').replace(/^\[[xX]\]\s*/, '☑ ');
              nodes.push(
                h(
                  ordered ? 'ol' : 'ul',
                  { key: key++, className: ordered ? 'mn-doc-ol' : 'mn-doc-ul' },
                  items.map((item, i) => h('li', { key: i }, renderInline(asTask(item)))),
                ),
              );
              continue;
            }
            // 引用
            if (/^>\s?/.test(trimmed)) {
              const quotes = [];
              while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
                quotes.push(lines[index].trim().replace(/^>\s?/, ''));
                index += 1;
              }
              nodes.push(
                h('div', { key: key++, className: 'mn-doc-quote' }, quotes.map((q, i) => h('div', { key: i }, renderInline(q)))),
              );
              continue;
            }
            // 转录时间轴 [mm:ss] 文本
            const stamped = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)$/.exec(trimmed);
            if (stamped) {
              nodes.push(
                h(
                  'div',
                  { key: key++, className: 'mn-doc-line' },
                  h('span', { className: 'mn-doc-ts' }, stamped[1]),
                  h('span', { className: 'mn-doc-text' }, renderInline(stamped[2])),
                ),
              );
              index += 1;
              continue;
            }
            nodes.push(h('p', { key: key++, className: 'mn-doc-p' }, renderInline(trimmed)));
            index += 1;
          }
          return h('div', { className: 'mn-doc' }, nodes);
        }

        function PanelIcon(props) {
          const size = Number(props?.size) || 20;
          return h(
            'span',
            { className: 'mn-nav', style: { display: 'inline-flex', alignItems: 'center', color: 'currentColor' } },
            h(Icon, { name: 'mic', size }),
          );
        }

        function Topbar() {
          const s = useStore();
          const state = s.state;
          const models = modelList(state);
          const current = models.find((model) => model.selected) || models[0] || null;
          const phase = current?.preparation?.phase || (state?.providerReady ? 'ready' : 'unprepare');
          const ready = !!current?.ready;
          return h(
            'header',
            { className: 'mn-topbar' },
            h(
              'div',
              { className: 'mn-brand' },
              h('span', { className: 'mn-brand-mark' }, h(Icon, { name: 'mic', size: 18 })),
              h(
                'div',
                { style: { minWidth: 0 } },
                h('h1', { className: 'mn-title' }, t('title')),
                h('p', { className: 'mn-sub' }, `${t('subtitle')}${state?.platform?.name ? ` · ${state.platform.name}` : ''}`),
              ),
            ),
            h(
              'div',
              { className: 'mn-topbar-right' },
              // 模型状态只是入口：下载/切换都在设置页的模型列表里完成。
              h(
                Tooltip,
                { label: t('modelHint'), side: 'bottom', align: 'end' },
                h(
                  'button',
                  { type: 'button', className: 'mn-chip mn-chip-btn', onClick: openSettings },
                  h(StatusDot, { tone: ready ? 'ok' : phaseTone(phase) }),
                  h('b', null, current?.name || t('modelLabel')),
                  h('span', { className: 'mn-sep' }, '·'),
                  h('span', null, phaseLabel(phase)),
                ),
              ),
              h(
                Tooltip,
                { label: t('settings'), side: 'bottom', align: 'end' },
                h(
                  'button',
                  { type: 'button', className: 'mn-icon-btn', 'aria-label': t('settings'), onClick: openSettings },
                  h(Icon, { name: 'gear', size: 17 }),
                ),
              ),
              h(
                Tooltip,
                { label: t('refresh'), side: 'bottom', align: 'end' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'mn-icon-btn',
                    'aria-label': t('refresh'),
                    disabled: s.refreshing,
                    onClick: () => void refreshState(false),
                  },
                  h(Icon, { name: 'refresh', size: 17 }),
                ),
              ),
            ),
          );
        }

        function RecordPanel() {
          const s = useStore();
          const state = s.state;
          const recording = state?.recording || {};
          const draft = s.cfgDraft || cfgFrom(state?.config);
          const active = !!recording.active;
          const mode = recording.mode || draft.transcribeMode;
          const seconds = active ? Number(recording.seconds) || 0 : 0;
          const supported = state ? state.platform?.supported !== false : true;
          const busy = s.busy;
          const live = s.live;
          // 录制面板只判断“当前选中的模型是否就绪”，下载/切换都在设置页。
          const models = modelList(state);
          const currentModel = models.find((model) => model.selected) || models[0] || null;
          const modelReady = !!currentModel?.ready;
          const liveRef = React.useRef(null);
          const segmentCount = live.segments.length;
          React.useEffect(() => {
            const node = liveRef.current;
            if (node) node.scrollTop = node.scrollHeight;
          }, [live.partial, segmentCount]);
          const showLive = mode === 'realtime' || segmentCount > 0 || !!live.partial;
          return h(
            'section',
            { className: 'mn-record' },
            h(
              'div',
              { className: 'mn-record-head' },
              h('h2', null, t('recordTitle')),
              h(
                Tooltip,
                { label: t('modeLocked'), disabled: !active, side: 'bottom', align: 'end' },
                h(
                  'div',
                  { className: 'mn-seg', role: 'group', 'aria-label': t('mode') },
                  ['after', 'realtime'].map((value) =>
                    h(
                      'button',
                      {
                        key: value,
                        type: 'button',
                        'data-active': mode === value ? '1' : '0',
                        disabled: active,
                        onClick: () => changeMode(value),
                      },
                      value === 'realtime' ? t('modeRealtime') : t('modeAfter'),
                    ),
                  ),
                ),
              ),
            ),
            h(
              'div',
              { className: 'mn-timer-row' },
              h('div', { className: 'mn-timer', 'data-active': active ? '1' : '0' }, fmtClock(seconds)),
              h(
                'div',
                { className: 'mn-recstate', 'data-active': active ? '1' : '0' },
                h(StatusDot, { tone: active ? 'active' : 'muted' }),
                active ? t('recordingActive') : t('recordingIdle'),
              ),
            ),
            h(
              'div',
              { className: 'mn-levels' },
              [
                ['micLevel', 'mic'],
                ['systemLevel', 'system'],
              ].map(([key, source]) =>
                h(
                  'div',
                  { key: source, className: 'mn-level' },
                  h('span', null, source === 'mic' ? t('micLevel') : t('systemLevel')),
                  h(
                    'div',
                    { className: 'mn-level-track' },
                    h('div', { className: 'mn-level-fill', style: { width: `${clamp01(recording[key]) * 100}%` } }),
                  ),
                  h('span', { className: 'mn-level-pct' }, `${Math.round(clamp01(recording[key]) * 100)}%`),
                ),
              ),
            ),
            h(
              'div',
              { className: 'mn-record-actions' },
              active
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-variant': 'primary',
                      'data-size': 'block',
                      disabled: busy === 'stop',
                      onClick: () => void stopRecording(),
                    },
                    h(Icon, { name: 'stop', size: 14 }),
                    busy === 'stop' ? t('stopping') : t('stop'),
                  )
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-variant': 'primary',
                      'data-size': 'block',
                      disabled: !supported || busy === 'start',
                      onClick: () => void startRecording(),
                    },
                    h(Icon, { name: 'mic', size: 15 }),
                    t('start'),
                  ),
              active
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-variant': 'ghost',
                      'data-tone': 'danger',
                      'data-size': 'small',
                      disabled: busy === 'cancel',
                      onClick: requestCancelRecording,
                    },
                    t('cancel'),
                  )
                : null,
            ),
            h('p', { className: 'mn-hint' }, mode === 'realtime' ? t('modeHintRealtime') : t('modeHintAfter')),
            // 实时转写依赖模型就绪；这里只做提示并引导到设置页，不重复放下载按钮。
            mode === 'realtime' && !active && (!modelReady || currentModel.realtime === false)
              ? h(
                  'div',
                  { className: 'mn-model-warn', role: 'status' },
                  h('span', null, modelReady ? t('modelRealtimeWarn') : t('modelNotReady')),
                  h(
                    'button',
                    { type: 'button', className: 'mn-link', onClick: openSettings },
                    t('modelNotReadySettings'),
                  ),
                )
              : null,
            showLive
              ? h(
                  'div',
                  { className: 'mn-live' },
                  h(
                    'div',
                    { className: 'mn-live-head' },
                    h('span', null, t('liveTitle')),
                    h('span', { style: { fontVariantNumeric: 'tabular-nums' } }, fmtClock(seconds)),
                  ),
                  h(
                    'div',
                    { className: 'mn-live-list', ref: liveRef },
                    live.segments.length === 0 && !live.partial
                      ? h('div', { className: 'mn-live-empty' }, t('liveEmpty'))
                      : live.segments
                          .slice()
                          .sort((a, b) => (a.fromSec || 0) - (b.fromSec || 0))
                          .map((segment, index) =>
                            h(
                              'div',
                              { key: `${segment.index ?? index}-${segment.fromSec}`, className: 'mn-live-line' },
                              h('span', { className: 'mn-live-ts' }, fmtClock(segment.fromSec)),
                              h('span', { className: 'mn-live-text' }, segment.text),
                            ),
                          )
                          .concat(
                            live.partial
                              ? [
                                  h(
                                    'div',
                                    { key: 'partial', className: 'mn-live-line' },
                                    h('span', { className: 'mn-live-ts' }, '…'),
                                    h('span', { className: 'mn-live-text mn-live-partial' }, live.partial),
                                  ),
                                ]
                              : [],
                          ),
                  ),
                )
              : null,
            supported ? null : h('p', { className: 'mn-hint', style: { color: 'var(--mn-warn)' } }, t('platformUnsupported')),
          );
        }

        const fmtListDate = (value) => {
          if (!value) return '—';
          const date = new Date(String(value));
          if (Number.isNaN(date.getTime())) return String(value);
          return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
        };

        function MeetingList() {
          const s = useStore();
          const meetings = s.state?.meetings || [];
          return h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 } },
            h(
              'div',
              { className: 'mn-rail-head' },
              h('h2', null, t('meetings')),
              h('span', { className: 'mn-count' }, String(meetings.length)),
            ),
            s.loading && !s.state
              ? h('div', null, h('div', { className: 'mn-skel' }), h('div', { className: 'mn-skel' }), h('div', { className: 'mn-skel' }))
              : meetings.length === 0
                ? h(
                    'div',
                    { className: 'mn-empty', style: { padding: '32px 12px' } },
                    h('span', { className: 'mn-empty-mark' }, h(Icon, { name: 'mic', size: 18 })),
                    h('b', null, t('meetingsEmptyTitle')),
                    h('span', null, t('meetingsEmptyHint')),
                  )
                : h(
                    'div',
                    { className: 'mn-items' },
                    meetings.map((meeting) =>
                      h(
                        'button',
                        {
                          key: meeting.id,
                          type: 'button',
                          className: 'mn-item',
                          'data-active': s.selectedId === meeting.id ? '1' : '0',
                          onClick: () => selectMeeting(meeting.id),
                        },
                        h(
                          'span',
                          { className: 'mn-item-main' },
                          h('span', { className: 'mn-item-title' }, meeting.title || t('meetingFallbackTitle')),
                          h(
                            'span',
                            { className: 'mn-item-meta' },
                            h('span', null, fmtListDate(meeting.startedAt)),
                            h('span', { className: 'mn-sep' }, '·'),
                            h('span', null, fmtClock(meeting.durationSec)),
                            h('span', { className: 'mn-sep' }, '·'),
                            h(StatusText, { status: meeting.status }),
                          ),
                        ),
                        meeting.hasMinutes
                          ? h(
                              Tooltip,
                              { label: t('hasMinutes'), side: 'right', align: 'center' },
                              h('span', { className: 'mn-item-flag' }, h(Icon, { name: 'doc', size: 14 })),
                            )
                          : null,
                      ),
                    ),
                  ),
          );
        }

        function DetailPane() {
          const s = useStore();
          const state = s.state;
          const meetings = state?.meetings || [];
          const meetingId = s.selectedId;
          const summary = meetings.find((item) => item.id === meetingId) || null;
          const detail = s.detail;
          const meeting = detail?.meeting || summary || null;
          const transcript = detail?.transcript || '';
          const minutes = detail?.minutes || '';
          const hasTranscript = !!String(transcript).trim();
          const hasMinutesDoc = !!String(minutes).trim();
          const busy = s.busy;
          const transcoding = meeting?.status === 'transcribing';
          const audioSrc = meetingId ? `${API}/meetings/${encodeURIComponent(meetingId)}/audio` : '';
          const storageDir = state?.storage?.dir || state?.config?.storageDir || '';
          const folderPath = meetingId && storageDir ? `${storageDir.replace(/\/$/, '')}/${meetingId}` : '';
          const tab = s.docTab === 'minutes' ? 'minutes' : 'transcript';

          if (!meetingId) {
            const noMeetings = meetings.length === 0 && !state?.recording?.active;
            return h(
              'section',
              { className: 'mn-detail' },
              h(
                'div',
                { className: 'mn-empty', style: { paddingTop: '88px' } },
                h('span', { className: 'mn-empty-mark' }, h(Icon, { name: noMeetings ? 'mic' : 'doc', size: 20 })),
                h('b', null, noMeetings ? t('emptyGuideTitle') : t('selectMeeting')),
                noMeetings ? h('span', null, t('emptyGuideBody')) : null,
              ),
            );
          }

          if (s.detailError && !detail) {
            return h(
              'section',
              { className: 'mn-detail' },
              h(
                'div',
                { className: 'mn-empty', style: { paddingTop: '72px' } },
                h('b', null, t('detailLoadFailed')),
                h('span', null, s.detailError),
                h(
                  'button',
                  { type: 'button', className: 'mn-btn', 'data-size': 'small', style: { marginTop: '4px' }, onClick: () => void loadDetail(meetingId, false) },
                  t('retry'),
                ),
              ),
            );
          }

          if (s.detailLoading && !detail) {
            return h('section', { className: 'mn-detail' }, h('div', { className: 'mn-loading' }, h('div', { className: 'mn-spinner' }), t('loading')));
          }

          return h(
            'section',
            { className: 'mn-detail' },
            h(
              'div',
              { className: 'mn-detail-head' },
              h(
                'div',
                { className: 'mn-detail-title' },
                h('h2', null, meeting?.title || t('meetingFallbackTitle')),
                h(
                  'div',
                  { className: 'mn-meta' },
                  meeting ? h(StatusText, { status: meeting.status }) : null,
                  h('span', { className: 'mn-sep' }, '·'),
                  h('span', null, fmtDate(meeting?.startedAt)),
                  h('span', { className: 'mn-sep' }, '·'),
                  h('span', null, fmtClock(meeting?.durationSec)),
                  h('span', { className: 'mn-sep' }, '·'),
                  h('span', null, meeting?.mode === 'realtime' ? t('modeRealtime') : t('modeAfter')),
                  h('span', { className: 'mn-sep' }, '·'),
                  h('span', null, langLabel(meeting?.language)),
                  meeting?.sizeBytes
                    ? [
                        h('span', { key: 's1', className: 'mn-sep' }, '·'),
                        h('span', { key: 's2' }, fmtBytes(meeting.sizeBytes)),
                      ]
                    : null,
                ),
              ),
              h(
                'div',
                { className: 'mn-detail-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'mn-btn',
                    'data-variant': 'outline',
                    disabled: !!busy || !hasTranscript || transcoding,
                    onClick: () => void generateMinutes(),
                  },
                  h(Icon, { name: 'spark', size: 14 }),
                  busy === 'minutes' ? t('generatingMinutes') : hasMinutesDoc ? t('regenerateMinutes') : t('generateMinutes'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'mn-btn',
                    'data-variant': 'ghost',
                    'data-size': 'small',
                    disabled: !!busy || transcoding,
                    onClick: () => void retranscribe(),
                  },
                  busy === 'transcribe' ? t('retranscribing') : t('retranscribe'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'mn-btn',
                    'data-variant': 'ghost',
                    'data-size': 'small',
                    disabled: !hasTranscript,
                    onClick: () => void copyTranscript(),
                  },
                  busy === 'copy' ? t('copied') : t('copyTranscript'),
                ),
                h(
                  Tooltip,
                  { label: t('deleteAction'), side: 'bottom', align: 'end' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-icon-btn mn-icon-btn-danger',
                      'aria-label': t('deleteAction'),
                      disabled: !!busy,
                      onClick: requestDeleteMeeting,
                    },
                    h(Icon, { name: 'trash', size: 15 }),
                  ),
                ),
              ),
            ),
            meeting?.status === 'failed' && meeting?.error ? h(Banner, { tone: 'error' }, String(meeting.error)) : null,
            transcoding ? h(Banner, { tone: 'info' }, t('transcribingHint')) : null,
            h(
              'div',
              { className: 'mn-audio' },
              h('span', { className: 'mn-audio-label' }, t('audioTitle')),
              h('audio', { key: meetingId, className: 'mn-audio-el', controls: true, preload: 'metadata', src: audioSrc }),
            ),
            folderPath ? h('span', { className: 'mn-path' }, `${t('meetingPath')}：${folderPath}`) : null,
            h(
              'div',
              { className: 'mn-tabs', role: 'tablist' },
              h(
                'button',
                {
                  type: 'button',
                  role: 'tab',
                  className: 'mn-tab',
                  'data-active': tab === 'transcript' ? '1' : '0',
                  'aria-selected': tab === 'transcript',
                  onClick: () => store.set({ docTab: 'transcript' }),
                },
                t('tabTranscript'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  role: 'tab',
                  className: 'mn-tab',
                  'data-active': tab === 'minutes' ? '1' : '0',
                  'aria-selected': tab === 'minutes',
                  onClick: () => store.set({ docTab: 'minutes' }),
                },
                t('tabMinutes'),
                hasMinutesDoc ? h('span', { className: 'mn-tab-dot' }) : null,
              ),
            ),
            tab === 'transcript'
              ? h(DocView, {
                  text: transcript,
                  skipTitle: meeting?.title,
                  emptyText: t('transcriptEmpty'),
                  emptyHint: transcoding ? t('transcribingHint') : t('transcriptEmptyHint'),
                })
              : h(DocView, {
                  text: minutes,
                  skipTitle: meeting?.title,
                  emptyText: t('minutesEmpty'),
                  emptyHint: hasTranscript ? t('minutesHint') : t('transcriptEmptyHint'),
                }),
          );
        }

        // 设置页里的单个模型行：下载/取消/切换都集中在这里，未来新增 ASR provider 自动出现。
        function ModelRow({ model }) {
          const preparation = model.preparation || {};
          const phase = preparation.phase || (model.ready ? 'ready' : 'unprepare');
          const sources = Array.isArray(model.downloadSources) ? model.downloadSources : [];
          const [source, setSource] = React.useState('auto');
          const preparing = model.preparing === true || preparingPhase(phase);
          const cancelling = phase === 'cancelling';
          const idle = canPrepareModel(model);
          const total = Number(preparation.totalBytes) || 0;
          const completed = Number(preparation.completedBytes) || 0;
          const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((completed / total) * 100))) : 0;
          const steps = Array.isArray(preparation.steps) ? preparation.steps : [];
          const runningStep = steps.find((step) => step.status === 'running');
          const download = preparation.download;
          const failed = phase === 'failed';

          const gb = (bytes) => {
            const value = (Number(bytes) || 0) / 1e9;
            return value ? String(Math.round(value * 10) / 10) : '0';
          };
          const sourceLabel = (origin) => {
            if (!origin) return '';
            if (/hf-mirror/i.test(origin)) return t('sourceMirror');
            if (/huggingface/i.test(origin)) return t('sourceHuggingFace');
            if (/modelscope/i.test(origin)) return t('sourceModelscope');
            try {
              return new URL(origin).hostname;
            } catch {
              return origin;
            }
          };

          return h(
            'div',
            { className: 'mn-model', 'data-model': model.id },
            h(
              'div',
              { className: 'mn-model-head' },
              h(
                'div',
                { style: { minWidth: 0 } },
                h(
                  'div',
                  { className: 'mn-model-name' },
                  h('b', null, model.name || model.id),
                  model.selected ? h('span', { className: 'mn-tag' }, t('modelCurrent')) : null,
                ),
                h(
                  'div',
                  { className: 'mn-model-meta' },
                  h(StatusDot, { tone: phaseTone(phase) }),
                  h('span', null, phaseLabel(phase)),
                  runningStep ? h('span', null, `· ${stepLabel(runningStep.kind)}`) : null,
                  model.location === 'cloud' ? h('span', null, '· cloud') : null,
                ),
              ),
              !model.selected && !preparing
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-size': 'small',
                      onClick: () => void selectModel(model.id),
                    },
                    t('useModel'),
                  )
                : null,
            ),
            // 未开始时先给出磁盘/内存/耗时估算，让用户知道要下多大的东西。
            idle && model.setupEstimate
              ? h(
                  'div',
                  { className: 'mn-model-estimate' },
                  h('span', null, t('estimateDisk', { gb: gb(model.setupEstimate.recommendedDiskBytes) })),
                  h('span', null, '·'),
                  h('span', null, t('estimateMemory', { gb: gb(model.setupEstimate.expectedMemoryBytes) })),
                  h('span', null, '·'),
                  h('span', {
                    children: t('estimateTime', {
                      min: model.setupEstimate.minimumMinutes ?? 1,
                      max: model.setupEstimate.maximumMinutes ?? 10,
                    }),
                  }),
                )
              : null,
            model.realtime === false
              ? h('p', { className: 'mn-hint', 'data-hint': 'realtime' }, t('modelRealtimeHint'))
              : null,
            phase === 'downloading'
              ? h(
                  'div',
                  { className: 'mn-model-progress' },
                  h(
                    'div',
                    {
                      className: 'mn-progress',
                      role: 'progressbar',
                      'aria-label': t('downloadProgress'),
                      'aria-valuenow': percent,
                      'aria-valuemin': 0,
                      'aria-valuemax': 100,
                    },
                    h('div', { className: 'mn-progress-fill', style: { width: `${percent}%` } }),
                  ),
                  h(
                    'p',
                    { className: 'mn-hint' },
                    total > 0
                      ? t('downloadBytes', {
                          completed: fmtMb(completed),
                          total: fmtMb(total),
                          percent: String(percent),
                        })
                      : t('downloadUnknown', { completed: fmtMb(completed) }),
                    preparation.resource ? ` · ${preparation.resource}` : '',
                  ),
                )
              : null,
            steps.length && (preparing || failed || phase === 'cancelled' || phase === 'cancelling')
              ? h(
                  'details',
                  { className: 'mn-model-steps' },
                  h(
                    'summary',
                    null,
                    t('modelSteps'),
                    runningStep ? h('span', { className: 'mn-model-step-now' }, ` · ${stepLabel(runningStep.kind)}`) : null,
                  ),
                  h(
                    'ol',
                    null,
                    steps.map((step, index) =>
                      h(
                        'li',
                        { key: `${step.kind}-${index}`, className: 'mn-step' },
                        h(StatusDot, {
                          tone:
                            step.status === 'complete' || step.status === 'completed'
                              ? 'ok'
                              : step.status === 'running'
                                ? 'busy'
                                : step.status === 'failed'
                                  ? 'hot'
                                  : 'muted',
                        }),
                        h('span', null, stepLabel(step.kind)),
                        h('span', { className: 'mn-model-step-status' }, stepStatusLabel(step.status)),
                      ),
                    ),
                  ),
                )
              : null,
            failed
              ? h(
                  'div',
                  { className: 'mn-model-error' },
                  h(
                    'strong',
                    null,
                    download?.reason
                      ? t('downloadReason', {
                          reason: t(DOWNLOAD_REASON_KEY[download.reason] || 'reasonUnknown'),
                        })
                      : t('preparationFailed', { message: preparation.message || t('phaseFailed') }),
                  ),
                  download?.reason
                    ? h('p', { className: 'mn-hint' }, t(DOWNLOAD_ADVICE_KEY[download.reason] || 'adviceUnknown'))
                    : null,
                  download?.source
                    ? h('p', { className: 'mn-hint' }, `${t('downloadSource')}: ${download.source}`)
                    : null,
                )
              : null,
            idle && sources.length
              ? h(
                  'div',
                  { className: 'mn-field mn-model-source' },
                  h('label', { className: 'mn-label', htmlFor: `mn-model-source-${model.id}` }, t('downloadSource')),
                  h(
                    'select',
                    {
                      id: `mn-model-source-${model.id}`,
                      className: 'mn-select',
                      value: source,
                      onChange: (event) => setSource(event.target.value),
                    },
                    h('option', { value: 'auto' }, t('sourceAuto')),
                    sources.map((origin) => h('option', { key: origin, value: origin }, sourceLabel(origin))),
                  ),
                  h('p', { className: 'mn-hint' }, source === 'auto' ? t('sourceAutoHelp') : t('sourceManualHelp')),
                )
              : null,
            h(
              'div',
              { className: 'mn-model-actions' },
              preparing
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-size': 'small',
                      disabled: cancelling,
                      onClick: () => void cancelModelPrepare(model.id),
                    },
                    cancelling ? t('phaseCancelling') : t('modelCancel'),
                  )
                : idle
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'mn-btn',
                        'data-variant': 'outline',
                        'data-size': 'small',
                        onClick: () => void prepareModel(model.id, source === 'auto' ? '' : source),
                      },
                      phase === 'failed' || phase === 'cancelled' ? t('modelRetry') : t('modelDownload'),
                    )
                  : null,
              preparing && phase === 'downloading' ? h('span', { className: 'mn-model-actions-hint' }, t('modelPreparing')) : null,
            ),
          );
        }

        // 会议建议卡片：rail 内常驻位置，开始建议在空闲时出现，结束建议只在录音中出现。
        function DetectSuggestion() {
          const s = useStore();
          const detect = s.detect;
          const suggestion = detect && detect.suggestion ? detect.suggestion : null;
          const recordingActive = !!s.state?.recording?.active;
          const cardRef = React.useRef(null);
          const focusSeq = s.detectFocusSeq;

          // 系统通知被点击后，把焦点带回页面并保证卡片在可视区域内。
          React.useEffect(() => {
            if (!focusSeq) return;
            const node = cardRef.current;
            if (!node || typeof node.scrollIntoView !== 'function') return;
            try {
              node.scrollIntoView({ block: 'nearest' });
            } catch {
              /* ignore */
            }
          }, [focusSeq]);

          if (!suggestion) return null;
          const kind = detectKind(suggestion);
          if (kind === 'start' && recordingActive) return null;
          if (kind === 'end' && !recordingActive) return null;
          const title = detectTitle(kind);
          const body = detectBody(kind, suggestion);
          const busy = s.busy === 'detect';
          return h(
            'section',
            { ref: cardRef, className: 'mn-detect', 'data-kind': kind, 'aria-label': title },
            h(
              'div',
              { className: 'mn-detect-head' },
              h('span', { className: 'mn-detect-icon' }, h(Icon, { name: kind === 'end' ? 'stop' : 'mic' })),
              h(
                'div',
                { className: 'mn-detect-main' },
                h('h2', { className: 'mn-detect-title' }, title),
                h('p', { className: 'mn-detect-body' }, body),
              ),
            ),
            h(
              'div',
              { className: 'mn-detect-actions' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'mn-btn',
                  'data-variant': 'primary',
                  disabled: busy,
                  onClick: () => void ackDetect(true),
                },
                kind === 'end' ? t('suggestAcceptEnd') : t('suggestAcceptStart'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'mn-btn',
                  'data-variant': 'outline',
                  disabled: busy,
                  onClick: () => void ackDetect(false),
                },
                kind === 'end' ? t('suggestDismissEnd') : t('suggestDismissStart'),
              ),
            ),
          );
        }

        function SettingsDialog() {
          const s = useStore();
          const draft = s.cfgDraft || cfgFrom(s.state?.config);
          const languages = s.state?.provider?.languages || ['auto', 'zh', 'en', 'yue', 'ja', 'ko'];
          const models = modelList(s.state);
          const recording = !!s.state?.recording?.active;
          const notifyPermission = canNotify() ? window.Notification.permission : '';
          const detectNotifyDenied = notifyPermission === 'denied';
          const detectNotifyUnsupported = !canNotify();
          const detectState = s.state?.detect || null;
          const detectUnavailable = !!detectState && detectState.available === false;
          const detectError = detectState && detectState.error ? String(detectState.error) : '';
          return h(
            Modal,
            {
              open: !!s.settingsOpen,
              title: t('settings'),
              description: t('settingsSubtitle'),
              className: 'mn-modal-settings',
              width: 'min(560px, 100%)',
              onClose: closeSettings,
              closeLabel: t('closeDialog'),
              footer: h(
                React.Fragment,
                null,
                h('span', { className: 'mn-modal-note' }, s.cfgDirty ? t('unsavedHint') : ''),
                h(
                  'div',
                  { className: 'mn-modal-actions' },
                  h('button', { type: 'button', className: 'mn-btn', 'data-variant': 'outline', onClick: closeSettings }, t('dialogCancel')),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-variant': 'primary',
                      disabled: s.cfgSaving,
                      onClick: () => void saveConfig(),
                    },
                    s.cfgSaving ? t('savingConfig') : t('saveConfig'),
                  ),
                ),
              ),
            },
            h(
              'div',
              { className: 'mn-group' },
              h('div', { className: 'mn-group-head' }, h('h3', null, t('sectionModels'))),
              h('p', { className: 'mn-hint', style: { marginTop: 0 } }, t('modelSectionNote')),
              models.length
                ? h('div', { className: 'mn-model-list' }, models.map((model) => h(ModelRow, { key: model.id, model })))
                : h('p', { className: 'mn-hint' }, t('modelEmpty')),
              h('p', { className: 'mn-hint' }, t('modelsHint')),
            ),
            h(
              'div',
              { className: 'mn-group' },
              h('div', { className: 'mn-group-head' }, h('h3', null, t('sectionStorage'))),
              h(
                'div',
                { className: 'mn-field' },
                h('label', { className: 'mn-label', htmlFor: 'mn-cfg-dir' }, t('storageDir')),
                h(
                  'div',
                  { className: 'mn-field-row' },
                  h('input', {
                    id: 'mn-cfg-dir',
                    className: 'mn-input',
                    type: 'text',
                    value: draft.storageDir,
                    spellCheck: false,
                    placeholder: '~/dsh-meetings',
                    'data-modal-autofocus': 'true',
                    onChange: (event) => editDraft({ storageDir: event.target.value }),
                  }),
                  h('button', { type: 'button', className: 'mn-btn', 'data-variant': 'outline', 'data-size': 'small', onClick: chooseStorageDir }, t('pickDirectory')),
                ),
                h('p', { className: 'mn-hint', style: { marginTop: 0 } }, t('storageHint')),
              ),
            ),
            h(
              'div',
              { className: 'mn-group' },
              h('div', { className: 'mn-group-head' }, h('h3', null, t('sectionRecognition'))),
              h(
                'div',
                { className: 'mn-field' },
                h('label', { className: 'mn-label', htmlFor: 'mn-cfg-lang' }, t('language')),
                h(
                  'select',
                  {
                    id: 'mn-cfg-lang',
                    className: 'mn-select',
                    value: draft.language,
                    disabled: recording,
                    onChange: (event) => editDraft({ language: event.target.value }),
                  },
                  languages.map((code) => h('option', { key: code, value: code }, langLabel(code))),
                ),
              ),
              h(
                'div',
                { className: 'mn-field' },
                h('label', { className: 'mn-label', htmlFor: 'mn-cfg-chunk' }, t('chunkSeconds')),
                h('input', {
                  id: 'mn-cfg-chunk',
                  className: 'mn-input',
                  type: 'number',
                  min: 8,
                  max: 60,
                  step: 5,
                  value: String(draft.chunkSeconds),
                  disabled: recording,
                  onChange: (event) => editDraft({ chunkSeconds: Number(event.target.value) || 0 }),
                }),
                h('p', { className: 'mn-hint', style: { marginTop: 0 } }, t('chunkHint')),
              ),
            ),
            h(
              'div',
              { className: 'mn-group' },
              h('div', { className: 'mn-group-head' }, h('h3', null, t('sectionCapture'))),
              h(
                'div',
                { className: 'mn-field' },
                h(
                  'label',
                  { className: 'mn-switch' },
                  h('input', {
                    type: 'checkbox',
                    role: 'switch',
                    'aria-checked': draft.captureMicrophone ? 'true' : 'false',
                    checked: !!draft.captureMicrophone,
                    onChange: (event) => editDraft({ captureMicrophone: event.target.checked }),
                  }),
                  h('span', { className: 'mn-switch-track' }),
                  h('span', null, t('captureMic')),
                ),
                h(
                  'label',
                  { className: 'mn-switch', style: { marginTop: '10px' } },
                  h('input', {
                    type: 'checkbox',
                    role: 'switch',
                    'aria-checked': draft.captureSystemAudio ? 'true' : 'false',
                    checked: !!draft.captureSystemAudio,
                    onChange: (event) => editDraft({ captureSystemAudio: event.target.checked }),
                  }),
                  h('span', { className: 'mn-switch-track' }),
                  h('span', null, t('captureSystem')),
                ),
                h('p', { className: 'mn-hint', style: { marginTop: '10px' } }, t('captureHint')),
              ),
            ),
            h(
              'div',
              { className: 'mn-group' },
              h('div', { className: 'mn-group-head' }, h('h3', null, t('sectionDetect'))),
              h(
                'div',
                { className: 'mn-field' },
                h(
                  'label',
                  { className: 'mn-switch' },
                  h('input', {
                    type: 'checkbox',
                    role: 'switch',
                    'aria-checked': draft.detectEnabled ? 'true' : 'false',
                    checked: !!draft.detectEnabled,
                    onChange: (event) => editDraft({ detectEnabled: event.target.checked }),
                  }),
                  h('span', { className: 'mn-switch-track' }),
                  h('span', null, t('detectSwitchEnabled')),
                ),
                h(
                  'label',
                  {
                    className: 'mn-switch',
                    style: { marginTop: '10px' },
                    'data-disabled': draft.detectEnabled ? '0' : '1',
                  },
                  h('input', {
                    type: 'checkbox',
                    role: 'switch',
                    'aria-checked': draft.detectNotify ? 'true' : 'false',
                    checked: !!draft.detectNotify,
                    disabled: !draft.detectEnabled,
                    onChange: (event) => editDraft({ detectNotify: event.target.checked }),
                  }),
                  h('span', { className: 'mn-switch-track' }),
                  h('span', null, t('detectSwitchNotify')),
                ),
                h('p', { className: 'mn-hint', style: { marginTop: '10px' } }, t('detectHint')),
                detectUnavailable
                  ? h('p', { className: 'mn-hint', style: { marginTop: '6px' } }, t('detectUnavailableHint'))
                  : null,
                detectError
                  ? h('p', { className: 'mn-hint', style: { marginTop: '6px' } }, detectError)
                  : null,
                detectNotifyDenied
                  ? h('p', { className: 'mn-hint', style: { marginTop: '6px' } }, t('detectNotifyDenied'))
                  : null,
                detectNotifyUnsupported
                  ? h('p', { className: 'mn-hint', style: { marginTop: '6px' } }, t('detectNotifyUnsupported'))
                  : null,
                h(
                  'div',
                  { style: { marginTop: '12px' } },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-variant': 'outline',
                      'data-size': 'small',
                      disabled: detectNotifyUnsupported,
                      onClick: () => void sendTestNotification(),
                    },
                    t('detectTestNotify'),
                  ),
                ),
              ),
            ),
          );
        }

        function MainPage() {
          React.useEffect(() => startPolling(), []);
          const s = useStore();
          if (s.loading && !s.state) {
            return h(
              'div',
              { className: 'mn-root' },
              h('style', null, CSS),
              h('div', { className: 'mn-shell' }, h('div', { className: 'mn-loading', style: { minHeight: '320px' } }, h('div', { className: 'mn-spinner' }), t('loading'))),
            );
          }
          if (s.stateError && !s.state) {
            return h(
              'div',
              { className: 'mn-root' },
              h('style', null, CSS),
              h(
                'div',
                { className: 'mn-shell' },
                h(
                  'div',
                  { className: 'mn-empty', style: { paddingTop: '96px' } },
                  h('b', null, t('loadStateFailed')),
                  h('span', null, s.stateError),
                  h(
                    'button',
                    { type: 'button', className: 'mn-btn', 'data-size': 'small', onClick: () => void refreshState(false) },
                    t('retry'),
                  ),
                ),
              ),
            );
          }
          return h(
            'div',
            { className: 'mn-root' },
            h('style', null, CSS),
            h(
              'div',
              { className: 'mn-shell' },
              h(Topbar),
              s.error ? h(Banner, { tone: 'error', onClose: () => store.set({ error: '' }) }, s.error) : null,
              s.warning ? h(Banner, { tone: 'warn', onClose: () => store.set({ warning: '' }) }, s.warning) : null,
              s.sseDown ? h(Banner, { tone: 'warn', onClose: () => store.set({ sseDown: false }) }, t('sseGaveUp')) : null,
              h('div', { className: 'mn-layout' }, h('aside', { className: 'mn-rail' }, h(DetectSuggestion), h(RecordPanel), h(MeetingList)), h(DetailPane)),
            ),
            s.settingsOpen ? h(SettingsDialog) : null,
            h(ConfirmDialog, {
              open: s.confirm === 'delete' || s.confirm === 'cancel',
              title: s.confirm === 'delete' ? t('confirmDeleteTitle') : t('confirmCancelTitle'),
              body:
                s.confirm === 'delete'
                  ? t('confirmDeleteBody').replace(
                      '{title}',
                      s.detail?.meeting?.title ||
                        (s.state?.meetings || []).find((item) => item.id === s.selectedId)?.title ||
                        t('meetingFallbackTitle'),
                    )
                  : t('confirmCancelBody'),
              confirmLabel: s.confirm === 'delete' ? t('confirmDeleteGo') : t('confirmCancelGo'),
              cancelLabel: t('dialogCancel'),
              busy: s.confirm === 'delete' ? s.busy === 'delete' : s.busy === 'cancel',
              onCancel: closeConfirm,
              onConfirm: s.confirm === 'delete' ? () => void deleteMeeting() : () => void cancelRecording(),
            }),
            h(Toast, { text: s.notice, seq: s.noticeSeq }),
          );
        }
        // 检测订阅与系统通知提升到插件启动作用域：不依赖「会议记录」页面挂载，
        // 页面最小化或切到其他对话时仍能收到建议并弹系统通知。
        ctx.effect(() => {
          let disposed = false;
          void (async () => {
            if (!store.get().state) {
              try {
                await refreshState(true);
              } catch {
                /* 页面打开后轮询会继续补齐状态 */
              }
            }
            if (!disposed) startDetectSse();
          })();
          return () => {
            disposed = true;
            stopDetectSse();
          };
        });

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'dsh-meeting-notes',
              order: 30,
              label: () => t('nav'),
            },
            PanelIcon,
          ),
        );
        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: 'dsh-meeting-notes',
            },
            MainPage,
          ),
        );

        ctx.effect(() => () => {
          subscribers = 0;
          clearUiTimers();
          stopSse();
        });
      },
    };
  },
});
