-- =============================================
-- 系統通知表 (Notifications Table)
-- =============================================
-- 用於儲存系統通知，與聊天訊息分離

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_application',      -- 有人申請了您的活動
    'application_accepted', -- 您的申請已被接受
    'application_rejected', -- 您的申請已被拒絕
    'listing_expired',      -- 您的活動已過期
    'new_review',           -- 您收到了新的評價
    'system'                -- 系統公告
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,                -- 點擊後跳轉的連結 (如 /listing/123)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：加速用戶通知查詢
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 索引：加速時間排序
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 索引：加速未讀通知計數
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的通知
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- 後端可插入通知 (透過 service role)
-- 注意：前端不應直接插入通知
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- 用戶可以更新自己的通知 (標記已讀)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 用戶可以刪除自己的通知
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());
