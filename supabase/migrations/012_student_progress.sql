-- Stage 24: Student Progress Layer (Private, Non-Competitive)
-- Tables for private student XP, level, and virtue trends

-- Student progress (XP, level)
CREATE TABLE student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Virtue trends (cumulative per virtue)
CREATE TABLE student_virtue_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  virtue_id text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, virtue_id)
);

-- RLS: Students only see their own data (SELECT only)
-- NO educator access policies
-- NO INSERT policies (writes happen via RPC)
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_virtue_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own progress"
  ON student_progress FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students view own virtue trends"
  ON student_virtue_trends FOR SELECT
  USING (student_id = auth.uid());

-- Indexes
CREATE INDEX student_progress_student_id_idx ON student_progress(student_id);
CREATE INDEX student_virtue_trends_student_id_idx ON student_virtue_trends(student_id);

-- RPC Functions (SECURITY DEFINER with role guard + safe search_path)

CREATE OR REPLACE FUNCTION public.increment_student_xp(p_student_id uuid, p_xp_delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow the authenticated student to update their own row
  IF auth.uid() IS NULL OR auth.uid() <> p_student_id THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- Ensure role is student
  IF NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'student') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO student_progress (student_id, xp, level, last_active_at)
  VALUES (p_student_id, p_xp_delta, 1, now())
  ON CONFLICT (student_id)
  DO UPDATE SET
    xp = student_progress.xp + p_xp_delta,
    level = floor((student_progress.xp + p_xp_delta) / 100) + 1,
    last_active_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_virtue_trend(p_student_id uuid, p_virtue_id text, p_delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow the authenticated student to update their own row
  IF auth.uid() IS NULL OR auth.uid() <> p_student_id THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- Ensure role is student
  IF NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'student') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO student_virtue_trends (student_id, virtue_id, value, updated_at)
  VALUES (p_student_id, p_virtue_id, p_delta, now())
  ON CONFLICT (student_id, virtue_id)
  DO UPDATE SET
    value = student_virtue_trends.value + p_delta,
    updated_at = now();
END;
$$;

-- GRANT EXECUTE permissions for authenticated users (required for RPC calls)
GRANT EXECUTE ON FUNCTION public.increment_student_xp(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_virtue_trend(uuid, text, integer) TO authenticated;
