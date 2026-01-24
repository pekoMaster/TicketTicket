-- 用戶通知偏好設定 Migration
-- 新增 notification_preferences JSONB 欄位至 users 表

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_application": {"email": true, "discord": true, "line": false},
  "application_accepted": {"email": true, "discord": true, "line": false},
  "application_rejected": {"email": true, "discord": true, "line": false},
  "subscription_match": {"email": true, "discord": true, "line": false},
  "new_review": {"email": false, "discord": false, "line": false},
  "listing_expired": {"email": false, "discord": false, "line": false},
  "system": {"email": false, "discord": false, "line": false}
}'::jsonb;

-- 更新現有用戶的預設設定（如果欄位為 NULL）
UPDATE users
SET notification_preferences = '{
  "new_application": {"email": true, "discord": true, "line": false},
  "application_accepted": {"email": true, "discord": true, "line": false},
  "application_rejected": {"email": true, "discord": true, "line": false},
  "subscription_match": {"email": true, "discord": true, "line": false},
  "new_review": {"email": false, "discord": false, "line": false},
  "listing_expired": {"email": false, "discord": false, "line": false},
  "system": {"email": false, "discord": false, "line": false}
}'::jsonb
WHERE notification_preferences IS NULL;
