-- 新增每帳號最多可創建刊登數量的欄位
-- 用於限制每個用戶在每個活動可以創建的票券刊登數量
-- 預設為 2（適用於大多數單日/雙日活動）

ALTER TABLE events
ADD COLUMN IF NOT EXISTS max_listings_per_user INTEGER DEFAULT 2;

-- 添加約束確保值為正整數
ALTER TABLE events
ADD CONSTRAINT max_listings_per_user_positive CHECK (max_listings_per_user > 0);

-- 添加註解
COMMENT ON COLUMN events.max_listings_per_user IS '每個帳號在此活動最多可創建的刊登數量';
