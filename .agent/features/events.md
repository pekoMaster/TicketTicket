# 活動管理 (Events Management)

## 功能說明
管理員透過後台管理活動（演唱會、粉絲見面會等）。活動定義了座位等級、票價、幣值、人數上限等資訊，供用戶發布刊登時選擇。

## 活動分類 (EventCategory)
| 分類 | 值 | 說明 |
|------|---|------|
| 演唱會 | `concert` | 現場演唱會 |
| 粉絲見面會 | `fan_meeting` | 粉絲見面會 |
| 展覽活動 | `expo` | 展覽、即賣會 |
| 線上直播 | `streaming` | 線上活動 |
| 其他 | `other` | 其他類型 |

## 相關檔案

### 前端頁面
- `src/app/admin/page.tsx` — 管理後台主頁（含活動 CRUD）

### API 路由
- `src/app/api/events/route.ts` — GET (列表)、POST (新增)
- `src/app/api/events/[id]/route.ts` — GET、PATCH、DELETE
- `src/app/api/events/import/route.ts` — AI 匯入（Gemini 解析活動資訊）

### 元件
- `src/components/admin/EventForm.tsx` — 活動新增/編輯表單
  - 包含：活動名稱、藝人、日期、場地、票價等級、幣值選擇、人數上限

### Context
- `src/contexts/AdminContext.tsx`
  - `events` — 活動列表
  - `addEvent()` / `updateEvent()` / `deleteEvent()` — CRUD
  - `ApiEvent` → `HololiveEvent` 型別映射

### 型別
- `src/types/index.ts` — `HololiveEvent`, `EventCategory`, `TicketPriceTier`, `CurrencyCode`

## 資料庫
- 表: `events`
- 關鍵欄位: `id`, `name`, `artist`, `event_date`, `event_end_date`, `venue`, `image_url`, `category`, `currency`, `ticket_price_tiers` (JSONB), `max_tickets_per_person`, `max_requests_per_user`, `is_active`

## 票價等級 (TicketPriceTier)
```typescript
interface TicketPriceTier {
  seatGrade: string;   // 座位等級名稱（如 "A", "S", "SS"）
  priceJpy?: number;   // 每張票原價（以活動 currency 計）
}
```
存為 JSONB 陣列。

## AI 活動匯入
- 使用 Gemini API 解析用戶貼上的活動資訊文字
- 自動提取活動名、日期、場地、票價等級
- 僅填補尚未填寫的空欄位
- 路由: `POST /api/events/import`
- 模型: `gemini-2.0-flash-lite`
