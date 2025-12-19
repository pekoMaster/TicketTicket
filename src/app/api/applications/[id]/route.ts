import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// PATCH /api/applications/[id] - 更新申請狀態
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
    const { status } = body;

    // 獲取申請和刊登資訊
    const { data: application } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        listing:listings!listing_id(id, host_id)
      `)
      .eq('id', id)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const userId = session.user.dbId;
    const isHost = application.listing?.host_id === userId;
    const isGuest = application.guest_id === userId;

    // 權限檢查
    if (status === 'cancelled' && !isGuest) {
      return NextResponse.json({ error: 'Only applicant can cancel' }, { status: 403 });
    }

    if ((status === 'accepted' || status === 'rejected') && !isHost) {
      return NextResponse.json({ error: 'Only host can accept/reject' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 如果接受申請，創建對話
    if (status === 'accepted') {
      const { data: existingConvo } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('listing_id', application.listing_id)
        .eq('guest_id', application.guest_id)
        .single();

      if (!existingConvo) {
        await supabaseAdmin.from('conversations').insert({
          listing_id: application.listing_id,
          host_id: application.listing.host_id,
          guest_id: application.guest_id,
        });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/applications/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/applications/[id] - 撤回申請（設為 cancelled）
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

    // 獲取申請資訊
    const { data: application } = await supabaseAdmin
      .from('applications')
      .select('id, guest_id, status')
      .eq('id', id)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 只有申請者本人可以撤回
    if (application.guest_id !== session.user.dbId) {
      return NextResponse.json({ error: 'Only applicant can withdraw' }, { status: 403 });
    }

    // 只有 pending 狀態可以撤回
    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Can only withdraw pending applications' }, { status: 400 });
    }

    // 更新狀態為 cancelled
    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error withdrawing application:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in DELETE /api/applications/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
