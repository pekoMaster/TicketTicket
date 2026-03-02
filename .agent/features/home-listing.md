# Homepage & Listings (首頁與活動列表)

## 功能說明
負責票票網的首頁呈現與活動卡片 (Listings) 的展示、排序、過濾（包含分類、時間、以及動態加載）。

## 主要相關檔案
### 前端路徑
- **頁面與路由**:
  - `src/app/page.tsx` - 首頁最外層 Server Component
  - `src/app/_components/HomePageContent.tsx` - 首頁前端主要元件（負責卡片排序、過濾與無限滾動等邏輯）
  - `src/app/listing/` - 單一活動/票券的詳細頁面
- **元件**:
  - `src/components/features/` (可能包含活動用的元件)
  - `src/components/ui/` 中的卡片展示元件

### 後端 / 資料庫
- `supabase/schema.sql` (主要在 `listings`, `tickets` 相關表)
- `supabase/add-listings-composite-index.sql` (負責列表查詢的最佳化索引)
