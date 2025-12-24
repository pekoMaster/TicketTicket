-- =============================================
-- 啟用 reports 表的 Row Level Security
-- =============================================

-- 啟用 RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 政策
-- =============================================

-- 用戶可以查看自己提交的檢舉
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

-- 用戶可以提交檢舉（只能以自己的身份）
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- 允許 Service Role (API/Admin) 完全存取
DROP POLICY IF EXISTS "Service role full access to reports" ON reports;
CREATE POLICY "Service role full access to reports" ON reports
  FOR ALL TO service_role USING (true);

-- 注意：管理員透過 supabaseAdmin (service role) 在 API 中操作
-- 一般用戶無法查看他人的檢舉或修改自己的檢舉
