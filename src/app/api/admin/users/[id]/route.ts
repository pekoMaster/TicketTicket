import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';

// PUT /api/admin/users/[id] - 更新會員資料
export async function PUT(
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
    const body = await request.json();
    const { username, custom_avatar_url, notify, notifyMessage } = body;

    // 取得用戶資訊
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 建立更新物件
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) {
      updates.username = username;
    }

    if (custom_avatar_url !== undefined) {
      updates.custom_avatar_url = custom_avatar_url;
    }

    // 更新用戶
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // 記錄操作日誌
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'user_edit',
      target_type: 'user',
      target_id: id,
      details: {
        before: { username: user.username, custom_avatar_url: user.custom_avatar_url },
        after: { username: updatedUser.username, custom_avatar_url: updatedUser.custom_avatar_url },
        notify,
        notifyMessage,
      },
    });

    // 發送通知（如果需要）
    if (notify && notifyMessage) {
      // 取得用戶的對話，發送系統訊息
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .or(`host_id.eq.${id},guest_id.eq.${id}`)
        .limit(1);

      if (conversations && conversations.length > 0) {
        await supabaseAdmin.from('messages').insert({
          conversation_id: conversations[0].id,
          sender_id: id,
          content: `[系統通知] ${notifyMessage}`,
          is_system_message: true,
          system_message_type: 'admin_user_edited',
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
