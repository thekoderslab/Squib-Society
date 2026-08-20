# Supabase setup

Fifteen minutes end to end. You do not create any tables by hand: one SQL file
builds everything.

## 1. Create the project

New project at supabase.com. Pick the region closest to most of your users, and
save the database password somewhere even though this app never uses it (the app
talks to Supabase over HTTPS with a key, not over Postgres directly). You will
want that password the first time you need psql or a backup restore.

Free tier is fine. See the limits section at the bottom.

## 2. Run the schema

Dashboard → **SQL Editor** → **New query**. Paste the whole of
`supabase/schema.sql` and run it.

It is idempotent, so re-run it any time the file changes. You will re-run it at
least once more when the X OAuth work lands.

What it creates:

| Object | What it holds |
| --- | --- |
| `profiles` | One row per connected X account |
| `allowlist_entries` | Address, guaranteed flag. One per person, one per address |
| `points_ledger` | Append-only. Every point ever awarded |
| `streaks` | Spin count and last spin time |
| `rate_limits` | Request counters, shared across serverless instances |
| `leaderboard` (view) | The ranking, derived from the ledger |
| `daily_spin()` | The 24h spin, with its lock |
| `cooldown_award()` | The 24h game, with its lock |
| `award_points()` | One-time awards (tasks, share) |
| `rate_limit()` / `prune_rate_limits()` | The limiter and its housekeeping |

If it succeeds you will see "Success. No rows returned". That is the expected
output; none of these statements return rows.

## 3. Copy two values

Dashboard → **Project Settings** → **API** (newer projects call it **API Keys**).

| Copy this | Into |
| --- | --- |
| Project URL | `SUPABASE_URL` |
| `service_role` secret | `SUPABASE_SERVICE_ROLE_KEY` |

Take **service_role**, not **anon**. The anon key genuinely cannot read anything
here, and that is deliberate: every table has RLS on with no policies, and
EXECUTE on every function is revoked from PUBLIC. If you wire the anon key in by
mistake, every route will fail rather than silently half-work.

The service role bypasses all of that, which is why it must never leave the
server. Do not prefix it with `NEXT_PUBLIC_`.

## 4. Generate the session secret

```bash
openssl rand -base64 32
```

That is `SESSION_SECRET`. It signs the session cookie so nobody can paste
someone else's profile id into their browser and farm points into that account.
It is also the key used to hash IP addresses for rate limiting, so we can count
per address without ever storing one.

Changing it later logs everyone out. That is the only consequence.

## 5. Add the variables to Vercel

Settings → Environment Variables. Tick **Production**, **Preview** and
**Development** for each.

Required:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SESSION_SECRET
```

Recommended:

```
CRON_SECRET            any random string, protects the keepalive route
TURNSTILE_SECRET_KEY   Cloudflare Turnstile, free
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

While `TURNSTILE_SECRET_KEY` is unset the captcha is a decorative checkbox and
the server logs a warning on every submit, so you can see in the logs that the
front door is still open.

Then **redeploy**. Environment variables are read at build and runtime, and an
existing deployment will not pick them up on its own.

## 6. Check it actually took

Walk the funnel on the live site: connect, verify the three tasks, submit an
address. Then in the SQL Editor:

```sql
select p.handle, l.kind, l.points, l.created_at
from points_ledger l
join profiles p on p.id = l.profile_id
order by l.created_at desc
limit 20;
```

Rows means it is live. Empty means it is still running on mock data, and the
cause is almost always a typo in a variable name or a deploy that predates
adding them. Vercel → Deployments → Functions logs will show
`[squib-api]` errors if the key is wrong.

## 7. Stop the project pausing

Free Supabase projects pause after about a week of inactivity, and a paused
project means every route on the site starts failing.

`vercel.json` already schedules `/api/cron/keepalive` daily at 06:00 UTC. It
runs a real query rather than just returning 200, because Supabase measures
activity partly on API traffic and an internal `pg_cron` job may not register.
It also prunes expired rate-limit rows while it is there.

Set `CRON_SECRET` so the endpoint cannot be used by anyone else as a free way to
hammer your database. Vercel sends it automatically as a Bearer token on
scheduled runs.

Check it ran: Vercel → your project → **Cron Jobs**.

Note that Vercel's Hobby plan allows one cron run per day. That is comfortably
inside the pause window.

## Running the numbers at snapshot

The leaderboard view is the ranking. To pull the people at the top:

```sql
select handle, display_name, points, streak
from leaderboard
order by points desc, handle
limit 20;
```

To export the allowlist for the mint:

```sql
select p.handle, a.evm_address, a.gtd, a.created_at
from allowlist_entries a
join profiles p on p.id = a.profile_id
order by a.created_at;
```

To find someone running many wallets off related accounts, look for accounts
created in a tight window with near-identical behaviour:

```sql
select p.handle, p.x_created_at, count(l.id) as awards, sum(l.points) as points
from profiles p
left join points_ledger l on l.profile_id = p.id
group by p.id, p.handle, p.x_created_at
having p.x_created_at > now() - interval '30 days'
order by points desc;
```

`x_created_at` only fills in once real X OAuth is wired; the column is there
waiting for it.

To remove a cheat, delete the profile. Everything else cascades:

```sql
delete from profiles where handle = 'the_handle';
```

## Free tier limits worth knowing

- **500 MB database.** This schema is tiny; the ledger is a few hundred bytes a
  row. Tens of thousands of participants will not come close.
- **Pauses after ~7 days idle.** Handled by the cron above.
- **No daily backups on free.** Before the snapshot, run the two export queries
  above and keep the CSV somewhere safe. That is the record that actually
  matters, and it is worth having outside Supabase.
- Upgrading to Pro later is a switch in the dashboard and needs no code change.

## Resetting during testing

The mock X connect creates a throwaway account on every click, so test data
piles up fast. To wipe everything and keep the schema:

```sql
truncate table points_ledger, allowlist_entries, streaks, rate_limits restart identity cascade;
delete from profiles;
```

Also clear your browser's localStorage for the site, or the client will show
stale local progress until the server answer overrides it.
