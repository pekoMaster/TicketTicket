import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// POST /api/conversations/[id]/confirm - 確認票券
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
    const { action } = body; // 'confirm' | 'cancel'

    if (!['confirm', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 獲取對話
    const { data: conversation, error: convoError } = await supabaseAdmin
      .from('conversations')
      .select('*, listing:listings!listing_id(id, event_name)')
      .eq('id', id)
      .single();

    if (convoError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 確認用戶是對話參與者
    const isHost = conversation.host_id === userId;
    const isGuest = conversation.guest_id === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 獲取或創建 transaction_confirmations 記錄
    let { data: tc } = await supabaseAdmin
      .from('transaction_confirmations')
      .select('*')
      .eq('conversation_id', id)
      .single();

    // 如果不存在，創建一個（支援舊對話）
    if (!tc) {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: newTc } = await supabaseAdmin
        .from('transaction_confirmations')
        .insert({
          conversation_id: id,
          listing_id: conversation.listing_id,
          host_id: conversation.host_id,
          guest_id: conversation.guest_id,
          deadline_at: deadline,
        })
        .select()
        .single();
      tc = newTc;
    }

    // 檢查是否已完成
    if (tc?.completed_at) {
      return NextResponse.json({
        error: 'Transaction already completed'
      }, { status: 400 });
    }

    // 準備更新資料
    const updateField = isHost ? 'host_confirmed_at' : 'guest_confirmed_at';
    const updateValue = action === 'confirm' ? new Date().toISOString() : null;

    // 更新確認狀態
    const { data: updatedTc, error: updateError } = await supabaseAdmin
      .from('transaction_confirmations')
      .update({ [updateField]: updateValue })
      .eq('id', tc?.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating confirmation:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 檢查是否雙方都已確認
    const bothConfirmed = !!(updatedTc?.host_confirmed_at && updatedTc?.guest_confirmed_at);

    if (bothConfirmed && !updatedTc?.completed_at) {
      // 標記為完成
      await supabaseAdmin
        .from('transaction_confirmations')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', tc?.id);

      // 發送通知
      const otherUserId = isHost ? conversation.guest_id : conversation.host_id;
      await supabaseAdmin
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type: 'transaction_completed',
            title: '交易完成',
            message: `「${conversation.listing?.event_name}」的同行已確認完成！請給對方評價。`,
            data: { conversation_id: id, listing_id: conversation.listing_id },
            is_read: false,
          },
          {
            user_id: otherUserId,
            type: 'transaction_completed',
            title: '交易完成',
            message: `「${conversation.listing?.event_name}」的同行已確認完成！請給對方評價。`,
            data: { conversation_id: id, listing_id: conversation.listing_id },
            is_read: false,
          },
        ]);
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        hostConfirmedAt: updatedTc?.host_confirmed_at,
        guestConfirmedAt: updatedTc?.guest_confirmed_at,
        bothConfirmed,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/conversations/[id]/confirm:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
