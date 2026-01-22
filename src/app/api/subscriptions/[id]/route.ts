import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// PUT /api/subscriptions/[id] - 更新訂閱
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.dbId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { seatGrades, maxPriceJpy, ticketTypes, notifyEmail, notifyDiscord, notifyLine, isActive } = body;

        // 驗證訂閱屬於該用戶
        const { data: existing } = await supabaseAdmin
            .from('ticket_subscriptions')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        if (existing.user_id !== session.user.dbId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 至少選擇一種通知方式
        const hasNotify = (notifyEmail ?? true) || (notifyDiscord ?? false) || (notifyLine ?? false);
        if (!hasNotify) {
            return NextResponse.json({ error: 'At least one notification method is required' }, { status: 400 });
        }

        // 更新訂閱
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (seatGrades !== undefined) updates.seat_grades = seatGrades;
        if (maxPriceJpy !== undefined) updates.max_price_jpy = maxPriceJpy;
        if (ticketTypes !== undefined) updates.ticket_types = ticketTypes;
        if (notifyEmail !== undefined) updates.notify_email = notifyEmail;
        if (notifyDiscord !== undefined) updates.notify_discord = notifyDiscord;
        if (notifyLine !== undefined) updates.notify_line = notifyLine;
        if (isActive !== undefined) updates.is_active = isActive;

        const { data, error } = await supabaseAdmin
            .from('ticket_subscriptions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Subscriptions] Update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[Subscriptions] Updated:', id);
        return NextResponse.json({ subscription: data });
    } catch (error) {
        console.error('[Subscriptions] Exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/subscriptions/[id] - 刪除訂閱
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.dbId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // 驗證訂閱屬於該用戶
        const { data: existing } = await supabaseAdmin
            .from('ticket_subscriptions')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        if (existing.user_id !== session.user.dbId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 刪除訂閱
        const { error } = await supabaseAdmin
            .from('ticket_subscriptions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Subscriptions] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[Subscriptions] Deleted:', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Subscriptions] Exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
