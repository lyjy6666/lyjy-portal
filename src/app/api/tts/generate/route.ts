import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { join } from 'path';

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

const PYTHON_SCRIPT = join(process.cwd(), 'scripts', 'tts_bridge.py');

function callPythonTTS(text: string, voice: string, rate: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = JSON.stringify({ text, voice, rate });
    const python = spawn('python', [PYTHON_SCRIPT], { cwd: process.cwd() });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => { stdout += data; });
    python.stderr.on('data', (data) => { stderr += data; });

    python.on('error', (err) => {
      reject(new Error('Python execution failed: ' + err.message));
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stderr:', stderr);
        reject(new Error('Python TTS failed: ' + stderr || 'unknown error'));
        return;
      }
      try {
        const result = JSON.parse(stdout);
        if (result.success && result.audioBase64) {
          resolve(result.audioBase64);
        } else {
          reject(new Error('Invalid Python response'));
        }
      } catch (e) {
        reject(new Error('Failed to parse Python output: ' + e));
      }
    });

    python.stdin.write(input);
    python.stdin.end();
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

    console.log('Edge TTS (Python): voice=' + edgeVoice + ', rate=' + rateStr + ', len=' + text.length);

    const audioBase64 = await callPythonTTS(text, edgeVoice, rateStr);

    return NextResponse.json({
      success: true,
      audioUrl: 'data:audio/mp3;base64,' + audioBase64,
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败，请重试' },
      { status: 500 }
    );
  }
}
