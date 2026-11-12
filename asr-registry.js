// ASR 门面：把「插件自带的识别引擎」和「DSH 语音插件提供的 provider」合并成
// 一个与 DSH speechToText 同形的对象，供 asr.js 的选择/准备/转写逻辑使用。
//
// 依赖方向：插件自带 SenseVoice + Qwen3-ASR 是主来源，永远存在；DSH 的
// speechToText 是可选增强，未启用时只是少几行模型，不会让模型列表变空。
//
// 同名 id 的优先级：自带 provider > 失败占位 > DSH 的 provider。原因是自带实现
// 用的是本插件自己的下载/校验/状态机，设置页展示与「使用该模型」必须指向它。
const OWN_SOURCE = 'plugin';
const DSH_SOURCE = 'dsh';

/** 构造门面。providers 是插件自建的 provider 实例，failures 是创建失败的占位信息。 */
export function createAsrRegistry({ providers = [], failures = [], dsh = () => undefined } = {}) {
  const own = new Map();
  for (const provider of providers) own.set(provider.info.id, provider);
  const failed = new Map();
  for (const failure of failures) failed.set(failure.id, failure);

  function dshService() {
    try {
      return dsh() || null;
    } catch {
      return null;
    }
  }

  function remoteProviders() {
    const service = dshService();
    if (!service) return [];
    try {
      const list = service.listProviders();
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function remoteProvider(id) {
    return remoteProviders().find((item) => item.id === id) || null;
  }

  function dshSnapshotProviders() {
    const service = dshService();
    if (!service) return [];
    try {
      const snapshot = service.snapshot();
      return Array.isArray(snapshot?.providers) ? snapshot.providers : [];
    } catch {
      return [];
    }
  }

  function listProviders() {
    const list = [...own.values()].map((provider) => provider.info);
    for (const failure of failed.values()) list.push(failure.info);
    for (const info of remoteProviders()) {
      if (own.has(info.id) || failed.has(info.id)) continue;
      list.push(info);
    }
    return list;
  }

  function snapshot() {
    const providers = [...own.values()].map((provider) => ({
      ...provider.info,
      source: OWN_SOURCE,
      preparation: provider.preparation?.snapshot() || { phase: 'ready' },
    }));
    for (const failure of failed.values()) {
      providers.push({
        ...failure.info,
        source: OWN_SOURCE,
        preparation: { phase: 'failed', message: failure.message },
      });
    }
    for (const view of dshSnapshotProviders()) {
      if (own.has(view.id) || failed.has(view.id)) continue;
      providers.push({
        ...view,
        source: DSH_SOURCE,
        preparation: view.preparation || { phase: 'ready' },
      });
    }
    return { providers };
  }

  function ownProvider(id) {
    return own.get(id);
  }

  function failureFor(id) {
    return failed.get(id);
  }

  function prepare(id, options) {
    const provider = own.get(id);
    if (provider) return provider.preparation.prepare(options);
    const failure = failed.get(id);
    if (failure) throw new Error(failure.message);
    const service = dshService();
    if (service && remoteProvider(id)) return service.prepare(id, options);
    throw new Error(`Speech provider is unavailable: ${id}`);
  }

  function cancelPreparation(id) {
    const provider = own.get(id);
    if (provider) return provider.preparation.cancel();
    if (failed.has(id)) return undefined;
    const service = dshService();
    if (service && remoteProvider(id)) {
      if (typeof service.cancelPreparation !== 'function') throw new Error('当前语音识别服务不支持取消准备');
      return service.cancelPreparation(id);
    }
    throw new Error(`Speech provider is unavailable: ${id}`);
  }

  function resolve({ providerId, language, audio } = {}) {
    const provider = providerId ? own.get(providerId) : undefined;
    if (provider) {
      const languages = provider.info.languages || [];
      if (language && languages.length > 0 && !languages.includes(language)) {
        throw new Error(`Speech language is unsupported: ${language}`);
      }
      return { provider, audio, language };
    }
    const failure = providerId ? failed.get(providerId) : undefined;
    if (failure) throw new Error(failure.message);
    const service = dshService();
    if (!service) throw new Error(`Speech provider is unavailable: ${providerId}`);
    return service.resolve({ providerId, language, audio });
  }

  function transcribe(spec, signal) {
    if (spec?.provider && own.get(spec.provider.info.id) === spec.provider) {
      return spec.provider.transcribe({ audio: spec.audio, language: spec.language }, signal);
    }
    const service = dshService();
    if (!service) throw new Error('没有可用的本地语音识别服务');
    return service.transcribe(spec, signal);
  }

  async function dispose() {
    await Promise.allSettled([...own.values()].map((provider) => provider.dispose()));
  }

  return {
    listProviders,
    snapshot,
    prepare,
    cancelPreparation,
    resolve,
    transcribe,
    dispose,
    ownProvider,
    failureFor,
    dshAvailable: () => Boolean(dshService()),
  };
}
