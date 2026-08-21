"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { formatNumber } from "@/lib/dates";
import SquibHead from "../art/SquibHead";
import Button from "../ui/Button";

type Row = { day: string; n: number };
type Entry = { handle: string; address: string; gtd: boolean; at: string };

type Stats = {
  profiles: number;
  entries: number;
  gtd: number;
  points_total: number;
  tasks: Record<string, number>;
  spins: number;
  games: number;
  shares: number;
  spinners: number;
  signups_by_day: Row[];
  entries_by_day: Row[];
  recent: Entry[];
};

const TASK_LABEL: Record<string, string> = {
  "task:follow": "Followed",
  "task:like": "Liked",
  "task:retweet": "Reposted",
  "task:quote": "Quoted",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "failed">(
    "loading",
  );

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.status === 404) {
        setState("denied");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { stats: Stats };
      setStats(json.stats);
      setState("ok");
    } catch {
      setState("failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading") {
    return (
      <div className="grid place-items-center gap-3 py-24">
        <SquibHead size={96} className="h-10 w-10 animate-spin object-contain" />
        <p className="stamp text-ink/40">Counting</p>
      </div>
    );
  }

  if (state === "denied") {
    return <PasswordGate onUnlocked={() => void load()} />;
  }

  if (state === "failed" || !stats) {
    return (
      <div className="border-2 border-hairline bg-surface p-8 text-center shadow-card">
        <p className="text-sm text-ink/60">Could not load the numbers.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 border-2 border-hairline bg-cream px-4 py-2 font-display text-xs font-semibold uppercase tracking-wide shadow-card transition hover:bg-ink hover:text-cream"
        >
          Try again
        </button>
      </div>
    );
  }

  const followed = stats.tasks["task:follow"] ?? 0;
  const pct = (n: number, of: number) => (of === 0 ? 0 : Math.round((n / of) * 100));

  function copyCsv() {
    const header = "handle,address,gtd,joined_at";
    const body = (stats?.recent ?? [])
      .map((r) => [r.handle, r.address, r.gtd ? "yes" : "no", r.at].join(","))
      .join("\n");
    void navigator.clipboard.writeText(`${header}\n${body}`);
  }

  return (
    <div className="space-y-8">
      {/* headline numbers */}
      <div className="grid grid-cols-2 gap-px border-2 border-hairline bg-hairline lg:grid-cols-4">
        <Stat label="Signed in with X" value={stats.profiles} />
        <Stat label="On the allowlist" value={stats.entries} />
        <Stat label="Guaranteed spots" value={stats.gtd} />
        <Stat label="Points awarded" value={stats.points_total} />
      </div>

      {/* the funnel is the number that actually matters */}
      <section className="border-2 border-hairline bg-surface p-5 shadow-card sm:p-6">
        <h2 className="stamp text-squib-deep">Funnel</h2>
        <p className="mt-2 text-sm text-ink/55">
          Every step as a share of the people who signed in. The biggest drop is
          where to spend your attention.
        </p>

        <ul className="mt-5 space-y-3">
          <Bar label="Signed in" n={stats.profiles} of={stats.profiles} />
          {Object.keys(TASK_LABEL).map((k) => (
            <Bar
              key={k}
              label={TASK_LABEL[k]}
              n={stats.tasks[k] ?? 0}
              of={stats.profiles}
              muted={k === "task:quote"}
            />
          ))}
          <Bar label="Gave an address" n={stats.entries} of={stats.profiles} />
        </ul>

        {followed > 0 ? (
          <p className="mt-5 border-t-2 border-hairline pt-4 text-sm text-ink/60">
            {pct(stats.entries, followed)}% of the people who started the tasks
            finished and gave an address.
          </p>
        ) : null}
      </section>

      {/* retention */}
      <div className="grid grid-cols-2 gap-px border-2 border-hairline bg-hairline lg:grid-cols-4">
        <Stat label="Spins taken" value={stats.spins} />
        <Stat label="People who spun" value={stats.spinners} />
        <Stat label="Games played" value={stats.games} />
        <Stat label="Shares" value={stats.shares} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Chart title="Sign ins per day" rows={stats.signups_by_day} />
        <Chart title="Allowlist entries per day" rows={stats.entries_by_day} />
      </div>

      {/* the actual list */}
      <section className="border-2 border-hairline bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-hairline px-5 py-3">
          <h2 className="stamp text-squib-deep">
            Latest entries ({stats.recent.length})
          </h2>
          <button
            type="button"
            onClick={copyCsv}
            className="border-2 border-hairline bg-cream px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-wide shadow-card transition hover:bg-ink hover:text-cream"
          >
            Copy CSV
          </button>
        </div>

        {stats.recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink/55">
            Nobody has submitted an address yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b-2 border-hairline">
                <tr className="stamp text-ink/40">
                  <th className="px-5 py-2 font-normal">Handle</th>
                  <th className="px-5 py-2 font-normal">Address</th>
                  <th className="px-5 py-2 font-normal">GTD</th>
                  <th className="px-5 py-2 font-normal">When</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-hairline">
                {stats.recent.map((r) => (
                  <tr key={r.address}>
                    <td className="px-5 py-2.5 font-mono text-xs">@{r.handle}</td>
                    <td className="px-5 py-2.5 font-mono text-xs">{r.address}</td>
                    <td className="px-5 py-2.5">
                      {r.gtd ? (
                        <span className="bg-squib px-1.5 py-0.5 font-mono text-[10px] font-bold">
                          YES
                        </span>
                      ) : (
                        <span className="text-ink/30">no</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-ink/50">
                      {new Date(r.at).toLocaleString("en-GB", {
                        timeZone: "UTC",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-hairline pt-5">
        <p className="text-xs text-ink/40">
          Times are UTC. The list is capped at the 200 most recent entries; use
          the SQL editor for the full export before a snapshot.
        </p>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            setStats(null);
            setState("denied");
          }}
          className="shrink-0 border-2 border-hairline bg-cream px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-wide shadow-card transition hover:bg-ink hover:text-cream"
        >
          Lock again
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface px-4 py-4">
      <p className="stamp text-ink/45">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold tabular">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function Bar({
  label,
  n,
  of,
  muted,
}: {
  label: string;
  n: number;
  of: number;
  muted?: boolean;
}) {
  const pct = of === 0 ? 0 : Math.round((n / of) * 100);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={muted ? "text-ink/45" : ""}>
          {label}
          {muted ? " (bonus)" : ""}
        </span>
        <span className="font-mono tabular">
          {formatNumber(n)} <span className="text-ink/40">{pct}%</span>
        </span>
      </div>
      <div className="mt-1 h-3 border-2 border-hairline bg-cream">
        <div
          className={`h-full ${muted ? "bg-locked" : "bg-squib"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

/** Plain CSS bars. A chart library for eight numbers would be silly. */
function Chart({ title, rows }: { title: string; rows: Row[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.n), 0);

  return (
    <section className="border-2 border-hairline bg-surface p-5 shadow-card">
      <h2 className="stamp text-squib-deep">{title}</h2>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/50">Nothing yet.</p>
      ) : (
        <div className="mt-5 flex h-40 items-end gap-1">
          {rows.map((r) => (
            <div key={r.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] tabular text-ink/50">
                {r.n}
              </span>
              <div
                className="w-full border-2 border-hairline bg-squib"
                style={{ height: `${max === 0 ? 0 : (r.n / max) * 100}%` }}
                title={`${r.day}: ${r.n}`}
              />
              <span className="font-mono text-[9px] text-ink/40">
                {r.day.slice(8)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The gate. Rendered whenever the stats endpoint says no, which covers both a
 * missing cookie and an expired one, so a stale session simply asks again.
 */
function PasswordGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setPassword("");
        onUnlocked();
        return;
      }
      setError(
        res.status === 429
          ? "Too many attempts. Wait fifteen minutes."
          : res.status === 503
            ? "ADMIN_PASSWORD is not set on this deployment."
            : "That is not the password.",
      );
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-sm border-2 border-hairline bg-surface p-6 shadow-lift"
    >
      <p className="stamp text-squib-deep">Locked</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/60">
        This page lists entrants and their wallet addresses. Password required.
      </p>

      <label htmlFor="admin-password" className="sr-only">
        Admin password
      </label>
      <input
        id="admin-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-4 w-full border-2 border-hairline bg-cream px-4 py-3 font-mono text-sm outline-none focus:border-squib-deep"
        placeholder="Password"
      />

      {error ? (
        <p role="alert" className="mt-3 text-sm text-flare">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={busy} size="lg" className="mt-4 w-full">
        {busy ? "Checking" : "Unlock"}
      </Button>
    </form>
  );
}
