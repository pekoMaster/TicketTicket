import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/users/[id] - 獲取用戶資訊
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 獲取用戶基本資訊
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, avatar_url, custom_avatar_url, rating, review_count, is_verified, created_at, line_id, discord_id, show_line, show_discord, verification_level, email_verified_at, phone_verified_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // 計算成功同行次數（作為主辦方已完成的配對 + 作為申請者已接受的申請）
    // 方式：計算狀態為 closed 的 listings 數量（作為主辦方）
    const { count: hostMeetups } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', id)
      .eq('status', 'closed');

    // 計算作為申請者已被接受並且活動已結束的數量
    const { count: guestMeetups } = await supabaseAdmin
      .from('applications')
      .select('*, listing:listings!listing_id(event_date, status)', { count: 'exact', head: true })
      .eq('guest_id', id)
      .eq('status', 'accepted');

    const successfulMeetups = (hostMeetups || 0) + (guestMeetups || 0);

    return NextResponse.json({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      customAvatarUrl: user.custom_avatar_url,
      rating: user.rating,
      reviewCount: user.review_count,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      lineId: user.line_id,
      discordId: user.discord_id,
      showLine: user.show_line,
      showDiscord: user.show_discord,
      successfulMeetups,
      // 驗證層級資訊
      verification_level: user.verification_level || 'unverified',
      emailVerifiedAt: user.email_verified_at,
      phoneVerifiedAt: user.phone_verified_at,
    });
  } catch (error) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
