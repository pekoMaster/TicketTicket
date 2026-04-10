# 聊天與私訊 (Chat & Messages)

## 功能說明
配對成功後，主辦方與申請者可以透過即時聊天溝通。使用 Supabase Realtime 實現即時訊息。

## 相關檔案

### 前端頁面
- `src/app/chat/[id]/page.tsx` — 聊天頁面（即時訊息）
- `src/app/messages/page.tsx` — 訊息列表頁（所有對話）

### API 路由
- `src/app/api/conversations/route.ts` — 對話列表 / 建立
- `src/app/api/conversations/[id]/route.ts` — 對話詳情
- `src/app/api/conversations/[id]/messages/route.ts` — 訊息 CRUD

### 型別
- `src/types/index.ts` — `Message`

## 資料庫
- 表: `conversations`, `messages`, `conversation_participants`
- Realtime: 訂閱 `messages` 表的 INSERT 事件

## 依賴
- Supabase Realtime (即時訊息)
- `NotificationContext` (未讀計數)

## 隱藏導覽
- 聊天頁 (`/chat/*`) 會隱藏 SideNav 和 BottomNav（見 layout.md）
