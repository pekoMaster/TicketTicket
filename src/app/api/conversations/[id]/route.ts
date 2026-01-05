import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// GET /api/conversations/[id] - 獲取對話詳情和訊息
export async function GET(
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
      .select(`
        *,
        listing:listings!listing_id(
          id, event_name, event_date, venue, asking_price_jpy, status,
          ticket_type, ticket_count_type, meeting_time, meeting_location,
          seat_grade, will_assist_entry
        ),
        host:users!host_id(id, username, avatar_url, custom_avatar_url, rating, review_count, line_id, discord_id, show_line, show_discord),
        guest:users!guest_id(id, username, avatar_url, custom_avatar_url, rating, review_count)
      `)
      .eq('id', id)
      .single();

    if (convoError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 確認用戶是對話參與者
    if (conversation.host_id !== userId && conversation.guest_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 獲取訊息
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
    }

    // 標記訊息為已讀
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', id)
      .neq('sender_id', userId);

    // 獲取交易確認資料（如果存在）
    const { data: transactionConfirmation } = await supabaseAdmin
      .from('transaction_confirmations')
      .select('*')
      .eq('conversation_id', id)
      .single();

    // 計算剩餘天數
    let deadlineInfo = null;
    if (transactionConfirmation?.deadline_at && !transactionConfirmation.completed_at) {
      const deadline = new Date(transactionConfirmation.deadline_at);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      deadlineInfo = {
        deadlineAt: transactionConfirmation.deadline_at,
        daysRemaining: Math.max(0, diffDays),
        isExpired: diffDays <= 0,
        autoCompleted: transactionConfirmation.auto_completed,
        completedAt: transactionConfirmation.completed_at,
      };
    }

    // 如果是已配對狀態且用戶是申請者，提供主辦方的聯繫方式
    const isMatched = conversation.conversation_type === 'matched';
    const isGuest = conversation.guest_id === userId;
    const hostContactMethods = (isMatched && isGuest) ? {
      hasLine: !!(conversation.host.line_id && conversation.host.show_line),
      hasDiscord: !!(conversation.host.discord_id && conversation.host.show_discord),
    } : null;

    return NextResponse.json({
      conversation: {
        ...conversation,
        otherUser: conversation.host_id === userId ? conversation.guest : conversation.host,
        isHost: conversation.host_id === userId,
        // 票券驗證狀態
        hostConfirmedAt: transactionConfirmation?.host_confirmed_at || conversation.host_confirmed_at,
        guestConfirmedAt: transactionConfirmation?.guest_confirmed_at || conversation.guest_confirmed_at,
        bothConfirmed: !!(
          (transactionConfirmation?.host_confirmed_at || conversation.host_confirmed_at) &&
          (transactionConfirmation?.guest_confirmed_at || conversation.guest_confirmed_at)
        ),
        // 7天期限資訊
        deadlineInfo,
        conversationType: conversation.conversation_type,
        // 主辦方聯繫方式（僅已配對的申請者可見）
        hostContactMethods,
      },
      messages: messages || [],
    });
  } catch (error) {
    console.error('Error in GET /api/conversations/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/conversations/[id] - 發送訊息
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
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // 確認用戶是對話參與者
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('host_id, guest_id')
      .eq('id', id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.host_id !== userId && conversation.guest_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: userId,
        content: content.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 發送 Email 通知給對方（背景執行）
    (async () => {
      try {
        const { sendNotificationEmail } = await import('@/lib/email');

        // 判斷接收者是哪個用戶
        const recipientId = conversation.host_id === userId ? conversation.guest_id : conversation.host_id;

        // 獲取對話詳情（含刊登資訊）和用戶資訊
        const [convoResult, senderResult, recipientResult] = await Promise.all([
          supabaseAdmin.from('conversations')
            .select('listing:listings!listing_id(event_name)')
            .eq('id', id)
            .single(),
          supabaseAdmin.from('users').select('username').eq('id', userId).single(),
          supabaseAdmin.from('users').select('email, preferred_locale').eq('id', recipientId).single(),
        ]);

        if (recipientResult.data?.email && convoResult.data?.listing) {
          const listing = convoResult.data.listing as unknown as { event_name: string };
          await sendNotificationEmail(
            recipientResult.data.email,
            'new_message',
            {
              eventName: listing.event_name || '',
              senderName: senderResult.data?.username || '用戶',
              messagePreview: content.trim().slice(0, 100),
              conversationId: id,
            },
            recipientResult.data.preferred_locale || 'zh-TW'
          );
        }
      } catch (emailError) {
        console.error('Failed to send message email:', emailError);
      }
    })();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/conversations/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
