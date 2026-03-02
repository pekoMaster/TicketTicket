# Authentication & User Onboarding (認證與 onboarding)

## 功能說明
負責票票網的使用者登入、驗證與註冊後的資訊補全 (Onboarding)。包含 Discord 第三方登入、Email 驗證以防機器人，以及手機號碼驗證等機制。

## 主要相關檔案
### 前端路徑
- **頁面與路由**:
  - `src/app/login/` - 登入頁面
  - `src/app/verify-email/` - Email 驗證回傳頁面
  - `src/app/verify-phone/` - 手機綁定與驗證頁面
  - `src/app/onboarding/` - 首次註冊後的新手任務/資料補全
- **Context 與狀態**:
  - `src/contexts/AppContext.tsx` - 負責全域 User 狀態與登入狀態判定
- **元件 & 工具**:
  - `src/auth.ts` - 實作 NextAuth.js 或 Supabase Auth 的設定
  - `src/components/onboarding/` - Onboarding 相關的 UI 元件

### 後端 / 資料庫
- `supabase/schema.sql` (尤其是 `users` 相關表與 auth 設定)
- `supabase/add-user-profile-fields.sql`
- `supabase/add-verification-levels.sql`
