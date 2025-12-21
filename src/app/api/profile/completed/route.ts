import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// GET /api/profile/completed - 獲取用戶的已完成配對列表
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.dbId;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // 獲取已完成的對話（雙方都確認票券）
        const { data: conversations, error, count } = await supabaseAdmin
            .from('conversations')
            .select(`
        id,
        listing_id,
        host_id,
        guest_id,
        host_confirmed_at,
        guest_confirmed_at,
        created_at,
        listing:listings!listing_id(
          id,
          event_name,
          event_date,
          venue,
          ticket_type,
          seat_grade,
          asking_price_jpy
        ),
        host:users!host_id(id, username, avatar_url, custom_avatar_url, rating),
        guest:users!guest_id(id, username, avatar_url, custom_avatar_url, rating)
      `, { count: 'exact' })
            .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
            .not('host_confirmed_at', 'is', null)
            .not('guest_confirmed_at', 'is', null)
            .order('guest_confirmed_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching completed conversations:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 為每個對話獲取用戶的評價
        const completedItems = await Promise.all(
            (conversations || []).map(async (conv) => {
                const isHost = conv.host_id === userId;
                const otherUser = isHost ? conv.guest : conv.host;
                const revieweeId = isHost ? conv.guest_id : conv.host_id;

                // 獲取用戶給對方的評價
                const { data: myReview } = await supabaseAdmin
                    .from('reviews')
                    .select('id, rating, comment, created_at, is_auto')
                    .eq('listing_id', conv.listing_id)
                    .eq('reviewer_id', userId)
                    .eq('reviewee_id', revieweeId)
                    .single();

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const otherUserData = otherUser as any;

                return {
                    id: conv.id,
                    listingId: conv.listing_id,
                    listing: conv.listing,
                    isHost,
                    otherUser: {
                        id: otherUserData?.id,
                        username: otherUserData?.username,
                        avatarUrl: otherUserData?.custom_avatar_url || otherUserData?.avatar_url,
                        rating: otherUserData?.rating,
                    },
                    completedAt: conv.guest_confirmed_at,
                    myReview: myReview ? {
                        id: myReview.id,
                        rating: myReview.rating,
                        comment: myReview.comment,
                        isAuto: myReview.is_auto,
                        createdAt: myReview.created_at,
                    } : null,
                };
            })
        );

        return NextResponse.json({
            items: completedItems,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Error in GET /api/profile/completed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
