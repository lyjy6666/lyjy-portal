import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';
import { randomUUID, createHash, randomBytes } from 'crypto';

const VOICE_MAP: Record<string, string> = {
  'xiaoxiao': 'zh-CN-XiaoxiaoNeural',
  'xiaoyi': 'zh-CN-XiaoyiNeural',
  'xiaobei': 'zh-CN-liaoning-XiaobeiNeural',
  'xiaoni': 'zh-CN-shaanxi-XiaoniNeural',
  'hiugaai': 'zh-HK-HiuGaaiNeural',
  'hiumaan': 'zh-HK-HiuMaanNeural',
  'hsiaochen': 'zh-TW-HsiaoChenNeural',
  'hsiaoyu': 'zh-TW-HsiaoYuNeural',
  'yunjian': 'zh-CN-YunjianNeural',
  'yunxi': 'zh-CN-YunxiNeural',
  'yunxia': 'zh-CN-YunxiaNeural',
  'yunyang': 'zh-CN-YunyangNeural',
  'wanlung': 'zh-HK-WanLungNeural',
  'yunjhe': 'zh-TW-YunJheNeural',
};

// Edge TTS 常量（与 edge-tts Python 包 v7.x 保持一致）
const EDGE_TTS_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const EDGE_TTS_BASE = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0];
// 微软 2026-10 起要求 v2 令牌，v1 握手直接 403
const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;

// Windows 文件时间基准（秒）
const WIN_EPOCH_SECONDS = 11644473600n;
const PREFIX = Buffer.from(
  ['Q29weXJpZ2h0IChDKSBNaWNyb3NvZnQg', 'Q29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQu'].join(''),
  'base64'
);
const COEFFICIENTS: [number, number][] = [
  [0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038],
  [0xC89C5933, 0xB328CBDF], [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C],
  [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB], [0x06064CF3, 0xFA51A3DA],
  [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61],
  [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167],
];

const mul = Math.imul;
const rol16 = (x: number) => ((x << 16) | (x >>> 16)) >>> 0;

/** v2 令牌的 CS64 摘要，逐行对齐 edge-tts 7.3.x / node-edge-tts 1.2.12 */
function cs64Digest(data: Buffer, shaDigest: Buffer): Buffer {
  const keyA = (shaDigest.readUInt32LE(0) | 1) >>> 0;
  const keyB = (shaDigest.readUInt32LE(4) | 1) >>> 0;
  const factors = [mul(keyA, 0x82893933) >>> 0, mul(keyB, 0x82893933) >>> 0];
  const terms = COEFFICIENTS.map(([c], i) => mul(c, factors[i % 2]) >>> 0);
  const offsets = COEFFICIENTS.map(([, o]) => o);

  const padded = Buffer.alloc(Math.ceil((data.length + 1) / 8) * 8);
  padded.set(data, 1);
  for (let i = 0; i < padded.length / 4; i++) {
    const word = padded.readUInt32LE(i * 4);
    let term = mul(word, i % 2 === 0 ? keyA : keyB);
    let offset = mul(rol16(word), i % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
    if (i === 0) {
      term = (term + mul(0xF2F90B1A, factors[0])) >>> 0;
      offset = (offset + 0x0B1A0000) >>> 0;
    }
    terms.push(term >>> 0);
    offsets.push(offset >>> 0);
  }

  let swapAcc = 0;
  let swapLast = 0;
  let state = 0;
  let acc = 0;
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i];
    const y = terms[i + 1];
    let t = rol16((offsets[i] + x) >>> 0);
    let q = mul(t, 0x76F50F34);
    swapAcc += (mul(rol16(q), 0xC3EFEA97) + q) >>> 0;
    t = rol16((offsets[i + 1] + y) >>> 0);
    q = mul(t, 0x1881CE3C);
    swapLast = (mul(rol16(q), 0x35BD1EC9) + q) >>> 0;
    swapAcc = (swapAcc + swapLast) >>> 0;

    state = (mul(state, keyA) + x) >>> 0;
    for (const k of [0xCF98B111, 0x87085B9F, 0x12CEB96D, 0x257E1D83]) {
      state = mul(rol16(state), k) >>> 0;
    }
    acc += state;
    t = (mul(state, keyB) + y) >>> 0;
    t = mul(rol16(t), 0xA27416F5) >>> 0;
    t = mul(rol16(t), 0xD38396FF) >>> 0;
    state = mul(rol16(mul(rol16(t), 0x7C932B89)), 0xBFA49F69) >>> 0;
    acc = (acc + state) >>> 0;
  }

  const result = Buffer.allocUnsafe(8);
  result.writeUInt32LE((swapLast ^ state) >>> 0, 0);
  result.writeUInt32LE((swapAcc ^ acc) >>> 0, 4);
  return result;
}

/** Sec-MS-GEC v2：CS64-SHA256 格式 */
function generateSecMsGec(): string {
  const epochSeconds = BigInt(Math.floor(Date.now() / 1000)) + WIN_EPOCH_SECONDS;
  const roundedSeconds = epochSeconds - (epochSeconds % 300n);
  const ticks = roundedSeconds * 10000000n;
  const data = Buffer.from(`${ticks}${EDGE_TTS_TOKEN}`, 'ascii');
  const sha = createHash('sha256').update(PREFIX).update(data).digest();
  return `${cs64Digest(data, sha).toString('hex').toUpperCase()}-${sha.toString('hex').toUpperCase()}`;
}

// 生成随机 MUID
function generateMuid(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

function buildEdgeTtsUrl(connectionId: string): string {
  const secMsGec = generateSecMsGec();
  return (
    `${EDGE_TTS_BASE}?TrustedClientToken=${EDGE_TTS_TOKEN}` +
    `&ConnectionId=${connectionId}` +
    `&Sec-MS-GEC=${secMsGec}` +
    `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`
  );
}

function tts(text: string, voice: string, rate: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const connectionId = randomUUID().replaceAll('-', '');
    const muid = generateMuid();
    const url = buildEdgeTtsUrl(connectionId);

    const ws = new WebSocket(url, {
      host: 'speech.platform.bing.com',
      origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      headers: {
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Cookie': `muid=${muid};`,
        'Sec-WebSocket-Version': '13',
      },
      // 启用 permessage-deflate 压缩
      perMessageDeflate: true,
    });

    const audioData: Buffer[] = [];
    const timeout = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('TTS 请求超时'));
    }, 30000);

    ws.on('message', (rawData: Buffer, isBinary: boolean) => {
      if (!isBinary) {
        const dataStr = rawData.toString('utf8');
        if (dataStr.includes('turn.end')) {
          clearTimeout(timeout);
          resolve(Buffer.concat(audioData));
          ws.close();
        }
        return;
      }
      const separator = 'Path:audio\r\n';
      const idx = rawData.indexOf(separator);
      if (idx !== -1) {
        audioData.push(rawData.subarray(idx + separator.length));
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    // 时间戳格式与 Python 包一致
    const timestamp = new Date().toUTCString();
    const speechConfig = JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
            outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
          },
        },
      },
    });

    const configMessage =
      `X-Timestamp:${timestamp}\r\n` +
      'Content-Type:application/json; charset=utf-8\r\n' +
      'Path:speech.config\r\n\r\n' +
      speechConfig;

    ws.on('open', () => {
      ws.send(configMessage, { compress: true }, (configError) => {
        if (configError) {
          clearTimeout(timeout);
          reject(configError);
          return;
        }

        const requestId = randomUUID().replaceAll('-', '');
        // SSML 格式与 Python 包一致
        const ssmlMessage =
          `X-RequestId:${requestId}\r\n` +
          'Content-Type:application/ssml+xml\r\n' +
          `X-Timestamp:${timestamp}Z\r\n` +
          'Path:ssml\r\n\r\n' +
          '<speak version=\'1.0\' xmlns=\'http://www.w3.org/2001/10/synthesis\' xml:lang=\'zh-CN\'>' +
          `<voice name='${voice}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>` +
          text +
          '</prosody></voice></speak>';

        ws.send(ssmlMessage, { compress: true }, (ssmlError) => {
          if (ssmlError) {
            clearTimeout(timeout);
            reject(ssmlError);
          }
        });
      });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice, speechRate } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: '文本内容不能为空' }, { status: 400 });
    }

    const edgeVoice = VOICE_MAP[voice] || 'zh-CN-XiaoxiaoNeural';
    const ratePercent = Math.max(-50, Math.min(100, speechRate || 0));
    const rateStr = ratePercent >= 0 ? '+' + ratePercent + '%' : ratePercent + '%';

    console.log('Edge TTS: voice=' + edgeVoice + ', rate=' + rateStr + ', len=' + text.length);

    const audioBuffer = await tts(text, edgeVoice, rateStr);

    return NextResponse.json({
      success: true,
      audioUrl: 'data:audio/mp3;base64,' + audioBuffer.toString('base64'),
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败，请重试' },
      { status: 500 }
    );
  }
}
