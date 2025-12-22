import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/auth/verify-phone - 更新電話驗證狀態
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.dbId;
    const body = await request.json();
    const { phoneNumber, phoneCountryCode } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 獲取用戶當前狀態
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('verification_level')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 檢查是否已經是 host
    if (user.verification_level === 'host') {
      return NextResponse.json({ error: 'Phone already verified' }, { status: 400 });
    }

    // 檢查是否已完成 Email 驗證
    if (user.verification_level === 'unverified') {
      return NextResponse.json({
        error: 'Email verification required first',
        currentLevel: 'unverified',
      }, { status: 400 });
    }

    // 檢查電話號碼是否已被其他用戶使用
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .neq('id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json({
        error: 'Phone number already in use',
      }, { status: 400 });
    }

    // 更新用戶驗證狀態
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        verification_level: 'host',
        phone_number: phoneNumber,
        phone_country_code: phoneCountryCode || null,
        phone_verified_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update phone verification:', updateError);
      return NextResponse.json({ error: 'Failed to verify phone' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
      verificationLevel: 'host',
    });
  } catch (error) {
    console.error('Error in verify-phone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
