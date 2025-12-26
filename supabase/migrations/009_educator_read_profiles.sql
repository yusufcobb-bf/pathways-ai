-- Allow educators to read all profiles (for roster display)
-- Students can still only see their own profile

-- Create a SECURITY DEFINER function to check educator role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_educator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'educator'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create policy using the function
CREATE POLICY "Educators can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_educator());
