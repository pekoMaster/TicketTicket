import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';

// GET /api/admin/bugs/[id] - 獲取單一 BUG 詳情
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const { data: bugReport, error } = await supabaseAdmin
            .from('bug_reports')
            .select(`
        id,
        title,
        description,
        status,
        admin_note,
        created_at,
        updated_at,
        reporter:users!reporter_id(id, username, email, avatar_url, custom_avatar_url)
      `)
            .eq('id', id)
            .single();

        if (error || !bugReport) {
            return NextResponse.json({ error: 'BUG 回報不存在' }, { status: 404 });
        }

        return NextResponse.json(bugReport);
    } catch (error) {
        console.error('Error in GET /api/admin/bugs/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/bugs/[id] - 更新 BUG 狀態
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, adminNote } = body;

        // 驗證狀態
        const validStatuses = ['pending', 'resolved', 'unresolvable', 'ignored', 'not_a_bug'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: '無效的狀態' }, { status: 400 });
        }

        // 建立更新物件
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (status) {
            updates.status = status;
        }

        if (adminNote !== undefined) {
            updates.admin_note = adminNote;
        }

        const { data: updatedBugReport, error } = await supabaseAdmin
            .from('bug_reports')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating bug report:', error);
            return NextResponse.json({ error: '更新失敗' }, { status: 500 });
        }

        // 記錄操作日誌
        await supabaseAdmin.from('admin_logs').insert({
            action_type: 'bug_report_update',
            target_type: 'bug_report',
            target_id: id,
            details: {
                new_status: status,
                admin_note: adminNote,
            },
        });

        return NextResponse.json({
            success: true,
            bugReport: updatedBugReport,
        });
    } catch (error) {
        console.error('Error in PATCH /api/admin/bugs/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
