/**
 * 纪要层：把转写文稿交给 DSH 会话，形成一条「工作区记录」。
 *
 * 这里不调用大模型接口，而是复用 DSH 自己的工作区与会话服务：
 *   1. 把会议存储目录注册成 DSH 工作区（同一路径幂等复用，不会重复出现）；
 *   2. 在该工作区里新建一条会话（左侧工作区树里的一条记录）；
 *   3. 给会话排队一条 prompt，模型会读 transcript.md 并写 minutes.md；
 *   4. 客户端拿到 sessionId 后跳过去，用户可以在同一会话里继续聊。
 */

import { formatClock } from './storage.js';

/** 会议纪要的 prompt：约束输出结构与落盘位置，避免模型自由发挥。 */
export function minutesPrompt(meta) {
  const startedAt = meta.startedAt ? new Date(meta.startedAt) : new Date();
  const id = meta.id;
  const startedText = Number.isNaN(startedAt.getTime())
    ? String(meta.startedAt || '')
    : `${startedAt.toLocaleDateString('zh-CN')} ${startedAt.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
  return [
    '你是一名严谨的会议纪要助手。请把这次会议的转写文稿整理成中文会议纪要。',
    '',
    `会议编号：${id}`,
    `会议标题：${meta.title || id}`,
    `开始时间：${startedText}`,
    `会议时长：${formatClock(meta.durationSec || 0)}`,
    `转写语言：${meta.language || 'zh'}（中文为主，可能夹少量英文术语与原话）`,
    '',
    '请按以下步骤工作：',
    `1. 完整阅读工作区里的 \`${id}/transcript.md\`（这是带时间戳的原始转写，可能有个别识别错误）。`,
    '2. 整理成结构化 Markdown 纪要，包含：会议信息、议题与讨论要点、结论与决议、待办事项（表格列：事项 | 负责人 | 截止时间；原文没提到的写「未提及」）、风险与待确认事项。',
    '3. 保留关键数据、专有名词与英文术语原文；不要编造转写中不存在的内容；识别明显错误时按上下文纠正，但不要改变原意。',
    `4. 把纪要写入 \`${id}/minutes.md\`（只写这一个文件，不要改动音频和转写文稿）。`,
    '5. 在本次回复里给出这份纪要的完整内容，方便我直接查看与继续讨论。',
    '',
    '之后我会在这个会话里继续提问（例如追问某个决定的背景、补充待办、重排优先级），请始终以这份转写和纪要为基础回答。',
  ].join('\n');
}

/**
 * 生成一条会议纪要工作区记录。
 * @param {object} ctx cordis 上下文
 * @param {{ storageDir: string, meta: object }} options
 * @returns {Promise<{ sessionId: string, workspaceId: string, workspacePath: string, title: string }>}
 */
export async function createMinutesRecord(ctx, { storageDir, meta }) {
  const registry = ctx.get('workspaceRegistry');
  const controller = ctx.get('sessionController');
  if (!registry || !controller) {
    throw new Error('DSH 的工作区或会话服务不可用，无法生成会议纪要');
  }

  // 同一个存储目录永远只对应一个工作区，重复点「生成纪要」不会堆出重复工作区。
  const workspace = await registry.create(storageDir, '会议记录');
  // 只传 workspaceId：DSH 不接受 workspaceId 与 cwd 同时给出，会话工作目录即工作区目录。
  const created = await controller.create({ workspaceId: workspace.id });
  const sessionId = created && created.sessionId;
  if (!sessionId) throw new Error('创建纪要会话失败：DSH 没有返回会话编号');

  const title = `纪要 · ${meta.title || meta.id}`;
  try {
    await controller.rename({ sessionId, title });
  } catch {
    // 改名失败不影响纪要生成，标题只是展示用。
  }

  await controller.prompt(
    {
      requestId: `dsh-meeting-notes-${meta.id}-${Date.now().toString(36)}`,
      sessionId,
      mode: 'queue',
      content: [{ type: 'text', text: minutesPrompt(meta) }],
    },
    new AbortController().signal,
  );

  return {
    sessionId,
    workspaceId: workspace.id,
    workspacePath: workspace.path || storageDir,
    title,
  };
}
