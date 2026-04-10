# 首頁與活動列表 (Homepage & Listings)

## 功能說明
首頁是用戶進入的第一個畫面，展示所有開放中的刊登卡片。支援多種檢視模式、排序、過濾，以及無限滾動。

## 檢視模式
- **卡片** — `ListingCard`（桌面預設）
- **列表** — `ListingListItem`（桌面可切換）
- **手機卡片** — `MobileListingItem`（手機自動切換）

## 相關檔案

### 前端頁面
- `src/app/page.tsx` — 首頁 Server Component（ISR 預渲染）
- `src/app/_components/HomePageContent.tsx` — 首頁主元件（排序、篩選、無限滾動、檢視切換）

### 元件
- `src/components/features/ListingCard.tsx` — 卡片檢視（Glassmorphism V4 設計）
  - 含：頭像、星級、活動名稱、座位等級、票種標籤、價格 Aurora 效果、幣值換算
- `src/components/features/ListingListItem.tsx` — 列表檢視（3 行佈局）
- `src/components/features/MobileListingItem.tsx` — 手機卡片（精簡 3 行）
- `src/components/features/ListingCardSkeleton.tsx` — 骨架屏

### API 路由
- `src/app/api/listings/route.ts` — GET 列表（支援分頁、排序、篩選）

### Context
- `src/contexts/AppContext.tsx` — `listings`, `events`, `users` 全域狀態
  - `fetchListings()` — 載入刊登列表
  - 映射 API snake_case → 前端 camelCase

## 篩選欄位
- 活動名稱 (`eventName`)
- 票券類型 (`ticketType`)
- 票源 (`ticketSource`)
- 座位等級 (`seatGrade`)
- 可協助入場 (`willAssistEntry`)
- 價格範圍

## 排序選項
- 最新發布
- 價格低→高 / 高→低
- 活動日期

## 幣值整合
- 各卡片元件接收 `currency` prop（來自關聯活動）
- 使用 `getCurrencySymbol(currency)` 顯示正確符號
- 使用 `useCurrency().convertPrice()` 顯示換算參考價
- 非 JPY 時顯示 `CurrencyBadge`

## 資料庫
- 表: `listings`（主查詢）
- 索引: `listings` 複合索引（排序、篩選最佳化）
- 關聯: `users`（顯示主辦方資訊）、`events`（取得幣值）
