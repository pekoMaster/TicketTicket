import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';

// GET /api/admin/bugs - 獲取 BUG 回報列表
export async function GET(request: NextRequest) {
    try {
        // 驗證管理員權限
        const authResult = await requireAdmin();
        if (isAuthError(authResult)) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || '';

        const offset = (page - 1) * limit;

        // 構建查詢
        let query = supabaseAdmin
            .from('bug_reports')
            .select(`
        id,
        title,
        description,
        status,
        admin_note,
        created_at,
        updated_at,
        reporter:users!reporter_id(id, username, email)
      `, { count: 'exact' });

        // 狀態篩選
        if (status && ['pending', 'resolved', 'unresolvable', 'ignored', 'not_a_bug'].includes(status)) {
            query = query.eq('status', status);
        }

        // 分頁
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: bugReports, count, error } = await query;

        if (error) {
            console.error('Error fetching bug reports:', error);
            return NextResponse.json({ error: '取得資料失敗' }, { status: 500 });
        }

        return NextResponse.json({
            bugReports: bugReports || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Error in GET /api/admin/bugs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
