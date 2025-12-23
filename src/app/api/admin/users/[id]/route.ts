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

// DELETE /api/admin/users/[id] - 刪除會員
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

    // 取得用戶資訊（用於記錄）
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, username, email')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 刪除相關資料（按照外鍵依賴順序）
    // 1. 刪除用戶的訊息
    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('sender_id', id);

    // 2. 刪除用戶作為 host 或 guest 的對話
    await supabaseAdmin
      .from('conversations')
      .delete()
      .or(`host_id.eq.${id},guest_id.eq.${id}`);

    // 3. 刪除用戶的刊登
    await supabaseAdmin
      .from('listings')
      .delete()
      .eq('host_id', id);

    // 4. 刪除用戶的檢舉記錄
    await supabaseAdmin
      .from('reports')
      .delete()
      .or(`reporter_id.eq.${id},reported_user_id.eq.${id}`);

    // 5. 刪除用戶的評價
    await supabaseAdmin
      .from('reviews')
      .delete()
      .or(`reviewer_id.eq.${id},reviewed_user_id.eq.${id}`);

    // 6. 刪除用戶的封鎖記錄
    await supabaseAdmin
      .from('user_blocks')
      .delete()
      .or(`blocker_id.eq.${id},blocked_id.eq.${id}`);

    // 7. 最後刪除用戶本身
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user: ' + deleteError.message }, { status: 500 });
    }

    // 記錄操作日誌
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'user_delete',
      target_type: 'user',
      target_id: id,
      details: {
        deleted_user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.username} has been deleted`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
