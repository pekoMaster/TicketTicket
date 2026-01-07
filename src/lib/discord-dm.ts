/**
 * Discord Bot DM 通知服務
 * 用於透過 Discord Bot 發送私訊通知
 */

interface SendDMParams {
    discordId: string;
    title: string;
    message: string;
    link?: string;
    type?: 'new_application' | 'application_accepted' | 'application_rejected' | 'new_review' | 'system';
}

/**
 * 發送 Discord DM 通知
 * @returns true if sent successfully, false otherwise
 */
export async function sendDiscordDM(params: SendDMParams): Promise<boolean> {
    const endpoint = process.env.DISCORD_BOT_DM_API;
    const secret = process.env.DISCORD_BOT_DM_SECRET;

    // 如果沒有設定 API，跳過發送
    if (!endpoint || !secret) {
        console.log('[Discord DM] API not configured, skipping');
        return false;
    }

    // 驗證 discordId 是數字（真正的 Discord ID）
    if (!params.discordId || !/^\d+$/.test(params.discordId)) {
        console.log('[Discord DM] Invalid discord ID (not numeric), skipping:', params.discordId);
        return false;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secret}`,
            },
            body: JSON.stringify({
                discordId: params.discordId,
                title: params.title,
                message: params.message,
                link: params.link || 'https://ticketticket.live',
                type: params.type || 'system',
            }),
        });

        if (response.ok) {
            console.log('[Discord DM] Sent successfully to', params.discordId);
            return true;
        } else {
            const error = await response.json();
            console.error('[Discord DM] Failed:', error);
            return false;
        }
    } catch (error) {
        console.error('[Discord DM] Error:', error);
        return false;
    }
}

/**
 * 檢查是否可以發送 Discord DM（用於條件渲染 UI）
 */
export function isDiscordDMEnabled(): boolean {
    return !!(process.env.DISCORD_BOT_DM_API && process.env.DISCORD_BOT_DM_SECRET);
}
