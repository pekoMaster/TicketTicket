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
            console.error('Error creating notification:', error);
            return false;
        }

        // 2. 查詢用戶的 Discord ID 和通知偏好設定
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('discord_id, notification_preferences')
            .eq('id', data.user_id)
            .single();

        if (!user) {
            return true; // 站內通知已創建，用戶不存在跳過 Discord
        }

        // 3. 檢查通知偏好 - Discord DM 是否啟用
        const notifPrefs = user.notification_preferences || {};
        const typePrefs = notifPrefs[data.type as keyof typeof notifPrefs];
        const shouldSendDiscord = typePrefs?.discord ?? false;

        // 4. 如果用戶啟用此類型的 Discord 通知，且有有效的 discord_id，發送 DM
        if (shouldSendDiscord && user.discord_id && /^\d+$/.test(user.discord_id)) {
            const endpoint = process.env.DISCORD_BOT_DM_API;
            const secret = process.env.DISCORD_BOT_DM_SECRET;

            if (endpoint && secret) {
                try {
                    await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${secret}`,
                        },
                        body: JSON.stringify({
                            discordId: user.discord_id,
                            title: data.title,
                            message: data.message,
                            link: data.link || 'https://ticketticket.live',
                            type: data.type,
                        }),
                    });
                    console.log(`[Discord DM] Sent ${data.type} notification to user ${data.user_id}`);
                } catch (dmError) {
                    console.error('[Discord DM] Failed:', dmError);
                    // DM 發送失敗不影響通知功能
                }
            }
        } else {
            console.log(`[Discord DM] Skipped ${data.type} for user ${data.user_id} (preference disabled or no Discord)`);
        }

        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
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
