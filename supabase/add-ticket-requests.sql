-- ============================================================
-- 求票功能 (Ticket Requests) 資料表
-- 讓使用者依據現有活動提交求票請求（求同行 / 求讓票）
-- ============================================================

-- 1. 在 events 表新增 max_requests_per_user 欄位
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_requests_per_user INTEGER DEFAULT 2;

-- 2. 建立 ticket_requests 資料表
CREATE TABLE IF NOT EXISTS ticket_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  -- 可接受的類型 (find_companion / sub_ticket_transfer)
  accepted_types TEXT[] NOT NULL DEFAULT '{}',
  -- 想要的座位等級 (複選)
  seat_grades TEXT[] NOT NULL DEFAULT '{}',
  -- 張數 (1 or 2)
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 10),
  -- 備註說明
  description TEXT,
  -- 狀態
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 建立索引
CREATE INDEX IF NOT EXISTS idx_ticket_requests_user_id ON ticket_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_requests_event_id ON ticket_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_requests_status ON ticket_requests(status);
CREATE INDEX IF NOT EXISTS idx_ticket_requests_created_at ON ticket_requests(created_at DESC);

-- 4. 建立 RLS 策略
ALTER TABLE ticket_requests ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取 open 狀態的求票
CREATE POLICY "ticket_requests_select_open" ON ticket_requests
  FOR SELECT USING (status = 'open');

-- 允許使用者管理自己的求票
CREATE POLICY "ticket_requests_insert_own" ON ticket_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "ticket_requests_update_own" ON ticket_requests
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "ticket_requests_delete_own" ON ticket_requests
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 5. 建立 request_applications 資料表 (回應求票)
CREATE TABLE IF NOT EXISTS request_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ticket_requests(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 同一使用者不能重複申請同一求票
  UNIQUE(request_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_request_applications_request_id ON request_applications(request_id);
CREATE INDEX IF NOT EXISTS idx_request_applications_applicant_id ON request_applications(applicant_id);

ALTER TABLE request_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "request_applications_select" ON request_applications
  FOR SELECT USING (true);

CREATE POLICY "request_applications_insert_own" ON request_applications
  FOR INSERT WITH CHECK (auth.uid()::text = applicant_id::text);

CREATE POLICY "request_applications_update_own" ON request_applications
  FOR UPDATE USING (auth.uid()::text = applicant_id::text);
