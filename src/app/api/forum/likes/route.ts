import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST: 切換按讚（主題或回覆）
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { topicId, replyId } = body;

        if (!topicId && !replyId) {
            return NextResponse.json({ error: 'topicId or replyId is required' }, { status: 400 });
        }

        if (topicId && replyId) {
            return NextResponse.json({ error: 'Cannot like both topic and reply' }, { status: 400 });
        }

        const userId = session.user.dbId;

        // 檢查是否已按讚
        let existingLike;
        if (topicId) {
            const { data } = await supabaseAdmin
                .from('forum_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('topic_id', topicId)
                .maybeSingle();
            existingLike = data;
        } else {
            const { data } = await supabaseAdmin
                .from('forum_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('reply_id', replyId)
                .maybeSingle();
            existingLike = data;
        }

        if (existingLike) {
            // 取消按讚
            await supabaseAdmin
                .from('forum_likes')
                .delete()
                .eq('id', existingLike.id);

            // 更新計數
            if (topicId) {
                const { data: topic } = await supabaseAdmin
                    .from('forum_topics')
                    .select('like_count')
                    .eq('id', topicId)
                    .single();

                await supabaseAdmin
                    .from('forum_topics')
                    .update({ like_count: Math.max(0, (topic?.like_count || 1) - 1) })
                    .eq('id', topicId);
            } else {
                const { data: reply } = await supabaseAdmin
                    .from('forum_replies')
                    .select('like_count')
                    .eq('id', replyId)
                    .single();

                await supabaseAdmin
                    .from('forum_replies')
                    .update({ like_count: Math.max(0, (reply?.like_count || 1) - 1) })
                    .eq('id', replyId);
            }

            return NextResponse.json({ liked: false });
        } else {
            // 新增按讚
            await supabaseAdmin
                .from('forum_likes')
                .insert({
                    user_id: userId,
                    topic_id: topicId || null,
                    reply_id: replyId || null,
                });

            // 更新計數
            if (topicId) {
                const { data: topic } = await supabaseAdmin
                    .from('forum_topics')
                    .select('like_count')
                    .eq('id', topicId)
                    .single();

                await supabaseAdmin
                    .from('forum_topics')
                    .update({ like_count: (topic?.like_count || 0) + 1 })
                    .eq('id', topicId);
            } else {
                const { data: reply } = await supabaseAdmin
                    .from('forum_replies')
                    .select('like_count')
                    .eq('id', replyId)
                    .single();

                await supabaseAdmin
                    .from('forum_replies')
                    .update({ like_count: (reply?.like_count || 0) + 1 })
                    .eq('id', replyId);
            }

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error('Error in POST /api/forum/likes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
