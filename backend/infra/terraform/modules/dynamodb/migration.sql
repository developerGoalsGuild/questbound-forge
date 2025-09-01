/*
  # Update users table schema for native sign-up and email verification

  1. Changes to users table:
    - Add columns:
      - login_type (string) to indicate 'native' or 'social'
      - email_verified (boolean) to track email confirmation status
      - password_hash (string) to store hashed password
      - salt (string) to store unique salt per user
      - verification_token (string) to store email verification token

  2. Security:
    - Enable Row Level Security (RLS)
    - Policies to restrict access to own user data only

  3. Notes:
    - Existing data is preserved
    - New columns have default values where appropriate
*/

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS login_type text DEFAULT 'social',
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS salt text,
  ADD COLUMN IF NOT EXISTS verification_token text;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can access own data"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
