import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// POST /api/users/block - 封鎖用戶
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.dbId;
        const body = await request.json();
        const { blocked_id } = body;

        if (!blocked_id) {
            return NextResponse.json({ error: 'blocked_id is required' }, { status: 400 });
        }

        if (blocked_id === userId) {
            return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
        }

        // 檢查是否已封鎖
        const { data: existing } = await supabaseAdmin
            .from('user_blocks')
            .select('id')
            .eq('blocker_id', userId)
            .eq('blocked_id', blocked_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
        }

        // 新增封鎖記錄
        const { error: insertError } = await supabaseAdmin
            .from('user_blocks')
            .insert({
                blocker_id: userId,
                blocked_id: blocked_id,
            });

        if (insertError) {
            console.error('Error blocking user:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User blocked' });

    } catch (error) {
        console.error('Error in POST /api/users/block:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/users/block - 解除封鎖
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.dbId;
        const { searchParams } = new URL(request.url);
        const blocked_id = searchParams.get('blocked_id');

        if (!blocked_id) {
            return NextResponse.json({ error: 'blocked_id is required' }, { status: 400 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('user_blocks')
            .delete()
            .eq('blocker_id', userId)
            .eq('blocked_id', blocked_id);

        if (deleteError) {
            console.error('Error unblocking user:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User unblocked' });

    } catch (error) {
        console.error('Error in DELETE /api/users/block:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/users/block - 獲取封鎖列表
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.dbId;

        const { data: blocks, error } = await supabaseAdmin
            .from('user_blocks')
            .select(`
        id,
        blocked_id,
        created_at,
        blocked:users!blocked_id(id, username, avatar_url, custom_avatar_url)
      `)
            .eq('blocker_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blocks:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ blocks: blocks || [] });

    } catch (error) {
        console.error('Error in GET /api/users/block:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
