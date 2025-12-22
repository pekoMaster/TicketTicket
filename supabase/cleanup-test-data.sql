-- 清理測試資料
-- 刪除所有對話相關資料
DELETE FROM messages;
DELETE FROM transaction_confirmations;
DELETE FROM conversations;
DELETE FROM applications;
DELETE FROM reviews;

-- 重置刊登狀態（將所有刊登設為 open）
UPDATE listings SET status = 'open', available_slots = total_slots;

-- 確認 conversation_type 欄位存在
-- ALTER TABLE conversations ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(20) DEFAULT 'inquiry';
