import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ReportType } from '@/types';

const VALID_REPORT_TYPES: ReportType[] = ['scalper', 'ticket_issue', 'fraud', 'payment_issue'];

// POST /api/reports - Submit a new report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportedUserId, conversationId, listingId, reportType, reason } = body;

    // Validation
    if (!reportedUserId) {
      return NextResponse.json({ error: 'Missing reportedUserId' }, { status: 400 });
    }

    if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Cannot report yourself
    if (reportedUserId === session.user.dbId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
    }

    // Check if user exists
    const { data: reportedUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', reportedUserId)
      .single();

    if (userError || !reportedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already reported (same reporter, reported user, and conversation/listing)
    let duplicateQuery = supabaseAdmin
      .from('reports')
      .select('id')
      .eq('reporter_id', session.user.dbId)
      .eq('reported_user_id', reportedUserId)
      .eq('status', 'pending');

    if (conversationId) {
      duplicateQuery = duplicateQuery.eq('conversation_id', conversationId);
    }
    if (listingId) {
      duplicateQuery = duplicateQuery.eq('listing_id', listingId);
    }

    const { data: existingReport } = await duplicateQuery.single();

    if (existingReport) {
      return NextResponse.json({ error: 'Already reported' }, { status: 409 });
    }

    // Create report
    const { data: report, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_id: session.user.dbId,
        reported_user_id: reportedUserId,
        conversation_id: conversationId || null,
        listing_id: listingId || null,
        report_type: reportType,
        reason: reason.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create report:', insertError);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/reports - Get user's own reports
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        reported_user:users!reports_reported_user_id_fkey(id, username, avatar_url, custom_avatar_url)
      `)
      .eq('reporter_id', session.user.dbId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
