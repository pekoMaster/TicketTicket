-- Migration: add-listings-composite-index
-- Description: Adds a composite index on status and created_at to optimize homepage loading

CREATE INDEX IF NOT EXISTS idx_listings_status_created_at 
ON listings(status, created_at DESC);
