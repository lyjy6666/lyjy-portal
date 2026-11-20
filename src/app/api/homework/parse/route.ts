import { NextRequest, NextResponse } from 'next/server';
import { requireHomeworkUser } from '@/lib/homeworkAuth';
import { parseHomeworkText } from '@/lib/homeworkParse';

/**
 * 只解析、不入库：Pro 版「AI 一句话 / 拍照记作业」的结构化预览用。
 * 用户在弹窗里确认后才调用 POST /api/homework/tasks 真正写入。
 */
export async function POST(request: NextRequest) {
  try {
    if (!requireHomeworkUser(request)) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const { text } = await request.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: '请输入内容' }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: '内容太长，请精简到 2000 字以内' }, { status: 400 });
    }
    const result = await parseHomeworkText(text);
    return NextResponse.json({ items: result.items.slice(0, 30), source: result.source });
  } catch (error) {
    console.error('parse homework failed:', error);
    return NextResponse.json({ error: '解析失败，请重试' }, { status: 500 });
  }
}
