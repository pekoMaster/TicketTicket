-- =============================================
-- 換票座位等級複選功能 (Multi-Select Exchange Seat Grades)
-- =============================================
-- 將 exchange_seat_grade 從單一字串改為陣列格式

-- 新增 exchange_seat_grades 陣列欄位
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS exchange_seat_grades TEXT[] DEFAULT '{}';

-- 遷移現有資料：將單一值轉換為陣列
UPDATE listings 
SET exchange_seat_grades = ARRAY[exchange_seat_grade]
WHERE exchange_seat_grade IS NOT NULL 
  AND exchange_seat_grade != '' 
  AND exchange_seat_grades = '{}';

-- 建立索引方便查詢
CREATE INDEX IF NOT EXISTS idx_listings_exchange_seat_grades ON listings USING GIN (exchange_seat_grades);
