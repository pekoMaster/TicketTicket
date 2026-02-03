import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// 設定
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_SECRET = process.env.DM_API_SECRET || 'ticketticket-dm-secret-2026';

/**
 * POST /api/verify-yt/complete
 * 完成 YouTube 會員驗證
 */
export async function POST(request: NextRequest) {
    try {
        const { code, token } = await request.json();

        if (!code || !token) {
            return NextResponse.json(
                { error: '缺少必要參數' },
                { status: 400 }
            );
        }

        // 1. 先向 Bot API 取得驗證資料
        const verifyResponse = await fetch(`${BOT_API_URL}/api/yt-membership/verify/${token}`, {
            headers: { 'Authorization': `Bearer ${BOT_API_SECRET}` }
        });

        if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            return NextResponse.json(
                { error: errorData.error || '驗證連結無效或已過期', code: 'INVALID_TOKEN' },
                { status: 400 }
            );
        }

        const verificationData = await verifyResponse.json();
        const { verificationVideoId } = verificationData;

        // 2. 使用 code 交換 access token
        const redirectUri = `${request.nextUrl.origin}/verify-yt/callback`;

        const oauth2Client = new google.auth.OAuth2(
            YOUTUBE_CLIENT_ID,
            YOUTUBE_CLIENT_SECRET,
            redirectUri
        );

        let tokens;
        try {
            const tokenResponse = await oauth2Client.getToken(code);
            tokens = tokenResponse.tokens;
        } catch (tokenError: any) {
            console.error('[verify-yt/complete] Token exchange error:', tokenError);
            return NextResponse.json(
                { error: '授權碼無效或已過期，請重新驗證', code: 'TOKEN_ERROR' },
                { status: 400 }
            );
        }

        oauth2Client.setCredentials(tokens);

        // 3. 取得用戶的 YouTube 頻道資訊
        const youtube = google.youtube('v3');
        let userChannel;

        try {
            const channelResponse = await youtube.channels.list({
                auth: oauth2Client,
                part: ['snippet'],
                mine: true
            });

            userChannel = channelResponse.data.items?.[0];
        } catch (channelError) {
            console.error('[verify-yt/complete] Channel fetch error:', channelError);
            // 繼續執行，頻道資訊非必要
        }

        // 4. 嘗試讀取會員專屬影片的留言（核心驗證邏輯）
        let isMember = false;

        try {
            const commentResponse = await youtube.commentThreads.list({
                auth: oauth2Client,
                part: ['snippet'],
                videoId: verificationVideoId,
                maxResults: 1
            });

            // 如果能成功取得留言，表示是會員
            isMember = true;
            console.log(`[verify-yt/complete] 會員驗證成功: ${userChannel?.snippet?.title || 'unknown'}`);

        } catch (commentError: any) {
            // 403 = 沒有權限（非會員）
            if (commentError.code === 403 || commentError.status === 403) {
                console.log(`[verify-yt/complete] 非會員: ${userChannel?.snippet?.title || 'unknown'}`);
                isMember = false;
            } else {
                console.error('[verify-yt/complete] Comment fetch error:', commentError);
                // 其他錯誤，嘗試備用驗證方法
                isMember = false;
            }
        }

        // 5. 通知 Bot API 驗證結果
        const completeResponse = await fetch(`${BOT_API_URL}/api/yt-membership/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOT_API_SECRET}`
            },
            body: JSON.stringify({
                token,
                youtubeChannelId: userChannel?.id || null,
                youtubeChannelName: userChannel?.snippet?.title || null,
                isMember
            })
        });

        const completeData = await completeResponse.json();

        if (!isMember) {
            return NextResponse.json({
                success: false,
                error: '您不是該頻道的會員',
                code: 'NOT_MEMBER',
                message: '無法驗證您的會員身份。如果您確定已加入會員，請確認使用的是正確的 Google 帳號。'
            });
        }

        return NextResponse.json({
            success: true,
            youtubeChannelId: userChannel?.id,
            youtubeChannelName: userChannel?.snippet?.title,
            roleGranted: completeData.roleGranted
        });

    } catch (error: any) {
        console.error('[verify-yt/complete] Error:', error);
        return NextResponse.json(
            { error: error.message || '驗證過程發生錯誤' },
            { status: 500 }
        );
    }
}
