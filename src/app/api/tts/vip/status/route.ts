import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 查询用户 VIP 状态
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '缺少用户 ID' },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, username, vip_trial_used, vip_expires_at
      FROM users WHERE id = ${userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const user = rows[0];
    const exp = user.vip_expires_at ? new Date(user.vip_expires_at).getTime() : 0;
    const isVip = exp > Date.now();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isVip,
        vipExpiresAt: user.vip_expires_at,
        trialUsed: user.vip_trial_used || false,
      }
    });
  } catch (error) {
    console.error('VIP 状态查询错误:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
}
