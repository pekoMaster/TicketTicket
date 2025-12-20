import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/users/[userId]/reviews - 取得用戶所有評價（分頁）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 取得該用戶的基本資訊
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, avatar_url, custom_avatar_url, rating, review_count')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 取得評價總數
    const { count: totalCount } = await supabaseAdmin
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewee_id', userId);

    // 取得分頁評價
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        reviewer:reviewer_id (
          id,
          username,
          avatar_url,
          custom_avatar_url
        ),
        listing:listing_id (
          id,
          event_name,
          event_date
        )
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // 計算評分分布
    const { data: allReviews } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (allReviews) {
      allReviews.forEach((review) => {
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
      });
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.custom_avatar_url || user.avatar_url,
        rating: user.rating,
        reviewCount: user.review_count,
      },
      reviews,
      ratingDistribution,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
