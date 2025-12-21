import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole, ROLE_HIERARCHY } from '@/types';

// ============================================
// 常數
// ============================================

// 管理員進入密碼
export const ADMIN_PASSWORD = 'pekomura01120717';

// 站主轉讓密碼
export const TRANSFER_PASSWORD = 'Destiny219870818';

// 初始主管理員 Email
export const INITIAL_SUPER_ADMIN = 'lmmlmm16861@gmail.com';

// ============================================
// 權限檢查工具函數
// ============================================

/**
 * 檢查用戶是否有足夠的角色權限
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * 檢查是否為管理員（sub_admin 或 super_admin）
 */
export function isAdmin(role: UserRole | undefined): boolean {
  return hasRole(role, 'sub_admin');
}

/**
 * 檢查是否為主管理員
 */
export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === 'super_admin';
}

// ============================================
// 密碼驗證
// ============================================

/**
 * 驗證管理員密碼
 */
export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

/**
 * 驗證站主轉讓密碼
 */
export function verifyTransferPassword(password: string): boolean {
  return password === TRANSFER_PASSWORD;
}

// ============================================
// API 路由用權限驗證
// ============================================

// Session 類型（簡化版）
interface SessionUser {
  id: string;
  dbId?: string;
  role?: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Session {
  user: SessionUser;
  expires: string;
}

export interface AuthResult {
  session: Session;
  userId: string;
  role: UserRole;
  isSuperAdmin: boolean;
}

export interface AuthError {
  error: string;
  status: number;
}

/**
 * API 路由用：驗證管理員權限
 * 從資料庫獲取最新 role（避免 session 過期問題）
 */
export async function requireAdmin(): Promise<AuthResult | AuthError> {
  const authSession = await auth();

  if (!authSession?.user?.dbId) {
    return { error: 'Unauthorized', status: 401 };
  }

  // 轉換為本地 Session 類型
  const session: Session = {
    user: {
      id: authSession.user.id,
      dbId: authSession.user.dbId,
      role: authSession.user.role,
      name: authSession.user.name,
      email: authSession.user.email,
      image: authSession.user.image,
    },
    expires: authSession.expires || '',
  };

  // 從資料庫獲取最新 role
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', session.user.dbId)
    .single();

  if (error || !user) {
    return { error: 'User not found', status: 404 };
  }

  const role = user.role as UserRole;

  if (!isAdmin(role)) {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return {
    session,
    userId: session.user.dbId!, // 上面已驗證存在
    role,
    isSuperAdmin: role === 'super_admin',
  };
}

/**
 * API 路由用：驗證主管理員權限
 */
export async function requireSuperAdmin(): Promise<AuthResult | AuthError> {
  const result = await requireAdmin();

  if ('error' in result) {
    return result;
  }

  if (!result.isSuperAdmin) {
    return { error: 'Forbidden: Super admin access required', status: 403 };
  }

  return result;
}

/**
 * 檢查是否為錯誤結果
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result;
}
