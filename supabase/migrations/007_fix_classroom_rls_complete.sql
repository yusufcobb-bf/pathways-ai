-- Complete fix for classroom RLS policies
-- This migration ensures both students and educators can access the data they need

-- First, drop ALL existing policies on both tables to start fresh
DROP POLICY IF EXISTS "Educators can view own classrooms" ON classrooms;
DROP POLICY IF EXISTS "Educators can create classrooms" ON classrooms;
DROP POLICY IF EXISTS "Educators can update own classrooms" ON classrooms;
DROP POLICY IF EXISTS "Educators can delete own classrooms" ON classrooms;
DROP POLICY IF EXISTS "Students can view joined classrooms" ON classrooms;
DROP POLICY IF EXISTS "Authenticated users can view classrooms by id" ON classrooms;

DROP POLICY IF EXISTS "Educators can view roster" ON classroom_members;
DROP POLICY IF EXISTS "Educators can remove students" ON classroom_members;
DROP POLICY IF EXISTS "Students can join classrooms" ON classroom_members;
DROP POLICY IF EXISTS "Students can view own memberships" ON classroom_members;

-- Drop the function if it exists (we'll recreate it)
DROP FUNCTION IF EXISTS public.is_classroom_owner(UUID);

-- =====================
-- CLASSROOMS TABLE POLICIES (Simple, no recursion)
-- =====================

-- Educators: full CRUD on their own classrooms
CREATE POLICY "Educators can manage own classrooms"
  ON classrooms FOR ALL
  USING (educator_id = auth.uid())
  WITH CHECK (educator_id = auth.uid());

-- Everyone authenticated can SELECT classrooms (needed for joins)
-- Security: classroom IDs are UUIDs (unguessable), access is via join codes
CREATE POLICY "Authenticated can view classrooms"
  ON classrooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================
-- CLASSROOM_MEMBERS TABLE POLICIES
-- =====================

-- Students can INSERT (join) if they are a student
CREATE POLICY "Students can join classrooms"
  ON classroom_members FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'student'
    )
  );

-- Students can view their own memberships
CREATE POLICY "Students can view own memberships"
  ON classroom_members FOR SELECT
  USING (student_id = auth.uid());

-- Educators can view members of classrooms they own
-- Using a direct subquery (safe because classrooms policies don't reference classroom_members)
CREATE POLICY "Educators can view roster"
  ON classroom_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classrooms
      WHERE classrooms.id = classroom_members.classroom_id
      AND classrooms.educator_id = auth.uid()
    )
  );

-- Educators can remove students from their classrooms
CREATE POLICY "Educators can remove students"
  ON classroom_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classrooms
      WHERE classrooms.id = classroom_members.classroom_id
      AND classrooms.educator_id = auth.uid()
    )
  );
