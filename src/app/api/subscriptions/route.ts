import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin, DbTicketSubscription } from '@/lib/supabase';

const MAX_SUBSCRIPTIONS = 3;
const COOLDOWN_MINUTES = 5;

// GET /api/subscriptions - 取得用戶訂閱列表
export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.dbId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('ticket_subscriptions')
            .select('*')
            .eq('user_id', session.user.dbId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Subscriptions] Error fetching:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ subscriptions: data || [] });
    } catch (error) {
        console.error('[Subscriptions] Exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/subscriptions - 新增訂閱
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.dbId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { eventId, eventName, seatGrades, maxPriceJpy, ticketTypes, notifyEmail, notifyDiscord, notifyLine } = body;

        // 驗證必填欄位
        if (!eventName) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
        }

        // 至少選擇一種通知方式
        if (!notifyEmail && !notifyDiscord && !notifyLine) {
            return NextResponse.json({ error: 'At least one notification method is required' }, { status: 400 });
        }

        // 檢查用戶訂閱數量上限
        const { count, error: countError } = await supabaseAdmin
            .from('ticket_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.dbId)
            .eq('is_active', true);

        if (countError) {
            console.error('[Subscriptions] Count error:', countError);
            return NextResponse.json({ error: countError.message }, { status: 500 });
        }

        if (count && count >= MAX_SUBSCRIPTIONS) {
            return NextResponse.json({
                error: `Maximum ${MAX_SUBSCRIPTIONS} subscriptions allowed`,
                code: 'MAX_SUBSCRIPTIONS_REACHED'
            }, { status: 400 });
        }

        // 檢查是否已訂閱同一活動
        const { data: existing } = await supabaseAdmin
            .from('ticket_subscriptions')
            .select('id')
            .eq('user_id', session.user.dbId)
            .eq('event_name', eventName)
            .eq('is_active', true)
            .single();

        if (existing) {
            return NextResponse.json({
                error: 'Already subscribed to this event',
                code: 'ALREADY_SUBSCRIBED'
            }, { status: 400 });
        }

        // 如果要使用 Discord 通知，檢查是否已連結
        if (notifyDiscord) {
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('discord_id')
                .eq('id', session.user.dbId)
                .single();

            if (!user?.discord_id) {
                return NextResponse.json({
                    error: 'Discord account not linked',
                    code: 'DISCORD_NOT_LINKED'
                }, { status: 400 });
            }
        }

        // 建立訂閱
        const { data, error } = await supabaseAdmin
            .from('ticket_subscriptions')
            .insert({
                user_id: session.user.dbId,
                event_id: eventId || null,
                event_name: eventName,
                seat_grades: seatGrades || [],
                max_price_jpy: maxPriceJpy || 0,
                ticket_types: ticketTypes || [],
                notify_email: notifyEmail || false,
                notify_discord: notifyDiscord || false,
                notify_line: notifyLine || false,
                is_active: true,
                triggered_count: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('[Subscriptions] Insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[Subscriptions] Created:', data.id);
        return NextResponse.json({ subscription: data }, { status: 201 });
    } catch (error) {
        console.error('[Subscriptions] Exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
