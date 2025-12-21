import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminPassword, isAdmin } from '@/lib/auth-helpers';
import { UserRole } from '@/types';

/**
 * POST /api/admin/verify
 * 驗證管理員密碼並檢查用戶角色
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.dbId) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    // 驗證密碼
    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: '密碼錯誤' },
        { status: 401 }
      );
    }

    // 從資料庫獲取最新角色
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.dbId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '找不到用戶' },
        { status: 404 }
      );
    }

    const role = user.role as UserRole;

    // 檢查是否有管理員權限
    if (!isAdmin(role)) {
      return NextResponse.json(
        { error: '您沒有管理員權限' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      role,
      isSuperAdmin: role === 'super_admin',
    });

  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: '驗證失敗' },
      { status: 500 }
    );
  }
}
