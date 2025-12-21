import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// GET /api/reviews/pending - 獲取用戶的待評價列表
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.dbId;

        // 獲取已完成的對話（雙方都確認票券）
        const { data: conversations, error } = await supabaseAdmin
            .from('conversations')
            .select(`
        id,
        listing_id,
        host_id,
        guest_id,
        host_confirmed_at,
        guest_confirmed_at,
        listing:listings!listing_id(
          id,
          event_name,
          event_date,
          venue,
          ticket_type
        ),
        host:users!host_id(id, username, avatar_url, custom_avatar_url),
        guest:users!guest_id(id, username, avatar_url, custom_avatar_url)
      `)
            .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
            .not('host_confirmed_at', 'is', null)
            .not('guest_confirmed_at', 'is', null)
            .order('guest_confirmed_at', { ascending: false });

        if (error) {
            console.error('Error fetching conversations:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 過濾出未評價的
        const pendingReviews = [];

        for (const conv of conversations || []) {
            const isHost = conv.host_id === userId;
            const revieweeId = isHost ? conv.guest_id : conv.host_id;
            const otherUser = isHost ? conv.guest : conv.host;

            // 檢查是否已評價
            const { data: existingReview } = await supabaseAdmin
                .from('reviews')
                .select('id')
                .eq('listing_id', conv.listing_id)
                .eq('reviewer_id', userId)
                .eq('reviewee_id', revieweeId)
                .single();

            if (!existingReview) {
                // 計算距離完成的天數
                const completedAt = new Date(conv.guest_confirmed_at);
                const now = new Date();
                const daysSinceCompleted = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
                const daysRemaining = Math.max(0, 3 - daysSinceCompleted);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const otherUserData = otherUser as any;

                pendingReviews.push({
                    conversationId: conv.id,
                    listingId: conv.listing_id,
                    listing: conv.listing,
                    isHost,
                    otherUser: {
                        id: otherUserData?.id,
                        username: otherUserData?.username,
                        avatarUrl: otherUserData?.custom_avatar_url || otherUserData?.avatar_url,
                    },
                    completedAt: conv.guest_confirmed_at,
                    daysRemaining, // 剩餘幾天會自動評價
                });
            }
        }

        return NextResponse.json(pendingReviews);
    } catch (error) {
        console.error('Error in GET /api/reviews/pending:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
