/**
 * LINE Messaging API 通知服務
 * 用於透過 LINE Bot 發送推播通知給使用者
 */

interface SendLineMessageParams {
    lineId: string;
    title: string;
    message: string;
    link?: string;
    type?: string;
}

/**
 * 發送 LINE 推播訊息 (Push Message)
 * @returns true if sent successfully, false otherwise
 */
export async function sendLineMessage(params: SendLineMessageParams): Promise<boolean> {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    // 如果沒有設定 Access Token，跳過發送
    if (!channelAccessToken) {
        console.log('[LINE Message] LINE_CHANNEL_ACCESS_TOKEN not configured, skipping');
        return false;
    }

    if (!params.lineId) {
        console.log('[LINE Message] Invalid lineId, skipping');
        return false;
    }

    try {
        // 組成 LINE Flex Message 或簡單 Text Message
        // 這裡為了確保高相容性，我們先使用 Text Message 附帶連結的方式
        const textContent = `【${params.title}】\n\n${params.message}${params.link ? `\n\n查看詳情：\n${params.link}` : ''}`;

        const payload = {
            to: params.lineId,
            messages: [
                {
                    type: "text",
                    text: textContent
                }
            ]
        };

        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            console.log('[LINE Message] Sent successfully to', params.lineId);
            return true;
        } else {
            const errorText = await response.text();
            console.error('[LINE Message] Failed:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('[LINE Message] Error:', error);
        return false;
    }
}

/**
 * 檢查是否可以發送 LINE 訊息（用於條件渲染 UI）
 */
export function isLineNotificationEnabled(): boolean {
    return !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
}
