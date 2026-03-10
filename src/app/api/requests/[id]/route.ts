import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/requests/[id] - 取得單一求票詳情
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: ticketRequest, error } = await supabaseAdmin
            .from('ticket_requests')
            .select(`
        *,
        user:users!ticket_requests_user_id_fkey(id, username, avatar_url, custom_avatar_url, rating, review_count)
      `)
            .eq('id', id)
            .single();

        if (error || !ticketRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // 取得申請列表
        const { data: applications } = await supabaseAdmin
            .from('request_applications')
            .select(`
        *,
        applicant:users!request_applications_applicant_id_fkey(id, username, avatar_url, custom_avatar_url, rating, review_count)
      `)
            .eq('request_id', id)
            .order('created_at', { ascending: false });

        return NextResponse.json({ request: ticketRequest, applications: applications || [] });
    } catch (error) {
        console.error('Request detail API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/requests/[id] - 更新求票狀態
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

        // 驗證此求票屬於目前用戶
        const { data: existing } = await supabaseAdmin
            .from('ticket_requests')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existing || existing.user_id !== session.user.dbId) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};
        if (body.status) updateData.status = body.status;
        if (body.description !== undefined) updateData.description = body.description;
        updateData.updated_at = new Date().toISOString();

        const { data: updated, error } = await supabaseAdmin
            .from('ticket_requests')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Failed to update request:', error);
            return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
        }

        return NextResponse.json({ success: true, request: updated });
    } catch (error) {
        console.error('Request update API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/requests/[id] - 刪除求票
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

        // 驗證此求票屬於目前用戶
        const { data: existing } = await supabaseAdmin
            .from('ticket_requests')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existing || existing.user_id !== session.user.dbId) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('ticket_requests')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Failed to delete request:', error);
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Request delete API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
