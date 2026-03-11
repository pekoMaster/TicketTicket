-- Migration: add ticket source, nationality and languages to ticket_requests
-- Description: Adds new preferences to ticket requests for better filtering.

ALTER TABLE public.ticket_requests
ADD COLUMN IF NOT EXISTS ticket_source text,
ADD COLUMN IF NOT EXISTS requester_nationality text,
ADD COLUMN IF NOT EXISTS requester_languages jsonb;

-- Comment on columns
COMMENT ON COLUMN public.ticket_requests.ticket_source IS 'Preferred ticket source (zaiko, lawson), null means any';
COMMENT ON COLUMN public.ticket_requests.requester_nationality IS 'Nationality of the requester';
COMMENT ON COLUMN public.ticket_requests.requester_languages IS 'Languages spoken by the requester (JSON array)';
