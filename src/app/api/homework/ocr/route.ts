import { NextRequest, NextResponse } from 'next/server';

// 智谱 GLM-4V-Flash（永久免费多模态视觉模型，OCR 准确率远高于 tesseract.js）
const API_KEY = '4a11e71ff94a4534ac0126fe4ca0851d.P3s9sA1aB25cIb6u';
const BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const MODEL = 'glm-4v-flash';

// GLM-4V-Flash 限制：单张图片 5MB 以下，像素不超过 6000*6000
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const OCR_PROMPT = `你是一个高精度的 OCR 识别引擎。请仔细识别图片中的所有文字内容，包括题目、学生作答、标点符号、数学符号、公式等。

输出要求：
1. 完整准确地输出图片中的所有文字，保持原文的换行和段落结构
2. 数学公式用 LaTeX 语法输出（如 $x^2 + y^2 = r^2$）
3. 分数用 a/b 形式表示（如 3/4）
4. 选择题保留题号和选项字母
5. 填空题用 ____ 表示空格
6. 只输出识别到的文字内容，不要添加任何解释、说明或额外格式
7. 如果图片中没有文字，请回复"未识别到文字"`;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, message: '请提供图片数据' },
        { status: 400 }
      );
    }

    // 校验 base64 图片前缀
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, message: '图片格式错误，请上传有效的图片' },
        { status: 400 }
      );
    }

    // 校验图片大小（base64 字符串长度约为实际字节数的 4/3）
    const base64Data = image.split(',')[1] || '';
    const estimatedBytes = Math.floor(base64Data.length * 3 / 4);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: `图片太大（${(estimatedBytes / 1024 / 1024).toFixed(1)}MB），请上传 5MB 以下的图片`,
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: OCR_PROMPT },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('GLM-4V OCR API error:', response.status, errText);
      // 解析智谱 API 的错误信息，返回给前端更有用的提示
      let detail = `OCR 服务暂时不可用（${response.status}）`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          detail = errJson.error.message;
        }
      } catch {}
      return NextResponse.json(
        { success: false, message: detail },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    if (!text || text === '未识别到文字') {
      return NextResponse.json({
        success: false,
        message: '未识别到文字，请上传包含清晰文字的图片',
      });
    }

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OCR 识别失败';
    console.error('Homework OCR error:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

