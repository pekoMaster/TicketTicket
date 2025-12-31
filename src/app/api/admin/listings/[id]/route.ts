import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';

// PUT /api/admin/listings/[id] - 強制編輯刊登
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
    const { updates, notify, notifyMessage } = body;

    // 取得刊登資訊（用於日誌和通知）
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        host:host_id (id, username, email)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // 更新刊登
    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    // 記錄操作日誌
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'listing_edit',
      target_type: 'listing',
      target_id: id,
      details: {
        before: listing,
        after: updatedListing,
        notify,
        notifyMessage,
      },
    });

    // 發送通知
    let notifiedUsers = 0;
    if (notify && notifyMessage) {
      // 取得相關對話
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id, host_id, guest_id')
        .eq('listing_id', id);

      if (conversations && conversations.length > 0) {
        // 為每個對話發送系統訊息
        for (const conv of conversations) {
          await supabaseAdmin.from('messages').insert({
            conversation_id: conv.id,
            sender_id: conv.host_id, // 使用 host_id 作為發送者（系統訊息）
            content: `[系統通知] ${notifyMessage}`,
            is_system_message: true,
            system_message_type: 'admin_listing_edited',
          });
          notifiedUsers += 2; // host + guest
        }
      }
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      notifiedUsers,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/listings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/listings/[id] - 強制移除刊登
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
    const body = await request.json();
    const { reason, notify, notifyMessage } = body;

    // 取得刊登資訊
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        host:host_id (id, username, email)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // 發送通知（在刪除前）
    let notifiedUsers = 0;
    const messageContent = notifyMessage || reason;

    if (notify && messageContent) {
      const notificationContent = `您的刊登「${listing.event_name}」已被管理員移除。原因：${messageContent}`;

      // 1. 通知主辦方（插入 notifications 表）
      await supabaseAdmin.from('notifications').insert({
        user_id: listing.host_id,
        type: 'listing_removed',
        title: '刊登已被移除',
        content: notificationContent,
        related_listing_id: id,
        is_read: false,
      });
      notifiedUsers += 1;

      // 2. 取得所有申請者並通知
      const { data: applications } = await supabaseAdmin
        .from('applications')
        .select('applicant_id')
        .eq('listing_id', id);

      if (applications && applications.length > 0) {
        const applicantNotifications = applications.map(app => ({
          user_id: app.applicant_id,
          type: 'listing_removed',
          title: '您申請的刊登已被移除',
          content: `您申請的刊登「${listing.event_name}」已被管理員移除。`,
          related_listing_id: id,
          is_read: false,
        }));

        await supabaseAdmin.from('notifications').insert(applicantNotifications);
        notifiedUsers += applications.length;
      }

      // 3. 同時也發送系統訊息到對話（如果有）
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id, host_id, guest_id')
        .eq('listing_id', id);

      if (conversations && conversations.length > 0) {
        for (const conv of conversations) {
          await supabaseAdmin.from('messages').insert({
            conversation_id: conv.id,
            sender_id: conv.host_id,
            content: `[系統通知] 此刊登已被管理員移除。原因：${messageContent}`,
            is_system_message: true,
            system_message_type: 'admin_listing_deleted',
          });
        }
      }
    }

    // 記錄操作日誌
    await supabaseAdmin.from('admin_logs').insert({
      action_type: 'listing_delete',
      target_type: 'listing',
      target_id: id,
      details: {
        listing,
        reason,
        notify,
        notifyMessage: messageContent,
      },
    });

    // 刪除相關資料
    // 1. 刪除申請
    await supabaseAdmin.from('applications').delete().eq('listing_id', id);

    // 2. 刪除訊息和對話
    const { data: convs } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('listing_id', id);

    if (convs) {
      for (const conv of convs) {
        await supabaseAdmin.from('messages').delete().eq('conversation_id', conv.id);
      }
      await supabaseAdmin.from('conversations').delete().eq('listing_id', id);
    }

    // 3. 刪除刊登
    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifiedUsers,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/listings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
