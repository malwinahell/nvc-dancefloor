-- ============================================================================
-- NVC Dancefloor — migracja inicjalna
-- Tabele: profiles, tiles, processes, user_tile_library
-- + trigger auto-tworzenia profilu + RLS policies
-- ============================================================================

-- ── Rozszerzenia ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Typ wyliczeniowy: widoczność ─────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'visibility_t') then
    create type visibility_t as enum ('private', 'public');
  end if;
end $$;

-- ============================================================================
-- 1. profiles
-- ============================================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Auto-insert profilu po rejestracji w auth.users
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- 2. tiles (kafelki własne / publiczne — kafelki domyślne żyją w kodzie frontu)
-- ============================================================================

create table if not exists tiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  description text,
  color text not null,
  icon text not null default '',
  nvc_type text not null default 'custom',
  visibility visibility_t not null default 'private',
  created_at timestamptz not null default now()
);

create index if not exists tiles_owner_idx on tiles(owner_id);
create index if not exists tiles_public_idx on tiles(visibility) where visibility = 'public';

-- ============================================================================
-- 3. user_tile_library (referencje: "moja biblioteka" — własne + dodane cudze publiczne)
-- ============================================================================

create table if not exists user_tile_library (
  user_id uuid not null references profiles(id) on delete cascade,
  tile_id uuid not null references tiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, tile_id)
);

create index if not exists library_user_idx on user_tile_library(user_id);

-- Auto-dodanie własnego kafelka do własnej biblioteki przy tworzeniu
create or replace function handle_new_tile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_tile_library (user_id, tile_id)
  values (new.owner_id, new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_tile_created on tiles;
create trigger on_tile_created
  after insert on tiles
  for each row execute function handle_new_tile();

-- ============================================================================
-- 4. processes (zapisane układy na kanwasie)
-- ============================================================================

create table if not exists processes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Nowy proces',
  description text,
  visibility visibility_t not null default 'private',
  forked_from_id uuid references processes(id) on delete set null,
  canvas_data jsonb not null default '{"nodes": [], "edges": [], "viewport": {"x":0,"y":0,"zoom":1}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists processes_owner_idx on processes(owner_id);
create index if not exists processes_public_idx on processes(visibility) where visibility = 'public';
create index if not exists processes_forked_from_idx on processes(forked_from_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists processes_set_updated_at on processes;
create trigger processes_set_updated_at
  before update on processes
  for each row execute function set_updated_at();

-- ============================================================================
-- 5. Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table tiles enable row level security;
alter table processes enable row level security;
alter table user_tile_library enable row level security;

-- profiles: każdy zalogowany widzi podstawowe profile (np. do przyszłych "autor: x"),
-- ale modyfikować może tylko swój wiersz.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (id = auth.uid());

-- tiles
drop policy if exists tiles_select on tiles;
create policy tiles_select on tiles for select
  using (visibility = 'public' or owner_id = auth.uid());

drop policy if exists tiles_insert on tiles;
create policy tiles_insert on tiles for insert
  with check (owner_id = auth.uid());

drop policy if exists tiles_update on tiles;
create policy tiles_update on tiles for update
  using (owner_id = auth.uid());

drop policy if exists tiles_delete on tiles;
create policy tiles_delete on tiles for delete
  using (owner_id = auth.uid());

-- processes
drop policy if exists processes_select on processes;
create policy processes_select on processes for select
  using (visibility = 'public' or owner_id = auth.uid());

drop policy if exists processes_insert on processes;
create policy processes_insert on processes for insert
  with check (owner_id = auth.uid());

drop policy if exists processes_update on processes;
create policy processes_update on processes for update
  using (owner_id = auth.uid());

drop policy if exists processes_delete on processes;
create policy processes_delete on processes for delete
  using (owner_id = auth.uid());

-- user_tile_library: user widzi i zarządza wyłącznie własną biblioteką
drop policy if exists library_select on user_tile_library;
create policy library_select on user_tile_library for select
  using (user_id = auth.uid());

drop policy if exists library_insert on user_tile_library;
create policy library_insert on user_tile_library for insert
  with check (
    user_id = auth.uid()
    -- można dodać do biblioteki tylko kafelek, który jest publiczny lub własny
    and exists (
      select 1 from tiles t
      where t.id = tile_id
        and (t.visibility = 'public' or t.owner_id = auth.uid())
    )
  );

drop policy if exists library_delete on user_tile_library;
create policy library_delete on user_tile_library for delete
  using (user_id = auth.uid());

-- ============================================================================
-- Koniec migracji 0001_init
-- ============================================================================
