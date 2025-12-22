-- Migration: Allow any authenticated user to read all sessions (simplified for Stage 3)
-- In a production app, you would have role-based access control

create policy "Authenticated users can read all sessions"
  on story_sessions for select
  using (auth.role() = 'authenticated');
