-- Kystobservatorene Supabase schema (baseline)
-- Apply in Supabase SQL editor or migrations.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (optional, for stats/badges)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure profiles columns exist (in case table already existed)
alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_user_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

-- Submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  display_name text,
  level smallint not null,
  comment text,
  valg text,
  wind_dir text,
  wave_dir text,
  video_duration integer,
  video_analysis jsonb,
  lat double precision not null,
  lng double precision not null,
  lat_public double precision,
  lng_public double precision,
  location_method text,
  accuracy double precision,
  media_type text not null check (media_type in ('photo', 'video')),
  media_path_original text not null,
  media_path_preview text,
  media_content_type text,
  media_size_bytes bigint,
  is_public boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Ensure submissions columns exist (in case table already existed)
alter table public.submissions
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists display_name text,
  add column if not exists level smallint,
  add column if not exists comment text,
  add column if not exists valg text,
  add column if not exists wind_dir text,
  add column if not exists wave_dir text,
  add column if not exists video_duration integer,
  add column if not exists video_analysis jsonb,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists lat_public double precision,
  add column if not exists lng_public double precision,
  add column if not exists location_method text,
  add column if not exists accuracy double precision,
  add column if not exists media_type text,
  add column if not exists media_path_original text,
  add column if not exists media_path_preview text,
  add column if not exists media_content_type text,
  add column if not exists media_size_bytes bigint,
  add column if not exists is_public boolean default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'submissions_user_id_fkey'
  ) then
    alter table public.submissions
      add constraint submissions_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'submissions_media_type_check'
  ) then
    alter table public.submissions
      add constraint submissions_media_type_check
      check (media_type in ('photo', 'video'));
  end if;
end $$;

create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
create index if not exists submissions_public_idx on public.submissions (is_public);
create index if not exists submissions_deleted_idx on public.submissions (deleted_at);
create index if not exists submissions_public_created_idx on public.submissions (is_public, created_at desc);

-- Storage bucket (media)
-- NOTE: Bucket creation may require manual action in the Supabase UI.
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

-- Badges
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text,
  icon text,
  threshold integer,
  created_at timestamptz default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  badge_id uuid references public.badges (id) on delete cascade,
  progress integer default 0,
  earned_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists user_badges_unique_idx
  on public.user_badges (user_id, badge_id);

-- RLS
alter table public.submissions enable row level security;
alter table public.profiles enable row level security;

-- Public read of public submissions
drop policy if exists public_read_submissions on public.submissions;
create policy public_read_submissions
  on public.submissions
  for select
  using (is_public = true and deleted_at is null);

-- Authenticated users can read their own submissions
drop policy if exists read_own_submissions on public.submissions;
create policy read_own_submissions
  on public.submissions
  for select
  using (auth.uid() = user_id);

-- Authenticated users can insert (optional; API uses service role)
drop policy if exists insert_own_submissions on public.submissions;
create policy insert_own_submissions
  on public.submissions
  for insert
  with check (auth.uid() = user_id);

-- Profiles: owner read/write
drop policy if exists read_own_profile on public.profiles;
create policy read_own_profile
  on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists upsert_own_profile on public.profiles;
create policy upsert_own_profile
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists update_own_profile on public.profiles;
create policy update_own_profile
  on public.profiles
  for update
  using (auth.uid() = user_id);

-- Badges: public read
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists public_read_badges on public.badges;
create policy public_read_badges
  on public.badges
  for select
  using (true);

drop policy if exists read_own_user_badges on public.user_badges;
create policy read_own_user_badges
  on public.user_badges
  for select
  using (auth.uid() = user_id);

drop policy if exists update_own_user_badges on public.user_badges;
create policy update_own_user_badges
  on public.user_badges
  for update
  using (auth.uid() = user_id);

-- Storage policies (media bucket)
-- NOTE: Supabase may block altering storage.objects unless you are the owner.
-- Configure these in the Supabase Storage UI if this section errors.
-- alter table storage.objects enable row level security;
-- drop policy if exists public_read_media on storage.objects;
-- create policy public_read_media
--   on storage.objects
--   for select
--   using (bucket_id = 'media');
-- drop policy if exists authenticated_upload_media on storage.objects;
-- create policy authenticated_upload_media
--   on storage.objects
--   for insert
--   with check (bucket_id = 'media' and auth.role() = 'authenticated');
