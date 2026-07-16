import { NextRequest, NextResponse } from 'next/server';
import { getVideoById, deleteVideo } from '@/lib/video-store';

// GET - 获取单个视频信息
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const videoId = Number(id);

    if (Number.isNaN(videoId)) {
      return NextResponse.json(
        { error: '无效的视频 ID' },
        { status: 400 }
      );
    }

    const video = getVideoById(videoId);

    if (!video) {
      return NextResponse.json(
        { error: '视频不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('获取视频失败:', error);
    return NextResponse.json(
      { error: '获取视频失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除视频
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const videoId = Number(id);

    if (Number.isNaN(videoId)) {
      return NextResponse.json(
        { error: '无效的视频 ID' },
        { status: 400 }
      );
    }

    const deleted = deleteVideo(videoId);

    if (!deleted) {
      return NextResponse.json(
        { error: '视频不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除视频失败:', error);
    return NextResponse.json(
      { error: '删除视频失败' },
      { status: 500 }
    );
  }
}
