import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/bug-reports - 提交 BUG 回報
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description } = body;

        // 驗證輸入
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json({ error: '請輸入標題' }, { status: 400 });
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            return NextResponse.json({ error: '請輸入問題描述' }, { status: 400 });
        }

        if (title.length > 200) {
            return NextResponse.json({ error: '標題不能超過 200 字' }, { status: 400 });
        }

        if (description.length > 5000) {
            return NextResponse.json({ error: '描述不能超過 5000 字' }, { status: 400 });
        }

        // 檢查用戶最近是否提交過太多回報（防止濫用）
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
            .from('bug_reports')
            .select('*', { count: 'exact', head: true })
            .eq('reporter_id', session.user.dbId)
            .gte('created_at', oneHourAgo);

        if ((count || 0) >= 5) {
            return NextResponse.json({ error: '每小時最多只能提交 5 個回報' }, { status: 429 });
        }

        // 創建 BUG 回報
        const { data: bugReport, error } = await supabaseAdmin
            .from('bug_reports')
            .insert({
                reporter_id: session.user.dbId,
                title: title.trim(),
                description: description.trim(),
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating bug report:', error);
            return NextResponse.json({ error: '提交失敗' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            bugReport: {
                id: bugReport.id,
                title: bugReport.title,
                status: bugReport.status,
                createdAt: bugReport.created_at,
            },
        });
    } catch (error) {
        console.error('Error in POST /api/bug-reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/bug-reports - 獲取自己提交的 BUG 回報
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: bugReports, error } = await supabaseAdmin
            .from('bug_reports')
            .select('id, title, status, created_at')
            .eq('reporter_id', session.user.dbId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching bug reports:', error);
            return NextResponse.json({ error: '取得資料失敗' }, { status: 500 });
        }

        return NextResponse.json(bugReports || []);
    } catch (error) {
        console.error('Error in GET /api/bug-reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
