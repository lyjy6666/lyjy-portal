import { NextRequest, NextResponse } from 'next/server';
import { recognizeImage, isEmptyText, friendlyVisionMessage } from '@/lib/aiChain';

/**
 * 通用 OCR（语音/文本工具页在用）。
 * 与作业识别共用同一条模型链：GLM 4.6 Flash → Agnes 3.0 Flash → Agnes 2.5 Flash，
 * 主模型不可用时自动降级，且绝不把上游原文透传给前端。
 */
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return NextResponse.json({ success: false, message: '请提供图片数据' }, { status: 400 });
    }

    const result = await recognizeImage(image, {
      prompt: '请仔细识别这张图片中的所有文字内容，完整准确地输出图片中的文字。只输出识别到的文字内容，不要添加任何解释、说明或格式。如果图片中没有文字，请回复"未识别到文字"。',
      maxTokens: 2048,
    });

    if (result.ok) {
      if (isEmptyText(result.text)) {
        return NextResponse.json({ success: false, message: '未识别到文字，请上传包含文字的图片' });
      }
      return NextResponse.json({ success: true, text: result.text, model: result.model });
    }

    return NextResponse.json({
      success: false,
      code: 'VISION_UNAVAILABLE',
      message: friendlyVisionMessage(result.lastStatus, result.lastRaw),
    });
  } catch (error: unknown) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { success: false, code: 'VISION_UNAVAILABLE', message: 'OCR 服务暂时不可用，请稍后重试' },
      { status: 200 },
    );
  }
}
