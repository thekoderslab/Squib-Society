# Squib Society — teaser & allowlist site

Next.js (App Router) + TypeScript + Tailwind + Framer Motion. Every dynamic
value on the page is mock data today, read through typed functions in one file,
so wiring a real backend is a one-file change.

```bash
npm install
npm run dev
```

Deploying: push to GitHub, import the repo on Vercel, accept the defaults. No
environment variables are needed for the mock build.

## Where things are

| What | File |
| --- | --- |
| Everything configurable (name, supply, chain, odds, points, milestones, snapshot date) | `src/lib/constants.ts` |
| **All data + every integration seam** | `src/lib/mock-api.ts` |
| Design tokens (colours, fonts, radii, shadows, keyframes) | `tailwind.config.ts` + `src/app/globals.css` |
| Client-side user state (tasks, points, streak, spin) | `src/state/progress.tsx` |
| Vector squib art (placeholder for the studio photos) | `src/components/art/SquibArt.tsx` |

## Integration seams

All of them are marked `// INTEGRATION:` in the source and all have working
mocks, so the site is clickable end to end today.

| Seam | Where | Note |
| --- | --- | --- |
| X OAuth | `connectX()` | Read the handle only. Keep the token server-side. |
| Task verification | `verifyTask()` | Offload to Zealy / Galxe / TaskOn rather than hand-rolling X API checks — follow/like/repost verification is rate-limited and costly, and quote-tweet detection is the least reliable of the four. That is exactly why the quote task is a bonus and never a gate. |
| Points ledger + leaderboard | `getLeaderboard()`, `checkIn()`, `getRevealProgress()` | Supabase or the quest platform. Points must never be accepted from the client. |
| Sybil filtering | `submitAllowlist()` | One entry per EVM address, one per X **user id** (not handle — handles get renamed), min account age, follower floor, captcha verified server-side. |
| GTD spin | `requestSpin()` | Must be server-authoritative, once per account, result recorded before it is returned. The wheel is only told where to stop. |
| Share intent | `buildShareIntent()` | Pre-filled quote tweet via `x.com/intent/post`. |

## Swapping the placeholder art for real photos

The squibs on the page are drawn in SVG (`SquibArt.tsx`) so the site is
complete before the product shots exist. To swap: drop PNGs in
`public/squibs/`, set `photo:` on the squib in `mock-api.ts`. See
`public/squibs/README.md`. You can do them one at a time.

## Things that are deliberate

- **No wallet connect, no minting.** Minting is on OpenSea. This site collects
  an EVM address as plain text and nothing else. That is also a phishing
  defence — "we never ask you to connect" is only true if it stays true.
- **Reveals are earned, not scheduled.** The vault progress bar ties the locked
  360 tiles to allowlist milestones, which turns hiding the collection into a
  pull instead of a gate.
- **Points reward returning, not reach.** Follower count carries zero weight, so
  a whale can't sweep the top 20 on day one.
- **The spin is an upgrade, never a gate.** Anyone who finishes the three base
  tasks is allowlisted before the wheel is ever shown.
- **Mono type is a structural device.** Counters, ranks, points, addresses and
  the token ids are mono; nothing else is.
