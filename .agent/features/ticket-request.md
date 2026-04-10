# 求票系統 (Ticket Request)

## 功能說明
讓沒有票的用戶發布「求票」需求，有票的用戶可以主動回應。與刊登系統互補——刊登是「我有票找人」，求票是「我沒票求幫忙」。

## 求票狀態 (TicketRequestStatus)
- `open` — 開放回應中
- `matched` — 已配對
- `closed` — 已關閉

## 可接受票券類型
- `find_companion` (同行)
- `sub_ticket_transfer` (子票轉讓)
- `ticket_exchange` (換票)

## 相關檔案

### 前端頁面
- `src/app/request/page.tsx` — 求票列表 + 發布求票（整合在同一頁）
- `src/app/request/[id]/page.tsx` — 求票詳情頁

### API 路由
- `src/app/api/requests/route.ts` — GET (列表)、POST (新增)
- `src/app/api/requests/[id]/route.ts` — GET、PATCH、DELETE
- `src/app/api/requests/[id]/apply/route.ts` — 回應求票

### 元件
- `src/components/features/RequestCard.tsx` — 求票卡片（桌面）
- `src/components/features/RequestListItem.tsx` — 求票列表項
- `src/components/features/MobileRequestItem.tsx` — 求票手機項

### Context
- `src/contexts/AppContext.tsx` — 管理 requests 全域狀態

### 型別
- `src/types/index.ts` — `TicketRequest`, `RequestApplication`, `TicketRequestStatus`, `RequestApplicationStatus`

## 資料庫
- 表: `ticket_requests`, `request_applications`
- 關聯: `ticket_requests.user_id → users.id`、`ticket_requests.event_id → events.id`

## 依賴
- 與活動 (events) 關聯以取得座位等級選項
- 使用 `ACCEPTED_TICKET_TYPE_INFO` 常數做顯示映射
