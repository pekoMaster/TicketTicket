import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const PUBSUB_SECRET = process.env.YOUTUBE_PUBSUB_SECRET || '';
const GOOGLE_HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
const CALLBACK_URL = 'https://ticketticket.live/api/youtube/pubsub';
const LEASE_SECONDS = 432000; // 5 天

// ============================================================
// GET: 自動續訂 Cron（Vercel Cron 觸發）
// 查詢 48 小時內即將過期的訂閱，重新發送訂閱請求
// ============================================================
export async function GET() {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 小時後

    // 查詢即將過期或已過期但仍 active 的訂閱
    const { data: subscriptions, error } = await supabaseAdmin
      .from('youtube_pubsub_subscriptions')
      .select('*')
      .eq('is_active', true)
      .lt('expires_at', threshold.toISOString());

    if (error) {
      console.error('[YT PubSub Renew] Query error:', error);
      return NextResponse.json({ error: 'Failed to query subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[YT PubSub Renew] No subscriptions need renewal');
      return NextResponse.json({ renewed: 0, message: 'No subscriptions need renewal' });
    }

    console.log(`[YT PubSub Renew] ${subscriptions.length} subscriptions need renewal`);

    // 按 youtube_channel_id 分組（同一 YT 頻道只需向 Hub 發送一次）
    const channelGroups = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = channelGroups.get(sub.youtube_channel_id) || [];
      existing.push(sub);
      channelGroups.set(sub.youtube_channel_id, existing);
    }

    let renewedCount = 0;
    let failedCount = 0;

    for (const [channelId, subs] of channelGroups) {
      const topicUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const hubSecret = subs[0].hub_secret || PUBSUB_SECRET;

      try {
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

        if (hubResponse.ok) {
          // 更新所有相關訂閱的過期時間
          const newExpiresAt = new Date(Date.now() + LEASE_SECONDS * 1000).toISOString();
          const ids = subs.map((s) => s.id);

          await supabaseAdmin
            .from('youtube_pubsub_subscriptions')
            .update({ expires_at: newExpiresAt })
            .in('id', ids);

          renewedCount += subs.length;
          console.log(`[YT PubSub Renew] Renewed ${channelId} (${subs.length} subscriptions)`);
        } else {
          failedCount += subs.length;
          const errorText = await hubResponse.text();
          console.error(
            `[YT PubSub Renew] Failed to renew ${channelId}: ${hubResponse.status} ${errorText}`
          );
        }
      } catch (err) {
        failedCount += subs.length;
        console.error(`[YT PubSub Renew] Error renewing ${channelId}:`, err);
      }

      // 避免過於頻繁的請求
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const result = {
      renewed: renewedCount,
      failed: failedCount,
      total: subscriptions.length,
      timestamp: now.toISOString(),
    };

    console.log(`[YT PubSub Renew] Complete:`, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[YT PubSub Renew] Cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
