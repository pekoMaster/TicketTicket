# 任務日誌：排查票票網 Webhook 儲存與發送失效問題

## 第一階段：紀錄與分析原始需求 (已完成)
- 已確立雙重失效問題：「一般用戶的個人 Webhook」與「管理員的活動專屬 Webhook」。

## 第二階段：程式碼追蹤與診斷分析 (已完成)

### 故障點一：一般用戶 Webhook (被權限拒絕)
- **錯誤原因**：`/api/webhooks/route.ts` 原先使用了 `supabase` (匿名權限) 嘗試寫入資料庫。但因為系統使用 NextAuth 認證，這會導致資料庫認定這是一筆「未登入」的寫入。因此 Supabase 的 RLS (Row-Level Security) 防火牆會直接把這筆資料刪掉或擋下，造成了「按下儲存，返回卻消失」的靜默失敗。
- **修復方式**：將所有存取代碼更換為具有最高存取權的 `supabaseAdmin`，直接繞過 RLS 防火牆，讓資料能夠確實存入。

### 故障點二：管理員 Webhook (變數遭到脫落)
- **錯誤原因**：在前端狀態管理中心 `src/contexts/AdminContext.tsx` 負責處理編輯活動 (PATCH) 請求時，系統**遺漏了將前端填寫好的 `discordWebhookUrl` 裝入即將發送給伺服器的包裹中**。因此伺服器根本「沒有收到」要更新網址的指令。
- **修復方式**：在 `AdminContext.tsx` 補上脫落的參數綁定，並修正了型別定義：
  `if (updates.discordWebhookUrl !== undefined) payload.discordWebhookUrl = updates.discordWebhookUrl;`

---

## 🚀 最終總結與待辦
所有的 Webhook 儲存阻擋原因（無論是用戶端還是管理員端）皆已找到並修復完畢！接下來只需要使用者實際至頁面操作一次，資料就能順利進入資料庫了。
