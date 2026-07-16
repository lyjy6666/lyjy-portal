import { NextRequest, NextResponse } from 'next/server';
import { getAllVideos, createVideo } from '@/lib/video-store';

// GET - 获取视频列表
export async function GET() {
  try {
    const videos = getAllVideos();
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return NextResponse.json(
      { error: '获取视频列表失败' },
      { status: 500 }
    );
  }
}

// POST - 新建视频
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, description } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: '请输入视频标题' },
        { status: 400 }
      );
    }

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: '请输入视频 URL' },
        { status: 400 }
      );
    }

    const video = createVideo({
      title: title.trim(),
      url: url.trim(),
      description: typeof description === 'string' ? description.trim() : '',
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error('创建视频失败:', error);
    return NextResponse.json(
      { error: '创建视频失败' },
      { status: 500 }
    );
  }
}
