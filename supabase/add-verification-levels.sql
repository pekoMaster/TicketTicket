-- 新增用戶驗證層級系統（2025-12-22）
-- 用於防止帳號量產和黃牛轉賣

-- 驗證層級：'unverified' | 'applicant' | 'host'
-- unverified: 未驗證（剛註冊）
-- applicant: 已驗證 Email（可申請同行）
-- host: 已驗證電話（可發布活動）

-- 新增驗證層級欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_level VARCHAR(20) DEFAULT 'unverified';

-- Email 驗證相關欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;

-- 電話驗證時間戳記（phone_number 已存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_users_verification_level ON users(verification_level);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);

-- 更新現有用戶：已有 phone_number 且 is_verified 的設為 host
UPDATE users
SET verification_level = 'host',
    email_verified_at = created_at,
    phone_verified_at = created_at
WHERE is_verified = true
  AND phone_number IS NOT NULL
  AND phone_number != '';

-- 更新現有用戶：有 email 但沒驗證電話的設為 applicant
UPDATE users
SET verification_level = 'applicant',
    email_verified_at = created_at
WHERE verification_level = 'unverified'
  AND email IS NOT NULL;

-- 註解說明
COMMENT ON COLUMN users.verification_level IS 'unverified: 未驗證, applicant: Email已驗證可申請, host: 電話已驗證可發布';
COMMENT ON COLUMN users.email_verification_token IS '一次性 Email 驗證 token';
COMMENT ON COLUMN users.email_verification_expires IS 'Email 驗證 token 過期時間';
