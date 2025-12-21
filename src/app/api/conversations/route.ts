import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// GET /api/conversations - 獲取用戶的所有對話
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.dbId;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        listing:listings!listing_id(id, event_name, event_date, venue, asking_price_jpy),
        host:users!host_id(id, username, avatar_url, custom_avatar_url),
        guest:users!guest_id(id, username, avatar_url, custom_avatar_url),
        messages(id, content, sender_id, is_read, created_at)
      `)
      .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 處理每個對話的最後訊息和未讀數
    const processedConversations = (data || []).map((convo) => {
      const messages = convo.messages || [];
      const lastMessage = messages.sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const unreadCount = messages.filter(
        (m: { is_read: boolean; sender_id: string }) => !m.is_read && m.sender_id !== userId
      ).length;

      return {
        ...convo,
        lastMessage,
        unreadCount,
        otherUser: convo.host_id === userId ? convo.guest : convo.host,
      };
    });

    // 過濾掉已完成（雙方確認）且當前用戶已評價的對話
    const completedConvoIds = processedConversations
      .filter(c => c.host_confirmed_at && c.guest_confirmed_at)
      .map(c => c.id);

    // 如果有已完成的對話，檢查用戶是否已評價
    let completedAndReviewedIds: string[] = [];
    if (completedConvoIds.length > 0) {
      // 獲取這些對話相關的 listing_id
      const completedListingIds = processedConversations
        .filter(c => completedConvoIds.includes(c.id))
        .map(c => c.listing_id);

      // 檢查用戶在這些 listing 上是否已評價
      const { data: userReviews } = await supabaseAdmin
        .from('reviews')
        .select('listing_id')
        .eq('reviewer_id', userId)
        .in('listing_id', completedListingIds);

      const reviewedListingIds = new Set((userReviews || []).map(r => r.listing_id));

      // 找出已完成且已評價的對話 ID
      completedAndReviewedIds = processedConversations
        .filter(c =>
          c.host_confirmed_at &&
          c.guest_confirmed_at &&
          reviewedListingIds.has(c.listing_id)
        )
        .map(c => c.id);
    }

    // 過濾掉已完成且已評價的對話
    const filteredConversations = processedConversations.filter(
      c => !completedAndReviewedIds.includes(c.id)
    );

    return NextResponse.json(filteredConversations);
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
