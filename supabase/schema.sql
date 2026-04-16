-- ============================================================
-- Steam Deal Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================

-- Enable UUID extension (usually enabled by default on Supabase)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- TABLE: profiles
-- One row per auth user, holds notification preferences.
-- Created automatically via trigger when a user signs up.
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  discord_webhook_url text,
  telegram_chat_id    text,
  wants_aaa_only      boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- TABLE: games
-- Shared cache of Steam game metadata. Updated by the CRON worker.
-- ----------------------------------------------------------------
create table if not exists public.games (
  app_id               integer primary key,
  title                text not null,
  header_image         text,
  base_price_cents     integer not null default 0,
  current_price_cents  integer not null default 0,
  discount_percent     integer not null default 0,
  -- Generated column: true when original price >= $40.00
  is_aaa               boolean generated always as (base_price_cents >= 4000) stored,
  last_updated_at      timestamptz
);

-- ----------------------------------------------------------------
-- TABLE: user_tracked_games
-- Maps users to games they are watching, with target price alerts.
-- ----------------------------------------------------------------
create table if not exists public.user_tracked_games (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  app_id              integer not null references public.games(app_id) on delete cascade,
  target_price_cents  integer not null default 0,
  notified_at         timestamptz,
  created_at          timestamptz not null default now(),
  -- One tracking rule per game per user
  unique (profile_id, app_id)
);

-- ----------------------------------------------------------------
-- RLS: profiles
-- Users can only read/update their own row.
-- The service-role key (CRON worker) bypasses RLS entirely.
-- ----------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------
-- RLS: games
-- All authenticated users can read the games cache.
-- Writes are done exclusively via the service-role key (CRON).
-- ----------------------------------------------------------------
alter table public.games enable row level security;

create policy "Anyone can read games cache"
  on public.games for select
  using (true);

-- Note: INSERT/UPDATE/DELETE on games is only allowed via service-role key.
-- No anon/authenticated policy needed for writes.

-- ----------------------------------------------------------------
-- RLS: user_tracked_games
-- Full CRUD scoped to the authenticated user's own rows.
-- ----------------------------------------------------------------
alter table public.user_tracked_games enable row level security;

create policy "Users can view their own tracked games"
  on public.user_tracked_games for select
  using (auth.uid() = profile_id);

create policy "Users can insert their own tracked games"
  on public.user_tracked_games for insert
  with check (auth.uid() = profile_id);

create policy "Users can delete their own tracked games"
  on public.user_tracked_games for delete
  using (auth.uid() = profile_id);

-- ----------------------------------------------------------------
-- TRIGGER: auto-create profile on user signup
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
