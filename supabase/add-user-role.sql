-- User Role System for V14
-- Run this migration to add role-based access control

-- ============================================
-- 1. Add role column to users table
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comment
COMMENT ON COLUMN users.role IS 'User role: user, sub_admin, super_admin';

-- ============================================
-- 2. Initialize super admin
-- ============================================
-- Set the initial super admin (only one allowed)
UPDATE users SET role = 'super_admin' WHERE email = 'lmmlmm16861@gmail.com';

-- ============================================
-- 3. Ensure all existing users have default role
-- ============================================
UPDATE users SET role = 'user' WHERE role IS NULL;
