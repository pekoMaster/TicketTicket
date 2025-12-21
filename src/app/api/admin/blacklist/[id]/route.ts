import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';

// DELETE /api/admin/blacklist/[id] - 從黑名單移除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 驗證管理員權限
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    // 取得黑名單記錄
    const { data: entry, error: fetchError } = await supabaseAdmin
      .from('blacklist')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Blacklist entry not found' }, { status: 404 });
    }

    // 刪除記錄
    const { error: deleteError } = await supabaseAdmin
      .from('blacklist')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error removing from blacklist:', deleteError);
      return NextResponse.json({ error: 'Failed to remove from blacklist' }, { status: 500 });
    }

    // 記錄操作日誌
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'user_unblacklist',
      target_type: 'blacklist',
      target_id: id,
      details: {
        email: entry.email,
        original_reason: entry.reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/blacklist/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
