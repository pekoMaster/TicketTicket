# 訂閱 & Webhook (Subscriptions & Webhooks)

## 功能說明
用戶可以訂閱特定活動，當有新刊登出現時，透過 Discord Webhook 接收通知。

## 相關檔案

### API 路由
- `src/app/api/subscriptions/route.ts` — 訂閱 CRUD
- `src/app/api/webhooks/route.ts` — Webhook 管理

### 前端頁面
- `src/app/profile/subscriptions/page.tsx` — 訂閱管理頁

### 元件
- `src/components/ui/SubscriptionModal.tsx` — 訂閱設定彈窗

### 工具
- `src/lib/subscription-notify.ts` — 訂閱通知發送邏輯

### 型別
- `src/types/index.ts` — `UserDiscordWebhook`, `UserWebhookSubscription`, `WebhookLog`

## 資料庫
- 表: `user_discord_webhooks`, `user_webhook_subscriptions`, `webhook_logs`
