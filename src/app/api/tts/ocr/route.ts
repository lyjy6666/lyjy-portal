import { NextRequest, NextResponse } from 'next/server';

const API_KEY = 'sk-5sA83DFAASHDScmmvQuFxawtCkesKcQomSZlmCgxNloVuIVS';
const BASE_URL = 'https://apihub.agnes-ai.com/v1';
const MODEL = 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '请提供图片数据' },
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
              {
                type: 'text',
                text: '请仔细识别这张图片中的所有文字内容，完整准确地输出图片中的文字。只输出识别到的文字内容，不要添加任何解释、说明或格式。如果图片中没有文字，请回复"未识别到文字"。',
              },
              {
                type: 'image_url',
                image_url: { url: image, detail: 'high' },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      console.error('OCR API error:', response.status);
      return NextResponse.json(
        { success: false, message: 'OCR 服务暂时不可用' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    if (text === '未识别到文字' || !text) {
      return NextResponse.json({
        success: false,
        message: '未识别到文字，请上传包含文字的图片',
      });
    }

    return NextResponse.json({
      success: true,
      text: text,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OCR识别失败';
    console.error('OCR error:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
