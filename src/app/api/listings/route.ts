import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { inngest } from '@/lib/inngest';

// GET /api/listings - 獲取所有刊登
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        host:users!host_id(id, username, avatar_url, custom_avatar_url, rating, review_count, line_id, discord_id, show_line, show_discord)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/listings - 新增刊登
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 檢查用戶驗證層級（必須是 host 才能發布刊登）
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('verification_level')
      .eq('id', session.user.dbId)
      .single();

    if (!user || user.verification_level !== 'host') {
      return NextResponse.json({
        error: 'VERIFICATION_REQUIRED',
        message: 'Phone verification required to create listings',
        currentLevel: user?.verification_level || 'unverified',
        requiredLevel: 'host',
      }, { status: 403 });
    }

    const body = await request.json();

    // 獲取活動的刊登上限設定
    const { data: eventData } = await supabaseAdmin
      .from('events')
      .select('id, max_listings_per_user')
      .eq('name', body.eventName)
      .single();

    const maxListingsPerEvent = eventData?.max_listings_per_user || 2;

    // 檢查該用戶在此活動的刊登數量
    const { count: existingCount } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', session.user.dbId)
      .eq('event_name', body.eventName)
      .neq('status', 'closed'); // 不計算已關閉的

    if (existingCount !== null && existingCount >= maxListingsPerEvent) {
      return NextResponse.json({
        error: 'MAX_LISTINGS_REACHED',
        message: `Maximum ${maxListingsPerEvent} listings per event`,
        current: existingCount,
        max: maxListingsPerEvent,
      }, { status: 400 });
    }

    // 準備插入資料
    const insertData: Record<string, unknown> = {
      host_id: session.user.dbId,
      event_id: eventData?.id || null, // 關聯到活動
      event_name: body.eventName,
      artist_tags: body.artistTags || [],
      event_date: body.eventDate,
      venue: body.venue,
      meeting_time: body.meetingTime,
      meeting_location: body.meetingLocation,
      original_price_jpy: 0, // 價格功能已移除，預設為 0
      asking_price_jpy: 0,   // 價格功能已移除，預設為 0
      total_slots: body.totalSlots || 1,
      available_slots: body.totalSlots || 1,
      ticket_type: body.ticketType,
      ticket_source: body.ticketSource || 'zaiko', // 票源預設為 ZAIKO
      seat_grade: body.seatGrade,
      ticket_count_type: body.ticketCountType,
      host_nationality: body.hostNationality,
      host_languages: body.hostLanguages || [],
      identification_features: body.identificationFeatures || '',
      description: body.description || '',
      status: 'open',
      will_assist_entry: body.willAssistEntry || false, // 同行者協助入場
    };

    // 如果是換票類型，添加換票專用欄位
    if (body.ticketType === 'ticket_exchange') {
      insertData.exchange_event_name = body.exchangeEventName || '';
      // 支援新陣列格式和舊單一值格式
      const grades = body.exchangeSeatGrades || (body.exchangeSeatGrade ? [body.exchangeSeatGrade] : []);
      insertData.exchange_seat_grades = grades;
      insertData.exchange_seat_grade = grades.join(','); // 向後相容
      insertData.subsidy_amount = 0;  // 補貼功能已移除，預設為 0
      insertData.subsidy_direction = null; // 補貼功能已移除
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send Discord webhook notifications (background job via Inngest)
    try {
      // Get event's admin webhook URL
      const { data: eventWithWebhook } = await supabaseAdmin
        .from('events')
        .select('id, discord_webhook_url')
        .eq('name', body.eventName)
        .single();

      // Get user subscriptions for this event
      const { data: subscriptions } = await supabaseAdmin
        .from('user_webhook_subscriptions')
        .select('webhook_url, event_id')
        .eq('event_id', eventWithWebhook?.id)
        .eq('is_active', true);

      // Get host info
      const { data: hostInfo } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', session.user.dbId)
        .single();

      // Prepare webhook data
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketticket.live';
      const listingUrl = `${baseUrl}/listing/${data.id}`;

      const ticketTypeLabels: Record<string, string> = {
        find_companion: 'Find Companion',
        sub_ticket_transfer: 'Sub-ticket Transfer',
        ticket_exchange: 'Ticket Exchange',
      };

      const webhookData = {
        eventName: body.eventName,
        listingId: data.id,
        listingTitle: body.description || body.eventName,
        hostName: hostInfo?.username || 'Anonymous',
        eventDate: new Date(body.eventDate).toLocaleDateString('ja-JP'),
        price: 0, // Price feature removed
        ticketType: ticketTypeLabels[body.ticketType] || body.ticketType,
        seatGrade: body.seatGrade || '-',
        listingUrl,
      };

      // Collect all webhooks to send
      const webhooksToSend: Array<{ webhookUrl: string; eventId: string }> = [];

      // Add admin webhook if configured
      if (eventWithWebhook?.discord_webhook_url) {
        webhooksToSend.push({
          webhookUrl: eventWithWebhook.discord_webhook_url,
          eventId: eventWithWebhook.id,
        });
      }

      // Add user subscription webhooks
      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          webhooksToSend.push({
            webhookUrl: sub.webhook_url,
            eventId: sub.event_id,
          });
        }
      }

      // Send webhooks via Inngest (non-blocking)
      if (webhooksToSend.length > 0) {
        await inngest.send({
          name: 'webhook/batch.discord',
          data: {
            webhooks: webhooksToSend,
            ...webhookData,
          },
        });
      }
    } catch (webhookError) {
      // Log but don't fail the request if webhook sending fails
      console.error('Error sending webhooks:', webhookError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
