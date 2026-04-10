# 刊登管理 CRUD (Listing CRUD)

## 功能說明
刊登是票票網的核心功能。用戶可以發布同行/讓票/換票刊登，其他用戶可以瀏覽並申請。

## 票券類型 (TicketType)
| 類型 | 程式碼值 | 說明 |
|------|---------|------|
| 尋找同行者 | `find_companion` | 尋找同行夥伴，費用均攤 |
| 子票轉讓 | `sub_ticket_transfer` | 轉讓 ZAIKO 子票 |
| 換票 | `ticket_exchange` | 與他人交換不同場次/座位 |

## 刊登狀態 (ListingStatus)
- `open` — 開放申請中
- `matched` — 已配對
- `closed` — 已關閉

## 相關檔案

### 前端頁面
- `src/app/create/page.tsx` — 發布刊登頁面
- `src/app/listing/[id]/page.tsx` — 刊登詳情頁（含申請按鈕、價格顯示、幣值提示）
- `src/app/listing/[id]/edit/page.tsx` — 編輯刊登頁面

### API 路由
- `src/app/api/listings/route.ts` — GET (列表)、POST (新增)
- `src/app/api/listings/[id]/route.ts` — GET、PATCH、DELETE
- `src/app/api/applications/route.ts` — 同行申請 CRUD

### 元件
- `src/components/features/ListingCard.tsx` — 卡片檢視（首頁用）
- `src/components/features/ListingListItem.tsx` — 列表檢視
- `src/components/features/MobileListingItem.tsx` — 手機卡片檢視
- `src/components/features/ListingCardSkeleton.tsx` — 骨架屏

### Context
- `src/contexts/AppContext.tsx` — 管理 listings 全域狀態（含 fetchListings, createListing 等）

### 型別
- `src/types/index.ts` — `Listing`, `TicketType`, `TicketSource`, `ListingStatus`, `Application`

## 資料庫
- 表: `listings`, `applications`
- 關聯: `listings.host_id → users.id`、`applications.listing_id → listings.id`

## 價格邏輯
- `originalPriceJpy` — 票券原價（欄位名含 Jpy 但實際幣值由活動 currency 決定）
- `askingPriceJpy` — 希望分攤金額
- 上限公式: `originalPriceJpy / totalSlots`（不可超賣）
- 幣值符號由 `getCurrencySymbol(currency)` 動態決定

## 依賴
- `CurrencyBadge` — 非 JPY 時顯示幣值警告
- `getCurrencySymbol()` — from `src/lib/currency.ts`
- `useCurrency()` — from `src/contexts/CurrencyContext.tsx`（換算顯示）
