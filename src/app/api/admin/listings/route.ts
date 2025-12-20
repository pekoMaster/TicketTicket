import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/listings - 取得刊登列表（分頁、搜尋、篩選）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // 建立查詢
    let query = supabaseAdmin
      .from('listings')
      .select(`
        id,
        event_name,
        event_date,
        status,
        total_slots,
        available_slots,
        asking_price_twd,
        ticket_type,
        created_at,
        host:host_id (
          id,
          username,
          email
        )
      `, { count: 'exact' });

    // 搜尋（活動名稱或主辦方暱稱）
    if (search) {
      query = query.or(`event_name.ilike.%${search}%`);
    }

    // 狀態篩選
    if (status && ['open', 'matched', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }

    // 排序
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // 分頁
    query = query.range(offset, offset + limit - 1);

    const { data: listings, count, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    // 取得每個刊登的申請數量
    const listingsWithApplications = await Promise.all(
      (listings || []).map(async (listing) => {
        const { count: applicationsCount } = await supabaseAdmin
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('listing_id', listing.id);

        return {
          ...listing,
          applications_count: applicationsCount || 0,
        };
      })
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      listings: listingsWithApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
