import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '请提供图片数据' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: '请仔细识别这张图片中的所有文字内容，完整准确地输出图片中的文字。只输出识别到的文字内容，不要添加任何解释、说明或格式。如果图片中没有文字，请回复"未识别到文字"。',
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: image,
              detail: 'high' as const,
            },
          },
        ],
      },
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-6-vision-250815',
      temperature: 0.1,
    });

    const text = response.content.trim();

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
