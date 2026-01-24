import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '@/types';

// 共用的用戶資料格式化函數
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatUserResponse(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatar_url,
    customAvatarUrl: user.custom_avatar_url,
    rating: parseFloat(user.rating) || 0,
    reviewCount: user.review_count || 0,
    isVerified: user.is_verified,
    verificationLevel: user.verification_level || 'unverified',
    phoneCountryCode: user.phone_country_code,
    phoneNumber: user.phone_number,
    lineId: user.line_id,
    discordId: user.discord_id,
    showLine: user.show_line,
    showDiscord: user.show_discord,
    notificationPreferences: user.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
    createdAt: user.created_at,
  };
}

// GET /api/profile - 取得當前用戶資料
export async function GET() {
  const session = await auth();

  if (!session?.user?.dbId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user.dbId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      // 如果用戶在資料庫中不存在（已被刪除），回傳特殊錯誤讓前端清除 session
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'user_deleted', message: '此帳號已被刪除，請重新註冊' },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: '取得用戶資料失敗' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'user_deleted', message: '此帳號已被刪除，請重新註冊' },
        { status: 401 }
      );
    }

    return NextResponse.json(formatUserResponse(user));
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}


// PATCH /api/profile - 更新用戶資料
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.dbId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      username,
      customAvatarUrl,
      phoneCountryCode,
      phoneNumber,
      lineId,
      discordId,
      showLine,
      showDiscord,
      notificationPreferences,
    } = body;

    // 建立更新資料
    const updateData: Record<string, unknown> = {};

    if (username !== undefined) {
      if (!username || username.trim().length < 1) {
        return NextResponse.json({ error: '名稱不能為空' }, { status: 400 });
      }
      if (username.length > 50) {
        return NextResponse.json({ error: '名稱不能超過 50 字' }, { status: 400 });
      }
      updateData.username = username.trim();
    }

    if (customAvatarUrl !== undefined) {
      updateData.custom_avatar_url = customAvatarUrl;
    }

    if (phoneCountryCode !== undefined) {
      updateData.phone_country_code = phoneCountryCode;
    }

    if (phoneNumber !== undefined) {
      // 簡單驗證電話號碼格式
      if (phoneNumber && !/^[0-9]{6,15}$/.test(phoneNumber.replace(/[\s-]/g, ''))) {
        return NextResponse.json({ error: '電話號碼格式不正確' }, { status: 400 });
      }
      updateData.phone_number = phoneNumber ? phoneNumber.replace(/[\s-]/g, '') : null;
    }

    if (lineId !== undefined) {
      if (lineId && lineId.length > 100) {
        return NextResponse.json({ error: 'LINE ID 不能超過 100 字' }, { status: 400 });
      }
      updateData.line_id = lineId || null;
    }

    if (discordId !== undefined) {
      if (discordId && discordId.length > 100) {
        return NextResponse.json({ error: 'Discord ID 不能超過 100 字' }, { status: 400 });
      }
      updateData.discord_id = discordId || null;
    }

    if (showLine !== undefined) {
      updateData.show_line = Boolean(showLine);
    }

    if (showDiscord !== undefined) {
      updateData.show_discord = Boolean(showDiscord);
    }

    if (notificationPreferences !== undefined) {
      // 驗證通知偏好設定格式
      if (typeof notificationPreferences !== 'object') {
        return NextResponse.json({ error: '通知偏好設定格式不正確' }, { status: 400 });
      }
      // 合併現有設定與新設定（允許部分更新）
      const validTypes = ['new_application', 'application_accepted', 'application_rejected', 'subscription_match', 'new_review', 'listing_expired', 'system'];
      const sanitizedPrefs: Partial<NotificationPreferences> = {};
      for (const type of validTypes) {
        if (notificationPreferences[type]) {
          sanitizedPrefs[type as keyof NotificationPreferences] = {
            email: Boolean(notificationPreferences[type].email),
            discord: Boolean(notificationPreferences[type].discord),
            line: Boolean(notificationPreferences[type].line),
          };
        }
      }
      if (Object.keys(sanitizedPrefs).length > 0) {
        updateData.notification_preferences = JSON.stringify({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...sanitizedPrefs,
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '沒有要更新的資料' }, { status: 400 });
    }

    // 執行更新
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', session.user.dbId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: '更新用戶資料失敗' }, { status: 500 });
    }

    return NextResponse.json(formatUserResponse(updatedUser));
  } catch (error) {
    console.error('Error in PATCH /api/profile:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
