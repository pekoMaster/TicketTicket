import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/reviews/auto-complete - 自動為超過三天未評價的交易創建五星評價
// 此端點應該由定時任務（如 Vercel Cron）調用
export async function POST(request: Request) {
    try {
        // 驗證 cron secret（可選，用於安全性）
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 計算三天前的時間
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // 查找已完成（雙方確認）且超過三天的對話
        const { data: completedConversations, error: convError } = await supabaseAdmin
            .from('conversations')
            .select(`
        id,
        listing_id,
        host_id,
        guest_id,
        host_confirmed_at,
        guest_confirmed_at
      `)
            .not('host_confirmed_at', 'is', null)
            .not('guest_confirmed_at', 'is', null)
            .lt('host_confirmed_at', threeDaysAgo.toISOString())
            .lt('guest_confirmed_at', threeDaysAgo.toISOString());

        if (convError) {
            console.error('Error fetching conversations:', convError);
            return NextResponse.json({ error: convError.message }, { status: 500 });
        }

        let createdCount = 0;

        for (const conv of completedConversations || []) {
            // 檢查主辦方是否已評價客人
            const { data: hostReview } = await supabaseAdmin
                .from('reviews')
                .select('id')
                .eq('listing_id', conv.listing_id)
                .eq('reviewer_id', conv.host_id)
                .eq('reviewee_id', conv.guest_id)
                .single();

            if (!hostReview) {
                // 主辦方未評價，自動創建五星評價
                const { error: createError } = await supabaseAdmin
                    .from('reviews')
                    .insert({
                        listing_id: conv.listing_id,
                        reviewer_id: conv.host_id,
                        reviewee_id: conv.guest_id,
                        rating: 5,
                        comment: null, // 自動評價無評論
                        is_auto: true, // 標記為自動評價
                    });

                if (!createError) {
                    createdCount++;
                    // 更新被評價者的評分
                    await updateUserRating(conv.guest_id);
                }
            }

            // 檢查客人是否已評價主辦方
            const { data: guestReview } = await supabaseAdmin
                .from('reviews')
                .select('id')
                .eq('listing_id', conv.listing_id)
                .eq('reviewer_id', conv.guest_id)
                .eq('reviewee_id', conv.host_id)
                .single();

            if (!guestReview) {
                // 客人未評價，自動創建五星評價
                const { error: createError } = await supabaseAdmin
                    .from('reviews')
                    .insert({
                        listing_id: conv.listing_id,
                        reviewer_id: conv.guest_id,
                        reviewee_id: conv.host_id,
                        rating: 5,
                        comment: null,
                        is_auto: true,
                    });

                if (!createError) {
                    createdCount++;
                    // 更新被評價者的評分
                    await updateUserRating(conv.host_id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            processedConversations: completedConversations?.length || 0,
            createdReviews: createdCount,
        });
    } catch (error) {
        console.error('Error in auto-complete reviews:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// 更新用戶評分
async function updateUserRating(userId: string) {
    const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', userId);

    if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabaseAdmin
            .from('users')
            .update({
                rating: Math.round(avgRating * 10) / 10,
                review_count: reviews.length,
            })
            .eq('id', userId);
    }
}
