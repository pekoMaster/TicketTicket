import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ForumTopic, ForumReply, ForumCategory } from '@/types';

export const dynamic = 'force-dynamic';

// GET: 獲取單一主題詳情
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        const userId = session?.user?.dbId;

        // 獲取主題
        const { data: topic, error: topicError } = await supabaseAdmin
            .from('forum_topics')
            .select(`
        *,
        author:users!forum_topics_author_id_fkey(
          id, username, avatar_url, custom_avatar_url
        )
      `)
            .eq('id', id)
            .single();

        if (topicError || !topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // 增加瀏覽次數
        await supabaseAdmin
            .from('forum_topics')
            .update({ view_count: (topic.view_count || 0) + 1 })
            .eq('id', id);

        // 獲取回覆
        const { data: replies } = await supabaseAdmin
            .from('forum_replies')
            .select(`
        *,
        author:users!forum_replies_author_id_fkey(
          id, username, avatar_url, custom_avatar_url
        )
      `)
            .eq('topic_id', id)
            .order('created_at', { ascending: true });

        // 獲取投票（如果有）
        const { data: poll } = await supabaseAdmin
            .from('forum_polls')
            .select(`
        *,
        options:forum_poll_options(*)
      `)
            .eq('topic_id', id)
            .single();

        // 檢查用戶按讚和投票狀態
        let isLikedByMe = false;
        let likedReplyIds: string[] = [];
        let myVotes: string[] = [];

        if (userId) {
            // 檢查主題按讚
            const { data: topicLike } = await supabaseAdmin
                .from('forum_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('topic_id', id)
                .single();
            isLikedByMe = !!topicLike;

            // 檢查回覆按讚
            if (replies && replies.length > 0) {
                const replyIds = replies.map(r => r.id);
                const { data: replyLikes } = await supabaseAdmin
                    .from('forum_likes')
                    .select('reply_id')
                    .eq('user_id', userId)
                    .in('reply_id', replyIds);
                likedReplyIds = replyLikes?.map(l => l.reply_id) || [];
            }

            // 檢查投票
            if (poll) {
                const { data: votes } = await supabaseAdmin
                    .from('forum_poll_votes')
                    .select('option_id')
                    .eq('poll_id', poll.id)
                    .eq('user_id', userId);
                myVotes = votes?.map(v => v.option_id) || [];
            }
        }

        // 格式化回應
        const formattedTopic: ForumTopic = {
            id: topic.id,
            authorId: topic.author_id,
            category: topic.category as ForumCategory,
            title: topic.title,
            content: topic.content,
            isPinned: topic.is_pinned,
            isLocked: topic.is_locked,
            viewCount: topic.view_count + 1,
            replyCount: topic.reply_count,
            likeCount: topic.like_count,
            createdAt: new Date(topic.created_at),
            updatedAt: new Date(topic.updated_at),
            author: topic.author ? {
                id: topic.author.id,
                username: topic.author.username,
                avatarUrl: topic.author.avatar_url,
                customAvatarUrl: topic.author.custom_avatar_url,
            } : undefined,
            isLikedByMe,
            replies: (replies || []).map((r: Record<string, unknown>): ForumReply => ({
                id: r.id as string,
                topicId: r.topic_id as string,
                authorId: r.author_id as string,
                content: r.content as string,
                likeCount: r.like_count as number,
                createdAt: new Date(r.created_at as string),
                updatedAt: new Date(r.updated_at as string),
                author: r.author ? {
                    id: (r.author as Record<string, unknown>).id as string,
                    username: (r.author as Record<string, unknown>).username as string,
                    avatarUrl: (r.author as Record<string, unknown>).avatar_url as string,
                    customAvatarUrl: (r.author as Record<string, unknown>).custom_avatar_url as string,
                } : undefined,
                isLikedByMe: likedReplyIds.includes(r.id as string),
            })),
            poll: poll ? {
                id: poll.id,
                topicId: poll.topic_id,
                question: poll.question,
                isMultipleChoice: poll.is_multiple_choice,
                endsAt: poll.ends_at ? new Date(poll.ends_at) : undefined,
                createdAt: new Date(poll.created_at),
                options: (poll.options || []).map((o: Record<string, unknown>) => ({
                    id: o.id as string,
                    pollId: o.poll_id as string,
                    optionText: o.option_text as string,
                    voteCount: o.vote_count as number,
                })),
                myVotes,
            } : undefined,
        };

        return NextResponse.json(formattedTopic);
    } catch (error) {
        console.error('Error in GET /api/forum/topics/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH: 更新主題（作者編輯內容，管理員可置頂/鎖定）
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // 獲取主題
        const { data: topic, error: topicError } = await supabaseAdmin
            .from('forum_topics')
            .select('author_id, is_locked')
            .eq('id', id)
            .single();

        if (topicError || !topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // 獲取用戶角色
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', session.user.dbId)
            .single();

        const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';
        const isAuthor = topic.author_id === session.user.dbId;

        // 權限檢查
        if (!isAdmin && !isAuthor) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 構建更新資料
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        // 作者可以編輯標題和內容（如果主題未鎖定）
        if (isAuthor && !topic.is_locked) {
            if (body.title) updateData.title = body.title.trim();
            if (body.content) updateData.content = body.content.trim();
        }

        // 管理員可以置頂和鎖定
        if (isAdmin) {
            if (typeof body.isPinned === 'boolean') updateData.is_pinned = body.isPinned;
            if (typeof body.isLocked === 'boolean') updateData.is_locked = body.isLocked;
            // 管理員也可以編輯內容
            if (body.title) updateData.title = body.title.trim();
            if (body.content) updateData.content = body.content.trim();
        }

        const { error: updateError } = await supabaseAdmin
            .from('forum_topics')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            console.error('Error updating topic:', updateError);
            return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/forum/topics/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: 刪除主題（僅管理員）
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 檢查管理員權限
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', session.user.dbId)
            .single();

        if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const { error } = await supabaseAdmin
            .from('forum_topics')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting topic:', error);
            return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/forum/topics/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
