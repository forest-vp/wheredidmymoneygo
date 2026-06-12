-- Run this in Supabase SQL Editor to add email verification code support

-- Table to store verification codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'signup',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type 
  ON verification_codes(email, type) WHERE used = FALSE;

-- Function to generate a random 6-digit code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Cleanup old codes (run periodically or on new code insert)
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS: Allow anyone to insert/select (codes are short-lived and single-use)
ALTER TABLE verification_codes ENABLE ROW LEVEL CREATE;
CREATE POLICY "Anyone can insert codes" ON verification_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read codes" ON verification_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can update codes" ON verification_codes FOR UPDATE USING (true);

-- Add email_verified column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
