# Profile (會員中心)

## 功能說明
提供使用者管理自己的個人資料、檢視過往發布的票券/活動、設定通知偏好等功能。

## 主要相關檔案
### 前端路徑
- **頁面與路由**:
  - `src/app/profile/` - 會員中心主頁
- **元件**:
  - `src/components/profile/` - 包含資料編輯表單、列表元件等各項個人中心子元件

### 後端 / 資料庫
- `supabase/schema.sql` (`profiles` / `users`)
- `supabase/add-notification-preferences.sql` (用戶自己的偏好設定部份)
