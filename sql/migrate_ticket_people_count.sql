-- Migration: 票種人數統一化
-- 執行位置：Supabase Dashboard > SQL Editor

-- Step 1: listings 新增 ticket_people_count 欄位
ALTER TABLE listings ADD COLUMN IF NOT EXISTS ticket_people_count INTEGER DEFAULT 1;

-- Step 2: 遷移現有資料（duo → 2，solo → 1）
UPDATE listings
SET ticket_people_count = CASE
  WHEN ticket_count_type = 'duo' THEN 2
  ELSE 1
END;

-- Step 3: 設為 NOT NULL
ALTER TABLE listings ALTER COLUMN ticket_people_count SET NOT NULL;

-- Step 4: 移除 ticket_price_tiers 內的 ticket_count_type 欄位
UPDATE events
SET ticket_price_tiers = (
  SELECT jsonb_agg(t - 'ticket_count_type')
  FROM jsonb_array_elements(ticket_price_tiers) t
)
WHERE ticket_price_tiers IS NOT NULL
  AND ticket_price_tiers != '[]'::jsonb;

-- Step 5: events 欄位改名（max_listings_per_user → max_tickets_per_person）
-- 使用 DO block 安全處理（若已改名則跳過）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'max_listings_per_user'
  ) THEN
    ALTER TABLE events RENAME COLUMN max_listings_per_user TO max_tickets_per_person;
  END IF;
END $$;

-- 驗證
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'listings' AND column_name = 'ticket_people_count';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'max_tickets_per_person';
