# 多幣值系統 Code Review 修復

## 狀態：進行中
- 建立日期：2026-04-23
- 來源：`62366ab` commit review

---

## 一、原始需求

> 針對多幣值功能（multi-currency support）的 code review 發現的問題，按嚴重度分階段修復。

---

## 二、進度追蹤

### Phase 1 — A 級（功能正確性）✅ 已完成

- [x] DB migration — 確認 `currency` 欄位已存在於 Supabase（default JPY），補建 `supabase/add-event-currency.sql` 備查 (2026-04-23)
- [x] 匯率 API fallback — API route 加 `FALLBACK_RATES`，失敗時回 fallback 而非 500 (2026-04-23)
- [x] CurrencyContext fallback — fetch 失敗時用 fallback rates (2026-04-23)
- [x] API response 過濾 — 只回傳 6 種支援幣別而非 150+ 種 (2026-04-23)

### Phase 2 — B 級（品質/安全）✅ 已完成

- [x] `CurrencyCode` 型別驗證 — AdminContext 用 Set 驗證取代 `as` 斷言 (2026-04-23)
- [x] `convertPrice` 雙重呼叫 — 4 個元件改為先存變數再判斷/渲染 (2026-04-23)
  - ListingCard.tsx
  - ListingListItem.tsx
  - MobileListingItem.tsx
  - listing/[id]/page.tsx
- [x] localStorage 讀取安全性 — 加 `VALID_CURRENCIES.has()` 驗證 (2026-04-23)

### Phase 3 — C 級（追蹤項目，不急）

- [ ] `priceJpy` / `askingPriceJpy` / `originalPriceJpy` 欄位重命名
  - 全域約 128 處引用
  - 涉及 DB 欄位名（`price_jpy`、`asking_price_jpy`、`original_price_jpy`）
  - 建議目標名：`price` / `askingPrice` / `originalPrice`
  - 安排在下一個大版本處理
- [ ] `formatPrice()` 工具函式統一使用（目前各元件手動拼接 symbol + amount）
- [ ] EventForm 中文硬編碼改為 i18n

---

## 三、修改檔案清單

| 檔案 | 動作 | Phase |
|------|------|-------|
| `supabase/add-event-currency.sql` | 新建 | 1 |
| `src/app/api/currency/rates/route.ts` | 修改 | 1 |
| `src/contexts/CurrencyContext.tsx` | 修改 | 1+2 |
| `src/contexts/AdminContext.tsx` | 修改 | 2 |
| `src/components/features/ListingCard.tsx` | 修改 | 2 |
| `src/components/features/ListingListItem.tsx` | 修改 | 2 |
| `src/components/features/MobileListingItem.tsx` | 修改 | 2 |
| `src/app/listing/[id]/page.tsx` | 修改 | 2 |

---

## 四、驗證

- TypeScript 編譯：✅ 零錯誤（`npx tsc --noEmit`）
- DB migration：⚠️ 需在 Supabase 執行 `supabase/add-event-currency.sql`
