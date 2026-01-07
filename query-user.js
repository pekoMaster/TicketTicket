// 測試 TicketTicket Discord Bot Token
require('dotenv').config({ path: '.env.local' });
const { Client, GatewayIntentBits } = require('discord.js');

async function testBot() {
    // 這個是 OAuth Client ID，不是 Bot Token
    // OAuth 應用和 Bot 是不同的
    // 需要進入 Developer Portal 查看這個應用是否有啟用 Bot

    console.log('Application ID:', process.env.AUTH_DISCORD_ID);
    console.log('');
    console.log('⚠️  注意：AUTH_DISCORD_ID 是 OAuth2 Client ID');
    console.log('   OAuth2 用於用戶登入/連結帳號');
    console.log('   發送 DM 需要 Bot Token (不同的東西)');
    console.log('');
    console.log('📋 解決方案：');
    console.log('   1. 前往 https://discord.com/developers/applications/' + process.env.AUTH_DISCORD_ID);
    console.log('   2. 點擊左側 "Bot" 頁面');
    console.log('   3. 如果還沒建立 Bot，點擊 "Add Bot"');
    console.log('   4. 點擊 "Reset Token" 取得 Bot Token');
    console.log('   5. 把 Token 給我，我來設定');
}

testBot();
