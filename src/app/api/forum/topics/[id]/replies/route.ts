import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST: 創建回覆
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: topicId } = await params;
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 檢查主題是否存在且未鎖定
        const { data: topic, error: topicError } = await supabaseAdmin
            .from('forum_topics')
            .select('id, is_locked, author_id, title, reply_count')
            .eq('id', topicId)
            .single();

        if (topicError || !topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        if (topic.is_locked) {
            return NextResponse.json({ error: 'Topic is locked' }, { status: 403 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // 創建回覆
        const { data: reply, error: replyError } = await supabaseAdmin
            .from('forum_replies')
            .insert({
                topic_id: topicId,
                author_id: session.user.dbId,
                content: content.trim(),
            })
            .select()
            .single();

        if (replyError) {
            console.error('Error creating reply:', replyError);
            return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
        }

        // 更新主題回覆數
        await supabaseAdmin
            .from('forum_topics')
            .update({
                reply_count: topic.reply_count ? topic.reply_count + 1 : 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', topicId);

        // 發送通知給主題作者（如果不是自己回覆自己）
        if (topic.author_id !== session.user.dbId) {
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: topic.author_id,
                    type: 'forum_reply',
                    title: '您的討論有新回覆',
                    message: `有人回覆了您的主題「${topic.title}」`,
                    data: { topicId, replyId: reply.id },
                });
        }

        return NextResponse.json({ reply: { id: reply.id } }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/forum/topics/[id]/replies:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
