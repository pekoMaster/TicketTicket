-- Add conversation type and related timestamp fields
-- This migration supports the inquiry -> pending -> matched conversation flow

-- Add conversation_type column
-- Values: 'inquiry' (諮詢中), 'pending' (申請中), 'matched' (已配對)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(20) DEFAULT 'inquiry';

-- Add timestamp for when inquiry was started
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS inquiry_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add timestamp for when application was submitted (inquiry -> pending)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add timestamp for when match was confirmed (pending -> matched)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS matched_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for filtering by conversation type
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);

-- Update existing conversations to 'matched' if they have confirmation records
-- This handles backward compatibility with existing data
UPDATE conversations c
SET conversation_type = 'matched', matched_at = c.created_at
WHERE EXISTS (
  SELECT 1 FROM transaction_confirmations tc WHERE tc.conversation_id = c.id
)
AND c.conversation_type IS NULL;

-- Set remaining null types to 'inquiry' (default)
UPDATE conversations SET conversation_type = 'inquiry' WHERE conversation_type IS NULL;

-- Comments for documentation
COMMENT ON COLUMN conversations.conversation_type IS 'Current state: inquiry (諮詢中), pending (申請中), matched (已配對)';
COMMENT ON COLUMN conversations.inquiry_started_at IS 'When the guest first contacted the host';
COMMENT ON COLUMN conversations.applied_at IS 'When the guest submitted an application';
COMMENT ON COLUMN conversations.matched_at IS 'When the host accepted the application';
