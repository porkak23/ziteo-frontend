-- Add email column to profiles for users who register with an email address
-- or sign in via Google/Apple OAuth.
-- NULL is allowed since phone-only users may not have an email.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email)
  WHERE email IS NOT NULL;
