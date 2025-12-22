-- 新增 email_verification_sent_at 欄位用於冷卻時間控制
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE;
