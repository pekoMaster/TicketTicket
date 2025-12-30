import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST: 投票
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { pollId, optionIds } = body;

        if (!pollId || !optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
            return NextResponse.json({ error: 'pollId and optionIds are required' }, { status: 400 });
        }

        const userId = session.user.dbId;

        // 獲取投票資訊
        const { data: poll, error: pollError } = await supabaseAdmin
            .from('forum_polls')
            .select('is_multiple_choice, ends_at')
            .eq('id', pollId)
            .single();

        if (pollError || !poll) {
            return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        }

        // 檢查投票是否已結束
        if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
            return NextResponse.json({ error: 'Poll has ended' }, { status: 400 });
        }

        // 檢查是否已投票
        const { data: existingVotes } = await supabaseAdmin
            .from('forum_poll_votes')
            .select('id, option_id')
            .eq('poll_id', pollId)
            .eq('user_id', userId);

        if (existingVotes && existingVotes.length > 0) {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 });
        }

        // 單選只能選一個
        if (!poll.is_multiple_choice && optionIds.length > 1) {
            return NextResponse.json({ error: 'Single choice poll allows only one option' }, { status: 400 });
        }

        // 插入投票
        const votesToInsert = optionIds.map((optionId: string) => ({
            poll_id: pollId,
            option_id: optionId,
            user_id: userId,
        }));

        // 對於單選，使用 unique constraint 的 upsert
        if (poll.is_multiple_choice) {
            await supabaseAdmin
                .from('forum_poll_votes')
                .insert(votesToInsert);
        } else {
            await supabaseAdmin
                .from('forum_poll_votes')
                .upsert(votesToInsert[0], { onConflict: 'poll_id,user_id' });
        }

        // 更新選項票數
        for (const optionId of optionIds) {
            const { data: option } = await supabaseAdmin
                .from('forum_poll_options')
                .select('vote_count')
                .eq('id', optionId)
                .single();

            await supabaseAdmin
                .from('forum_poll_options')
                .update({ vote_count: (option?.vote_count || 0) + 1 })
                .eq('id', optionId);
        }

        return NextResponse.json({ success: true, votedOptions: optionIds });
    } catch (error) {
        console.error('Error in POST /api/forum/polls/vote:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
