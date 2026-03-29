-- Enable RLS for YouTube PubSub tables
ALTER TABLE youtube_pubsub_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_pubsub_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on youtube_pubsub_subscriptions
CREATE POLICY "Admins can manage youtube_pubsub_subscriptions" 
ON youtube_pubsub_subscriptions 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- Admins can do everything on youtube_pubsub_notifications
CREATE POLICY "Admins can manage youtube_pubsub_notifications" 
ON youtube_pubsub_notifications 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
