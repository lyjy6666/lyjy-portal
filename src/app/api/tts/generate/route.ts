import { NextRequest, NextResponse } from 'next/server';
import { tts } from 'edge-tts';

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

    const audioBuffer = await tts(text, { voice: edgeVoice, rate: rateStr });

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
