import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// PATCH: 編輯回覆
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; replyId: string }> }
) {
    try {
        const { replyId } = await params;
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 獲取回覆
        const { data: reply, error: replyError } = await supabaseAdmin
            .from('forum_replies')
            .select('author_id, topic_id')
            .eq('id', replyId)
            .single();

        if (replyError || !reply) {
            return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
        }

        // 檢查主題是否鎖定
        const { data: topic } = await supabaseAdmin
            .from('forum_topics')
            .select('is_locked')
            .eq('id', reply.topic_id)
            .single();

        if (topic?.is_locked) {
            return NextResponse.json({ error: 'Topic is locked' }, { status: 403 });
        }

        // 檢查權限（只有作者可以編輯）
        if (reply.author_id !== session.user.dbId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const { error: updateError } = await supabaseAdmin
            .from('forum_replies')
            .update({
                content: content.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', replyId);

        if (updateError) {
            console.error('Error updating reply:', updateError);
            return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/forum/replies/[replyId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: 刪除回覆（僅管理員）
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; replyId: string }> }
) {
    try {
        const { id: topicId, replyId } = await params;
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
            .from('forum_replies')
            .delete()
            .eq('id', replyId);

        if (error) {
            console.error('Error deleting reply:', error);
            return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 });
        }

        // 更新主題回覆數
        const { data: topic } = await supabaseAdmin
            .from('forum_topics')
            .select('reply_count')
            .eq('id', topicId)
            .single();

        if (topic) {
            await supabaseAdmin
                .from('forum_topics')
                .update({ reply_count: Math.max(0, (topic.reply_count || 1) - 1) })
                .eq('id', topicId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/forum/replies/[replyId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
