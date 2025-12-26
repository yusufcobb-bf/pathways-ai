-- Stage 21b: Add username column to profiles for readable educator rosters
-- Usernames are educator-facing only (students never see other students)

-- Add username column
ALTER TABLE profiles ADD COLUMN username text;

-- Add unique constraint (allows multiple NULLs)
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Backfill existing users: extract email prefix as username
-- Example: test2@test.com → test2
UPDATE profiles
SET username = lower(split_part(
  (SELECT email FROM auth.users WHERE auth.users.id = profiles.user_id),
  '@',
  1
))
WHERE username IS NULL;

-- Create index for username lookups
CREATE INDEX profiles_username_idx ON profiles(username);
