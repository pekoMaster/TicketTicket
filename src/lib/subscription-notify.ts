/**
 * 訂閱通知系統
 * 當新刊登建立時，查詢符合條件的訂閱並發送通知
 */

import { supabaseAdmin, DbTicketSubscription } from '@/lib/supabase';
import { sendSubscriptionEmail } from '@/lib/email';
import { sendDiscordDM } from '@/lib/discord-dm';

interface ListingInfo {
    id: string;
    eventName: string;
    eventId?: string;
    seatGrade: string;
    ticketCountType: string;
    ticketType: string;
    askingPriceJpy: number;
    venue?: string;
}

const COOLDOWN_MINUTES = 5;

/**
 * 查詢符合條件的訂閱
 */
export async function findMatchingSubscriptions(listing: ListingInfo): Promise<DbTicketSubscription[]> {
    try {
        // 基本查詢：活躍的訂閱且符合活動
        let query = supabaseAdmin
            .from('ticket_subscriptions')
            .select('*')
            .eq('is_active', true)
            .or(`event_name.eq.${listing.eventName},event_id.eq.${listing.eventId}`);

        const { data: subscriptions, error } = await query;

        if (error) {
            console.error('[Subscriptions] Query error:', error);
            return [];
        }

        if (!subscriptions || subscriptions.length === 0) {
            return [];
        }

        // 過濾符合條件的訂閱
        const now = new Date();
        const matchedSubscriptions = subscriptions.filter((sub: DbTicketSubscription) => {
            // 檢查座位等級（空陣列 = 任意）
            if (sub.seat_grades && sub.seat_grades.length > 0) {
                if (!sub.seat_grades.includes(listing.seatGrade) && !sub.seat_grades.includes('any')) {
                    return false;
                }
            }

            // 檢查價格上限（0 = 不限）
            if (sub.max_price_jpy > 0 && listing.askingPriceJpy > sub.max_price_jpy) {
                return false;
            }

            // 檢查票券類型（空陣列 = 任意）
            if (sub.ticket_types && sub.ticket_types.length > 0) {
                if (!sub.ticket_types.includes(listing.ticketType)) {
                    return false;
                }
            }

            // 檢查冷卻時間
            if (sub.last_triggered_at) {
                const lastTriggered = new Date(sub.last_triggered_at);
                const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
                if (now.getTime() - lastTriggered.getTime() < cooldownMs) {
                    return false;
                }
            }

            return true;
        });

        return matchedSubscriptions;
    } catch (error) {
        console.error('[Subscriptions] Exception in findMatchingSubscriptions:', error);
        return [];
    }
}

/**
 * 發送訂閱通知給用戶
 */
export async function notifySubscribers(listing: ListingInfo): Promise<number> {
    const subscriptions = await findMatchingSubscriptions(listing);

    if (subscriptions.length === 0) {
        console.log('[Subscriptions] No matching subscriptions for listing', listing.id);
        return 0;
    }

    console.log(`[Subscriptions] Found ${subscriptions.length} matching subscriptions`);

    let notifiedCount = 0;

    for (const sub of subscriptions) {
        try {
            // 取得用戶資訊
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('email, username, discord_id')
                .eq('id', sub.user_id)
                .single();

            if (!user) continue;

            const listingUrl = `https://ticketticket.live/listing/${listing.id}`;
            const ticketTypeLabels: Record<string, string> = {
                find_companion: '尋找同行',
                sub_ticket_transfer: '子票轉讓',
                ticket_exchange: '換票',
            };

            // Email 通知
            if (sub.notify_email && user.email) {
                try {
                    await sendSubscriptionEmail({
                        to: user.email,
                        subject: `🎫 [TicketTicket] 有符合您訂閱條件的新票券！`,
                        html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">🔔 訂閱通知</h2>
                <p>您好！</p>
                <p>您訂閱的 <strong>${listing.eventName}</strong> 有新的票券上架了：</p>
                
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p>💺 <strong>座位：</strong>${listing.seatGrade} / ${listing.ticketCountType === 'duo' ? '二人票' : '一人票'}</p>
                  <p>💰 <strong>價格：</strong>¥${listing.askingPriceJpy.toLocaleString()}</p>
                  <p>🏷️ <strong>類型：</strong>${ticketTypeLabels[listing.ticketType] || listing.ticketType}</p>
                </div>
                
                <a href="${listingUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                  👉 立即查看
                </a>
                
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  如需管理您的訂閱設定，請前往個人中心。<br>
                  TicketTicket - 找到你的演唱會同行夥伴
                </p>
              </div>
            `,
                    });
                    console.log(`[Subscriptions] Email sent to ${user.email}`);
                } catch (emailError) {
                    console.error('[Subscriptions] Email error:', emailError);
                }
            }

            // Discord DM 通知
            if (sub.notify_discord && user.discord_id) {
                try {
                    await sendDiscordDM({
                        discordId: user.discord_id,
                        title: '🔔 訂閱通知',
                        message: `您訂閱的 **${listing.eventName}** 有新的票券！\n\n💺 ${listing.seatGrade} / ${listing.ticketCountType === 'duo' ? '二人票' : '一人票'}\n💰 ¥${listing.askingPriceJpy.toLocaleString()}\n🏷️ ${ticketTypeLabels[listing.ticketType] || listing.ticketType}`,
                        link: listingUrl,
                        type: 'new_application',
                    });
                    console.log(`[Subscriptions] Discord DM sent to ${user.discord_id}`);
                } catch (discordError) {
                    console.error('[Subscriptions] Discord error:', discordError);
                }
            }

            // In-app 通知（寫入 notifications 表）
            try {
                await supabaseAdmin.from('notifications').insert({
                    user_id: sub.user_id,
                    type: 'subscription_match',
                    title: `🔔 有符合您訂閱的新票券！`,
                    message: `${listing.eventName} - ${listing.seatGrade} / ¥${listing.askingPriceJpy.toLocaleString()}`,
                    link: listingUrl,
                    is_read: false,
                });
                console.log(`[Subscriptions] In-app notification created for user ${sub.user_id}`);
            } catch (inAppError) {
                console.error('[Subscriptions] In-app notification error:', inAppError);
            }

            // 更新訂閱觸發時間和次數
            await supabaseAdmin
                .from('ticket_subscriptions')
                .update({
                    last_triggered_at: new Date().toISOString(),
                    triggered_count: sub.triggered_count + 1,
                })
                .eq('id', sub.id);

            notifiedCount++;
        } catch (subError) {
            console.error(`[Subscriptions] Error notifying subscription ${sub.id}:`, subError);
        }
    }

    console.log(`[Subscriptions] Notified ${notifiedCount} subscribers for listing ${listing.id}`);
    return notifiedCount;
}
