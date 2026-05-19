-- Migration: legal acceptance and soft launch waitlist columns
-- Adds terms_accepted_at and waitlist flag to profiles table

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waitlist BOOLEAN DEFAULT FALSE;

-- Index for querying waitlist users by city (useful for batch notifications when a city opens)
CREATE INDEX IF NOT EXISTS idx_profiles_waitlist_city
  ON profiles (city, waitlist)
  WHERE waitlist = TRUE;

COMMENT ON COLUMN profiles.terms_accepted_at IS 'ISO timestamp when the user accepted the Terms of Use and Privacy Policy during registration.';
COMMENT ON COLUMN profiles.waitlist IS 'True if the user registered in a city that was not yet fully launched. Set to false once the city goes live.';
