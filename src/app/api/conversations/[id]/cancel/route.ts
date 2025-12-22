import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// POST /api/conversations/[id]/cancel - 發起取消請求
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.dbId;
        const body = await request.json();
        const { reason } = body;

        if (!reason?.trim()) {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        // 獲取對話
        const { data: conversation, error: convoError } = await supabaseAdmin
            .from('conversations')
            .select('*, listing:listings!listing_id(id, event_name, host_id)')
            .eq('id', id)
            .single();

        if (convoError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // 確認用戶是對話參與者
        if (conversation.host_id !== userId && conversation.guest_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 只有 matched 狀態才能取消
        if (conversation.conversation_type !== 'matched') {
            return NextResponse.json({ error: 'Only matched conversations can be cancelled' }, { status: 400 });
        }

        // 檢查是否已有待處理的取消請求
        if (conversation.cancellation_status === 'pending') {
            return NextResponse.json({ error: 'A cancellation request is already pending' }, { status: 400 });
        }

        // 設定 48 小時期限
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        // 更新對話狀態
        const { error: updateError } = await supabaseAdmin
            .from('conversations')
            .update({
                cancellation_status: 'pending',
                cancellation_requested_by: userId,
                cancellation_reason: reason.trim(),
                cancellation_requested_at: new Date().toISOString(),
                cancellation_expires_at: expiresAt,
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating conversation:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 發送通知給對方
        const otherUserId = conversation.host_id === userId ? conversation.guest_id : conversation.host_id;
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: otherUserId,
                type: 'cancellation_request',
                title: '收到取消同行請求',
                message: `對方希望取消「${conversation.listing?.event_name}」的同行配對`,
                data: {
                    conversation_id: id,
                    listing_id: conversation.listing_id,
                    reason: reason.trim(),
                },
                is_read: false,
            });

        // 發送系統訊息到聊天
        await supabaseAdmin
            .from('messages')
            .insert({
                conversation_id: id,
                sender_id: userId,
                content: `[系統訊息] 已發起取消同行請求。原因：${reason.trim()}`,
                is_read: false,
            });

        return NextResponse.json({
            success: true,
            cancellation_status: 'pending',
            expires_at: expiresAt,
        });

    } catch (error) {
        console.error('Error in POST /api/conversations/[id]/cancel:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/conversations/[id]/cancel - 回應取消請求 (accept/reject)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.dbId;
        const body = await request.json();
        const { action } = body; // 'accept' or 'reject'

        if (!['accept', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 獲取對話
        const { data: conversation, error: convoError } = await supabaseAdmin
            .from('conversations')
            .select('*, listing:listings!listing_id(id, event_name, host_id)')
            .eq('id', id)
            .single();

        if (convoError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // 確認用戶是對話參與者但不是發起者
        if (conversation.host_id !== userId && conversation.guest_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (conversation.cancellation_requested_by === userId) {
            return NextResponse.json({ error: 'Cannot respond to your own request' }, { status: 400 });
        }

        // 確認有待處理的取消請求
        if (conversation.cancellation_status !== 'pending') {
            return NextResponse.json({ error: 'No pending cancellation request' }, { status: 400 });
        }

        if (action === 'accept') {
            // 同意取消：更新對話狀態、恢復 listing、增加雙方取消次數
            const { error: updateError } = await supabaseAdmin
                .from('conversations')
                .update({
                    cancellation_status: 'cancelled',
                    cancellation_responded_at: new Date().toISOString(),
                    conversation_type: 'inquiry', // 恢復為詢問狀態
                })
                .eq('id', id);

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            // 恢復 listing 為 open
            await supabaseAdmin
                .from('listings')
                .update({ status: 'open' })
                .eq('id', conversation.listing_id);

            // 刪除交易確認記錄
            await supabaseAdmin
                .from('transaction_confirmations')
                .delete()
                .eq('conversation_id', id);

            // 雙方增加取消次數
            await supabaseAdmin.rpc('increment_cancellation_count', { user_id: conversation.host_id });
            await supabaseAdmin.rpc('increment_cancellation_count', { user_id: conversation.guest_id });

            // 發送系統訊息
            await supabaseAdmin
                .from('messages')
                .insert({
                    conversation_id: id,
                    sender_id: userId,
                    content: '[系統訊息] 取消同行請求已被同意。配對已解除。',
                    is_read: false,
                });

            // 通知發起者
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: conversation.cancellation_requested_by,
                    type: 'cancellation_accepted',
                    title: '取消請求已被同意',
                    message: `「${conversation.listing?.event_name}」的同行配對已解除`,
                    data: { conversation_id: id, listing_id: conversation.listing_id },
                    is_read: false,
                });

            return NextResponse.json({
                success: true,
                cancellation_status: 'cancelled',
                message: 'Cancellation accepted',
            });

        } else {
            // 拒絕取消：更新狀態為 rejected，進入協調階段
            const { error: updateError } = await supabaseAdmin
                .from('conversations')
                .update({
                    cancellation_status: 'rejected',
                    cancellation_responded_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            // 發送系統訊息
            await supabaseAdmin
                .from('messages')
                .insert({
                    conversation_id: id,
                    sender_id: userId,
                    content: '[系統訊息] 取消同行請求被拒絕。進入協調階段，請雙方繼續溝通。',
                    is_read: false,
                });

            // 通知發起者
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: conversation.cancellation_requested_by,
                    type: 'cancellation_rejected',
                    title: '取消請求被拒絕',
                    message: '對方拒絕了取消請求，請繼續溝通協調',
                    data: { conversation_id: id },
                    is_read: false,
                });

            return NextResponse.json({
                success: true,
                cancellation_status: 'rejected',
                message: 'Cancellation rejected - entering negotiation phase',
            });
        }

    } catch (error) {
        console.error('Error in PUT /api/conversations/[id]/cancel:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
