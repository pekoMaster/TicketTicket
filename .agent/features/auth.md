# 認證與註冊系統 (Authentication)

## 功能說明
使用 NextAuth.js + Google OAuth 登入。登入後需完成 Email 驗證 → 電話驗證的驗證流程，以解鎖不同權限層級。

## 驗證層級 (VerificationLevel)
| 層級 | 值 | 權限 |
|------|---|------|
| 未驗證 | `unverified` | 瀏覽 |
| 申請者 | `applicant` | 可申請同行（已驗 Email）|
| 主辦方 | `host` | 可發布刊登（已驗電話）|

## 用戶角色 (UserRole)
- `user` — 一般用戶
- `sub_admin` — 副管理員
- `super_admin` — 超級管理員
- 層級定義: `ROLE_HIERARCHY` (types/index.ts)

## 相關檔案

### 認證核心
- `src/auth.ts` — NextAuth 設定（Google Provider、callbacks、session 策略）
- `src/middleware.ts` — 路由保護中間件
- `src/lib/auth-helpers.ts` — 認證輔助函數（checkAuth, requireVerification）

### 前端頁面
- `src/app/login/page.tsx` — 登入頁（Google OAuth 按鈕）
- `src/app/verify-email/page.tsx` — Email 驗證頁
- `src/app/verify-phone/page.tsx` — 電話驗證頁

### API 路由
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth 路由

### 元件
- `src/components/providers/SessionProvider.tsx` — NextAuth SessionProvider 包裝
- `src/components/onboarding/LoginPromptModal.tsx` — 未登入提示彈窗
- `src/components/onboarding/TutorialOverlay.tsx` — 新手教學

### 型別
- `src/types/index.ts` — `User`, `UserRole`, `VerificationLevel`
- `src/types/next-auth.d.ts` — NextAuth session 型別擴展

## 資料庫
- 表: `users`
- 關鍵欄位: `id`, `username`, `email`, `role`, `verification_level`, `email_verified_at`, `phone_verified_at`, `phone_country_code`, `phone_number`

## Session 擴展
NextAuth session 中額外包含:
- `user.dbId` — Supabase users 表的 UUID
- `user.role` — 用戶角色
- `user.verificationLevel` — 驗證層級

## 依賴
- Google OAuth Client ID/Secret (環境變數)
- Supabase (用戶資料儲存)
- Resend (Email 驗證信)
