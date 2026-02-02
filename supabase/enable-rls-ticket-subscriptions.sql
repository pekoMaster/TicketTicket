-- ============================================
-- 🔒 安全性修復：啟用 ticket_subscriptions 表的 RLS
-- ============================================
-- ⚠️ 請在 Supabase SQL Editor 中執行此腳本
-- ============================================

-- 第一步：啟用 RLS
ALTER TABLE ticket_subscriptions ENABLE ROW LEVEL SECURITY;

-- 第二步：允許 service_role 完全存取 (Next.js API Routes 使用此角色)
CREATE POLICY "Service role can do everything on ticket_subscriptions"
ON ticket_subscriptions
TO service_role
USING (true)
WITH CHECK (true);

-- 第三步：允許認證用戶存取自己的訂閱 (如果未來使用 Supabase Client 端)
-- 讀取
CREATE POLICY "Users can view their own subscriptions"
ON ticket_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 新增
CREATE POLICY "Users can create their own subscriptions"
ON ticket_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 更新
CREATE POLICY "Users can update their own subscriptions"
ON ticket_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 刪除
CREATE POLICY "Users can delete their own subscriptions"
ON ticket_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
