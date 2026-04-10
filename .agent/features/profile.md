# 個人中心 (Profile)

## 功能說明
用戶的個人中心頁面，包含帳號設定、我的刊登、我的申請、求票紀錄、已完成配對等分頁。

## 分頁結構
| 分頁 | 元件 | 說明 |
|------|------|------|
| 我的刊登 | `ProfileListings` | 用戶發布的所有刊登 |
| 我的申請 | `ProfileApplications` | 用戶申請的同行紀錄 |
| 我的求票 | `ProfileRequests` | 用戶發布的求票紀錄 |
| 已完成 | `ProfileHistory` | 已完成的配對與評價 |

## 相關檔案

### 前端頁面
- `src/app/profile/page.tsx` — 個人中心主頁（含分頁切換、帳號資訊顯示）
- `src/app/profile/settings/page.tsx` — 帳號設定頁
- `src/app/profile/completed/page.tsx` — 已完成配對頁
- `src/app/profile/subscriptions/page.tsx` — 訂閱管理頁

### 元件
- `src/components/profile/ProfileContent.tsx` — 分頁內容包裝
- `src/components/profile/ProfileTabs.tsx` — 分頁切換
- `src/components/profile/ProfileListings.tsx` — 我的刊登列表
- `src/components/profile/ProfileApplications.tsx` — 我的申請列表
- `src/components/profile/ProfileRequests.tsx` — 我的求票列表
- `src/components/profile/ProfileHistory.tsx` — 已完成配對歷史
- `src/components/profile/settings/GeneralSettings.tsx` — 一般設定（頭像、暱稱、聯絡資訊）
- `src/components/profile/settings/NotificationSettings.tsx` — 通知偏好設定
- `src/components/profile/settings/SupportSettings.tsx` — 支援與幫助設定

### API 路由
- `src/app/api/profile/route.ts` — 個人資料 CRUD

### 型別
- `src/types/index.ts` — `User`, `UserProfile`, `ApiApplication`, `CompletedMatch`

## 資料庫
- 表: `users` (個人資料), `listings` (我的刊登), `applications` (我的申請), `ticket_requests` (我的求票)

## UI 元件依賴
- `LanguageSwitcher` — 語系切換（menu-item 變體）
- `CurrencySwitcher` — 幣值切換（menu-item 變體，待整合）
- `ThemeSwitcher` — 主題切換
- `UserProfileModal` — 用戶資料彈窗
