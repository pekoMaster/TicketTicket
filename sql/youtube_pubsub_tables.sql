-- ============================================================
-- YouTube PubSub 即時通知系統 - Supabase 資料表
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================

-- 1. YouTube PubSub 訂閱表
CREATE TABLE IF NOT EXISTS youtube_pubsub_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    youtube_channel_id TEXT NOT NULL,          -- YouTube 頻道 ID (UC...)
    youtube_channel_name TEXT,                 -- 頻道顯示名稱
    discord_channel_id TEXT NOT NULL,          -- Discord 通知頻道 ID
    discord_guild_id TEXT,                     -- Discord 伺服器 ID
    custom_message TEXT,                       -- 自訂通知訊息模板
    hub_secret TEXT NOT NULL,                  -- HMAC 驗證密鑰
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),   -- 訂閱時間
    expires_at TIMESTAMPTZ,                    -- 訂閱過期時間（Hub 回傳）
    last_notified_at TIMESTAMPTZ,              -- 最後通知時間
    notification_count INT DEFAULT 0,          -- 累計通知次數
    is_active BOOLEAN DEFAULT TRUE,            -- 是否啟用
    created_by TEXT,                           -- 建立者 Discord 用戶 ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_pubsub_subs_channel_id ON youtube_pubsub_subscriptions(youtube_channel_id);
CREATE INDEX IF NOT EXISTS idx_pubsub_subs_discord_channel ON youtube_pubsub_subscriptions(discord_channel_id);
CREATE INDEX IF NOT EXISTS idx_pubsub_subs_active ON youtube_pubsub_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_pubsub_subs_expires ON youtube_pubsub_subscriptions(expires_at);

-- 唯一約束：同一 YT 頻道 + 同一 Discord 頻道只能有一筆 active 訂閱
CREATE UNIQUE INDEX IF NOT EXISTS idx_pubsub_subs_unique_active
    ON youtube_pubsub_subscriptions(youtube_channel_id, discord_channel_id)
    WHERE is_active = TRUE;

-- 2. YouTube PubSub 通知紀錄表（去重用）
CREATE TABLE IF NOT EXISTS youtube_pubsub_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL,                    -- YouTube 影片 ID
    channel_id TEXT NOT NULL,                  -- YouTube 頻道 ID
    title TEXT,                                -- 影片標題
    link TEXT,                                 -- 影片連結
    published_at TIMESTAMPTZ,                  -- 影片發布時間
    received_at TIMESTAMPTZ DEFAULT NOW(),     -- 通知接收時間
    notified BOOLEAN DEFAULT FALSE             -- 是否已發送通知
);

-- 去重索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_pubsub_notif_unique
    ON youtube_pubsub_notifications(video_id, channel_id);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_pubsub_notif_channel ON youtube_pubsub_notifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_pubsub_notif_received ON youtube_pubsub_notifications(received_at);

-- 3. 自動清理 30 天以上的通知紀錄（可選）
-- 可在 Supabase 中設定 pg_cron 或手動清理
-- DELETE FROM youtube_pubsub_notifications WHERE received_at < NOW() - INTERVAL '30 days';

-- 4. updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_pubsub_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pubsub_subs_updated_at
    BEFORE UPDATE ON youtube_pubsub_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_pubsub_updated_at();
