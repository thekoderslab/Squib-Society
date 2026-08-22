"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ApiError,
  X_LOGIN_PATH,
  disconnectX,
  fetchMe,
  getMyTasks,
  submitAllowlist,
  verifyTask,
} from "@/lib/api";
import {
  AUTH_CHANNEL,
  AUTH_PING_KEY,
  EVM_ADDRESS_RE,
  HONEYPOT_FIELD,
  POINTS,
  TASK_FLOW,
} from "@/lib/constants";
import type { SubmitResult, Task, TaskId, UserProgress } from "@/lib/types";
import { useProgress } from "@/state/progress";
import Button, { Spinner } from "../ui/Button";
import Chip, { Check } from "../ui/Chip";
import { ExternalIcon, TaskIcon, XLogo } from "./icons";
import SuccessModal from "./SuccessModal";
import XProfileCard from "./XProfileCard";

const TASKS = getMyTasks();

/** Plain English for every code the callback can hand back. */
function connectMessage(code: string): string {
  return (
    {
      cancelled: "You cancelled on X. Nothing was saved, try again when ready.",
      denied: "X declined that sign in. Try again.",
      rate_limited:
        "Too many attempts from your network. Give it an hour and try again.",
      bad_state: "That sign in link expired. Start again from this page.",
      expired: "That sign in took too long. Start again from this page.",
      missing_code: "X did not send anything back. Try again.",
      not_configured: "Setup: this deployment is not connected to a database.",
      exchange_failed: "Could not finish signing in with X. Try again.",
      start_failed: "Could not reach X just then. Try again in a moment.",
    }[code] ?? "Could not sign in with X. Try again."
  );
}

export default function AllowlistFunnel() {
  const {
    hydrated,
    progress,
    applyServerProgress,
    setX,
    setTask,
    setEvmAddress,
    markAllowlisted,
    baseTasksDone,
  } = useProgress();

  const [connectError, setConnectError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const addressId = useId();
  const errorId = `${addressId}-error`;
  const honeypotId = `${addressId}-hp`;
  const poll = useRef<number | null>(null);

  const connected = !!progress.x;
  const alreadyIn = hydrated && progress.allowlisted;

  useEffect(() => {
    return () => {
      if (poll.current) window.clearInterval(poll.current);
    };
  }, []);

  /**
   * Sign in happens in a second tab, so this one has to notice when it lands.
   *
   * The session is a cookie on the same origin, which every tab shares, so
   * asking /api/me on a timer is enough. Without it the original tab would sit
   * on "Connect X" forever while the other tab is signed in, which is the usual
   * reason new-tab OAuth feels broken.
   */
  function handleConnect() {
    setConnectError(null);

    const tab = window.open(X_LOGIN_PATH, "_blank", "noopener,noreferrer");
    if (!tab) {
      // Popup blocked. Same tab is better than nothing happening at all.
      window.location.href = X_LOGIN_PATH;
      return;
    }

    setWaiting(true);
    const started = Date.now();

    if (poll.current) window.clearInterval(poll.current);
    poll.current = window.setInterval(async () => {
      // Give up after three minutes rather than polling forever.
      if (Date.now() - started > 3 * 60 * 1000) {
        stopWaiting();
        return;
      }
      try {
        const { progress: server } = await fetchMe();
        if (server?.x) {
          stopWaiting();
          applyServerProgress(server);
        }
      } catch {
        /* keep waiting, the other tab may still be mid flow */
      }
    }, 2000);
  }

  function stopWaiting() {
    if (poll.current) window.clearInterval(poll.current);
    poll.current = null;
    setWaiting(false);
  }

  /**
   * The sign in tab shouts before it closes, so this one does not have to wait
   * out the next poll to notice. It also covers someone who signed in from a
   * different tab entirely, which the poll would never see.
   */
  useEffect(() => {
    async function handle(msg: { ok?: boolean; error?: string | null }) {
      if (poll.current) window.clearInterval(poll.current);
      poll.current = null;
      setWaiting(false);

      if (msg.error) {
        setConnectError(connectMessage(msg.error));
        return;
      }
      if (!msg.ok) return;

      try {
        const { progress: server } = await fetchMe();
        if (server?.x) applyServerProgress(server);
      } catch {
        /* a refresh will still show it, the session cookie is already set */
      }
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage = (e) => void handle(e.data ?? {});
    } catch {
      channel = null;
    }

    // Fallback for anything without BroadcastChannel: a storage write fires an
    // event in every other tab on the origin.
    function onStorage(e: StorageEvent) {
      if (e.key !== AUTH_PING_KEY || !e.newValue) return;
      try {
        void handle(JSON.parse(e.newValue).m ?? {});
      } catch {
        /* someone else wrote the key */
      }
    }
    window.addEventListener("storage", onStorage);

    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [applyServerProgress]);

  /**
   * When the sign in tab cannot close itself it lands here instead, carrying
   * the outcome in the query. Read it once, then strip it so a refresh does not
   * resurrect a stale error.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("x_error");
    if (!code && !params.has("connected")) return;

    if (code) setConnectError(connectMessage(code));

    params.delete("x_error");
    params.delete("connected");
    const rest = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (rest ? `?${rest}` : ""),
    );
  }, []);

  async function handleDisconnect() {
    setX(null);
    await disconnectX();
  }

  function validate(value: string): string | null {
    const v = value.trim();
    if (!v) return "Add the address you want the squib to land in.";
    if (!EVM_ADDRESS_RE.test(v))
      return "That does not look right. An EVM address starts with 0x and is 42 characters long.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate(address);
    setAddressError(err);
    if (err || !progress.x || !captcha) return;

    setSubmitting(true);
    try {
      // INTEGRATION: sybil filtering + points ledger
      const res = await submitAllowlist({
        handle: progress.x.handle,
        evmAddress: address.trim(),
        captchaToken: "mock-captcha-token",
        honeypot,
      });

      if (res.progress) applyServerProgress(res.progress);
      else {
        setEvmAddress(address.trim());
        markAllowlisted();
      }

      setResult({ ok: true, rank: res.rank, points: res.points, allowlisted: true });
      setShowSuccess(true);
    } catch (err) {
      // The database rejected it. These are the anti-sybil rules firing, so say
      // plainly which one. A generic failure just gets retried forever.
      setAddressError(
        err instanceof ApiError && err.code === "address_taken"
          ? "That address is already on the list. One squib per address, so try another one."
          : err instanceof ApiError && err.code === "already_entered"
            ? "This account already has a spot. Check the leaderboard for your rank."
            : "That did not go through. Give it a moment and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Not connected: one button and nothing else ───────────────────────── */

  if (!hydrated) {
    return (
      <div className="mx-auto h-14 w-full max-w-sm animate-pulse border-2 border-hairline bg-surface" />
    );
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-sm">
        <Button
          onClick={handleConnect}
          loading={waiting}
          size="lg"
          className="w-full"
        >
          {!waiting ? <XLogo className="h-4 w-4" /> : null}
          {waiting ? "Waiting for X" : "Connect X"}
        </Button>

        {waiting ? (
          <p className="mt-3 text-center text-xs leading-relaxed text-ink/60">
            Finish in the other tab. It closes itself and this page picks up.{" "}
            <button
              type="button"
              onClick={stopWaiting}
              className="underline underline-offset-4"
            >
              Cancel
            </button>
          </p>
        ) : null}
        {connectError ? (
          <p
            role="alert"
            className="mt-3 border-2 border-flare bg-flare/10 px-3 py-2 text-center text-sm text-flare"
          >
            {connectError}
          </p>
        ) : null}
        <p className="mt-3 text-center text-xs leading-relaxed text-ink/45">
          Read only. We never post as you, and there is no wallet involved.
        </p>
      </div>
    );
  }

  /* ── Connected: profile on the left, the work on the right ────────────── */

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[3fr_7fr] lg:gap-5">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <XProfileCard account={progress.x!} onDisconnect={handleDisconnect} />
        </div>

        <div className="border-2 border-hairline bg-surface shadow-lift">
          <div className="space-y-8 p-5 sm:p-7">
            <StepBlock
              n={1}
              title="Do the three things"
              note={`They unlock one at a time. The fourth is a bonus worth ${POINTS.quote} points and it is never required.`}
              done={baseTasksDone}
            >
              <ul className="divide-y-2 divide-hairline border-2 border-hairline bg-cream">
                {TASKS.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    status={progress.tasks[task.id]}
                    /**
                     * A task stays shut until the one above it is done, so
                     * nobody fires all four at once and then wonders which of
                     * them actually went through.
                     */
                    locked={TASKS.slice(0, index).some(
                      (t) => progress.tasks[t.id] !== "done",
                    )}
                    onStatus={(s) => setTask(task.id, s)}
                    onServerProgress={applyServerProgress}
                  />
                ))}
              </ul>
            </StepBlock>

            <StepBlock
              n={2}
              title="Where should it land?"
              note="Any EVM address works. One entry per address, so use the one you actually want the squib in."
              done={alreadyIn}
              dimmed={!baseTasksDone}
            >
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Honeypot. Hidden from people and from screen readers, but
                    present in the DOM for anything filling fields blindly. */}
                <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
                  <label htmlFor={honeypotId}>Leave this empty</label>
                  <input
                    id={honeypotId}
                    name={HONEYPOT_FIELD}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor={addressId} className="sr-only">
                    EVM address
                  </label>
                  <input
                    id={addressId}
                    name="evm"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="0x0000000000000000000000000000000000000000"
                    disabled={!baseTasksDone || alreadyIn}
                    value={alreadyIn ? (progress.evmAddress ?? address) : address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (addressError) setAddressError(null);
                    }}
                    onBlur={(e) =>
                      setAddressError(e.target.value ? validate(e.target.value) : null)
                    }
                    aria-invalid={!!addressError}
                    aria-describedby={addressError ? errorId : undefined}
                    className={`w-full border-2 bg-cream px-4 py-3.5 font-mono text-[13px] tracking-tight text-ink outline-none transition placeholder:text-ink/25 disabled:opacity-55 sm:text-sm ${
                      addressError ? "border-flare bg-flare/[0.06]" : "border-hairline"
                    }`}
                  />
                  {addressError ? (
                    <p id={errorId} role="alert" className="mt-2 text-sm text-flare">
                      {addressError}
                    </p>
                  ) : null}
                </div>

                {/* INTEGRATION: sybil filtering. Swap for hCaptcha or Turnstile
                    and verify the token server side before writing the entry. */}
                <label
                  className={`flex cursor-pointer items-center gap-3 border-2 border-hairline bg-cream px-4 py-3 text-sm ${
                    !baseTasksDone || alreadyIn ? "pointer-events-none opacity-55" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={captcha || alreadyIn}
                    onChange={(e) => setCaptcha(e.target.checked)}
                    disabled={!baseTasksDone || alreadyIn}
                    className="h-5 w-5 shrink-0 accent-[#56B947]"
                  />
                  <span className="text-ink/70">
                    I am not a bot, a farm, or forty wallets in a trench coat.
                  </span>
                </label>

                {alreadyIn ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-hairline bg-squib-wash px-4 py-3.5">
                    <p className="text-sm font-medium text-squib-deep">
                      You are on the list.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSuccess(true)}
                      className="text-sm font-medium text-squib-deep underline underline-offset-4"
                    >
                      Open your spot
                    </button>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    loading={submitting}
                    disabled={!baseTasksDone || !captcha}
                    className="w-full"
                  >
                    {submitting ? "Locking it in" : "Claim my spot"}
                  </Button>
                )}

                <p className="text-center text-xs leading-relaxed text-ink/45">
                  Finish the three tasks and you are on the list. No draw, no cut.
                  The people at the top of the leaderboard pick up guaranteed
                  spots on top of that.
                </p>
              </form>
            </StepBlock>
          </div>
        </div>
      </div>

      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        result={result}
      />
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function StepBlock({
  n,
  title,
  note,
  done,
  dimmed,
  children,
}: {
  n: number;
  title: string;
  note: string;
  done?: boolean;
  dimmed?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={dimmed ? "opacity-55 transition-opacity" : "transition-opacity"}>
      <div className="mb-3 flex items-baseline gap-2.5">
        <span className="font-mono text-xs font-bold text-ink/35">
          {String(n).padStart(2, "0")}
        </span>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {done ? (
          <Chip tone="green" className="ml-auto">
            <Check /> Done
          </Chip>
        ) : null}
      </div>
      <p className="mb-4 text-sm leading-relaxed text-ink/55">{note}</p>
      {children}
    </section>
  );
}

function TaskRow({
  task,
  status,
  locked,
  onStatus,
  onServerProgress,
}: {
  task: Task;
  status: "pending" | "verifying" | "done";
  locked: boolean;
  onStatus: (s: "pending" | "verifying" | "done") => void;
  onServerProgress: (p: UserProgress) => void;
}) {
  const done = status === "done";
  const busy = status === "verifying";

  /**
   * Go, wait, verify.
   *
   * Verify is not offered until the tab has been open a while, because a
   * button that says Verify the instant you arrive invites people to press it
   * without doing anything, then wonder why nothing happened. The wait is
   * honest friction: it is roughly how long the task actually takes.
   */
  const [went, setWent] = useState(false);
  const [left, setLeft] = useState<number>(TASK_FLOW.goWaitSeconds);

  useEffect(() => {
    if (!went || left <= 0) return;
    const t = window.setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(t);
  }, [went, left]);

  function handleGo() {
    // noopener matters: without it the new tab gets a handle on this one via
    // window.opener and could navigate it somewhere else.
    window.open(task.href, "_blank", "noopener,noreferrer");
    setWent(true);
  }

  async function handleVerify() {
    onStatus("verifying");
    try {
      // INTEGRATION: task verification (Zealy / Galxe / TaskOn, or the X API).
      // Held to a floor so the check reads as work rather than a flicker.
      const [{ verified, progress }] = await Promise.all([
        verifyTask(task.id),
        new Promise<void>((r) => setTimeout(r, TASK_FLOW.verifyMs)),
      ]);
      if (progress) onServerProgress(progress);
      else onStatus(verified ? "done" : "pending");
    } catch {
      onStatus("pending");
    }
  }

  const ready = went && left <= 0;

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3.5 transition-opacity ${
        locked && !done ? "opacity-45" : ""
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center border-2 border-hairline ${
          done
            ? "bg-squib text-ink"
            : locked
              ? "bg-locked text-ink/50"
              : "bg-surface text-ink/70"
        }`}
      >
        {done ? (
          <Check className="h-4 w-4" />
        ) : locked ? (
          <LockIcon />
        ) : (
          <TaskIcon id={task.id as TaskId} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{task.label}</span>
          {task.bonus ? <Chip tone="outline">Bonus</Chip> : null}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-ink/45">
          <span className="font-mono">+{task.points}</span>
          <span aria-hidden>·</span>
          {locked ? (
            <span>Finish the one above first</span>
          ) : done ? (
            <span>Nice one</span>
          ) : went ? (
            <button
              type="button"
              onClick={handleGo}
              className="inline-flex items-center gap-1 underline underline-offset-4 transition hover:text-ink"
            >
              Open again <ExternalIcon className="h-3 w-3" />
            </button>
          ) : (
            <span>Opens X in a new tab</span>
          )}
        </span>
      </span>

      {done ? (
        <Chip tone="green">
          <Check /> Done
        </Chip>
      ) : locked ? (
        <span className="inline-flex h-8 shrink-0 items-center gap-1.5 border-2 border-hairline bg-locked px-3 font-display text-[11px] font-semibold uppercase tracking-wide text-ink/45">
          Locked
        </span>
      ) : !went ? (
        <button
          type="button"
          onClick={handleGo}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 border-2 border-hairline bg-squib px-4 font-display text-[11px] font-semibold uppercase tracking-wide shadow-card transition hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-lift active:translate-x-0 active:translate-y-0"
        >
          Go
          <ExternalIcon className="h-3 w-3" />
        </button>
      ) : !ready ? (
        <span
          aria-live="polite"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 border-2 border-hairline bg-cream px-3 font-mono text-[11px] font-bold tabular text-ink/55"
        >
          {left}s
        </span>
      ) : (
        <button
          type="button"
          onClick={handleVerify}
          disabled={busy}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 border-2 border-hairline bg-surface px-3 font-display text-[11px] font-semibold uppercase tracking-wide transition hover:bg-ink hover:text-cream disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? <Spinner className="h-3 w-3" /> : null}
          {busy ? "Checking" : "Verify"}
        </button>
      )}
    </li>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <rect x="3" y="7" width="10" height="7" fill="currentColor" />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
