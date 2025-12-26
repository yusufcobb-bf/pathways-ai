-- Stage 22: Assignments (Teacher-Directed Play)
-- Allows educators to assign specific stories to classrooms

-- Assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  educator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  archetype_id text NOT NULL,
  variant_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  guided_reflection_override boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assignment submissions table
CREATE TABLE assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(assignment_id, student_id),
  CONSTRAINT valid_status CHECK (status IN ('assigned', 'completed'))
);

-- Indexes
CREATE INDEX assignments_classroom_id_idx ON assignments(classroom_id);
CREATE INDEX assignments_educator_id_idx ON assignments(educator_id);
CREATE INDEX assignment_submissions_assignment_id_idx ON assignment_submissions(assignment_id);
CREATE INDEX assignment_submissions_student_id_idx ON assignment_submissions(student_id);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- =====================
-- ASSIGNMENTS POLICIES (split for clarity/safety)
-- =====================

CREATE POLICY "Educators can view own assignments"
  ON assignments FOR SELECT
  USING (educator_id = auth.uid());

CREATE POLICY "Educators can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (educator_id = auth.uid());

CREATE POLICY "Educators can update own assignments"
  ON assignments FOR UPDATE
  USING (educator_id = auth.uid());

CREATE POLICY "Educators can delete own assignments"
  ON assignments FOR DELETE
  USING (educator_id = auth.uid());

CREATE POLICY "Students can view assignments for joined classrooms"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members m
      WHERE m.classroom_id = assignments.classroom_id
      AND m.student_id = auth.uid()
    )
  );

-- =====================
-- SUBMISSIONS POLICIES
-- =====================

-- SECURITY DEFINER function to check if user is the educator for an assignment
CREATE OR REPLACE FUNCTION public.is_assignment_educator(assignment_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE a.id = assignment_uuid
    AND c.educator_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Educators can view submissions for their assignments"
  ON assignment_submissions FOR SELECT
  USING (public.is_assignment_educator(assignment_id));

CREATE POLICY "Students can view own submissions"
  ON assignment_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own submissions"
  ON assignment_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM assignments a
      JOIN classroom_members m ON m.classroom_id = a.classroom_id
      WHERE a.id = assignment_id
      AND m.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own submissions"
  ON assignment_submissions FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
