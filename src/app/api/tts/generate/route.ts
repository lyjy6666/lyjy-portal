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
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

// Windows 文件时间基准（秒）
const WIN_EPOCH_SECONDS = 11644473600;
const S_TO_100NS = 10_000_000; // 1 秒 = 10^7 个 100 纳秒间隔

// 生成 Sec-MS-GEC 鉴权参数
// 参考: edge-tts Python 包 drm.py
function generateSecMsGec(): string {
  // 当前 Unix 时间戳（秒）
  let ticks = Math.floor(Date.now() / 1000);
  // 转为 Windows 文件时间（秒）
  ticks += WIN_EPOCH_SECONDS;
  // 向下取整到 5 分钟边界
  ticks -= ticks % 300;
  // 转为 100 纳秒间隔
  ticks *= S_TO_100NS;
  // 哈希格式: "{ticks}{TOKEN}" — 注意 TOKEN 在后面！
  const strToHash = `${ticks}${EDGE_TTS_TOKEN}`;
  return createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
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
