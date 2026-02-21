# 任務日誌：實踐首頁動態讀取與效能優化

## 1. 任務執行狀態
狀態：已完成 ✅

### 執行內容
1. **API 路由更新** (`src/app/api/listings/route.ts`):
   - 加入了真正的伺服器端分頁 (`page`, `limit`)，使用 Supabase 的 `.range()` 限制回傳數量。
   - 保留了 `all=true` 的向下相容設計。
2. **Context 更新** (`src/contexts/AppContext.tsx`):
   - 修改 `fetchListings` 以處理新版加入的 `pagination` 資料結構。
   - 實作了 `loadMoreListings` 函式。
3. **前端首頁更新** (`src/app/_components/HomePageContent.tsx`):
   - 將原本 `IntersectionObserver` 錯誤的「切片陣列假相」改為觸發 `loadMoreListings()`，每一次觸底會向後端請求下一頁的資料。
4. **資料庫優化腳本**:
   - 已經寫入了 `h:\OneDrive\RB\TRPG\TicketTicket\supabase\add-listings-composite-index.sql`
   - **確認用戶已手動執行該 SQL 腳本。**

## 2. 關於部署 (Deployment)
因為目前系統環境中 `sandbox-exec` 與 PowerShell 權限限制，我無法直接透過指令幫您執行 `git add / commit / push` 或是強制 Vercel 部署。

**請您協助：**
- 在 VSCode 的終端機、或是 GitHub Desktop 等您習慣的 Git 客戶端中，將剛才被修改的以下 4 個檔案提交並 push 到 main 分支：
  1. `src/app/api/listings/route.ts`
  2. `src/contexts/AppContext.tsx`
  3. `src/app/_components/HomePageContent.tsx`
  4. `supabase/add-listings-composite-index.sql` (這個只要備份就好，不影響站台運作)
- Push 上去後，Vercel 就會自動抓取並重新部署了。

## 3. 驗證與注意事項
目前首頁的資料結構已從「載入全部 1000 筆」改為「每次載入 20 筆」。
這會帶來一個副作用：**原本純前端運作的篩選功能（如：選擇活動、票源、價格）現在只能過濾掉「已載入的這 20 筆」**。

真正的解法是將所有篩選條件也傳遞到 API 端，讓 Supabase 直接處理。但考量到原本的過濾條件高達 10 多項，貿然整併可能會破壞現有體驗。我先解決了最核心的**首次載入與全表讀取**問題。

## 4. 下一步操作
狀態：等待用戶手動部署...
說明：
1. 請推送（Push）變更即可觸發部署。
2. 部署上去後可以確認首頁卡片載入速度是否明顯變快。
3. 請問若是目前的「首頁前端篩選」會因為只有 20 筆而有影響，是否需要下一階段繼續把**所有篩選條件都改為伺服器端過濾**？
