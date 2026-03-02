# Admin (後台管理系統)

## 功能說明
票票網的管理員專用後台，處理使用者檢舉、數據分析或特殊權限操作等。

## 主要相關檔案
### 前端路徑
- **頁面與路由**:
  - `src/app/admin/` - 後台主要路由（應有權限保護）
- **Context**:
  - `src/contexts/AdminContext.tsx` - 負責確認使用者管理員身分與權限
- **元件**:
  - `src/components/admin/` - 後台專用的版面設計、表格等 UI

### 後端 / 資料庫
- `supabase/schema.sql` (使用者 Role 定義，例如 `'admin'`)
- `supabase/add-user-role.sql`
- `supabase/add-admin-management-tables.sql`
- `supabase/add-reports-table.sql` (檢舉機制資料表)
