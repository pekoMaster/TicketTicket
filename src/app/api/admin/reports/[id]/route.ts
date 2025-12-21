import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth-helpers';
import { ReportStatus } from '@/types';

const VALID_STATUSES: ReportStatus[] = ['pending', 'investigating', 'resolved', 'dismissed'];

// GET /api/admin/reports/[id] - Get report detail with conversation messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    // Get report with related data
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        reporter:users!reports_reporter_id_fkey(id, username, email, avatar_url, custom_avatar_url, rating, review_count),
        reported_user:users!reports_reported_user_id_fkey(id, username, email, avatar_url, custom_avatar_url, rating, review_count),
        listing:listings(id, event_name, event_date, venue, ticket_type, asking_price_jpy, host_id),
        resolved_by_user:users!reports_resolved_by_fkey(id, username)
      `)
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get conversation messages if conversation_id exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messages: any[] = [];
    if (report.conversation_id) {
      const { data: conversationMessages } = await supabaseAdmin
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          sender:users!messages_sender_id_fkey(id, username)
        `)
        .eq('conversation_id', report.conversation_id)
        .order('created_at', { ascending: true });

      messages = conversationMessages || [];
    }

    return NextResponse.json({
      report,
      messages,
    });
  } catch (error) {
    console.error('Admin report detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/reports/[id] - Update report status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = authResult.session.user.dbId;
      }
    }
    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update report:', error);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Admin report update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/reports/[id] - Delete report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete report:', error);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin report delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
