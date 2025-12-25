-- Stage 12: Add role column to profiles table for RBAC
-- Roles: 'student' (default) or 'educator'

ALTER TABLE profiles
ADD COLUMN role text NOT NULL DEFAULT 'student'
CHECK (role IN ('student', 'educator'));

-- Index for efficient role lookups in layout guards
CREATE INDEX idx_profiles_role ON profiles(role);
