# 任務清單

## 階段 1：資料庫與 API 基礎建設

### Task 1.1：建立黑名單資料表
- 複雜度：低
- 依賴：無
- 內容：
  - 建立 `blacklist` 資料表
  - 欄位：id, email, reason, created_at, created_by
  - 建立索引

### Task 1.2：建立管理員操作日誌表
- 複雜度：低
- 依賴：無
- 內容：
  - 建立 `admin_logs` 資料表
  - 欄位：id, action_type, target_type, target_id, details, created_at

### Task 1.3：修改登入流程檢查黑名單
- 複雜度：中
- 依賴：Task 1.1
- 內容：
  - 在 NextAuth 回調中檢查黑名單
  - 阻止被封鎖用戶登入
  - 顯示適當錯誤訊息

---

## 階段 2：刊登管理功能

### Task 2.1：刊登管理 API
- 複雜度：中
- 依賴：Task 1.2
- 內容：
  - GET `/api/admin/listings` - 取得刊登列表（分頁、搜尋、篩選）
  - PUT `/api/admin/listings/[id]` - 強制編輯刊登
  - DELETE `/api/admin/listings/[id]` - 強制移除刊登
  - 所有操作記錄到 admin_logs

### Task 2.2：管理員通知 API
- 複雜度：中
- 依賴：Task 2.1
- 內容：
  - POST `/api/admin/notify` - 發送系統通知
  - 支援發送給主辦方和申請者
  - 建立特殊系統訊息類型

### Task 2.3：刊登管理頁面
- 複雜度：高
- 依賴：Task 2.1, Task 2.2
- 內容：
  - 建立 `/admin/listings` 頁面
  - 列表顯示（表格形式）
  - 搜尋和篩選功能
  - 編輯對話框
  - 移除確認對話框（含通知選項）

---

## 階段 3：會員管理功能

### Task 3.1：會員管理 API
- 複雜度：中
- 依賴：Task 1.1, Task 1.2
- 內容：
  - GET `/api/admin/users` - 取得會員列表（分頁、搜尋）
  - PUT `/api/admin/users/[id]` - 更新會員資料（暱稱、頭像）
  - POST `/api/admin/users/[id]/blacklist` - 加入黑名單
  - DELETE `/api/admin/users/[id]/blacklist` - 移出黑名單
  - 所有操作記錄到 admin_logs

### Task 3.2：會員管理頁面
- 複雜度：高
- 依賴：Task 3.1
- 內容：
  - 建立 `/admin/users` 頁面
  - 列表顯示（表格形式）
  - 搜尋功能
  - 編輯會員對話框
  - 黑名單操作對話框

### Task 3.3：黑名單管理頁面
- 複雜度：中
- 依賴：Task 3.1
- 內容：
  - 建立 `/admin/blacklist` 頁面
  - 顯示所有被封鎖用戶
  - 支援解除封鎖
  - 顯示封鎖原因和時間

---

## 階段 4：側邊欄和導航更新

### Task 4.1：更新管理員側邊欄
- 複雜度：低
- 依賴：Task 2.3, Task 3.2, Task 3.3
- 內容：
  - 新增「刊登管理」連結
  - 新增「會員管理」連結
  - 新增「黑名單」連結

---

## 任務依賴圖

```
Task 1.1 (黑名單表) ──┬──> Task 1.3 (登入檢查)
                      │
                      └──> Task 3.1 (會員 API) ──> Task 3.2 (會員頁面)
                                               ──> Task 3.3 (黑名單頁面)

Task 1.2 (日誌表) ────┬──> Task 2.1 (刊登 API) ──> Task 2.2 (通知 API) ──> Task 2.3 (刊登頁面)
                      │
                      └──> Task 3.1 (會員 API)

Task 2.3 + Task 3.2 + Task 3.3 ──> Task 4.1 (側邊欄)
```

## 複雜度總結

| 複雜度 | 任務數 |
|--------|--------|
| 低     | 3      |
| 中     | 5      |
| 高     | 2      |
| **總計** | **10** |
