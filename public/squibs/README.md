# /public/squibs

Drop the studio photos here, transparent or cream-background PNG, square crop:

```
0001-explorer.png
0009-skater.png
0016-baseball.png
0018-ninja.png
0025-boxer.png
```

Then open `src/lib/mock-api.ts` and uncomment the `photo:` line on the matching
squib in `REVEALED_SQUIBS`:

```ts
{
  id: 25,
  name: "Mage",
  role: "Boxer",
  variant: "boxer",
  bio: "…",
  photo: "/squibs/0025-boxer.png",   // ← this
}
```

`<SquibImage>` (src/components/art/SquibImage.tsx) renders the photo when
`photo` is set and falls back to the vector squib in `SquibArt.tsx` when it
isn't — so you can swap them in one at a time and nothing breaks in between.
