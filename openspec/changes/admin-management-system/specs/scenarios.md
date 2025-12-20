# 情境規格

## 刊登管理情境

### Scenario: 管理員刪除違規刊登並通知用戶
- **Given** 管理員已登入後台
- **And** 存在一個違規刊登，有 2 個申請者
- **When** 管理員點擊刪除按鈕
- **And** 輸入原因「內容違反平台規範」
- **And** 勾選「通知相關用戶」
- **And** 確認刪除
- **Then** 刊登 SHALL 被刪除
- **And** 主辦方 SHALL 收到系統訊息
- **And** 2 個申請者 SHALL 各自收到系統訊息
- **And** 操作 SHALL 被記錄到 admin_logs

### Scenario: 管理員編輯刊登但不通知
- **Given** 管理員已登入後台
- **And** 存在一個需要修改見面地點的刊登
- **When** 管理員點擊編輯按鈕
- **And** 修改見面地點
- **And** 不勾選「通知相關用戶」
- **And** 儲存變更
- **Then** 刊登 SHALL 被更新
- **And** 用戶 SHALL NOT 收到通知
- **And** 操作 SHALL 被記錄到 admin_logs

### Scenario: 搜尋刊登
- **Given** 管理員在刊登管理頁面
- **When** 在搜尋框輸入「演唱會」
- **Then** 列表 SHALL 只顯示活動名稱包含「演唱會」的刊登
- **Or** 列表 SHALL 顯示主辦方暱稱包含「演唱會」的刊登

---

## 會員管理情境

### Scenario: 管理員強制更改違規暱稱
- **Given** 管理員已登入後台
- **And** 存在一個暱稱為「敏感詞」的用戶
- **When** 管理員點擊編輯按鈕
- **And** 將暱稱改為「用戶12345」
- **And** 勾選「通知用戶」
- **And** 輸入通知內容「您的暱稱因違規已被修改」
- **And** 儲存變更
- **Then** 用戶暱稱 SHALL 被更新
- **And** 用戶 SHALL 收到系統訊息
- **And** 操作 SHALL 被記錄到 admin_logs

### Scenario: 管理員移除不當頭像
- **Given** 管理員已登入後台
- **And** 存在一個使用不當頭像的用戶
- **When** 管理員點擊編輯按鈕
- **And** 點擊「移除頭像」
- **And** 儲存變更
- **Then** 用戶 custom_avatar_url SHALL 被設為 null
- **And** 用戶頭像 SHALL 回復為 Google 預設頭像

---

## 黑名單情境

### Scenario: 封鎖惡意用戶
- **Given** 管理員已登入後台
- **And** 存在一個多次違規的用戶 (email: bad@example.com)
- **When** 管理員點擊封鎖按鈕
- **And** 輸入原因「多次違反平台規範」
- **And** 確認封鎖
- **Then** 用戶 email SHALL 被加入 blacklist 表
- **And** 操作 SHALL 被記錄到 admin_logs

### Scenario: 被封鎖用戶嘗試登入
- **Given** 用戶 email (bad@example.com) 在黑名單中
- **When** 該用戶嘗試使用 Google 登入
- **Then** 登入 SHALL 失敗
- **And** 用戶 SHALL 看到「您的帳號已被封鎖」錯誤訊息

### Scenario: 被封鎖用戶嘗試註冊
- **Given** email (bad@example.com) 在黑名單中
- **When** 有人使用該 Google 帳號嘗試註冊
- **Then** 註冊 SHALL 失敗
- **And** 用戶 SHALL 看到「此帳號無法使用」錯誤訊息

### Scenario: 解除封鎖
- **Given** 管理員在黑名單頁面
- **And** 用戶 (bad@example.com) 在黑名單中
- **When** 管理員點擊「解除封鎖」
- **And** 確認解除
- **Then** 用戶 email SHALL 從 blacklist 表移除
- **And** 用戶 SHALL 可以正常登入
- **And** 操作 SHALL 被記錄到 admin_logs

---

## 通知系統情境

### Scenario: 系統訊息顯示
- **Given** 用戶收到管理員發送的系統訊息
- **When** 用戶打開對話頁面
- **Then** 訊息 SHALL 顯示為系統訊息樣式（不同於一般訊息）
- **And** 訊息 SHALL 顯示「系統通知」標籤
- **And** 訊息 SHALL 不可回覆
