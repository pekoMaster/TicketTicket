-- Add Discord Webhook notification support
-- V16: Discord Webhook Notification System with Inngest

-- 1. Add discord_webhook_url to events table (for admin to set per-event webhook)
ALTER TABLE events ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;

-- 2. Create user_webhook_subscriptions table (for users to subscribe to event notifications)
CREATE TABLE IF NOT EXISTS user_webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each user can only have one webhook per event
  UNIQUE(user_id, event_id)
);

-- 3. Create user_discord_webhook table (for user's personal Discord webhook)
CREATE TABLE IF NOT EXISTS user_discord_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  webhook_url TEXT NOT NULL,
  webhook_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create webhook_logs table (for tracking sent webhooks)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type VARCHAR(50) NOT NULL, -- 'event_admin', 'user_subscription'
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  webhook_url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_webhook_subscriptions_user ON user_webhook_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_webhook_subscriptions_event ON user_webhook_subscriptions(event_id);
CREATE INDEX IF NOT EXISTS idx_user_webhook_subscriptions_active ON user_webhook_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_discord_webhooks_user ON user_discord_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_listing ON webhook_logs(listing_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- 6. Enable RLS
ALTER TABLE user_webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_discord_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for user_webhook_subscriptions
CREATE POLICY "Users can view their own webhook subscriptions"
  ON user_webhook_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook subscriptions"
  ON user_webhook_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook subscriptions"
  ON user_webhook_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook subscriptions"
  ON user_webhook_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- 8. RLS Policies for user_discord_webhooks
CREATE POLICY "Users can view their own discord webhook"
  ON user_discord_webhooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discord webhook"
  ON user_discord_webhooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discord webhook"
  ON user_discord_webhooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discord webhook"
  ON user_discord_webhooks FOR DELETE
  USING (auth.uid() = user_id);

-- 9. RLS Policies for webhook_logs (read-only for users)
CREATE POLICY "Users can view their own webhook logs"
  ON webhook_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 10. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Triggers for updated_at
CREATE TRIGGER update_user_webhook_subscriptions_updated_at
  BEFORE UPDATE ON user_webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_updated_at();

CREATE TRIGGER update_user_discord_webhooks_updated_at
  BEFORE UPDATE ON user_discord_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_updated_at();

-- Add comment
COMMENT ON TABLE user_webhook_subscriptions IS 'User subscriptions to event notifications via Discord webhook';
COMMENT ON TABLE user_discord_webhooks IS 'User personal Discord webhook settings';
COMMENT ON TABLE webhook_logs IS 'Log of all webhook notifications sent';
COMMENT ON COLUMN events.discord_webhook_url IS 'Discord webhook URL for admin notifications of new listings for this event';
