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
create unique index if not exists ledger_once_ever
  on public.points_ledger (profile_id, kind)
  where day is null;

create index if not exists ledger_profile_idx
  on public.points_ledger (profile_id);

-- ── streaks ─────────────────────────────────────────────────────────────────
create table if not exists public.streaks (
  profile_id      uuid primary key references public.profiles(id) on delete cascade,
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_check_in   date
);

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

-- Daily check-in. Returns what was awarded and the resulting streak.
-- A gap of exactly one day continues the streak; anything else resets it to 1.
create or replace function public.check_in(
  p_profile        uuid,
  p_day            date,
  p_base           integer,
  p_bonus_per_day  integer,
  p_bonus_cap      integer
)
returns table (awarded integer, streak integer, already_done boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last    date;
  v_streak  integer;
  v_bonus   integer;
  v_awarded integer;
begin
  select s.last_check_in, s.current_streak
    into v_last, v_streak
    from public.streaks s
   where s.profile_id = p_profile
     for update;

  if not found then
    insert into public.streaks (profile_id, current_streak, longest_streak, last_check_in)
    values (p_profile, 0, 0, null);
    v_last := null;
    v_streak := 0;
  end if;

  if v_last = p_day then
    return query select 0, v_streak, true;
    return;
  end if;

  if v_last = p_day - 1 then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  v_bonus   := least((v_streak - 1) * p_bonus_per_day, p_bonus_cap);
  v_awarded := p_base + v_bonus;

  update public.streaks
     set current_streak = v_streak,
         longest_streak = greatest(longest_streak, v_streak),
         last_check_in  = p_day
   where profile_id = p_profile;

  insert into public.points_ledger (profile_id, kind, points, day)
  values (p_profile, 'checkin', v_awarded, p_day)
  on conflict do nothing;

  return query select v_awarded, v_streak, false;
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

-- The GTD spin. One per allowlist entry, forever. The caller (a server route)
-- has already rolled the dice; this records it and refuses a second attempt.
create or replace function public.use_spin(
  p_profile  uuid,
  p_upgraded boolean
)
returns table (applied boolean, gtd boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used boolean;
  v_gtd  boolean;
begin
  select e.spin_used, e.gtd
    into v_used, v_gtd
    from public.allowlist_entries e
   where e.profile_id = p_profile
     for update;

  if not found then
    raise exception 'no allowlist entry for profile %', p_profile
      using errcode = 'P0002';
  end if;

  if v_used then
    return query select false, v_gtd;
    return;
  end if;

  update public.allowlist_entries
     set spin_used   = true,
         spin_result = p_upgraded,
         gtd         = gtd or p_upgraded
   where profile_id = p_profile
  returning gtd into v_gtd;

  return query select true, v_gtd;
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

revoke all on function public.check_in(uuid, date, integer, integer, integer)   from anon, authenticated;
revoke all on function public.award_points(uuid, text, integer, date, jsonb)    from anon, authenticated;
revoke all on function public.use_spin(uuid, boolean)                           from anon, authenticated;
