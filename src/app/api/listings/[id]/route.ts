import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// GET /api/listings/[id] - 獲取單一刊登
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        host:users!host_id(id, username, avatar_url, rating, review_count, is_verified)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/listings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/listings/[id] - 更新刊登
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 提取 removeApplicants 標記（不要傳給資料庫）
    const { removeApplicants, ...updates } = body;

    // 確認是刊登擁有者並獲取狀態
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('host_id, status, event_name')
      .eq('id', id)
      .single();

    if (!listing || listing.host_id !== session.user.dbId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 已配對的刊登不能編輯
    if (listing.status === 'matched') {
      return NextResponse.json({ error: 'Cannot edit matched listing' }, { status: 400 });
    }

    // 如果需要移除申請人
    if (removeApplicants) {
      // 獲取所有申請人
      const { data: applications } = await supabaseAdmin
        .from('applications')
        .select('id, applicant_id')
        .eq('listing_id', id);

      if (applications && applications.length > 0) {
        // 為每個被移除的申請人創建通知
        const notifications = applications.map(app => ({
          user_id: app.applicant_id,
          type: 'application_removed',
          title: '申請已被移除',
          message: `您對「${listing.event_name}」的申請已被移除，因為主辦方已編輯活動內容。`,
          data: { listing_id: id, event_name: listing.event_name },
          is_read: false,
        }));

        // 創建通知
        await supabaseAdmin
          .from('notifications')
          .insert(notifications);

        // 刪除所有申請
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('listing_id', id);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/listings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/listings/[id] - 刪除刊登
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 確認是刊登擁有者
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('host_id')
      .eq('id', id)
      .single();

    if (!listing || listing.host_id !== session.user.dbId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting listing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/listings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
