-- =============================================
-- 啟用 user_blocks 表的 Row Level Security
-- =============================================

-- 啟用 RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 政策
-- =============================================

-- 用戶可以查看自己封鎖的人
DROP POLICY IF EXISTS "Users can view own blocks" ON user_blocks;
CREATE POLICY "Users can view own blocks" ON user_blocks
  FOR SELECT USING (blocker_id = auth.uid());

-- 用戶可以封鎖其他人（只能以自己的身份）
DROP POLICY IF EXISTS "Users can create own blocks" ON user_blocks;
CREATE POLICY "Users can create own blocks" ON user_blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

-- 用戶可以解除自己的封鎖
DROP POLICY IF EXISTS "Users can delete own blocks" ON user_blocks;
CREATE POLICY "Users can delete own blocks" ON user_blocks
  FOR DELETE USING (blocker_id = auth.uid());

-- 注意：我們使用 supabaseAdmin (service role) 在 API 中操作，
-- 所以這些政策主要是為了防止直接透過 PostgREST 的未授權存取
