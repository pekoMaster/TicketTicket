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

    // 檢查是否在冷卻時間內（防止濫發）
    if (user.email_verification_expires) {
      const expires = new Date(user.email_verification_expires);
      const cooldown = new Date(expires.getTime() - 23 * 60 * 60 * 1000); // 發送後 1 小時內不能重發
      if (new Date() < cooldown) {
        const waitMinutes = Math.ceil((cooldown.getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { error: `Please wait ${waitMinutes} minutes before requesting again` },
          { status: 429 }
        );
      }
    }

    // 產生新的驗證 token
    const token = generateVerificationToken();
    const expires = getTokenExpiration();

    // 更新資料庫
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verification_token: token,
        email_verification_expires: expires.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to save verification token:', updateError);
      return NextResponse.json({ error: 'Failed to generate verification' }, { status: 500 });
    }

    // 發送驗證信
    const result = await sendVerificationEmail(user.email, user.username, token);

    if (!result.success) {
      console.error('Failed to send verification email:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Error in send-verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
