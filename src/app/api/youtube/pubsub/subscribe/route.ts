import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const PUBSUB_API_KEY = process.env.YOUTUBE_PUBSUB_API_KEY || '';
const PUBSUB_SECRET = process.env.YOUTUBE_PUBSUB_SECRET || '';
const GOOGLE_HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
const CALLBACK_URL = 'https://ticketticket.live/api/youtube/pubsub';
const LEASE_SECONDS = 432000; // 5 天

// ============================================================
// 驗證 API Key（Bot 呼叫時使用）
// ============================================================
function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !PUBSUB_API_KEY) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === PUBSUB_API_KEY;
}

// ============================================================
// POST: 新增訂閱
// Body: { channelId, channelName?, discordChannelId, discordGuildId?, customMessage?, createdBy? }
// ============================================================
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { channelId, channelName, discordChannelId, discordGuildId, customMessage, createdBy } =
      body;

    if (!channelId || !discordChannelId) {
      return NextResponse.json(
        { error: 'channelId and discordChannelId are required' },
        { status: 400 }
      );
    }

    // 檢查是否已訂閱（同一 YT 頻道 + 同一 Discord 頻道）
    const { data: existing } = await supabaseAdmin
      .from('youtube_pubsub_subscriptions')
      .select('id')
      .eq('youtube_channel_id', channelId)
      .eq('discord_channel_id', discordChannelId)
      .eq('is_active', true)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already subscribed', subscription_id: existing.id },
        { status: 409 }
      );
    }

    // 生成此訂閱的 HMAC secret
    const hubSecret = PUBSUB_SECRET || randomBytes(32).toString('hex');

    // 向 Google Hub 發送訂閱請求
    const topicUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const hubResponse = await fetch(GOOGLE_HUB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.topic': topicUrl,
        'hub.callback': CALLBACK_URL,
        'hub.verify': 'async',
        'hub.secret': hubSecret,
        'hub.lease_seconds': LEASE_SECONDS.toString(),
      }).toString(),
    });

    if (!hubResponse.ok) {
      const errorText = await hubResponse.text();
      console.error(`[YT PubSub] Hub subscribe error ${hubResponse.status}: ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to subscribe at Google Hub', details: errorText },
        { status: 502 }
      );
    }

    // 儲存到資料庫
    const { data: subscription, error: insertError } = await supabaseAdmin
      .from('youtube_pubsub_subscriptions')
      .insert({
        youtube_channel_id: channelId,
        youtube_channel_name: channelName || null,
        discord_channel_id: discordChannelId,
        discord_guild_id: discordGuildId || null,
        custom_message: customMessage || null,
        hub_secret: hubSecret,
        expires_at: new Date(Date.now() + LEASE_SECONDS * 1000).toISOString(),
        is_active: true,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[YT PubSub] DB insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    console.log(
      `[YT PubSub] Subscription created: ${channelId} → Discord ${discordChannelId}`
    );

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        youtube_channel_id: channelId,
        youtube_channel_name: channelName,
        discord_channel_id: discordChannelId,
        expires_at: subscription.expires_at,
      },
    });
  } catch (error) {
    console.error('[YT PubSub] Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// DELETE: 取消訂閱
// Query: ?subscriptionId=xxx 或 ?channelId=xxx&discordChannelId=xxx
// ============================================================
export async function DELETE(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get('subscriptionId');
    const channelId = searchParams.get('channelId');
    const discordChannelId = searchParams.get('discordChannelId');

    // 查找訂閱記錄
    let query = supabaseAdmin
      .from('youtube_pubsub_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (subscriptionId) {
      query = query.eq('id', subscriptionId);
    } else if (channelId && discordChannelId) {
      query = query.eq('youtube_channel_id', channelId).eq('discord_channel_id', discordChannelId);
    } else {
      return NextResponse.json(
        { error: 'subscriptionId or (channelId + discordChannelId) required' },
        { status: 400 }
      );
    }

    const { data: subscription } = await query.single();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // 向 Google Hub 發送取消訂閱請求
    const topicUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${subscription.youtube_channel_id}`;

    // 檢查同一 YT 頻道是否還有其他 Discord 頻道訂閱中
    const { data: otherSubs } = await supabaseAdmin
      .from('youtube_pubsub_subscriptions')
      .select('id')
      .eq('youtube_channel_id', subscription.youtube_channel_id)
      .eq('is_active', true)
      .neq('id', subscription.id);

    // 只在沒有其他訂閱時才向 Hub 取消
    if (!otherSubs || otherSubs.length === 0) {
      await fetch(GOOGLE_HUB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'hub.mode': 'unsubscribe',
          'hub.topic': topicUrl,
          'hub.callback': CALLBACK_URL,
        }).toString(),
      });
    }

    // 標記為停用
    await supabaseAdmin
      .from('youtube_pubsub_subscriptions')
      .update({ is_active: false })
      .eq('id', subscription.id);

    console.log(
      `[YT PubSub] Unsubscribed: ${subscription.youtube_channel_id} from Discord ${subscription.discord_channel_id}`
    );

    return NextResponse.json({ success: true, unsubscribed: subscription.id });
  } catch (error) {
    console.error('[YT PubSub] Unsubscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// GET: 查詢訂閱列表
// Query: ?guildId=xxx 或 ?discordChannelId=xxx
// ============================================================
export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const guildId = searchParams.get('guildId');
    const discordChannelId = searchParams.get('discordChannelId');

    let query = supabaseAdmin
      .from('youtube_pubsub_subscriptions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (guildId) {
      query = query.eq('discord_guild_id', guildId);
    }
    if (discordChannelId) {
      query = query.eq('discord_channel_id', discordChannelId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('[YT PubSub] Query error:', error);
      return NextResponse.json({ error: 'Failed to query subscriptions' }, { status: 500 });
    }

    return NextResponse.json({
      subscriptions: (subscriptions || []).map((sub) => ({
        id: sub.id,
        youtube_channel_id: sub.youtube_channel_id,
        youtube_channel_name: sub.youtube_channel_name,
        discord_channel_id: sub.discord_channel_id,
        custom_message: sub.custom_message,
        expires_at: sub.expires_at,
        notification_count: sub.notification_count,
        last_notified_at: sub.last_notified_at,
        created_at: sub.created_at,
      })),
    });
  } catch (error) {
    console.error('[YT PubSub] List error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
