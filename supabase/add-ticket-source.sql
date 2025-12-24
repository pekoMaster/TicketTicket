-- =============================================
-- 新增票源欄位 (Ticket Source Column)
-- =============================================
-- 用於區分 ZAIKO 和 LAWSON 購票系統

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS ticket_source TEXT DEFAULT 'zaiko' 
CHECK (ticket_source IN ('zaiko', 'lawson'));

-- 為既有刊登設置預設值
UPDATE listings SET ticket_source = 'zaiko' WHERE ticket_source IS NULL;

-- 建立索引方便篩選
CREATE INDEX IF NOT EXISTS idx_listings_ticket_source ON listings(ticket_source);
