import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ForumTopic, ForumCategory } from '@/types';

// GET: 獲取主題列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') as ForumCategory | null;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const session = await auth();
        const userId = session?.user?.dbId;

        let query = supabaseAdmin
            .from('forum_topics')
            .select(`
        *,
        author:users!forum_topics_author_id_fkey(
          id, username, avatar_url, custom_avatar_url
        )
      `, { count: 'exact' })
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        const { data: topics, count, error } = await query;

        if (error) {
            console.error('Error fetching topics:', error);
            return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
        }

        // 如果用戶已登入，檢查是否按過讚
        let likedTopicIds: string[] = [];
        if (userId && topics && topics.length > 0) {
            const topicIds = topics.map(t => t.id);
            const { data: likes } = await supabaseAdmin
                .from('forum_likes')
                .select('topic_id')
                .eq('user_id', userId)
                .in('topic_id', topicIds);

            likedTopicIds = likes?.map(l => l.topic_id) || [];
        }

        // 轉換為前端格式
        const formattedTopics: ForumTopic[] = (topics || []).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            authorId: t.author_id as string,
            category: t.category as ForumCategory,
            title: t.title as string,
            content: t.content as string,
            isPinned: t.is_pinned as boolean,
            isLocked: t.is_locked as boolean,
            viewCount: t.view_count as number,
            replyCount: t.reply_count as number,
            likeCount: t.like_count as number,
            createdAt: new Date(t.created_at as string),
            updatedAt: new Date(t.updated_at as string),
            author: t.author ? {
                id: (t.author as Record<string, unknown>).id as string,
                username: (t.author as Record<string, unknown>).username as string,
                avatarUrl: (t.author as Record<string, unknown>).avatar_url as string,
                customAvatarUrl: (t.author as Record<string, unknown>).custom_avatar_url as string,
            } : undefined,
            isLikedByMe: likedTopicIds.includes(t.id as string),
        }));

        return NextResponse.json({
            topics: formattedTopics,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('Error in GET /api/forum/topics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 創建新主題
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { category, title, content, poll } = body;

        // 驗證必填欄位
        if (!category || !title || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 驗證分類
        const validCategories: ForumCategory[] = ['bug', 'feature', 'question', 'discussion'];
        if (!validCategories.includes(category)) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        // 創建主題
        const { data: topic, error: topicError } = await supabaseAdmin
            .from('forum_topics')
            .insert({
                author_id: session.user.dbId,
                category,
                title: title.trim(),
                content: content.trim(),
            })
            .select()
            .single();

        if (topicError) {
            console.error('Error creating topic:', topicError);
            return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
        }

        // 如果有投票，創建投票
        if (poll && poll.question && poll.options && poll.options.length >= 2) {
            const { data: pollData, error: pollError } = await supabaseAdmin
                .from('forum_polls')
                .insert({
                    topic_id: topic.id,
                    question: poll.question.trim(),
                    is_multiple_choice: poll.isMultipleChoice || false,
                    ends_at: poll.endsAt || null,
                })
                .select()
                .single();

            if (!pollError && pollData) {
                // 創建投票選項
                const optionsToInsert = poll.options.map((opt: string) => ({
                    poll_id: pollData.id,
                    option_text: opt.trim(),
                }));

                await supabaseAdmin
                    .from('forum_poll_options')
                    .insert(optionsToInsert);
            }
        }

        return NextResponse.json({ topic: { id: topic.id } }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/forum/topics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
