# 通知系統 (Notifications)

## 功能說明
系統通知中心，支援多種通知類型和頻道（Email、Discord、LINE）。用戶可以自訂通知偏好。

## 通知類型 (NotificationType)
| 類型 | 值 | 圖示 | 說明 |
|------|---|------|------|
| 新申請 | `new_application` | 📩 | 有人申請你的刊登 |
| 申請通過 | `application_accepted` | ✅ | 你的申請被接受 |
| 申請拒絕 | `application_rejected` | ❌ | 你的申請被拒絕 |
| 訂閱配對 | `subscription_match` | 🔔 | 訂閱的活動有新刊登 |
| 新評價 | `new_review` | ⭐ | 收到新的評價 |
| 刊登過期 | `listing_expired` | ⏰ | 刊登已過期 |
| 系統通知 | `system` | 📢 | 系統公告 |

## 相關檔案

### 前端頁面
- `src/app/notifications/page.tsx` — 通知列表頁

### Context
- `src/contexts/NotificationContext.tsx`
  - `notifications` — 通知列表
  - `unreadNotificationCount` — 未讀通知數
  - `unreadMessageCount` — 未讀訊息數
  - `hasUnread` — 是否有未讀（用於底部導覽紅點）
  - `markAsRead()` — 標記已讀

### API 路由
- `src/app/api/notifications/route.ts` — 通知 CRUD

### 元件
- `src/components/ui/NotificationBell.tsx` — 通知鈴鐺（含未讀計數）

### 設定
- `src/components/profile/settings/NotificationSettings.tsx` — 通知偏好設定

### 工具
- `src/lib/email.ts` — Email 通知模板（Resend）
- `src/lib/discord-dm.ts` — Discord DM 通知
- `src/lib/line-message.ts` — LINE 訊息通知
- `src/lib/subscription-notify.ts` — 訂閱通知觸發

### 型別
- `src/types/index.ts` — `NotificationType`, `NotificationChannelPreference`, `NotificationPreferences`, `DEFAULT_NOTIFICATION_PREFERENCES`

## 資料庫
- 表: `notifications`
- 關鍵欄位: `id`, `user_id`, `type`, `message`, `is_read`, `created_at`

## 即時更新
- 使用 Supabase Realtime 訂閱 `notifications` 表的 INSERT 事件
- 導覽列即時更新未讀計數
