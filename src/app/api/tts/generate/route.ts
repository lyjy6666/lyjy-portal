import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';
import { randomUUID } from 'crypto';

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

const EDGE_TTS_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const EDGE_TTS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=' + EDGE_TTS_TOKEN;

function tts(text: string, voice: string, rate: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const connectionId = randomUUID().replaceAll('-', '');
    const ws = new WebSocket(EDGE_TTS_URL + '&ConnectionId=' + connectionId, {
      host: 'speech.platform.bing.com',
      origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44',
      },
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

    const timestamp = new Date().toString();
    const speechConfig = JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
            outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
          },
        },
      },
    });

    const configMessage = 'X-Timestamp:' + timestamp + '\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n' + speechConfig;

    ws.on('open', () => {
      ws.send(configMessage, { compress: true }, (configError) => {
        if (configError) {
          clearTimeout(timeout);
          reject(configError);
          return;
        }

        const requestId = randomUUID().replaceAll('-', '');
        const ssmlMessage =
          'X-RequestId:' + requestId + '\r\n' +
          'Content-Type:application/ssml+xml\r\n' +
          'X-Timestamp:' + timestamp + 'Z\r\n' +
          'Path:ssml\r\n\r\n' +
          '<speak version=\'1.0\' xmlns=\'http://www.w3.org/2001/10/synthesis\' xml:lang=\'zh-CN\'>' +
          '<voice name=\'' + voice + '\'><prosody pitch=\'+0Hz\' rate=\'' + rate + '\' volume=\'+0%\'>' +
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
