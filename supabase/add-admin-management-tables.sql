-- Admin Management System Tables for V13
-- Run this migration to add blacklist and admin logs support

-- ============================================
-- 1. Blacklist Table
-- ============================================
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin'
);

-- Index for fast email lookup during login
CREATE INDEX IF NOT EXISTS idx_blacklist_email ON blacklist(email);

-- Comments
COMMENT ON TABLE blacklist IS 'Blocked users who cannot login or register';
COMMENT ON COLUMN blacklist.email IS 'Google account email that is blocked';
COMMENT ON COLUMN blacklist.reason IS 'Reason for blocking this user';

-- ============================================
-- 2. Admin Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);

-- Comments
COMMENT ON TABLE admin_logs IS 'Log of all admin actions for auditing';
COMMENT ON COLUMN admin_logs.action_type IS 'Type: listing_edit, listing_delete, user_edit, user_blacklist, user_unblacklist';
COMMENT ON COLUMN admin_logs.target_type IS 'Target type: listing, user, blacklist';
COMMENT ON COLUMN admin_logs.details IS 'JSON details including before/after values and notification status';

-- ============================================
-- 3. System Message Support (messages table)
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS system_message_type TEXT DEFAULT NULL;

COMMENT ON COLUMN messages.is_system_message IS 'Whether this is a system-generated message';
COMMENT ON COLUMN messages.system_message_type IS 'Type: admin_listing_edited, admin_listing_deleted, admin_user_edited';

-- ============================================
-- 4. RLS Policies for Admin Tables
-- ============================================

-- Blacklist: Only service role can access
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to blacklist" ON blacklist
  FOR ALL
  USING (auth.role() = 'service_role');

-- Admin Logs: Only service role can access
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to admin_logs" ON admin_logs
  FOR ALL
  USING (auth.role() = 'service_role');
