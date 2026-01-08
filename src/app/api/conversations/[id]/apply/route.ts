import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// POST /api/conversations/[id]/apply - 申請加入
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

    // 檢查用戶驗證層級（需要至少 applicant 層級）
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('verification_level')
      .eq('id', userId)
      .single();

    if (!user || (user.verification_level !== 'applicant' && user.verification_level !== 'host')) {
      return NextResponse.json({
        error: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Email verification required to apply',
        currentLevel: user?.verification_level || 'unverified',
      }, { status: 403 });
    }

    // 獲取對話
    const { data: conversation, error: convoError } = await supabaseAdmin
      .from('conversations')
      .select('*, listing:listings!listing_id(id, event_name, status, host_id)')
      .eq('id', id)
      .single();

    if (convoError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 只有申請人可以申請
    if (conversation.guest_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 檢查對話狀態必須是 inquiry
    if (conversation.conversation_type !== 'inquiry') {
      return NextResponse.json({
        error: 'Already applied or matched',
        currentType: conversation.conversation_type
      }, { status: 400 });
    }

    // 檢查刊登是否還開放
    if (conversation.listing?.status !== 'open') {
      return NextResponse.json({ error: 'Listing is no longer available' }, { status: 400 });
    }

    // 更新對話狀態為 pending
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        conversation_type: 'pending',
        applied_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 發送通知給主辦方（包含 Discord DM）
    const { createNotification } = await import('@/app/api/notifications/route');
    await createNotification({
      user_id: conversation.host_id,
      type: 'new_application',
      title: '新的申請',
      message: `有人申請加入您的「${conversation.listing?.event_name}」同行`,
      link: `/messages?conversation=${id}`,
    });

    // 發送 Email 通知給主辦方（背景執行，不阻塞回應）
    (async () => {
      try {
        const { sendNotificationEmail } = await import('@/lib/email');

        // 獲取申請者和主辦方資訊
        const [guestResult, hostResult] = await Promise.all([
          supabaseAdmin.from('users').select('username').eq('id', userId).single(),
          supabaseAdmin.from('users').select('email, preferred_locale').eq('id', conversation.host_id).single(),
        ]);

        if (hostResult.data?.email) {
          await sendNotificationEmail(
            hostResult.data.email,
            'new_application',
            {
              eventName: conversation.listing?.event_name || '',
              senderName: guestResult.data?.username || '用戶',
              conversationId: id,
              listingId: conversation.listing_id,
            },
            hostResult.data.preferred_locale || 'zh-TW'
          );
        }
      } catch (emailError) {
        console.error('Failed to send application email:', emailError);
      }
    })();

    return NextResponse.json({
      success: true,
      conversation_type: 'pending',
    });

  } catch (error) {
    console.error('Error in POST /api/conversations/[id]/apply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
