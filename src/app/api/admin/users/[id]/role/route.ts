import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  requireAdmin,
  requireSuperAdmin,
  isAuthError,
  verifyTransferPassword,
  INITIAL_SUPER_ADMIN,
} from '@/lib/auth-helpers';
import { UserRole } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/users/[id]/role
 * 更新用戶角色
 *
 * 規則：
 * - 副管理員不能編輯主管理員
 * - 副管理員不能授予管理員權限
 * - 轉讓站主需要特殊密碼
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params;
    const body = await request.json();
    const { newRole, transferPassword } = body as {
      newRole: UserRole;
      transferPassword?: string;
    };

    // 驗證參數
    if (!newRole || !['user', 'sub_admin', 'super_admin'].includes(newRole)) {
      return NextResponse.json(
        { error: '無效的角色' },
        { status: 400 }
      );
    }

    // 獲取目標用戶資訊
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, username')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: '找不到用戶' },
        { status: 404 }
      );
    }

    const targetCurrentRole = targetUser.role as UserRole;

    // 特殊情況：轉讓站主權限
    if (newRole === 'super_admin') {
      // 需要驗證轉讓密碼
      if (!transferPassword || !verifyTransferPassword(transferPassword)) {
        return NextResponse.json(
          { error: '轉讓密碼錯誤' },
          { status: 403 }
        );
      }

      // 驗證當前用戶是主管理員
      const authResult = await requireSuperAdmin();
      if (isAuthError(authResult)) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      // 執行站主轉讓
      // 1. 將當前主管理員降為副管理員
      await supabaseAdmin
        .from('users')
        .update({ role: 'sub_admin', updated_at: new Date().toISOString() })
        .eq('id', authResult.userId);

      // 2. 將目標用戶升為主管理員
      await supabaseAdmin
        .from('users')
        .update({ role: 'super_admin', updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      // 記錄日誌
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: authResult.userId,
        action: 'transfer_super_admin',
        target_type: 'user',
        target_id: targetUserId,
        details: {
          target_email: targetUser.email,
          target_username: targetUser.username,
        },
      });

      return NextResponse.json({
        success: true,
        message: '站主權限已轉讓',
      });
    }

    // 一般角色變更
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // 規則檢查
    // 1. 副管理員不能編輯主管理員
    if (!authResult.isSuperAdmin && targetCurrentRole === 'super_admin') {
      return NextResponse.json(
        { error: '副管理員無法編輯主管理員' },
        { status: 403 }
      );
    }

    // 2. 副管理員不能授予管理員權限
    if (!authResult.isSuperAdmin && newRole !== 'user') {
      return NextResponse.json(
        { error: '副管理員無法授予管理員權限' },
        { status: 403 }
      );
    }

    // 3. 不能修改初始主管理員的角色（保護機制）
    // 注意：此處 newRole 只能是 'user' 或 'sub_admin'，因為 'super_admin' 已在上面處理
    if (targetUser.email === INITIAL_SUPER_ADMIN) {
      return NextResponse.json(
        { error: '無法降低初始主管理員的權限' },
        { status: 403 }
      );
    }

    // 執行角色更新
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Update role error:', updateError);
      return NextResponse.json(
        { error: '更新失敗' },
        { status: 500 }
      );
    }

    // 記錄日誌
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: authResult.userId,
      action: 'update_role',
      target_type: 'user',
      target_id: targetUserId,
      details: {
        target_email: targetUser.email,
        target_username: targetUser.username,
        old_role: targetCurrentRole,
        new_role: newRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: newRole === 'sub_admin' ? '已授予副管理員權限' : '已移除管理員權限',
    });

  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: '更新失敗' },
      { status: 500 }
    );
  }
}
