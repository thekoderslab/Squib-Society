"use client";

import type { XAccount } from "@/lib/types";
import Avatar from "../art/Avatar";
import { XLogo } from "./icons";

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function joinedLabel(iso: string): string {
  // Fixed locale and UTC so the server and client never disagree.
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  });
}

/**
 * The connected account, shown back to them.
 *
 * // INTEGRATION: X OAuth. Every field here comes from /2/users/me on the free
 * read-only scopes. All of them are optional, so each row is only rendered when
 * the value actually arrived.
 */
export default function XProfileCard({
  account,
  onDisconnect,
}: {
  account: XAccount;
  onDisconnect: () => void;
}) {
  return (
    <div className="border-2 border-hairline bg-cream p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="stamp inline-flex items-center gap-1.5 text-ink/45">
          <XLogo className="h-3 w-3" />
          Connected
        </span>
        <span className="h-2 w-2 bg-squib" aria-hidden />
      </div>

      <div className="mt-4">
        <Avatar
          handle={account.handle}
          src={account.avatarUrl}
          className="h-20 w-20"
        />
      </div>

      <p className="mt-4 flex items-center gap-1.5 font-display text-lg font-bold leading-tight">
        {account.displayName}
        {account.verified ? (
          <span className="bg-squib px-1 font-mono text-[9px] font-bold uppercase text-ink">
            ✓
          </span>
        ) : null}
      </p>
      <p className="font-mono text-sm text-ink/50">@{account.handle}</p>

      {account.bio ? (
        <p className="mt-3 border-l-4 border-hairline pl-3 text-sm leading-relaxed text-ink/65">
          {account.bio}
        </p>
      ) : null}

      {account.followers != null || account.following != null ? (
        <dl className="mt-4 grid grid-cols-2 gap-px border-2 border-hairline bg-hairline">
          {account.followers != null ? (
            <div className="bg-surface px-3 py-2">
              <dt className="stamp text-ink/45">Followers</dt>
              <dd className="mt-1 font-mono text-sm font-bold tabular">
                {compact(account.followers)}
              </dd>
            </div>
          ) : null}
          {account.following != null ? (
            <div className="bg-surface px-3 py-2">
              <dt className="stamp text-ink/45">Following</dt>
              <dd className="mt-1 font-mono text-sm font-bold tabular">
                {compact(account.following)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {account.joinedAt ? (
        <p className="mt-3 text-xs text-ink/45">
          On X since {joinedLabel(account.joinedAt)}
        </p>
      ) : null}

      <p className="mt-4 border-t-2 border-hairline pt-3 text-xs leading-relaxed text-ink/45">
        We only read this. We will never post as you.
      </p>

      <button
        type="button"
        onClick={onDisconnect}
        className="mt-2 text-xs text-ink/45 underline underline-offset-4 transition hover:text-ink"
      >
        Use a different account
      </button>
    </div>
  );
}
