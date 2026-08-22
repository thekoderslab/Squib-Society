import { NextResponse } from "next/server";

import { AUTH_CHANNEL, AUTH_PING_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * The last stop of the sign in, and the shortest lived page on the site.
 *
 * Sign in happens in a second tab. Landing that tab on /allowlist left the
 * visitor holding two copies of the same page and no clue which one to use, so
 * this one tells the tab they started from what happened and then closes
 * itself.
 *
 * A route handler rather than a page because it dodges the layout entirely:
 * no nav, no fonts, no React. The script runs while the document is still
 * parsing, so in practice the tab is gone before anything paints.
 *
 * Closing is allowed here because the tab was opened by a script, which stays
 * true even though we opened it with noopener. If a browser refuses anyway, or
 * the popup was blocked and this is the only tab, the timer sends it back to
 * /allowlist and the flow ends exactly where it used to.
 */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  // The code is written straight into a script tag below, so it is allowed to
  // be a bare lowercase word and nothing else. Anything shaped differently did
  // not come from the callback and is not worth echoing back.
  const raw = params.get("x_error");
  const error = raw ? (/^[a-z_]{1,32}$/.test(raw) ? raw : "unknown") : null;
  const payload = JSON.stringify({
    source: AUTH_CHANNEL,
    ok: !error,
    error,
  });

  const back = error
    ? `/allowlist?x_error=${encodeURIComponent(error)}`
    : "/allowlist?connected=1";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Squib Society</title>
<style>
  html,body{height:100%;margin:0}
  body{background:#F4F1E8;color:#141414;display:grid;place-items:center;
       font:500 13px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  img{width:52px;height:52px;object-fit:contain;animation:spin 1.1s linear infinite}
  p{margin:14px 0 0;opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:11px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){img{animation:none}}
</style>
</head>
<body>
<img src="/logo/squib-logo-transparent.png" alt="">
<p>${error ? "Sending you back" : "Signed in"}</p>
<script>
(function () {
  var msg = ${payload};

  // Tell the tab they started from. BroadcastChannel reaches every tab on this
  // origin; the storage write is the fallback for anything that lacks it.
  try { var c = new BroadcastChannel(${JSON.stringify(AUTH_CHANNEL)}); c.postMessage(msg); } catch (e) {}
  try { localStorage.setItem(${JSON.stringify(AUTH_PING_KEY)}, JSON.stringify({ m: msg, t: Date.now() })); } catch (e) {}

  // A beat so the message lands before this context goes away.
  setTimeout(function () { try { window.close(); } catch (e) {} }, 120);

  // Still here means close was refused. Carry on in this tab instead.
  setTimeout(function () { location.replace(${JSON.stringify(back)}); }, 900);
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
