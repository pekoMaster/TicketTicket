import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';

// GET /api/admin/blacklist - 取得黑名單列表
export async function GET() {
  try {
    // 驗證管理員權限
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { data: blacklist, error } = await supabaseAdmin
      .from('blacklist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blacklist:', error);
      return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 });
    }

    return NextResponse.json({ blacklist });
  } catch (error) {
    console.error('Error in GET /api/admin/blacklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
