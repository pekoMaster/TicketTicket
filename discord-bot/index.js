/**
 * TicketTicket Discord Bot
 * 用於發送 DM 通知給已連接 Discord 的用戶
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// ========== 設定 ==========
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_SECRET = process.env.DM_API_SECRET || 'ticketticket-dm-secret-2026';
const API_PORT = process.env.DM_API_PORT || 3001;

// ========== Discord Client ==========
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ========== Express API ==========
const app = express();
app.use(express.json());

// 驗證 middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${API_SECRET}`) {
        console.log('[API] 未授權的請求');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// 健康檢查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        bot: client.user ? client.user.tag : 'Not connected',
        timestamp: new Date().toISOString()
    });
});

// 發送 DM 端點
app.post('/api/dm', authMiddleware, async (req, res) => {
    const { discordId, title, message, link, type } = req.body;

    if (!discordId) {
        return res.status(400).json({ error: 'discordId is required' });
    }

    // 驗證 discordId 是數字格式
    if (!/^\d+$/.test(discordId)) {
        return res.status(400).json({ error: 'discordId must be numeric' });
    }

    try {
        const user = await client.users.fetch(discordId);

        // 通知類型對應的顏色
        const colors = {
            new_application: 0x22c55e,       // 綠色 - 收到新申請
            application_accepted: 0x6366f1,  // 紫色 - 申請被接受
            application_rejected: 0xef4444,  // 紅色 - 申請被拒絕
            new_review: 0xeab308,            // 黃色 - 收到新評價
            new_message: 0x3b82f6,           // 藍色 - 新訊息
            system: 0x64748b,                // 灰色 - 系統通知
        };

        // 通知類型對應的 emoji
        const emojis = {
            new_application: '📥',
            application_accepted: '✅',
            application_rejected: '❌',
            new_review: '⭐',
            new_message: '💬',
            system: '📢',
        };

        const emoji = emojis[type] || '🎫';

        await user.send({
            embeds: [{
                title: `${emoji} ${title || 'TicketTicket 通知'}`,
                description: message || '',
                color: colors[type] || 0x6366f1,
                url: link || 'https://ticketticket.live',
                footer: {
                    text: 'TicketTicket - 找到你的演唱會同行夥伴'
                },
                timestamp: new Date().toISOString()
            }]
        });

        console.log(`[DM] 成功發送給 ${user.tag} (${discordId})`);
        res.json({ success: true, recipient: user.tag });

    } catch (error) {
        console.error('[DM] 發送失敗:', error.message);

        if (error.code === 50007) {
            return res.status(400).json({
                error: 'Cannot send DM to this user',
                code: 'DM_DISABLED'
            });
        } else if (error.code === 10013) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.status(500).json({ error: error.message });
    }
});

// 發送頻道訊息端點（用於新刊登通知）
app.post('/api/channel', authMiddleware, async (req, res) => {
    const { channelId, listing } = req.body;

    if (!channelId || !listing) {
        return res.status(400).json({ error: 'channelId and listing are required' });
    }

    try {
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({ error: 'Channel not found or not a text channel' });
        }

        // 票種類型對應的顏色和標籤
        const ticketTypeInfo = {
            find_companion: { color: 0x3b82f6, label: '🤝 尋找同行者', emoji: '🎫' },
            sub_ticket_transfer: { color: 0x22c55e, label: '🎟️ 子票轉讓', emoji: '🎟️' },
            ticket_exchange: { color: 0xf59e0b, label: '🔄 換票', emoji: '🔄' },
        };

        const typeInfo = ticketTypeInfo[listing.ticketType] || { color: 0x6366f1, label: '🎫 票券', emoji: '🎫' };

        // 構建 Embed
        const embed = {
            title: `${typeInfo.emoji} ${listing.eventName}`,
            description: listing.description || '快來看看這個刊登！',
            color: typeInfo.color,
            url: `https://ticketticket.live/listing/${listing.id}`,
            fields: [
                {
                    name: '📍 場地',
                    value: listing.venue || '待定',
                    inline: true,
                },
                {
                    name: '🎫 類型',
                    value: typeInfo.label,
                    inline: true,
                },
                {
                    name: '💺 座位',
                    value: `${listing.seatGrade} / ${listing.ticketCountType === 'duo' ? '二人票' : '一人票'}`,
                    inline: true,
                },
                {
                    name: '💰 希望價格',
                    value: `¥${listing.askingPriceJpy?.toLocaleString() || 0}`,
                    inline: true,
                },
            ],
            footer: {
                text: 'TicketTicket - 找到你的演唱會同行夥伴',
            },
            timestamp: new Date().toISOString(),
        };

        await channel.send({ embeds: [embed] });

        console.log(`[Channel] 成功發送到頻道 ${channelId}`);
        res.json({ success: true, channelId });

    } catch (error) {
        console.error('[Channel] 發送失敗:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== 啟動 ==========
async function start() {
    // 檢查 Token
    if (!BOT_TOKEN) {
        console.error('❌ 錯誤: 未設定 DISCORD_BOT_TOKEN');
        console.log('請在 .env 檔案中設定 Bot Token');
        process.exit(1);
    }

    try {
        // 連接 Discord
        console.log('正在連接 Discord...');
        await client.login(BOT_TOKEN);
        console.log(`✅ 已登入為: ${client.user.tag}`);

        // 啟動 API 伺服器
        app.listen(API_PORT, '0.0.0.0', () => {
            console.log(`✅ API 伺服器已啟動: http://0.0.0.0:${API_PORT}`);
            console.log('');
            console.log('📡 端點:');
            console.log(`   GET  /health      - 健康檢查`);
            console.log(`   POST /api/dm      - 發送 DM`);
            console.log(`   POST /api/channel - 發送頻道訊息`);
            console.log('');
            console.log('🎫 TicketTicket Discord Bot 已就緒!');
        });

    } catch (error) {
        console.error('❌ 啟動失敗:', error.message);
        process.exit(1);
    }
}

// 優雅關閉
process.on('SIGINT', async () => {
    console.log('\n正在關閉...');
    await client.destroy();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('未捕獲的異常:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('未處理的 Promise 拒絕:', error);
});

// 啟動 Bot
start();
