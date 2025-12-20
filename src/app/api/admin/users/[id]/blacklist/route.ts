import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/admin/users/[id]/blacklist - 加入黑名單
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // 取得用戶資訊
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, username')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 檢查是否已在黑名單
    const { data: existing } = await supabaseAdmin
      .from('blacklist')
      .select('id')
      .eq('email', user.email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User is already blacklisted' }, { status: 400 });
    }

    // 加入黑名單
    const { error: insertError } = await supabaseAdmin
      .from('blacklist')
      .insert({
        email: user.email,
        reason,
      });

    if (insertError) {
      console.error('Error adding to blacklist:', insertError);
      return NextResponse.json({ error: 'Failed to add to blacklist' }, { status: 500 });
    }

    // 記錄操作日誌
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'user_blacklist',
      target_type: 'user',
      target_id: id,
      details: {
        email: user.email,
        username: user.username,
        reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/blacklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]/blacklist - 移出黑名單
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 取得用戶資訊
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, username')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 從黑名單移除
    const { error: deleteError } = await supabaseAdmin
      .from('blacklist')
      .delete()
      .eq('email', user.email);

    if (deleteError) {
      console.error('Error removing from blacklist:', deleteError);
      return NextResponse.json({ error: 'Failed to remove from blacklist' }, { status: 500 });
    }

    // 記錄操作日誌
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'user_unblacklist',
      target_type: 'user',
      target_id: id,
      details: {
        email: user.email,
        username: user.username,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]/blacklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
