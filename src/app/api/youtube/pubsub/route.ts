import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { createHmac } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const PUBSUB_SECRET = process.env.YOUTUBE_PUBSUB_SECRET || '';
// 使用 RPG Bot 的 Token（與票票網自己的 Bot 分開）
const DISCORD_BOT_TOKEN = process.env.DISCORD_RPG_BOT_TOKEN || '';

// ============================================================
// GET: Hub 驗證回呼
// Google Hub 訂閱/取消訂閱時會 GET 此端點進行驗證
// 必須回傳 hub.challenge 的值
// ============================================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const topic = searchParams.get('hub.topic');
  const challenge = searchParams.get('hub.challenge');
  const leaseSeconds = searchParams.get('hub.lease_seconds');

  console.log(`[YT PubSub] Hub verification: mode=${mode}, topic=${topic}, lease=${leaseSeconds}`);

  if (!challenge) {
    return new NextResponse('Missing hub.challenge', { status: 400 });
  }

  // 如果是訂閱確認，更新資料庫中的過期時間
  if (mode === 'subscribe' && topic && leaseSeconds) {
    const channelIdMatch = topic.match(/channel_id=([^&]+)/);
    if (channelIdMatch) {
      const channelId = channelIdMatch[1];
      const expiresAt = new Date(Date.now() + parseInt(leaseSeconds) * 1000).toISOString();

      await supabaseAdmin
        .from('youtube_pubsub_subscriptions')
        .update({
          expires_at: expiresAt,
          is_active: true,
        })
        .eq('youtube_channel_id', channelId)
        .eq('is_active', true);

      console.log(`[YT PubSub] Subscription confirmed: ${channelId}, expires: ${expiresAt}`);
    }
  }

  // 如果是取消訂閱確認
  if (mode === 'unsubscribe' && topic) {
    const channelIdMatch = topic.match(/channel_id=([^&]+)/);
    if (channelIdMatch) {
      console.log(`[YT PubSub] Unsubscription confirmed: ${channelIdMatch[1]}`);
    }
  }

  // 回傳 challenge（純文字，非 JSON）
  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ============================================================
// POST: 接收 YouTube 推播通知
// Google Hub 在 YouTube 頻道有新影片/更新時 POST Atom XML
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // HMAC 簽名驗證
    const signature = request.headers.get('x-hub-signature');
    if (PUBSUB_SECRET && signature) {
      const expectedSignature =
        'sha1=' + createHmac('sha1', PUBSUB_SECRET).update(body).digest('hex');

      if (signature !== expectedSignature) {
        console.warn('[YT PubSub] HMAC signature mismatch');
        return new NextResponse('Invalid signature', { status: 403 });
      }
    }

    // 解析 Atom XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const parsed = parser.parse(body);

    // 提取 entry（可能是單個或多個）
    const feed = parsed.feed;
    if (!feed) {
      console.warn('[YT PubSub] No feed element in payload');
      return new NextResponse('OK', { status: 200 });
    }

    const entries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];

    if (entries.length === 0) {
      // 可能是 deleted-entry（影片被刪除的通知）
      console.log('[YT PubSub] No entries in feed (possibly deletion notification)');
      return new NextResponse('OK', { status: 200 });
    }

    for (const entry of entries) {
      const videoId = entry['yt:videoId'];
      const channelId = entry['yt:channelId'];
      const title = entry.title;
      const link = entry.link?.['@_href'] || `https://www.youtube.com/watch?v=${videoId}`;
      const published = entry.published;
      const updated = entry.updated;

      console.log(
        `[YT PubSub] Notification: videoId=${videoId}, channelId=${channelId}, title=${title}`
      );

      if (!videoId || !channelId) {
        console.warn('[YT PubSub] Missing videoId or channelId, skipping entry');
        continue;
      }

      // 去重檢查：同一影片只通知一次
      const { data: existing } = await supabaseAdmin
        .from('youtube_pubsub_notifications')
        .select('id')
        .eq('video_id', videoId)
        .eq('channel_id', channelId)
        .single();

      if (existing) {
        console.log(`[YT PubSub] Duplicate notification skipped: ${videoId}`);
        continue;
      }

      // 記錄通知（去重用）
      await supabaseAdmin.from('youtube_pubsub_notifications').insert({
        video_id: videoId,
        channel_id: channelId,
        title: title || 'Unknown Title',
        link,
        published_at: published || updated || new Date().toISOString(),
      });

      // 查詢該頻道的所有 Discord 通知訂閱
      const { data: subscriptions } = await supabaseAdmin
        .from('youtube_pubsub_subscriptions')
        .select('*')
        .eq('youtube_channel_id', channelId)
        .eq('is_active', true);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`[YT PubSub] No active subscriptions for channel: ${channelId}`);
        continue;
      }

      // 發送 Discord 通知到所有訂閱的頻道
      for (const sub of subscriptions) {
        await sendDiscordNotification(sub, {
          videoId,
          channelId,
          title: title || 'New Video',
          link,
          published: published || updated,
          channelName: sub.youtube_channel_name || channelId,
        });

        // 更新訂閱統計
        await supabaseAdmin
          .from('youtube_pubsub_subscriptions')
          .update({
            last_notified_at: new Date().toISOString(),
            notification_count: (sub.notification_count || 0) + 1,
          })
          .eq('id', sub.id);
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[YT PubSub] Error processing notification:', error);
    return new NextResponse('Internal Error', { status: 200 }); // 回 200 避免 Hub 重試
  }
}

// ============================================================
// 發送 Discord 通知
// ============================================================
async function sendDiscordNotification(
  subscription: {
    discord_channel_id: string;
    custom_message?: string;
    youtube_channel_name?: string;
  },
  video: {
    videoId: string;
    channelId: string;
    title: string;
    link: string;
    published?: string;
    channelName: string;
  }
) {
  if (!DISCORD_BOT_TOKEN) {
    console.error('[YT PubSub] DISCORD_BOT_TOKEN not set, cannot send notification');
    return;
  }

  const embed = {
    color: 0xff0000, // YouTube 紅
    author: {
      name: video.channelName,
      url: `https://www.youtube.com/channel/${video.channelId}`,
      icon_url: `https://www.youtube.com/s/desktop/icon.png`,
    },
    title: video.title,
    url: video.link,
    thumbnail: {
      url: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
    },
    fields: video.published
      ? [
          {
            name: '📅 發布時間',
            value: `<t:${Math.floor(new Date(video.published).getTime() / 1000)}:R>`,
            inline: true,
          },
        ]
      : [],
    footer: {
      text: 'YouTube PubSub 即時通知',
    },
    timestamp: new Date().toISOString(),
  };

  // 組裝訊息內容
  const content = subscription.custom_message
    ? subscription.custom_message
        .replace('{channel}', video.channelName)
        .replace('{title}', video.title)
        .replace('{url}', video.link)
    : undefined;

  const payload: Record<string, unknown> = { embeds: [embed] };
  if (content) {
    payload.content = content;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${subscription.discord_channel_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[YT PubSub] Discord API error ${response.status}: ${errorText}`
      );
    } else {
      console.log(
        `[YT PubSub] Notification sent to Discord channel ${subscription.discord_channel_id}`
      );
    }
  } catch (error) {
    console.error('[YT PubSub] Failed to send Discord notification:', error);
  }
}
