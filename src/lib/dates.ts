/** Local-timezone YYYY-MM-DD. Streaks are a human concept, so use local days. */
export function localDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Whole days between two local day keys. Returns null if either is missing. */
export function daysBetween(a: string | null, b: string): number | null {
  if (!a) return null;
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86_400_000);
}

export function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The last `n` local days, oldest first, as day keys. */
export function recentDays(n: number, from = new Date()): string[] {
  return Array.from({ length: n }, (_, i) =>
    localDayKey(addDays(from, i - (n - 1))),
  );
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
