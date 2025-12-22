-- Profiles table (linked to auth.users)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

-- Story sessions table
create table story_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  story_id text not null,
  choices text[] not null,
  reflection text,
  virtue_scores jsonb,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table story_sessions enable row level security;

-- Story sessions policies
create policy "Users can view their own sessions"
  on story_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on story_sessions for insert
  with check (auth.uid() = user_id);

-- Trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
