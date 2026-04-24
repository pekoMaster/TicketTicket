-- 為 events 表新增 currency 欄位（多幣值支援）
-- 預設 JPY 以相容既有資料
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'JPY';
