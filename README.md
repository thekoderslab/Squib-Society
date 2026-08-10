# Squib Society — teaser & allowlist site

Next.js (App Router) + TypeScript + Tailwind + Framer Motion, with Supabase for
persistence. Runs fully on mock data with zero configuration; the moment the
Supabase env vars exist it switches to real data with no code change.

```bash
npm install
npm run dev
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero, six featured squibs, how-it-works, CTA |
| `/vault` | All 369 tiles — 10 revealed, 359 locked — and the reveal progress bar |
| `/squib/[id]` | One squib, statically generated per revealed squib, own OG image |
| `/roadmap` | Five phases |
| `/allowlist` | The funnel: connect X → tasks → address → spin |
| `/leaderboard` | Check-in, daily quest, quiz, mini-game, ranked board |
| `/faq` | Accordion |

## Where things are

| What | File |
| --- | --- |
| Everything configurable (name, supply, chain, odds, points, milestones, snapshot date, logo paths) | `src/lib/constants.ts` |
| Squib roster — ids, names, roles, bios, image paths | `src/lib/mock-api.ts` |
| **Client-side data seam** (fetches the API, falls back to mocks) | `src/lib/api.ts` |
| **Server-side Supabase access** — every query lives here | `src/lib/server/store.ts` |
| Database schema, indexes, functions, RLS | `supabase/schema.sql` |
| Design tokens | `tailwind.config.ts` + `src/app/globals.css` |
| User state (tasks, points, streak, spin) | `src/state/progress.tsx` |

## Setting up Supabase

1. Create a project, open **SQL editor**, paste `supabase/schema.sql`, run it.
   It is idempotent — safe to re-run.
2. Set three environment variables (see `.env.example`), locally in
   `.env.local` and on Vercel under Settings → Environment Variables:

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` — **server only**, never `NEXT_PUBLIC_`
   - `SESSION_SECRET` — any random 32+ char string

3. Redeploy. That's it; there is no feature flag to flip.

### Why the service role and not the anon key

Every table has RLS enabled with **no policies**, so the anon key can read
nothing. All access goes through route handlers under `src/app/api/` using the
service role. If the browser could write to the ledger, points would be
forgeable and the top 20 would be whoever opened devtools first.

Two rules that matter are enforced by unique indexes rather than app code, so
they hold even if a check is ever skipped: one allowlist entry per EVM address,
and one per profile. Daily awards use a partial unique index on
`(profile_id, kind, day)`, so two concurrent requests cannot both win.

## Integration seams

All marked `// INTEGRATION:` in source. Everything except X OAuth is now live
against Supabase.

| Seam | Status | Note |
| --- | --- | --- |
| Points ledger + leaderboard | **Live** | `src/lib/server/store.ts` |
| Sybil filtering | **Partly live** | Uniqueness enforced in the DB. Captcha verification and the account-age / follower-floor rules are still stubs in `api/allowlist/route.ts`. |
| GTD spin | **Live** | Rolled with `crypto.getRandomValues` server-side and written before it is returned; `use_spin` locks the row and refuses a second attempt. |
| Share intent | **Live** | `x.com/intent/post` |
| X OAuth | **Stubbed** | `api/session/route.ts` mints a throwaway identity. Replace the marked block with the OAuth 2.0 PKCE callback; the profile row and signed cookie stay the same. |
| Task verification | **Stubbed** | `api/tasks/route.ts` auto-passes. Offload to Zealy / Galxe / TaskOn rather than hand-rolling X API checks — follow/like/repost verification is rate-limited and costly, and quote-tweet detection is the least reliable of the four. That is why the quote task is a bonus and never a gate. |

## Art

Ten renders in `public/squibs/`, four logo variants in `public/logo/`. The bare
head is the brand mark: `squib-logo-transparent.png` in the nav, footer and
ambient moments; `squib-logo-lime-ccff00.png` for the favicon, OG card and
social avatars, because the lime field keeps the head readable at 16px.

To add a squib: drop the PNG in `public/squibs/`, add an entry to
`REVEALED_SQUIBS` in `src/lib/mock-api.ts`, and add a slot index to
`REVEALED_SLOTS`. The `/squib/[id]` page and the vault tile both appear
automatically.

## Things that are deliberate

- **No wallet connect, no minting.** Minting is on OpenSea. This site collects
  an EVM address as plain text and nothing else — which is also a phishing
  defence, since "we never ask you to connect" is only true if it stays true.
- **Reveals are earned, not scheduled.** The vault bar ties the locked 359 to
  live allowlist milestones, turning a hidden collection into a pull.
- **Points reward returning, not reach.** Follower count carries zero weight, so
  a whale can't sweep the top 20 on day one.
- **The spin is an upgrade, never a gate.** Anyone who finishes the three base
  tasks is allowlisted before the wheel is shown.
- **Mono type is a structural device.** Counters, ranks, points, addresses and
  token ids are mono; nothing else is.
