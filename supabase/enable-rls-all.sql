-- ============================================
-- 🔒 安全性修復：全面啟用 RLS 並封鎖未授權存取
-- ============================================
-- ⚠️ 請在 Supabase SQL Editor 中執行此腳本
-- 這將保護所有表，防止外部直接訪問。
-- 應用程式內部 API 使用 service_role 將不受影響。
-- ============================================

-- 1. 啟用 Users 表 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Deny anon access to users" ON users;
DROP POLICY IF EXISTS "Service role can access all users" ON users;

-- Users 表：完全拒絕 Anon 訪問
CREATE POLICY "Deny anon access to users" ON users FOR SELECT TO anon USING (false);
-- Users 表：允許 Service Role (API) 訪問
CREATE POLICY "Service role can access users" ON users FOR ALL TO service_role USING (true);


-- 2. 啟用 Listings 表 RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view open listings" ON listings;
DROP POLICY IF EXISTS "Users can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;

-- Listings 表：允許公開讀取（如果需要）
-- 如果希望刊登也是私有的，請將下面的 (true) 改為 (false)
CREATE POLICY "Anyone can view open listings" ON listings FOR SELECT TO anon USING (status = 'open');
-- 寫入權限：僅限 Service Role (API)
CREATE POLICY "Service role can manage listings" ON listings FOR ALL TO service_role USING (true);


-- 3. 啟用 Applications 表 RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- 移除舊政策
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
-- 僅限 Service Role (API)
CREATE POLICY "Service role can manage applications" ON applications FOR ALL TO service_role USING (true);
CREATE POLICY "Deny anon access to applications" ON applications FOR ALL TO anon USING (false);


-- 4. 啟用 Conversations 表 RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
-- 僅限 Service Role (API)
CREATE POLICY "Service role can manage conversations" ON conversations FOR ALL TO service_role USING (true);
CREATE POLICY "Deny anon access to conversations" ON conversations FOR ALL TO anon USING (false);


-- 5. 啟用 Messages 表 RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
-- 僅限 Service Role (API)
CREATE POLICY "Service role can manage messages" ON messages FOR ALL TO service_role USING (true);
CREATE POLICY "Deny anon access to messages" ON messages FOR ALL TO anon USING (false);


-- 6. 啟用 Reviews 表 RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
-- Reviews 表：允許公開讀取
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO anon USING (true);
-- 寫入權限：僅限 Service Role (API)
CREATE POLICY "Service role can manage reviews" ON reviews FOR ALL TO service_role USING (true);


-- 7. 啟用 Events 表 RLS (Hololive 活動)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active events" ON events;
-- Events 表：允許公開讀取
CREATE POLICY "Anyone can view active events" ON events FOR SELECT TO anon USING (is_active = true);
-- 寫入權限：僅限 Service Role (API)
CREATE POLICY "Service role can manage events" ON events FOR ALL TO service_role USING (true);
