-- Stage 21: Classrooms & Rosters
-- Creates foundational infrastructure for classroom management

-- Create classrooms table
create table classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  educator_id uuid references auth.users(id) on delete cascade not null,
  join_code text unique not null,
  created_at timestamp with time zone default now() not null
);

-- Create classroom_members table
create table classroom_members (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references classrooms(id) on delete cascade not null,
  student_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default now() not null,
  unique(classroom_id, student_id)
);

-- Enable RLS
alter table classrooms enable row level security;
alter table classroom_members enable row level security;

-- =====================
-- CLASSROOMS POLICIES
-- =====================

-- Educators can view their own classrooms
create policy "Educators can view own classrooms"
  on classrooms for select
  using (educator_id = auth.uid());

-- Educators can create classrooms
create policy "Educators can create classrooms"
  on classrooms for insert
  with check (educator_id = auth.uid());

-- Educators can update their own classrooms
create policy "Educators can update own classrooms"
  on classrooms for update
  using (educator_id = auth.uid());

-- Educators can delete their own classrooms
create policy "Educators can delete own classrooms"
  on classrooms for delete
  using (educator_id = auth.uid());

-- Students can view classrooms they're members of
create policy "Students can view joined classrooms"
  on classrooms for select
  using (
    exists (
      select 1 from classroom_members
      where classroom_members.classroom_id = classrooms.id
      and classroom_members.student_id = auth.uid()
    )
  );

-- ==============================
-- CLASSROOM MEMBERS POLICIES (HARDENED)
-- ==============================

-- Educators can view roster of their classrooms
create policy "Educators can view roster"
  on classroom_members for select
  using (
    exists (
      select 1 from classrooms
      where classrooms.id = classroom_members.classroom_id
      and classrooms.educator_id = auth.uid()
    )
  );

-- Educators can remove students from their classrooms
create policy "Educators can remove students"
  on classroom_members for delete
  using (
    exists (
      select 1 from classrooms
      where classrooms.id = classroom_members.classroom_id
      and classrooms.educator_id = auth.uid()
    )
  );

-- HARDENED: Students can join classrooms (role check prevents educators)
create policy "Students can join classrooms"
  on classroom_members for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.user_id = auth.uid()
      and p.role = 'student'
    )
  );

-- HARDENED: Students can view own memberships (role check)
create policy "Students can view own memberships"
  on classroom_members for select
  using (
    student_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.user_id = auth.uid()
      and p.role = 'student'
    )
  );

-- =====================
-- INDEXES
-- =====================
create index classrooms_educator_id_idx on classrooms(educator_id);
create index classrooms_join_code_idx on classrooms(join_code);
create index classroom_members_classroom_id_idx on classroom_members(classroom_id);
create index classroom_members_student_id_idx on classroom_members(student_id);
