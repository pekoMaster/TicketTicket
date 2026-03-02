# Chat & Messages (私訊與聊天功能)

## 功能說明
票票網內建的使用者間即時私訊系統，讓買賣雙方能進行交換票券或交易討論。

## 主要相關檔案
### 前端路徑
- **頁面與路由**:
  - `src/app/messages/`
  - `src/app/chat/`
- **元件**:
  - 對應在 `src/components/` 下的對話框、訊息氣泡等元件
- **狀態管理**:
  - 可能依賴 Supabase Realtime 實作即時更新

### 後端 / 資料庫
- `supabase/schema.sql` 放訊息紀錄的相關部分 (`conversations`, `messages` 表)
- `supabase/add-conversation-type.sql`
- `supabase/enable-realtime.sql` (用於接收即時訊息更新)
