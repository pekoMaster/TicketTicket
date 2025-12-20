import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/users - 取得會員列表（分頁、搜尋）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const isBlacklisted = searchParams.get('isBlacklisted') === 'true';
    const offset = (page - 1) * limit;

    // 取得黑名單 emails
    const { data: blacklistData } = await supabaseAdmin
      .from('blacklist')
      .select('email');
    const blacklistedEmails = new Set((blacklistData || []).map(b => b.email));

    // 建立查詢
    let query = supabaseAdmin
      .from('users')
      .select('id, username, email, avatar_url, custom_avatar_url, rating, review_count, created_at', { count: 'exact' });

    // 搜尋（暱稱或 Email）
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 排序
    query = query.order('created_at', { ascending: false });

    // 分頁
    query = query.range(offset, offset + limit - 1);

    const { data: users, count, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // 取得每個用戶的刊登數量並標記黑名單狀態
    const usersWithDetails = await Promise.all(
      (users || []).map(async (user) => {
        const { count: listingsCount } = await supabaseAdmin
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('host_id', user.id);

        return {
          ...user,
          listings_count: listingsCount || 0,
          is_blacklisted: blacklistedEmails.has(user.email),
        };
      })
    );

    // 如果只顯示黑名單用戶，過濾結果
    const filteredUsers = isBlacklisted
      ? usersWithDetails.filter(u => u.is_blacklisted)
      : usersWithDetails;

    const total = isBlacklisted ? filteredUsers.length : (count || 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
