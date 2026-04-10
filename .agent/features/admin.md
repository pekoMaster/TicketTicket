# 管理後台 (Admin)

## 功能說明
管理員專用後台，用於管理活動、用戶、刊登、檢舉等。需要 `sub_admin` 或 `super_admin` 角色才能存取。

## 相關檔案

### 前端頁面
- `src/app/admin/page.tsx` — 管理後台主頁（分頁切換各管理功能）

### API 路由
- `src/app/api/admin/route.ts` — 管理員 API
- `src/app/api/events/` — 活動 CRUD（見 events.md）
- `src/app/api/users/` — 用戶管理
- `src/app/api/reports/` — 檢舉管理
- `src/app/api/stats/` — 統計資料

### 元件
- `src/components/admin/EventForm.tsx` — 活動新增/編輯表單
  - 含：活動基本資訊、票價等級、幣值選擇、AI 匯入按鈕
  - 幣值下拉：JPY, USD, TWD, EUR, KRW, IDR

### Context
- `src/contexts/AdminContext.tsx`
  - `events` — 活動列表
  - `addEvent()` / `updateEvent()` / `deleteEvent()`
  - `ApiEvent` 與 `HololiveEvent` 的型別映射（snake_case ↔ camelCase）
  - 映射含 `currency` 欄位

## 權限控制
- 路由保護在 `middleware.ts`
- API 層面在 `auth-helpers.ts` 的 `checkAuth()` 中驗證角色
- `ROLE_HIERARCHY`: user(1) < sub_admin(2) < super_admin(3)

## 管理功能分頁
1. 活動管理（新增 / 編輯 / AI 匯入 / 刪除）
2. 用戶管理（角色調整 / 封禁）
3. 刊登管理（強制關閉 / 刪除）
4. 檢舉管理（審核 / 處理）
5. 統計面板（用戶數 / 刊登數 / 配對數）

## 資料庫
- 管理員存取大多數表（events, users, listings, reports 等）
- 權限由 `users.role` 欄位控制
