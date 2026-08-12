-- ─────────────────────────────────────────────────────────────────────────────
-- Squib Society — Supabase schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is idempotent: safe to re-run after edits.
--
-- Design notes:
--  · Points are NEVER stored as a mutable total. They live in an append-only
--    ledger and are summed on read, so a bug can't silently inflate somebody.
--  · Once-per-day and once-ever limits are enforced by unique indexes, not by
--    application logic — two concurrent requests cannot both win.
--  · RLS is on for every table with NO policies. That means the anon key can
--    read nothing. All access goes through Next.js route handlers using the
--    service role key, which bypasses RLS. This is deliberate: if the browser
--    could write to the ledger, points would be forgeable and the top 20 would
--    be whoever opened devtools first.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per connected X account.
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  -- The stable numeric id from X, NOT the handle. Handles get renamed and
  -- recycled; deduping on handle alone lets one person enter twice.
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
  spin_used     boolean     not null default false,
  spin_result   boolean,
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
-- Append only. `kind` is namespaced: 'task:follow', 'checkin', 'quest',
-- 'trivia', 'game', 'share'. `day` is the user's LOCAL day for anything that
-- repeats daily, and null for anything that can only ever happen once.
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
-- Spins are excluded: they repeat every 24 hours and are gated by daily_spin().
create unique index if not exists ledger_once_ever
  on public.points_ledger (profile_id, kind)
  where day is null and kind <> 'spin';

create index if not exists ledger_profile_idx
  on public.points_ledger (profile_id);

-- ── streaks ─────────────────────────────────────────────────────────────────
create table if not exists public.streaks (
  profile_id      uuid primary key references public.profiles(id) on delete cascade,
  -- current_streak is the number of daily spins taken in a row.
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_check_in   date,
  last_spin_at    timestamptz
);

-- Safe to run on an existing database.
alter table public.streaks add column if not exists last_spin_at timestamptz;

-- ── leaderboard ─────────────────────────────────────────────────────────────
-- A view, not a table: the ledger is the truth, this is just how we read it.
create or replace view public.leaderboard as
  select
    p.id                                as profile_id,
    p.handle,
    p.display_name,
    coalesce(sum(l.points), 0)::integer as points,
    coalesce(s.current_streak, 0)       as streak,
    min(p.created_at)                   as joined_at
  from public.profiles p
  left join public.points_ledger l on l.profile_id = p.id
  left join public.streaks s       on s.profile_id = p.id
  group by p.id, p.handle, p.display_name, s.current_streak;

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions. Point VALUES are passed in from the app so constants.ts stays the
-- single source of truth; the ATOMICITY lives here where it belongs.
-- ─────────────────────────────────────────────────────────────────────────────

-- One spin every 24 hours.
--
-- Locks the streak row, checks how long since the last spin, and either writes
-- the award or refuses. Both the check and the write happen in this one call,
-- so two tabs firing at once produce one prize and one refusal.
--
-- p_consume = false is the "try again" segment: it pays nothing and does NOT
-- start the cooldown, so the player spins straight away at no cost.
-- p_gtd = true also flips the guaranteed flag on their allowlist entry, if
-- they have one yet.
create or replace function public.daily_spin(
  p_profile         uuid,
  p_points          integer,
  p_cooldown_hours  integer,
  p_consume         boolean default true,
  p_gtd             boolean default false
)
returns table (applied boolean, awarded integer, gtd boolean, next_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last    timestamptz;
  v_count   integer;
  v_gtd     boolean := false;
  v_cool    interval := make_interval(hours => p_cooldown_hours);
begin
  select s.last_spin_at, s.current_streak
    into v_last, v_count
    from public.streaks s
   where s.profile_id = p_profile
     for update;

  if not found then
    insert into public.streaks (profile_id, current_streak, longest_streak)
    values (p_profile, 0, 0);
    v_last := null;
    v_count := 0;
  end if;

  -- The cooldown is checked even for "again", otherwise a client could ask for
  -- a free segment forever and farm the wheel.
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
    update public.allowlist_entries
       set gtd = true
     where profile_id = p_profile
    returning true into v_gtd;
    v_gtd := coalesce(v_gtd, false);
  end if;

  return query
    select true,
           p_points,
           v_gtd,
           case when p_consume then now() + v_cool else v_last end;
end;
$$;

-- Award points for anything else. Idempotent by design: if the unique index
-- rejects the row, nothing was awarded and `awarded` comes back 0.
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
-- RLS on, zero policies. The anon and authenticated roles can do nothing here;
-- only the service role (server-side) gets through.
alter table public.profiles          enable row level security;
alter table public.allowlist_entries enable row level security;
alter table public.points_ledger     enable row level security;
alter table public.streaks           enable row level security;

revoke all on public.profiles          from anon, authenticated;
revoke all on public.allowlist_entries from anon, authenticated;
revoke all on public.points_ledger     from anon, authenticated;
revoke all on public.streaks           from anon, authenticated;
revoke all on public.leaderboard       from anon, authenticated;

revoke all on function public.daily_spin(uuid, integer, integer, boolean, boolean) from anon, authenticated;
revoke all on function public.award_points(uuid, text, integer, date, jsonb)    from anon, authenticated;
