import { NextRequest, NextResponse } from 'next/server';

// 4.0 Bot API 設定
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_SECRET = process.env.DM_API_SECRET || 'ticketticket-dm-secret-2026';

/**
 * GET /api/verify-yt/check?token=xxx
 * 檢查驗證 Token 是否有效
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json(
            { error: '缺少 token 參數' },
            { status: 400 }
        );
    }

    try {
        // 向 4.0 Bot API 查詢 Token 資料
        const response = await fetch(`${BOT_API_URL}/api/yt-membership/verify/${token}`, {
            headers: {
                'Authorization': `Bearer ${BOT_API_SECRET}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || '驗證連結無效或已過期' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            ytChannelName: data.ytChannelName,
            discordUserId: data.discordUserId
        });

    } catch (error) {
        console.error('[verify-yt/check] Error:', error);
        return NextResponse.json(
            { error: '無法連接驗證伺服器' },
            { status: 500 }
        );
    }
}
