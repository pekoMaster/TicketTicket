import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// POST /api/conversations/[id]/accept - 同意申請
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

    // 獲取對話
    const { data: conversation, error: convoError } = await supabaseAdmin
      .from('conversations')
      .select('*, listing:listings!listing_id(id, event_name, status, host_id)')
      .eq('id', id)
      .single();

    if (convoError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 只有主辦方可以同意
    if (conversation.host_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 檢查對話狀態必須是 pending
    if (conversation.conversation_type !== 'pending') {
      return NextResponse.json({
        error: 'Cannot accept - not in pending state',
        currentType: conversation.conversation_type
      }, { status: 400 });
    }

    // 檢查刊登是否還開放
    if (conversation.listing?.status !== 'open') {
      return NextResponse.json({ error: 'Listing is no longer available' }, { status: 400 });
    }

    // 開始交易
    const listingId = conversation.listing_id;

    // 1. 更新此對話狀態為 matched
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        conversation_type: 'matched',
        matched_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. 刪除其他申請人的對話（inquiry 和 pending 狀態）
    await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('listing_id', listingId)
      .neq('id', id);

    // 3. 更新刊登狀態為 closed
    await supabaseAdmin
      .from('listings')
      .update({
        status: 'closed',
        available_slots: 0,
      })
      .eq('id', listingId);

    // 4. 創建交易確認記錄
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('transaction_confirmations')
      .insert({
        conversation_id: id,
        listing_id: listingId,
        host_id: conversation.host_id,
        guest_id: conversation.guest_id,
        deadline_at: deadline,
      });

    // 5. 發送通知給申請人
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: conversation.guest_id,
        type: 'application_accepted',
        title: '申請已通過',
        message: `您的「${conversation.listing?.event_name}」同行申請已被接受！`,
        data: {
          listing_id: listingId,
          conversation_id: id,
          event_name: conversation.listing?.event_name
        },
        is_read: false,
      });

    return NextResponse.json({
      success: true,
      conversation_type: 'matched',
    });

  } catch (error) {
    console.error('Error in POST /api/conversations/[id]/accept:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
