-- ─────────────────────────────────────────────────────────────────────────────
-- Squib Society, Supabase schema
--
-- Run this once in the Supabase SQL editor (Dashboard, SQL, New query).
-- Idempotent: safe to re-run.
--
-- Design notes:
--  · Points are NEVER stored as a mutable total. They live in an append-only
--    ledger and are summed on read, so a bug cannot silently inflate somebody.
--  · Once-per-day and once-ever limits are enforced by unique indexes rather
--    than by application logic, so two concurrent requests cannot both win.
--  · RLS is on for every table with NO policies, and EXECUTE on the functions
--    is revoked from PUBLIC. Between them, the anon key can neither read a row
--    nor call a function. Everything goes through Next.js route handlers using
--    the service role key. If the browser could reach either, points would be
--    forgeable and the board would belong to whoever opened devtools first.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per connected X account.
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  -- The stable numeric id from X, NOT the handle. Handles get renamed and
  -- recycled, so deduping on handle alone lets one person enter twice.
  x_user_id     text        not null,
  handle        text        not null,
  display_name  text,
  avatar_url    text,
  -- Captured at connect time so the account-age rule can be applied later
  -- without re-querying X.
  x_created_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists profiles_x_user_id_key
  on public.profiles (x_user_id);
create unique index if not exists profiles_handle_lower_key
  on public.profiles (lower(handle));

-- ── allowlist entries ───────────────────────────────────────────────────────
create table if not exists public.allowlist_entries (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid        not null references public.profiles(id) on delete cascade,
  evm_address   text        not null,
  gtd           boolean     not null default false,
  created_at    timestamptz not null default now(),
  constraint evm_address_shape check (evm_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- The two anti-sybil rules that matter, enforced by the database rather than
-- by a code path someone can forget to call.
create unique index if not exists allowlist_one_per_profile
  on public.allowlist_entries (profile_id);
create unique index if not exists allowlist_one_per_address
  on public.allowlist_entries (lower(evm_address));

-- ── points ledger ───────────────────────────────────────────────────────────
-- Append only. `kind` is one of: 'task:follow', 'task:like', 'task:retweet',
-- 'task:quote', 'spin', 'game', 'share'. `day` holds the user's LOCAL day for
-- anything that repeats daily, and null for anything that happens once.
create table if not exists public.points_ledger (
  id          bigint generated always as identity primary key,
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  kind        text        not null,
  points      integer     not null check (points >= 0),
  day         date,
  meta        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Daily things: one award per kind per local day.
create unique index if not exists ledger_once_per_day
  on public.points_ledger (profile_id, kind, day)
  where day is not null;

-- One-time things (the X tasks, the share bonus): one award, ever.
-- Spins and games are excluded because they repeat on a rolling cooldown that
-- daily_spin() and cooldown_award() enforce instead.
drop index if exists public.ledger_once_ever;
create unique index if not exists ledger_once_ever
  on public.points_ledger (profile_id, kind)
  where day is null and kind not in ('spin', 'game');

create index if not exists ledger_profile_idx
  on public.points_ledger (profile_id);

-- ── spin state ──────────────────────────────────────────────────────────────
create table if not exists public.streaks (
  profile_id      uuid primary key references public.profiles(id) on delete cascade,
  -- Number of daily spins taken. This is the flame shown on the board.
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_spin_at    timestamptz
);

-- Safe on an existing database that predates the daily spin.
alter table public.streaks add column if not exists last_spin_at timestamptz;

-- ── leaderboard ─────────────────────────────────────────────────────────────
-- A view, not a table. The ledger is the truth, this is only how we read it.
create or replace view public.leaderboard as
  select
    p.id                                as profile_id,
    p.handle,
    p.display_name,
    coalesce(sum(l.points), 0)::integer as points,
    coalesce(s.current_streak, 0)       as streak,
    p.created_at                        as joined_at
  from public.profiles p
  left join public.points_ledger l on l.profile_id = p.id
  left join public.streaks s       on s.profile_id = p.id
  group by p.id, p.handle, p.display_name, p.created_at, s.current_streak;

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions. Point VALUES are passed in from the app so constants.ts stays the
-- single source of truth. The ATOMICITY lives here, where it belongs.
-- ─────────────────────────────────────────────────────────────────────────────

-- One spin every 24 hours.
--
-- Locks the row, checks how long since the last spin, and either writes the
-- award or refuses. Check and write happen in the same call, so two tabs firing
-- at once produce one prize and one refusal.
--
-- p_consume = false is the "try again" segment: pays nothing and does NOT start
-- the cooldown, so the player spins again at no cost.
-- p_gtd = true also flips the guaranteed flag on their allowlist entry, if they
-- have one yet.
create or replace function public.daily_spin(
  p_profile         uuid,
  p_points          integer,
  p_cooldown_hours  integer,
  p_consume         boolean default true,
  p_gtd             boolean default false
)
returns table (applied boolean, awarded integer, won_gtd boolean, next_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last  timestamptz;
  v_count integer;
  v_gtd   boolean := false;
  v_cool  interval := make_interval(hours => p_cooldown_hours);
begin
  -- Create-then-lock rather than check-then-insert. Two first-time requests
  -- racing each other would otherwise both miss the row and both try to insert,
  -- and one would blow up on the primary key.
  insert into public.streaks (profile_id)
  values (p_profile)
  on conflict (profile_id) do nothing;

  select s.last_spin_at, s.current_streak
    into v_last, v_count
    from public.streaks s
   where s.profile_id = p_profile
     for update;

  -- The cooldown is checked even for "again", otherwise a client could keep
  -- asking for a free segment and farm the wheel.
  if v_last is not null and now() < v_last + v_cool then
    return query select false, 0, false, v_last + v_cool;
    return;
  end if;

  if p_consume then
    v_count := coalesce(v_count, 0) + 1;
    update public.streaks
       set current_streak = v_count,
           longest_streak = greatest(coalesce(longest_streak, 0), v_count),
           last_spin_at   = now()
     where profile_id = p_profile;
  end if;

  if p_points > 0 then
    insert into public.points_ledger (profile_id, kind, points, day, meta)
    values (p_profile, 'spin', p_points, null, jsonb_build_object('gtd', p_gtd));
  end if;

  if p_gtd then
    -- Only lands if they already have an entry. If they have not submitted an
    -- address yet, the ledger row above still records that they won it.
    update public.allowlist_entries ae
       set gtd = true
     where ae.profile_id = p_profile;
    v_gtd := found;
  end if;

  return query
    select true,
           p_points,
           v_gtd,
           case when p_consume then now() + v_cool else v_last end;
end;
$$;

-- Award on a rolling cooldown, measured from the last award of that kind.
--
-- Used by the game. Unlike daily_spin there is no dedicated column to lock, so
-- it takes a transaction-scoped advisory lock keyed on (profile, kind). Two
-- requests arriving together therefore queue rather than both reading the same
-- "last played" value and both paying out.
create or replace function public.cooldown_award(
  p_profile         uuid,
  p_kind            text,
  p_points          integer,
  p_cooldown_hours  integer,
  p_meta            jsonb default '{}'::jsonb
)
returns table (applied boolean, awarded integer, next_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
  v_cool interval := make_interval(hours => p_cooldown_hours);
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_profile::text || ':' || p_kind, 0)
  );

  select max(l.created_at)
    into v_last
    from public.points_ledger l
   where l.profile_id = p_profile
     and l.kind = p_kind;

  if v_last is not null and now() < v_last + v_cool then
    return query select false, 0, v_last + v_cool;
    return;
  end if;

  insert into public.points_ledger (profile_id, kind, points, day, meta)
  values (p_profile, p_kind, p_points, null, p_meta);

  return query select true, p_points, now() + v_cool;
end;
$$;

-- Award points for anything else. Idempotent by design: if a unique index
-- rejects the row then nothing was awarded and `awarded` comes back 0.
create or replace function public.award_points(
  p_profile uuid,
  p_kind    text,
  p_points  integer,
  p_day     date default null,
  p_meta    jsonb default '{}'::jsonb
)
returns table (awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
begin
  insert into public.points_ledger (profile_id, kind, points, day, meta)
  values (p_profile, p_kind, p_points, p_day, p_meta)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  return query select case when v_inserted > 0 then p_points else 0 end;
end;
$$;

-- ── lock everything down ────────────────────────────────────────────────────
-- RLS on with zero policies, so the anon and authenticated roles read nothing.
alter table public.profiles          enable row level security;
alter table public.allowlist_entries enable row level security;
alter table public.points_ledger     enable row level security;
alter table public.streaks           enable row level security;

revoke all on public.profiles          from anon, authenticated;
revoke all on public.allowlist_entries from anon, authenticated;
revoke all on public.points_ledger     from anon, authenticated;
revoke all on public.streaks           from anon, authenticated;
revoke all on public.leaderboard       from anon, authenticated;

-- CRITICAL. Postgres grants EXECUTE on new functions to PUBLIC by default, and
-- anon and authenticated both inherit PUBLIC. Revoking from those two roles
-- alone leaves the grant intact, so anyone holding the anon key could call
-- award_points() over PostgREST and mint themselves an unlimited score. These
-- two lines are what actually close that door. RLS does not gate function
-- execution, and SECURITY DEFINER runs as the owner, so nothing else stops it.
revoke all on function public.daily_spin(uuid, integer, integer, boolean, boolean)
  from public, anon, authenticated;
revoke all on function public.award_points(uuid, text, integer, date, jsonb)
  from public, anon, authenticated;
revoke all on function public.cooldown_award(uuid, text, integer, integer, jsonb)
  from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Rate limiting
--
-- Serverless functions do not share memory, so an in-process limiter on Vercel
-- counts separately on every cold instance and stops nothing. Postgres is the
-- only thing all instances agree on, so the counter lives here.
--
-- Buckets are opaque strings from the app, e.g. 'spin:<profile-uuid>' or
-- 'session:<hashed-ip>'. Raw IPs are never stored: the app sends an HMAC.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.rate_limits (
  bucket        text        primary key,
  hits          integer     not null default 0,
  window_start  timestamptz not null default now()
);

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

-- Fixed-window counter. Returns whether this call is allowed and how long to
-- wait if it is not. Row is locked for the increment, so parallel requests
-- cannot both read the same count and both pass.
create or replace function public.rate_limit(
  p_bucket          text,
  p_limit           integer,
  p_window_seconds  integer
)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits  integer;
  v_start timestamptz;
  v_win   interval := make_interval(secs => p_window_seconds);
begin
  insert into public.rate_limits (bucket, hits, window_start)
  values (p_bucket, 0, now())
  on conflict (bucket) do nothing;

  select rl.hits, rl.window_start
    into v_hits, v_start
    from public.rate_limits rl
   where rl.bucket = p_bucket
     for update;

  -- Window expired, start a fresh one.
  if v_start + v_win <= now() then
    v_hits  := 0;
    v_start := now();
  end if;

  v_hits := v_hits + 1;

  update public.rate_limits
     set hits = v_hits,
         window_start = v_start
   where bucket = p_bucket;

  if v_hits > p_limit then
    return query select
      false,
      0,
      greatest(1, ceil(extract(epoch from (v_start + v_win - now())))::integer);
    return;
  end if;

  return query select true, p_limit - v_hits, 0;
end;
$$;

-- Housekeeping. Called by the keepalive cron so the table cannot grow forever.
create or replace function public.prune_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits where window_start < now() - interval '1 day';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from public, anon, authenticated;

revoke all on function public.rate_limit(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.prune_rate_limits()
  from public, anon, authenticated;
