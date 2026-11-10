window.__ModuleLoader__.load({
  id: '@local/dsh-meeting-notes',
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
      prepare: '下载模型',
      prepareBusy: '准备中…',
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
      cancelConfirm: '确认放弃',
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
      deleteConfirm: '确认删除',
      deleting: '删除中…',
      deleteHint: '删除会移除该会议的音频与文稿，且无法恢复。',
      deleteOk: '会议已删除',
      deleteFailed: '删除失败',
      detailLoadFailed: '读取会议详情失败',
      meetingPath: '会议目录',
      duration: '时长',
      sizeLabel: '文件大小',
      emptyGuideTitle: '开始记录你的第一场会议',
      emptyGuideBody: '选择转写模式后点「开始录音」：系统声音与麦克风会混音保存到本地，录音结束后自动转写。',
      sseGaveUp: '实时通道已断开，已切换为定时刷新。',
      transcribingHint: '转写进行中，完成后文稿会自动出现。',
      settings: '设置',
      settingsSubtitle: '录音存储、识别语言与采集方式',
      closeDialog: '关闭',
      dialogCancel: '取消',
      sectionStorage: '存储',
      sectionRecognition: '识别',
      sectionCapture: '采集',
      storageHint: '每场会议一个子文件夹，存放录音 WAV、转写与纪要。',
      captureHint: '默认同时采集系统声音与麦克风，录音中不可更改。',
      modeHintAfter: '结束后转写：停止录音后整段识别，速度更快。',
      modeHintRealtime: '实时转写：录音时持续显示字幕，占用略高。',
      unsavedHint: '有未保存的修改',
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
      prepare: 'Download model',
      prepareBusy: 'Preparing…',
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
      cancelConfirm: 'Confirm discard',
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
      deleteConfirm: 'Confirm delete',
      deleting: 'Deleting…',
      deleteHint: 'Deleting removes this meeting audio and transcripts permanently.',
      deleteOk: 'Meeting deleted',
      deleteFailed: 'Failed to delete meeting',
      detailLoadFailed: 'Failed to load meeting details',
      meetingPath: 'Meeting folder',
      duration: 'Duration',
      sizeLabel: 'Size',
      emptyGuideTitle: 'Record your first meeting',
      emptyGuideBody: 'Pick a transcription mode and click "Start recording": system audio and microphone are mixed and stored locally, then transcribed when you stop.',
      sseGaveUp: 'The realtime channel closed; falling back to periodic refresh.',
      transcribingHint: 'Transcription in progress; the transcript appears when it finishes.',
      settings: 'Settings',
      settingsSubtitle: 'Where recordings live, recognition language and capture sources',
      closeDialog: 'Close',
      dialogCancel: 'Cancel',
      sectionStorage: 'Storage',
      sectionRecognition: 'Recognition',
      sectionCapture: 'Capture',
      storageHint: 'One folder per meeting, holding the WAV recording, transcript and minutes.',
      captureHint: 'System audio and microphone are captured together; change before recording.',
      modeHintAfter: 'Transcribe after stop: recognize the whole recording once, fastest.',
      modeHintRealtime: 'Realtime: subtitles stream while recording, slightly more CPU.',
      unsavedHint: 'Unsaved changes',
    };

    const CSS = `
.mn-root{
  --mn-bg:var(--dsw-alias-bg-base);
  --mn-surface:var(--dsw-alias-bg-layer-1);
  --mn-surface-2:var(--dsw-alias-bg-layer-2);
  --mn-overlay:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));
  --mn-line:var(--dsw-alias-border-l1);
  --mn-line-strong:var(--dsw-alias-border-l2);
  --mn-text:var(--dsw-alias-label-primary);
  --mn-muted:var(--dsw-alias-label-secondary);
  --mn-accent:var(--dsw-alias-brand-primary);
  --mn-hot:var(--dsw-alias-state-error-primary,#e5484d);
  --mn-warn:var(--dsw-alias-state-warn-primary,#d97706);
  --mn-ok:var(--dsw-alias-state-success-primary,#2f9e6b);
  position:relative;
  min-height:100%;
  overflow:auto;
  background:var(--mn-bg);
  color:var(--mn-text);
  font-family:inherit;
  font-size:13.5px;
  line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.mn-root *{box-sizing:border-box}
.mn-root button{font-family:inherit}
.mn-shell{max-width:1200px;margin:0 auto;padding:24px 28px 56px}

/* ---------- top bar ---------- */
.mn-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px}
.mn-brand{display:flex;align-items:center;gap:12px;min-width:0}
.mn-brand-mark{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;flex:0 0 auto;color:var(--mn-accent);background:color-mix(in srgb,var(--mn-accent) 12%,transparent)}
.mn-title{margin:0;font-size:18px;line-height:1.25;font-weight:650;letter-spacing:-.015em}
.mn-sub{margin:1px 0 0;font-size:11.5px;color:var(--mn-muted);line-height:1.4}
.mn-topbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.mn-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 11px;border-radius:999px;border:1px solid var(--mn-line);background:var(--mn-surface);color:var(--mn-muted);font-size:11.5px;white-space:nowrap;max-width:100%}
.mn-chip b{font-weight:600;color:var(--mn-text);overflow:hidden;text-overflow:ellipsis}
.mn-chip .mn-sep{opacity:.45}

/* ---------- buttons ---------- */
.mn-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 13px;border-radius:9px;border:1px solid transparent;background:transparent;color:var(--mn-text);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .16s ease-out,border-color .16s ease-out,color .16s ease-out,transform .12s ease-out}
.mn-btn:active{transform:translateY(1px)}
.mn-btn:focus-visible{outline:2px solid color-mix(in srgb,var(--mn-accent) 55%,transparent);outline-offset:2px}
.mn-btn:disabled{opacity:.5;cursor:default;transform:none}
.mn-btn[data-variant="primary"]{background:var(--mn-accent);color:var(--mn-bg);font-weight:600}
.mn-btn[data-variant="primary"]:hover:not(:disabled){filter:brightness(1.06)}
.mn-btn[data-variant="stop"]{background:var(--mn-hot);color:#fff;font-weight:600}
.mn-btn[data-variant="stop"]:hover:not(:disabled){filter:brightness(1.06)}
.mn-btn[data-variant="tonal"]{color:var(--mn-accent);background:color-mix(in srgb,var(--mn-accent) 11%,transparent);border-color:color-mix(in srgb,var(--mn-accent) 24%,transparent);font-weight:600}
.mn-btn[data-variant="tonal"]:hover:not(:disabled){background:color-mix(in srgb,var(--mn-accent) 17%,transparent)}
.mn-btn[data-variant="ghost"]{color:var(--mn-muted)}
.mn-btn[data-variant="ghost"]:hover:not(:disabled){color:var(--mn-text);background:var(--mn-surface-2)}
.mn-btn[data-variant="danger"]{color:var(--mn-hot)}
.mn-btn[data-variant="danger"]:hover:not(:disabled){background:color-mix(in srgb,var(--mn-hot) 10%,transparent)}
.mn-btn[data-size="small"]{height:29px;padding:0 10px;font-size:12px;border-radius:8px}
.mn-btn[data-size="block"]{width:100%;height:38px;font-size:13px}
.mn-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border-radius:9px;border:1px solid transparent;background:transparent;color:var(--mn-muted);cursor:pointer;transition:background .16s,color .16s}
.mn-icon-btn:hover{background:var(--mn-surface-2);color:var(--mn-text)}
.mn-icon-btn:focus-visible{outline:2px solid color-mix(in srgb,var(--mn-accent) 55%,transparent);outline-offset:2px}

/* ---------- banners ---------- */
.mn-banner{display:flex;align-items:flex-start;gap:8px;margin-bottom:12px;padding:9px 12px;border-radius:10px;font-size:12px;line-height:1.55}
.mn-banner[data-tone="error"]{color:var(--mn-hot);background:color-mix(in srgb,var(--mn-hot) 9%,transparent)}
.mn-banner[data-tone="warn"]{color:var(--mn-warn);background:color-mix(in srgb,var(--mn-warn) 10%,transparent)}
.mn-banner[data-tone="info"]{color:var(--mn-muted);background:var(--mn-surface-2)}
.mn-banner span{flex:1;min-width:0;word-break:break-word}
.mn-banner button{flex:0 0 auto;border:0;background:transparent;color:inherit;font:inherit;font-size:11.5px;cursor:pointer;opacity:.75;padding:0 2px}
.mn-banner button:hover{opacity:1}

/* ---------- layout ---------- */
.mn-layout{display:grid;grid-template-columns:minmax(0,336px) minmax(0,1fr);gap:28px;align-items:start}
.mn-rail{position:sticky;top:16px;display:flex;flex-direction:column;gap:20px;min-width:0}
@media (max-width:1020px){
  .mn-layout{grid-template-columns:minmax(0,1fr);gap:24px}
  .mn-rail{position:static}
  .mn-shell{padding:18px 18px 40px}
}

/* ---------- record panel ---------- */
.mn-record{background:var(--mn-surface);border-radius:16px;padding:18px}
.mn-record-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mn-record-head h2{margin:0;font-size:13px;font-weight:650;letter-spacing:.01em;color:var(--mn-muted)}
.mn-seg{display:inline-flex;gap:2px;padding:2px;border-radius:9px;background:var(--mn-surface-2)}
.mn-seg button{height:24px;padding:0 9px;border:0;border-radius:7px;background:transparent;color:var(--mn-muted);font-size:11.5px;cursor:pointer;transition:background .16s,color .16s}
.mn-seg button[data-active="1"]{background:var(--mn-bg);color:var(--mn-text);font-weight:600;box-shadow:0 1px 2px color-mix(in srgb,var(--mn-text) 12%,transparent)}
.mn-seg button:disabled{cursor:default;opacity:.6}
.mn-timer-row{display:flex;align-items:baseline;gap:10px;margin:14px 0 2px}
.mn-timer{font-size:38px;line-height:1;font-weight:600;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.mn-timer[data-active="1"]{color:var(--mn-hot)}
.mn-recstate{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--mn-muted);white-space:nowrap}
.mn-recstate[data-active="1"]{color:var(--mn-hot)}
.mn-dot{width:7px;height:7px;border-radius:50%;flex:0 0 auto;background:var(--mn-muted);display:inline-block}
.mn-dot[data-tone="ok"]{background:var(--mn-ok)}
.mn-dot[data-tone="warn"]{background:var(--mn-warn)}
.mn-dot[data-tone="hot"]{background:var(--mn-hot)}
.mn-dot[data-tone="busy"]{background:var(--mn-accent);animation:mn-blink 1.2s ease-in-out infinite}
.mn-dot[data-tone="active"]{background:var(--mn-hot);animation:mn-pulse 1.8s ease-out infinite}
@keyframes mn-blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes mn-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--mn-hot) 45%,transparent)}70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
.mn-levels{display:flex;flex-direction:column;gap:7px;margin:16px 0 0}
.mn-level{display:grid;grid-template-columns:52px minmax(0,1fr) 34px;align-items:center;gap:8px;font-size:11px;color:var(--mn-muted)}
.mn-level-pct{text-align:right;font-variant-numeric:tabular-nums}
.mn-level-track{height:4px;border-radius:999px;background:var(--mn-surface-2);overflow:hidden}
.mn-level-fill{height:100%;border-radius:999px;background:var(--mn-accent);transition:width .12s linear;opacity:.85}
.mn-record-actions{display:flex;align-items:center;gap:8px;margin-top:16px}
.mn-record-actions .mn-btn[data-size="block"]{flex:1 1 auto}
.mn-hint{margin:12px 0 0;font-size:11.5px;line-height:1.55;color:var(--mn-muted)}
.mn-live{margin-top:14px;padding-top:12px;border-top:1px solid var(--mn-line)}
.mn-live-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;font-size:11.5px;color:var(--mn-muted);font-weight:600;letter-spacing:.01em}
.mn-live-list{max-height:168px;overflow:auto;scrollbar-width:thin;display:flex;flex-direction:column;gap:5px}
.mn-live-line{display:flex;gap:8px;font-size:12.5px;line-height:1.6}
.mn-live-ts{flex:0 0 auto;min-width:34px;color:var(--mn-muted);font-variant-numeric:tabular-nums;font-size:10.5px;padding-top:2px}
.mn-live-text{min-width:0;word-break:break-word}
.mn-live-partial{color:var(--mn-muted);font-style:italic}
.mn-live-empty{font-size:11.5px;color:var(--mn-muted);padding:2px 0}

/* ---------- meetings list ---------- */
.mn-rail-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px;margin-bottom:2px}
.mn-rail-head h2{margin:0;font-size:13px;font-weight:650;letter-spacing:.01em;color:var(--mn-muted)}
.mn-count{font-size:11.5px;color:var(--mn-muted);font-variant-numeric:tabular-nums;padding-right:10px}
.mn-items{display:flex;flex-direction:column;gap:2px;max-height:min(46vh,460px);overflow:auto;scrollbar-width:thin;margin:0 -8px;padding:0 8px}
.mn-item{display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;border:0;border-radius:10px;background:transparent;color:var(--mn-text);font-size:13px;padding:9px 10px;cursor:pointer;transition:background .14s}
.mn-item:hover{background:var(--mn-surface-2)}
.mn-item[data-active="1"]{background:var(--mn-surface-2);box-shadow:inset 2px 0 0 var(--mn-accent)}
.mn-item-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}
.mn-item-title{font-weight:550;line-height:1.4;word-break:break-word;display:block}
.mn-item-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:var(--mn-muted);font-size:11px;font-variant-numeric:tabular-nums}
.mn-item-meta .mn-sep{opacity:.45}
.mn-item-flag{flex:0 0 auto;color:var(--mn-muted);display:flex;align-items:center;padding-top:1px}

/* ---------- detail ---------- */
.mn-detail{min-width:0;padding-top:2px}
.mn-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.mn-detail-title{min-width:0;flex:1 1 320px}
.mn-detail-title h2{margin:0 0 4px;font-size:21px;line-height:1.3;font-weight:650;letter-spacing:-.02em;word-break:break-word}
.mn-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:var(--mn-muted);font-size:11.5px;font-variant-numeric:tabular-nums}
.mn-meta .mn-sep{opacity:.45}
.mn-detail-actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end;flex:0 0 auto}
.mn-detail-actions .mn-btn{margin-left:2px}
.mn-audio{display:flex;align-items:center;gap:12px;margin:16px 0 4px;padding:10px 14px;border-radius:12px;background:var(--mn-surface)}
.mn-audio-label{flex:0 0 auto;font-size:11.5px;font-weight:600;color:var(--mn-muted);letter-spacing:.02em}
.mn-audio audio{flex:1 1 auto;min-width:0;height:32px;display:block;color-scheme:inherit}
.mn-audio audio::-webkit-media-controls-panel{background:var(--mn-surface)}
.mn-path{display:block;margin-top:8px;font-size:10.5px;color:var(--mn-muted);word-break:break-all}

/* ---------- tabs ---------- */
.mn-tabs{display:flex;align-items:center;gap:20px;margin-top:18px;border-bottom:1px solid var(--mn-line)}
.mn-tab{position:relative;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 1px;border:0;background:transparent;color:var(--mn-muted);font-size:12.5px;font-weight:600;cursor:pointer}
.mn-tab:hover{color:var(--mn-text)}
.mn-tab[data-active="1"]{color:var(--mn-text)}
.mn-tab[data-active="1"]::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;background:var(--mn-accent)}
.mn-tab-count{font-size:10.5px;font-weight:600;color:var(--mn-muted);font-variant-numeric:tabular-nums}
.mn-tab-dot{width:5px;height:5px;border-radius:50%;background:var(--mn-ok)}

/* ---------- document ---------- */
.mn-doc{margin-top:18px;max-width:76ch;font-size:14px;line-height:1.75}
.mn-doc-h1{margin:2px 0 10px;font-size:19px;line-height:1.35;font-weight:650;letter-spacing:-.015em}
.mn-doc-h2{margin:26px 0 8px;font-size:15px;line-height:1.4;font-weight:650;letter-spacing:-.01em}
.mn-doc-h2:first-child{margin-top:2px}
.mn-doc-h3{margin:18px 0 6px;font-size:13.5px;font-weight:650}
.mn-doc-p{margin:0 0 9px;white-space:pre-wrap;word-break:break-word}
.mn-doc-ul,.mn-doc-ol{margin:0 0 10px;padding-left:20px}
.mn-doc-ul li,.mn-doc-ol li{margin:0 0 4px;line-height:1.7}
.mn-doc-quote{margin:0 0 10px;padding:2px 0 2px 12px;border-left:2px solid var(--mn-line-strong);color:var(--mn-muted)}
.mn-doc-line{display:flex;gap:12px;margin:0 0 5px}
.mn-doc-ts{flex:0 0 auto;min-width:36px;color:var(--mn-muted);font-variant-numeric:tabular-nums;font-size:11.5px;padding-top:3px}
.mn-doc-text{min-width:0;word-break:break-word;white-space:pre-wrap}
.mn-doc b{font-weight:650}
.mn-doc code{padding:1px 5px;border-radius:5px;background:var(--mn-surface-2);font-size:12px}
.mn-table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:12.5px;line-height:1.6}
.mn-table th{text-align:left;font-weight:600;color:var(--mn-muted);padding:7px 10px;border-bottom:1px solid var(--mn-line-strong);white-space:nowrap}
.mn-table td{padding:7px 10px;border-bottom:1px solid var(--mn-line);vertical-align:top}
.mn-doc-empty{color:var(--mn-muted);font-size:12.5px;margin-top:18px}
.mn-doc-empty b{display:block;margin-bottom:4px;font-size:13.5px;color:var(--mn-text);font-weight:600}

/* ---------- states ---------- */
.mn-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:56px 24px;color:var(--mn-muted)}
.mn-empty-mark{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:var(--mn-surface);color:var(--mn-muted);margin-bottom:2px}
.mn-empty b{font-size:14px;color:var(--mn-text);font-weight:600}
.mn-empty span{font-size:12px;line-height:1.65;max-width:380px}
.mn-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:240px;color:var(--mn-muted);font-size:12px}
.mn-spinner{width:22px;height:22px;border-radius:50%;border:2px solid color-mix(in srgb,var(--mn-accent) 22%,transparent);border-top-color:var(--mn-accent);animation:mn-spin .8s linear infinite}
@keyframes mn-spin{to{transform:rotate(360deg)}}
.mn-skel{height:44px;border-radius:10px;background:linear-gradient(100deg,var(--mn-surface) 20%,var(--mn-surface-2) 40%,var(--mn-surface) 60%);background-size:220% 100%;animation:mn-shimmer 1.4s linear infinite;margin-bottom:6px}
@keyframes mn-shimmer{to{background-position:-120% 0}}

/* ---------- dialog ---------- */
.mn-overlay{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.38);animation:mn-fade .16s ease-out}
.mn-dialog{display:flex;flex-direction:column;width:min(560px,100%);max-height:min(86vh,780px);border-radius:18px;background:var(--mn-overlay);border:1px solid var(--mn-line);box-shadow:0 24px 60px rgba(0,0,0,.34);animation:mn-rise .18s ease-out;overflow:hidden}
@keyframes mn-fade{from{opacity:0}to{opacity:1}}
@keyframes mn-rise{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:none}}
.mn-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 22px 4px}
.mn-dialog-head h2{margin:0 0 3px;font-size:17px;line-height:1.3;font-weight:650;letter-spacing:-.015em}
.mn-dialog-sub{margin:0;font-size:11.5px;color:var(--mn-muted);line-height:1.5}
.mn-dialog-body{flex:1 1 auto;min-height:0;overflow:auto;padding:6px 22px 10px;scrollbar-width:thin}
.mn-group{padding:16px 0 4px;border-top:1px solid var(--mn-line)}
.mn-group:first-child{border-top:0;padding-top:10px}
.mn-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.mn-group-head h3{margin:0;font-size:12px;font-weight:650;letter-spacing:.03em;color:var(--mn-muted)}
.mn-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.mn-field:last-child{margin-bottom:4px}
.mn-label{font-size:11.5px;font-weight:600;color:var(--mn-muted)}
.mn-field-row{display:flex;align-items:center;gap:8px;min-width:0}
.mn-input{height:34px;min-width:0;border:1px solid var(--mn-line);border-radius:9px;background:var(--mn-surface);color:var(--mn-text);font-family:inherit;font-size:12.5px;padding:0 11px;outline:none;transition:border-color .16s,box-shadow .16s}
.mn-input:focus{border-color:color-mix(in srgb,var(--mn-accent) 60%,var(--mn-line));box-shadow:0 0 0 3px color-mix(in srgb,var(--mn-accent) 14%,transparent)}
.mn-input[type="number"]{width:88px}
.mn-field-row .mn-input{flex:1 1 auto}
.mn-select{height:34px;border:1px solid var(--mn-line);border-radius:9px;background:var(--mn-surface);color:var(--mn-text);font-family:inherit;font-size:12.5px;padding:0 9px;outline:none;cursor:pointer;min-width:120px}
.mn-select:focus{border-color:color-mix(in srgb,var(--mn-accent) 60%,var(--mn-line))}
.mn-switch{display:inline-flex;align-items:center;gap:10px;font-size:12.5px;cursor:pointer;color:var(--mn-text)}
.mn-switch input{position:absolute;opacity:0;width:0;height:0}
.mn-switch-track{position:relative;width:34px;height:19px;border-radius:999px;background:var(--mn-surface-2);border:1px solid var(--mn-line);transition:background .16s,border-color .16s;flex:0 0 auto}
.mn-switch-track::after{content:'';position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;background:var(--mn-muted);transition:transform .16s ease-out,background .16s}
.mn-switch input:checked+.mn-switch-track{background:color-mix(in srgb,var(--mn-accent) 20%,transparent);border-color:color-mix(in srgb,var(--mn-accent) 42%,var(--mn-line))}
.mn-switch input:checked+.mn-switch-track::after{transform:translateX(15px);background:var(--mn-accent)}
.mn-switch input:focus-visible+.mn-switch-track{outline:2px solid color-mix(in srgb,var(--mn-accent) 55%,transparent);outline-offset:2px}
.mn-dialog-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px 18px;border-top:1px solid var(--mn-line)}
.mn-dialog-foot .mn-foot-note{font-size:11.5px;color:var(--mn-muted)}
.mn-dialog-foot .mn-foot-actions{display:flex;align-items:center;gap:8px;margin-left:auto}

@media (prefers-reduced-motion:reduce){
  .mn-spinner,.mn-skel,.mn-dot[data-tone="busy"],.mn-dot[data-tone="active"]{animation:none!important}
  .mn-overlay,.mn-dialog{animation:none}
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
      unprepared: 'phaseUnprepared',
      downloading: 'phaseDownloading',
      checking: 'phaseChecking',
      loading: 'phaseLoading',
      ready: 'phaseReady',
      standby: 'phaseStandby',
      failed: 'phaseFailed',
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
          prepareBusy: false,
          confirmDelete: false,
          confirmCancel: false,
        });

        const useStore = () => React.useSyncExternalStore(store.subscribe, store.get);

        // -----------------------------------------------------------------
        // Small UI helpers
        // -----------------------------------------------------------------
        let noticeTimer = 0;
        let confirmTimer = 0;

        const showError = (error, fallback) => {
          const message =
            error && typeof error === 'object' && error.message
              ? String(error.message)
              : error
                ? String(error)
                : fallback || t('unknownError');
          store.set({ error: message });
        };

        const showNotice = (text) => {
          if (noticeTimer) window.clearTimeout(noticeTimer);
          store.set({ notice: text });
          noticeTimer = window.setTimeout(() => {
            noticeTimer = 0;
            store.set({ notice: '' });
          }, 4000);
        };

        const resetConfirmDelete = () => {
          if (confirmTimer) {
            window.clearTimeout(confirmTimer);
            confirmTimer = 0;
          }
          if (store.get().confirmDelete || store.get().confirmCancel) {
            store.set({ confirmDelete: false, confirmCancel: false });
          }
        };

        const armConfirmDelete = () => {
          store.set({ confirmDelete: true, confirmCancel: false });
          if (confirmTimer) window.clearTimeout(confirmTimer);
          confirmTimer = window.setTimeout(() => {
            confirmTimer = 0;
            store.set({ confirmDelete: false });
          }, 5000);
        };

        const cfgFrom = (config) => ({
          storageDir: String(config?.storageDir || ''),
          transcribeMode: config?.transcribeMode === 'realtime' ? 'realtime' : 'after',
          language: String(config?.language || 'zh'),
          captureSystemAudio: config?.captureSystemAudio !== false,
          captureMicrophone: config?.captureMicrophone !== false,
          chunkSeconds: Number(config?.chunkSeconds) || 25,
        });

        const langLabel = (code) => (LANG_KEY[code] ? t(LANG_KEY[code]) : String(code || ''));
        const phaseLabel = (phase) => t(PHASE_KEY[phase] || 'phaseUnprepared');
        const phaseTone = (phase) => {
          if (phase === 'ready') return 'ok';
          if (phase === 'failed') return 'hot';
          if (phase === 'downloading' || phase === 'checking' || phase === 'loading') return 'busy';
          return 'muted';
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
          if (confirmTimer) {
            window.clearTimeout(confirmTimer);
            confirmTimer = 0;
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
          if (!store.get().cfgDirty) patch.cfgDraft = cfgFrom(data.config);
          store.set(patch);

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
          }, 5000);
        };

        const startPolling = () => {
          subscribers += 1;
          if (subscribers === 1) {
            void refreshState(false);
            schedulePoll();
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
          ['storageDir', 'transcribeMode', 'language', 'chunkSeconds', 'captureSystemAudio', 'captureMicrophone'].every(
            (key) => String(a[key]) === String(b[key]),
          );

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
            store.set({
              cfgDraft: draft,
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
            void refreshState(true);
          } catch (error) {
            store.set({ cfgSaving: false });
            showError(error);
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

        const prepareModel = async () => {
          if (store.get().prepareBusy) return;
          store.set({ prepareBusy: true, error: '' });
          try {
            await apiPost('/prepare', {});
            showNotice(t('prepareStarted'));
            void refreshState(true);
          } catch (error) {
            showError(error);
          } finally {
            store.set({ prepareBusy: false });
          }
        };

        const startRecording = async () => {
          const draft = store.get().cfgDraft || cfgFrom(null);
          if (!draft.captureSystemAudio && !draft.captureMicrophone) {
            showError(t('captureNone'));
            return;
          }
          store.set({ busy: 'start', error: '', confirmDelete: false, confirmCancel: false });
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

        const cancelRecording = async () => {
          if (!store.get().confirmCancel) {
            store.set({ confirmCancel: true, confirmDelete: false });
            return;
          }
          store.set({ busy: 'cancel', confirmCancel: false, error: '' });
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
          resetConfirmDelete();
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

        const deleteMeeting = async () => {
          const meetingId = store.get().selectedId;
          if (!meetingId || store.get().busy) return;
          if (!store.get().confirmDelete) {
            armConfirmDelete();
            return;
          }
          resetConfirmDelete();
          store.set({ busy: 'delete', error: '' });
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
          const provider = state?.provider || {};
          const phase = provider.preparation?.phase || (state?.providerReady ? 'ready' : 'unprepared');
          const ready = state ? state.providerReady === true || phase === 'ready' : false;
          const preparing = s.prepareBusy || phase === 'downloading' || phase === 'checking' || phase === 'loading';
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
              h(
                'span',
                { className: 'mn-chip', title: provider.name || t('modelLabel') },
                h(StatusDot, { tone: ready ? 'ok' : phaseTone(phase) }),
                h('b', null, provider.name || t('modelLabel')),
                h('span', { className: 'mn-sep' }, '·'),
                h('span', null, preparing && phase !== 'ready' ? t('prepareBusy') : phaseLabel(phase)),
              ),
              ready
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'mn-btn',
                      'data-variant': 'primary',
                      'data-size': 'small',
                      disabled: preparing || s.prepareBusy,
                      onClick: prepareModel,
                    },
                    preparing ? t('prepareBusy') : phase === 'failed' ? t('prepareRetry') : t('prepare'),
                  ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'mn-icon-btn',
                  title: t('settings'),
                  'aria-label': t('settings'),
                  onClick: openSettings,
                },
                h(Icon, { name: 'gear', size: 17 }),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'mn-icon-btn',
                  title: t('refresh'),
                  'aria-label': t('refresh'),
                  disabled: s.refreshing,
                  onClick: () => void refreshState(false),
                },
                h(Icon, { name: 'refresh', size: 17 }),
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
                'div',
                { className: 'mn-seg', role: 'group', 'aria-label': t('mode'), title: active ? t('modeLocked') : '' },
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
                      'data-variant': 'stop',
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
                      'data-variant': 'danger',
                      'data-size': 'small',
                      disabled: busy === 'cancel',
                      onClick: () => void cancelRecording(),
                    },
                    s.confirmCancel ? t('cancelConfirm') : t('cancel'),
                  )
                : null,
            ),
            h('p', { className: 'mn-hint' }, mode === 'realtime' ? t('modeHintRealtime') : t('modeHintAfter')),
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
                          ? h('span', { className: 'mn-item-flag', title: t('hasMinutes') }, h(Icon, { name: 'doc', size: 14 }))
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
                    'data-variant': 'tonal',
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
                  'button',
                  {
                    type: 'button',
                    className: 'mn-btn',
                    'data-variant': 'danger',
                    'data-size': 'small',
                    disabled: !!busy,
                    title: t('deleteHint'),
                    'aria-label': t('deleteAction'),
                    onClick: () => void deleteMeeting(),
                  },
                  h(Icon, { name: 'trash', size: 14 }),
                  s.confirmDelete ? t('deleteConfirm') : null,
                ),
              ),
            ),
            s.confirmDelete ? h('p', { className: 'mn-hint', style: { color: 'var(--mn-hot)', marginTop: '8px' } }, t('deleteHint')) : null,
            meeting?.status === 'failed' && meeting?.error ? h(Banner, { tone: 'error' }, String(meeting.error)) : null,
            transcoding ? h(Banner, { tone: 'info' }, t('transcribingHint')) : null,
            h(
              'div',
              { className: 'mn-audio' },
              h('span', { className: 'mn-audio-label' }, t('audioTitle')),
              h('audio', { key: meetingId, className: 'mn-audio', controls: true, preload: 'metadata', src: audioSrc }),
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

        function SettingsDialog() {
          const s = useStore();
          const boxRef = React.useRef(null);
          const draft = s.cfgDraft || cfgFrom(s.state?.config);
          const languages = s.state?.provider?.languages || ['auto', 'zh', 'en', 'yue', 'ja', 'ko'];
          const recording = !!s.state?.recording?.active;
          React.useEffect(() => {
            const onKey = (event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                closeSettings();
              }
            };
            window.addEventListener('keydown', onKey);
            const node = boxRef.current;
            const focusable = node ? node.querySelector('input, select, button') : null;
            if (focusable && typeof focusable.focus === 'function') focusable.focus();
            return () => window.removeEventListener('keydown', onKey);
          }, []);
          return h(
            'div',
            {
              className: 'mn-overlay',
              onMouseDown: (event) => {
                if (event.target === event.currentTarget) closeSettings();
              },
            },
            h(
              'div',
              { className: 'mn-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mn-settings-title', ref: boxRef },
              h(
                'div',
                { className: 'mn-dialog-head' },
                h(
                  'div',
                  null,
                  h('h2', { id: 'mn-settings-title' }, t('settings')),
                  h('p', { className: 'mn-dialog-sub' }, t('settingsSubtitle')),
                ),
                h(
                  'button',
                  { type: 'button', className: 'mn-icon-btn', title: t('closeDialog'), 'aria-label': t('closeDialog'), onClick: closeSettings },
                  h(Icon, { name: 'close', size: 16 }),
                ),
              ),
              h(
                'div',
                { className: 'mn-dialog-body' },
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
                        onChange: (event) => editDraft({ storageDir: event.target.value }),
                      }),
                      h('button', { type: 'button', className: 'mn-btn', 'data-size': 'small', onClick: chooseStorageDir }, t('pickDirectory')),
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
                        checked: !!draft.captureSystemAudio,
                        onChange: (event) => editDraft({ captureSystemAudio: event.target.checked }),
                      }),
                      h('span', { className: 'mn-switch-track' }),
                      h('span', null, t('captureSystem')),
                    ),
                    h('p', { className: 'mn-hint', style: { marginTop: '10px' } }, t('captureHint')),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'mn-dialog-foot' },
                h('span', { className: 'mn-foot-note' }, s.cfgDirty ? t('unsavedHint') : ''),
                h(
                  'div',
                  { className: 'mn-foot-actions' },
                  h('button', { type: 'button', className: 'mn-btn', 'data-variant': 'ghost', onClick: closeSettings }, t('dialogCancel')),
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
              s.notice ? h(Banner, { tone: 'info' }, s.notice) : null,
              h('div', { className: 'mn-layout' }, h('aside', { className: 'mn-rail' }, h(RecordPanel), h(MeetingList)), h(DetailPane)),
            ),
            s.settingsOpen ? h(SettingsDialog) : null,
          );
        }
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
