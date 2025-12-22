import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendVerificationEmail, generateVerificationToken, getTokenExpiration } from '@/lib/email';

// POST /api/auth/send-verification - 發送驗證信
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.dbId;

    // 獲取用戶資料
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, username, verification_level, email_verification_expires')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 檢查是否已經驗證
    if (user.verification_level !== 'unverified') {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // 檢查是否在冷卻時間內（防止濫發）- 使用獨立的冷卻欄位
    // 冷卻時間：1 分鐘
    const COOLDOWN_SECONDS = 60;

    // 獲取上次發送時間（使用 email_verification_sent_at 欄位）
    const { data: cooldownData } = await supabaseAdmin
      .from('users')
      .select('email_verification_sent_at')
      .eq('id', userId)
      .single();

    if (cooldownData?.email_verification_sent_at) {
      const lastSent = new Date(cooldownData.email_verification_sent_at);
      const cooldownEnd = new Date(lastSent.getTime() + COOLDOWN_SECONDS * 1000);
      if (new Date() < cooldownEnd) {
        const waitSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
        return NextResponse.json(
          { error: `請等待 ${waitSeconds} 秒後再試`, waitSeconds },
          { status: 429 }
        );
      }
    }

    // 產生新的驗證 token
    const token = generateVerificationToken();
    const expires = getTokenExpiration();

    // 先發送驗證信（成功後才更新資料庫）
    const result = await sendVerificationEmail(user.email, user.username, token);

    if (!result.success) {
      console.error('Failed to send verification email:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // 發送成功後才更新資料庫
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verification_token: token,
        email_verification_expires: expires.toISOString(),
        email_verification_sent_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to save verification token:', updateError);
      // 郵件已發送，但 token 儲存失敗，用戶需要重新發送
      return NextResponse.json({ error: 'Email sent but failed to save token, please try again' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Error in send-verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
