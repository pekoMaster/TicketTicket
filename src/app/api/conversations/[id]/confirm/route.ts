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
      .select('*')
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

    // 檢查雙方是否都已確認（如果是，則不允許取消）
    const bothConfirmed = conversation.host_confirmed_at && conversation.guest_confirmed_at;
    if (bothConfirmed && action === 'cancel') {
      return NextResponse.json({
        error: 'Cannot cancel after both parties confirmed'
      }, { status: 400 });
    }

    // 準備更新資料
    const updateField = isHost ? 'host_confirmed_at' : 'guest_confirmed_at';
    const updateValue = action === 'confirm' ? new Date().toISOString() : null;

    // 更新確認狀態
    const { data: updatedConvo, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ [updateField]: updateValue })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating confirmation:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: updatedConvo.id,
        hostConfirmedAt: updatedConvo.host_confirmed_at,
        guestConfirmedAt: updatedConvo.guest_confirmed_at,
        bothConfirmed: !!(updatedConvo.host_confirmed_at && updatedConvo.guest_confirmed_at),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/conversations/[id]/confirm:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
