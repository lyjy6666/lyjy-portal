import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 免费试用：激活后获得 7 天 VIP 体验
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
      SELECT id, vip_trial_used, vip_expires_at
      FROM users WHERE id = ${userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const user = rows[0];

    if (user.vip_trial_used) {
      return NextResponse.json(
        { success: false, message: '免费试用已使用过，开通 VIP 即可继续使用' },
        { status: 400 }
      );
    }

    // 激活试用：7 天 VIP
    const updated = await sql`
      UPDATE users
      SET vip_trial_used = TRUE,
          vip_expires_at = NOW() + INTERVAL '7 days'
      WHERE id = ${userId}
      RETURNING id, username, vip_expires_at
    `;

    const u = updated[0];
    return NextResponse.json({
      success: true,
      message: '试用激活成功，已获得 7 天 VIP 体验',
      user: {
        id: u.id,
        username: u.username,
        isVip: true,
        vipExpiresAt: u.vip_expires_at,
        trialUsed: true,
      }
    });
  } catch (error) {
    console.error('VIP 试用激活错误:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '激活失败' },
      { status: 500 }
    );
  }
}
