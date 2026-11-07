import { NextRequest, NextResponse } from 'next/server';
import { requireHomeworkUser } from '@/lib/homeworkAuth';
import {
  recognizeImage,
  isEmptyText,
  friendlyVisionMessage,
  VISION_CHAIN,
} from '@/lib/aiChain';

// 单张图片 5MB 以下
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const OCR_PROMPT = `你是一个高精度的 OCR 识别引擎。请仔细识别图片中的所有文字内容，包括题目、学生作答、标点符号、数学符号、公式等。

输出要求：
1. 完整准确地输出图片中的所有文字，保持原文的换行和段落结构
2. 数学公式用 LaTeX 语法输出（如 $x^2 + y^2 = r^2$）
3. 分数用 a/b 形式表示（如 3/4）
4. 选择题保留题号和选项字母
5. 填空题用 ____ 表示空格
6. 只输出识别到的文字内容，不要添加任何解释、说明或额外格式
7. 如果图片中没有文字，请回复"未识别到文字"`;

/** 未配置任何识别通道时给前端的统一回复 */
function unavailable(message: string) {
  return NextResponse.json(
    { success: false, code: 'VISION_UNAVAILABLE', message, fallback: 'manual' },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!requireHomeworkUser(request)) {
      return NextResponse.json({ success: false, message: '请先登录后再使用图片识别' }, { status: 401 });
    }

    if (!VISION_CHAIN.some((m) => Boolean(m.apiKey))) {
      return unavailable('图片识别通道尚未配置，可直接输入文字');
    }

    const body = await request.json();
    const { image, fast } = body;
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return NextResponse.json({ success: false, message: '请上传有效的图片' }, { status: 400 });
    }
    const base64Data = image.split(',')[1] || '';
    const estimatedBytes = Math.floor((base64Data.length * 3) / 4);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: `图片太大（${(estimatedBytes / 1024 / 1024).toFixed(1)}MB），请上传 5MB 以下的图片`,
        },
        { status: 400 },
      );
    }

    // 默认：Agnes 3.0 → Agnes 2.5 → GLM 4.6V → GLM-4V（稳，但慢）
    // 快速模式：GLM 4.6V → Agnes 2.5 → Agnes 3.0（快，约 1 秒出字）
    const result = await recognizeImage(image, { prompt: OCR_PROMPT, maxTokens: 2048, fast: fast === true });

    if (result.ok) {
      if (isEmptyText(result.text)) {
        return NextResponse.json({
          success: false,
          message: '未识别到文字，请上传包含清晰文字的图片',
          model: result.model,
        });
      }
      // 记录一下是否降级过，方便线上排查到底哪条通道在跑
      if (result.attempts.length > 1) {
        console.warn(
          `[ocr] 已降级到 ${result.model}；失败通道：${result.attempts
            .filter((a) => !a.ok)
            .map((a) => `${a.id}(${a.status || a.reason || 'err'})`)
            .join(', ')}`,
        );
      }
      return NextResponse.json({ success: true, text: result.text, model: result.model });
    }

    // 全部通道失败：不透传上游原文（避免出现「余额不足」这类误导文案）
    return unavailable(friendlyVisionMessage(result.lastStatus, result.lastRaw));
  } catch (error: unknown) {
    console.error('Homework OCR error:', error);
    return unavailable('图片识别暂时不可用，请直接输入文字');
  }
}
