# 評價系統 (Reviews)

## 功能說明
配對完成後，雙方用戶可以互相評價（1-5 星 + 文字評論）。7 天內未評價自動給 5 星。

## 相關檔案

### 前端頁面
- `src/app/reviews/page.tsx` — 評價列表（可能在 profile 中）
- `src/app/profile/completed/page.tsx` — 已完成配對（含評價入口）

### API 路由
- `src/app/api/reviews/route.ts` — GET (列表)、POST (新增)

### 元件
- `src/components/features/ReviewCard.tsx` — 評價卡片
- `src/components/features/ReviewModal.tsx` — 評價輸入彈窗

### 型別
- `src/types/index.ts` — `Review`, `ApiReview`, `CompletedMatch`

## 資料庫
- 表: `reviews`
- 關聯: `reviewer_id → users.id`, `reviewee_id → users.id`, `listing_id → listings.id`
- 自動評價: Inngest 排程 7 天後自動給 5 星（`src/lib/inngest-functions.ts`）
