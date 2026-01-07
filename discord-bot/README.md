# TicketTicket Discord Bot

用於發送 Discord 私訊通知給已連接 Discord 的 TicketTicket 用戶。

## 功能

當用戶收到以下事件時發送 Discord DM：
- 📥 收到新申請
- ✅ 申請被接受  
- ❌ 申請被拒絕
- ⭐ 收到新評價

## 設定

1. 複製 `.env.example` 為 `.env`
2. 填入 Discord Bot Token
3. 安裝依賴：`npm install`
4. 啟動：`npm start`

## API 端點

| 方法 | 路徑      | 說明     |
| ---- | --------- | -------- |
| GET  | `/health` | 健康檢查 |
| POST | `/api/dm` | 發送 DM  |

### POST /api/dm

```json
{
  "discordId": "123456789012345678",
  "title": "通知標題",
  "message": "通知內容",
  "link": "https://ticketticket.live/listing/xxx",
  "type": "new_application"
}
```

**認證方式**: Bearer Token

```
Authorization: Bearer ticketticket-dm-secret-2026
```

## 部署

使用 PM2：
```bash
pm2 start index.js --name ticketticket-bot
pm2 save
```
