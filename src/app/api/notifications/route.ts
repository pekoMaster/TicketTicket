import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { NotificationType } from '@/types';


interface NotificationData {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

// Helper: 創建通知（根據用戶偏好發送 Discord DM）
export async function createNotification(data: NotificationData) {
    try {
        // 1. 創建網站通知（站內通知永遠創建）
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert(data);

        if (error) {
            console.error('[Notification] Error creating DB record:', error);
            // 即使 DB 失敗，我們仍嘗試發送外部通知嗎？通常不需要，因為這是主要記錄。
            // 但為了確保可靠性，如果主要是為了通知，可以繼續。
            // 這裡保持原邏輯，失敗則返回。
            return false;
        }

        // 2. 查詢用戶的外部帳號資訊與偏好
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('discord_id, line_id, notification_preferences')
            .eq('id', data.user_id)
            .single();

        if (!user) {
            console.warn(`[Notification] User ${data.user_id} not found, skipping external notifications.`);
            return true;
        }

        const { DEFAULT_NOTIFICATION_PREFERENCES } = await import('@/types');
        // 合併用戶設定與預設值
        const notifPrefs = {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...(user.notification_preferences || {})
        };
        const typePrefs = notifPrefs[data.type as keyof typeof notifPrefs];

        console.log(`[Notification] Dispatching ${data.type} for user ${data.user_id}. Prefs:`, typePrefs);

        // --- Discord Notification ---
        // 檢查偏好與 Discord ID
        const discordEnabled = typePrefs?.discord ?? false;
        if (discordEnabled && user.discord_id) {
            console.log(`[Notification] Attempting Discord DM to ${user.discord_id}`);
            try {
                // 動態導入以避免循環依賴（如果有的話），且確保使用最新環境變數
                const { sendDiscordDM } = await import('@/lib/discord-dm');

                const sent = await sendDiscordDM({
                    discordId: user.discord_id,
                    title: data.title,
                    message: data.message,
                    link: data.link || 'https://ticketticket.live', // TODO: 使用環境變數中的 BASE_URL
                    type: data.type as any
                });

                if (sent) {
                    console.log(`[Notification] Discord DM sent successfully.`);
                } else {
                    console.error(`[Notification] Discord DM failed to send.`);
                }
            } catch (err) {
                console.error(`[Notification] Error sending Discord DM:`, err);
            }
        } else {
            console.log(`[Notification] Skipped Discord: Enabled=${discordEnabled}, HasDistordId=${!!user.discord_id}`);
        }

        // --- LINE Notification (Placeholder) ---
        const lineEnabled = typePrefs?.line ?? false;
        if (lineEnabled && user.line_id) {
            // 目前尚未實作 LINE Bot 發送邏輯
            console.log(`[Notification] LINE notification requested but not implemented yet. User: ${user.line_id}`);
        }

        return true;
    } catch (error) {
        console.error('[Notification] Critical error in createNotification:', error);
        return false;
    }
}


// GET: 取得當前用戶的通知列表
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // 取得通知列表
        const { data: notifications, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.dbId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        // 取得未讀數量
        const { count: unreadCount, error: countError } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.dbId)
            .eq('is_read', false);

        if (countError) {
            console.error('Error counting unread:', countError);
        }

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
        });
    } catch (error) {
        console.error('Error in notifications GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: 批次標記為已讀
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { markAll, ids } = body;

        if (markAll) {
            // 全部標為已讀
            const { error } = await supabaseAdmin
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', session.user.dbId)
                .eq('is_read', false);

            if (error) {
                console.error('Error marking all as read:', error);
                return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
            }
        } else if (ids && Array.isArray(ids)) {
            // 指定 ID 標為已讀
            const { error } = await supabaseAdmin
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', session.user.dbId)
                .in('id', ids);

            if (error) {
                console.error('Error marking as read:', error);
                return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in notifications PUT:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
