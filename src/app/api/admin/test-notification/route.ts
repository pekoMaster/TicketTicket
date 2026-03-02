import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';
import { sendDiscordDM, isDiscordDMEnabled } from '@/lib/discord-dm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, target, message } = body;

        const results: any = {};

        // 1. 測試 Email (Resend)
        if (type === 'all' || type === 'email') {
            if (!target) {
                results.email = { success: false, error: 'Missing target email address' };
            } else if (!process.env.RESEND_API_KEY) {
                results.email = { success: false, error: 'RESEND_API_KEY is not configured in environment variables' };
            } else {
                console.log(`[Test] Sending test email to ${target}...`);
                const emailResult = await sendVerificationEmail(
                    target,
                    'Test User',
                    'test-token-12345',
                    'zh-TW'
                );
                results.email = emailResult;
            }
        }

        // 2. 測試 Discord DM
        if (type === 'all' || type === 'discord') {
            if (!target) {
                results.discord = { success: false, error: 'Missing target Discord ID' };
            } else if (!isDiscordDMEnabled()) {
                results.discord = { success: false, error: 'DISCORD_BOT_DM_API or SECRET is not configured' };
            } else {
                console.log(`[Test] Sending test Discord DM to ${target}...`);
                const dmSuccess = await sendDiscordDM({
                    discordId: target,
                    title: 'TicketTicket 系統測試',
                    message: message || '這是一封來自 TicketTicket 的測試訊息，如果您看到這個，代表 Discord 通知功能運作正常！',
                    type: 'system'
                });
                results.discord = { success: dmSuccess, error: dmSuccess ? null : 'Failed to send DM (Check Server Logs)' };
            }
        }

        // 3. 測試環境變數狀態 (不印出完整金鑰，只檢查是否存在)
        results.envStatus = {
            hasResendKey: !!process.env.RESEND_API_KEY,
            hasResendFromEmail: !!process.env.RESEND_FROM_EMAIL,
            hasDiscordApi: !!process.env.DISCORD_BOT_DM_API,
            hasDiscordSecret: !!process.env.DISCORD_BOT_DM_SECRET,
        };

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('[Test Notification API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
