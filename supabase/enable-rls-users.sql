-- ============================================
-- 🔒 安全性修復：啟用 RLS 並保護用戶資料
-- ============================================
-- ⚠️ 請在 Supabase SQL Editor 中執行此腳本
-- ============================================

-- 第一步：啟用 users 表的 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 第二步：刪除舊的 SELECT 政策（如果存在）
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Public users are viewable" ON users;

-- 第三步：創建新的 SELECT 政策
-- 方案一：拒絕所有使用 anon key 的直接訪問
-- 這樣只有使用 service role key 的 API 才能訪問
CREATE POLICY "Deny anon access to users"
ON users FOR SELECT
TO anon
USING (false);

-- 方案二：允許 authenticated 使用者和 service_role 訪問
CREATE POLICY "Service role can access all users"
ON users FOR SELECT
TO service_role
USING (true);

-- 第四步：創建公開用戶視圖（可選，供未來使用）
-- 這個 View 只包含安全的公開欄位
DROP VIEW IF EXISTS public_users;
CREATE VIEW public_users AS
SELECT 
  id,
  username,
  avatar_url,
  custom_avatar_url,
  rating,
  review_count,
  is_verified,
  phone_verified,
  created_at
FROM users;

-- 允許任何人透過這個 View 讀取公開資訊
GRANT SELECT ON public_users TO anon;
GRANT SELECT ON public_users TO authenticated;

-- ============================================
-- 驗證說明
-- ============================================
-- 執行後，請測試：
-- 1. 直接用 anon key 查詢 users 表 → 應該返回空結果或錯誤
-- 2. 直接用 anon key 查詢 public_users view → 應該返回安全欄位
-- 3. 應用程式功能 → 應該正常運作（使用 service role key）
-- ============================================
