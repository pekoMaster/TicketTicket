# 多幣值支援 (Multi-Currency)

## 功能說明
支援 6 種幣值（JPY, USD, TWD, EUR, KRW, IDR），讓不同國家的活動以當地幣值計價。同時提供全域幣值切換，讓用戶以偏好幣值查看參考換算價格。

## 支援幣值
| 代碼 | 符號 | 名稱 | locale |
|------|------|------|--------|
| JPY | ¥ | 日圓 | ja-JP |
| USD | $ | 美元 | en-US |
| TWD | NT$ | 新台幣 | zh-TW |
| EUR | € | 歐元 | de-DE |
| KRW | ₩ | 韓元 | ko-KR |
| IDR | Rp | 印尼盾 | id-ID |

## 架構設計

### 1. 活動幣值 (Event Currency)
- 每個活動 (`events` 表) 有 `currency` 欄位，預設 `'JPY'`
- 刊登 (listing) 的價格以**所屬活動的 currency** 計價
- 欄位名仍叫 `askingPriceJpy` / `originalPriceJpy`（歷史命名，避免大規模重構）

### 2. 用戶偏好幣值 (Preferred Currency)
- 透過 `CurrencyContext` 管理，存於 `localStorage`
- 用戶可用 `CurrencySwitcher` 元件切換（SideNav footer）
- 當活動幣值 ≠ 用戶偏好幣值時，自動顯示換算參考價

### 3. 匯率 API
- 使用 `open.er-api.com` 免費 API
- Server-side 12 小時 ISR cache
- 匯率基準: USD，轉換時先轉 USD 再轉目標幣值

## 相關檔案

### 型別
- `src/types/index.ts` — `CurrencyCode`, `CURRENCY_INFO`

### 工具函數
- `src/lib/currency.ts`
  - `getCurrencySymbol(code)` → 幣值符號
  - `formatPrice(amount, code)` → 格式化金額

### Context
- `src/contexts/CurrencyContext.tsx`
  - `preferredCurrency` — 用戶偏好幣值
  - `setPreferredCurrency()` — 設定偏好（會存 localStorage）
  - `exchangeRates` — 匯率資料
  - `convertPrice(amount, fromCurrency, toCurrency?)` — 換算函數

### API
- `src/app/api/currency/rates/route.ts` — GET 匯率（12h cache）

### 元件
- `src/components/ui/CurrencyBadge.tsx` — 非 JPY 時的警告標籤
- `src/components/ui/CurrencySwitcher.tsx` — 幣值切換器（button / menu-item）

### 整合位置（使用 convertPrice 和 CurrencyBadge 的元件）
- `src/components/features/ListingCard.tsx` — 卡片價格 + 換算
- `src/components/features/ListingListItem.tsx` — 列表價格 + 換算
- `src/components/features/MobileListingItem.tsx` — 手機價格 + 換算
- `src/app/listing/[id]/page.tsx` — 詳情頁價格 + 換算
- `src/app/listing/[id]/edit/page.tsx` — 編輯頁幣值顯示
- `src/app/create/page.tsx` — 發布頁幣值顯示
- `src/components/admin/EventForm.tsx` — 管理後台幣值下拉選單

### 導覽整合
- `src/components/layout/SideNav.tsx` — 桌面端 CurrencySwitcher

## 資料庫
- 表: `events` — `currency TEXT DEFAULT 'JPY'`

## Provider 位置
- 在 `src/app/layout.tsx` 中，`CurrencyProvider` 包裹在 `LanguageProvider` 之內、`AppProvider` 之外

## 重要注意事項
- ⚠️ `priceJpy` 系列欄位名稱雖含 "Jpy"，但實際幣值由活動 `currency` 決定
- ⚠️ 換算價格僅為**參考**，以「約 NT$xxx」格式顯示
- ⚠️ CurrencyContext 依賴 `localStorage`，SSR 時預設 JPY
