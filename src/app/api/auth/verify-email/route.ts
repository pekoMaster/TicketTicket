import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/auth/verify-email - 驗證 Email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 查找擁有此 token 的用戶
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, username, verification_level, email_verification_expires')
      .eq('email_verification_token', token)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // 檢查是否已經驗證
    if (user.verification_level !== 'unverified') {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // 檢查 token 是否過期
    if (user.email_verification_expires) {
      const expires = new Date(user.email_verification_expires);
      if (new Date() > expires) {
        return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
      }
    }

    // 更新驗證狀態
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        verification_level: 'applicant',
        email_verified_at: new Date().toISOString(),
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update verification status:', updateError);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      username: user.username,
    });
  } catch (error) {
    console.error('Error in verify-email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/auth/verify-email - 透過 URL 參數驗證（從信件連結）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?error=missing_token', request.url));
  }

  // 查找擁有此 token 的用戶
  const { data: user, error: findError } = await supabaseAdmin
    .from('users')
    .select('id, verification_level, email_verification_expires')
    .eq('email_verification_token', token)
    .single();

  if (findError || !user) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid_token', request.url));
  }

  // 檢查是否已經驗證
  if (user.verification_level !== 'unverified') {
    return NextResponse.redirect(new URL('/verify-email?error=already_verified', request.url));
  }

  // 檢查 token 是否過期
  if (user.email_verification_expires) {
    const expires = new Date(user.email_verification_expires);
    if (new Date() > expires) {
      return NextResponse.redirect(new URL('/verify-email?error=expired_token', request.url));
    }
  }

  // 更新驗證狀態
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      verification_level: 'applicant',
      email_verified_at: new Date().toISOString(),
      email_verification_token: null,
      email_verification_expires: null,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to update verification status:', updateError);
    return NextResponse.redirect(new URL('/verify-email?error=update_failed', request.url));
  }

  // 驗證成功，重定向到成功頁面
  return NextResponse.redirect(new URL('/verify-email?success=true', request.url));
}
