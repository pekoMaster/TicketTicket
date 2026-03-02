# Notifications (通知系統)

## 功能說明
票票網的全域通知系統，包含推播通知使用者有新訊息、活動狀態更新或系統公告等，並可設定通知偏好。

## 主要相關檔案
### 前端路徑
- **頁面與路由**:
  - `src/app/notifications/` - 獨立的通知列表頁面
- **Context & 狀態**:
  - `src/contexts/NotificationContext.tsx` - 負責接收並全域展示通知氣泡或下拉列表
- **元件**:
  - 通知提示用 UI 元件（如小鈴鐺圖示與數量的紅點）

### 後端 / 資料庫
- `supabase/schema.sql` (有相關 table)
- `supabase/create-notifications-table.sql`
- `supabase/add-notifications-table.sql`
- `supabase/add-notification-preferences.sql` (使用者的通知開關設定)
- `supabase/add-discord-webhooks.sql` (可能包含通知發送到開發者/管理員 Discord 群的功能)
