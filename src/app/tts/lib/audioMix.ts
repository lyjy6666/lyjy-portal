// 语音 + 背景音乐真混音导出：复用 AudioEditor 的 16-bit PCM WAV 编码思路，
// 使用 OfflineAudioContext 解码并离线渲染，输出单文件 WAV。

export interface MixExportOptions {
  voiceUrl: string;   // data:audio/mp3;base64,...（Edge TTS 结果）
  bgmUrl: string;     // 用户上传的 objectURL 或默认远程 URL
  voiceVolume: number; // 0-100，与页面"语音音量"滑块一致
  bgmVolume: number;   // 0-100，与页面"背景音量"滑块一致
  startSec: number;    // 语音播放起始位置（currentTime）
}

/** 跨域/损坏的 BGM 解码失败会被翻译成明确提示，不会静默导出"只有语音"。 */
export async function exportMixedWav(opts: MixExportOptions): Promise<Blob> {
  const { voiceUrl, bgmUrl, voiceVolume, bgmVolume, startSec } = opts;

  // 用一个轻量 OfflineAudioContext 仅做解码（无需播放设备）
  const decodeCtx = new OfflineAudioContext(2, 1, 44100);

  let voice: AudioBuffer;
  try {
    voice = await decodeAudioFromUrl(decodeCtx, voiceUrl);
  } catch {
    throw new Error('语音音频解码失败，请重新生成后再导出混音');
  }

  let bgm: AudioBuffer;
  try {
    bgm = await decodeAudioFromUrl(decodeCtx, bgmUrl);
  } catch {
    throw new Error('该背景音乐不支持混音导出，可先上传本地音频');
  }

  const sampleRate = voice.sampleRate;
  const start = Math.max(0, Math.min(startSec, voice.duration));
  const duration = voice.duration - start;
  if (duration <= 0) {
    throw new Error('当前语音没有可导出的内容，请从头播放后再试');
  }

  const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

  const voiceGain = ctx.createGain();
  voiceGain.gain.value = clamp01(voiceVolume / 100);
  voiceGain.connect(ctx.destination);
  const voiceSource = ctx.createBufferSource();
  voiceSource.buffer = voice;
  voiceSource.connect(voiceGain);
  voiceSource.start(0, start);

  if (bgmVolume > 0 && bgm.duration > 0) {
    const bgmGain = ctx.createGain();
    bgmGain.gain.value = clamp01(bgmVolume / 100);
    bgmGain.connect(ctx.destination);
    const bgmSource = ctx.createBufferSource();
    bgmSource.buffer = bgm;
    bgmSource.loop = true; // 与页面 BGM 的 loop 行为一致
    bgmSource.connect(bgmGain);
    bgmSource.start(0, start % bgm.duration);
  }

  const mixed = await ctx.startRendering();
  const wav = audioBufferToWav(mixed);
  return new Blob([wav], { type: 'audio/wav' });
}

async function decodeAudioFromUrl(ctx: BaseAudioContext, url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('音频请求失败: ' + res.status);
  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength === 0) throw new Error('音频数据为空');
  return await ctx.decodeAudioData(arrayBuffer);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

// ============ AudioBuffer 转 WAV（与 AudioEditor 编码方式一致）============
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i] || 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
