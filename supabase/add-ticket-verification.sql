-- Add ticket verification fields to conversations table for V12
-- This migration adds support for mutual ticket confirmation between host and guest

-- Add host confirmation timestamp (when host confirms ticket was given)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS host_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add guest confirmation timestamp (when guest confirms ticket was received)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS guest_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for querying confirmed conversations
CREATE INDEX IF NOT EXISTS idx_conversations_confirmed
  ON conversations(host_confirmed_at, guest_confirmed_at)
  WHERE host_confirmed_at IS NOT NULL AND guest_confirmed_at IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN conversations.host_confirmed_at IS 'Timestamp when host confirmed ticket was given to guest';
COMMENT ON COLUMN conversations.guest_confirmed_at IS 'Timestamp when guest confirmed ticket was received from host';
