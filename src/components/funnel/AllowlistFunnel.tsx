"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import {
  ApiError,
  connectX,
  disconnectX,
  getMyTasks,
  submitAllowlist,
  verifyTask,
} from "@/lib/api";
import { EVM_ADDRESS_RE, POINTS, WL_WINNERS } from "@/lib/constants";
import type { SubmitResult, Task, TaskId, UserProgress } from "@/lib/types";
import { useProgress } from "@/state/progress";
import Avatar from "../art/Avatar";
import Button, { Spinner } from "../ui/Button";
import Chip, { Check } from "../ui/Chip";
import { ExternalIcon, TaskIcon, XLogo } from "./icons";
import SuccessModal from "./SuccessModal";

const TASKS = getMyTasks();

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

  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const addressId = useId();
  const errorId = `${addressId}-error`;

  const connected = !!progress.x;
  const step = !connected ? 1 : !baseTasksDone ? 2 : 3;

  async function handleConnect() {
    setConnecting(true);
    try {
      // INTEGRATION: X OAuth
      const { account, progress: server } = await connectX();
      setX(account);
      // In Supabase mode the server already knows everything this account has
      // done before — adopt that rather than the browser's copy.
      if (server) applyServerProgress(server);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setX(null);
    await disconnectX();
  }

  function validate(value: string): string | null {
    const v = value.trim();
    if (!v) return "Add the address you want the squib to land in.";
    if (!EVM_ADDRESS_RE.test(v))
      return "That doesn't look like an EVM address — it should start with 0x and be 42 characters.";
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
      });

      if (res.progress) applyServerProgress(res.progress);
      else {
        setEvmAddress(address.trim());
        markAllowlisted();
      }

      setResult({ ok: true, rank: res.rank, points: res.points, allowlisted: true });
      setShowSuccess(true);
    } catch (err) {
      // The database rejected it. These are the anti-sybil rules firing, so
      // say plainly which one — a generic failure just gets retried forever.
      setAddressError(
        err instanceof ApiError && err.code === "address_taken"
          ? "That address is already on the list. One squib per address — try another."
          : err instanceof ApiError && err.code === "already_entered"
            ? "This account already has a spot. Check the leaderboard for your rank."
            : "That didn't go through. Give it a moment and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const alreadyIn = hydrated && progress.allowlisted;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-vault border border-hairline bg-surface shadow-lift">
        <StepBar step={alreadyIn ? 4 : step} />

        <div className="space-y-8 p-5 sm:p-8">
          {/* ── 1. Connect X ───────────────────────────────────────────── */}
          <StepBlock
            n={1}
            title="Connect X"
            note="We read your handle. That's it — no posting on your behalf."
            done={connected}
          >
            {!hydrated ? (
              <div className="h-11 w-full animate-pulse rounded-full bg-ink/[0.05]" />
            ) : connected ? (
              <div className="flex items-center justify-between gap-3 rounded-full border border-hairline bg-cream py-2 pl-2 pr-4">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar handle={progress.x!.handle} className="h-8 w-8" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium leading-tight">
                      {progress.x!.displayName}
                    </span>
                    <span className="block truncate font-mono text-xs leading-tight text-ink/50">
                      @{progress.x!.handle}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="shrink-0 rounded-full text-xs text-ink/45 underline underline-offset-4 transition hover:text-ink"
                >
                  Switch
                </button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                loading={connecting}
                size="lg"
                className="w-full"
              >
                {!connecting ? <XLogo className="h-4 w-4" /> : null}
                {connecting ? "Opening X…" : "Connect X"}
              </Button>
            )}
          </StepBlock>

          {/* ── 2. Tasks ───────────────────────────────────────────────── */}
          <StepBlock
            n={2}
            title="Do the three things"
            note={`The fourth is a bonus — worth ${POINTS.quote} points, never required.`}
            done={baseTasksDone}
            dimmed={!connected}
          >
            <ul className="divide-y divide-hairline overflow-hidden rounded-squib border border-hairline bg-cream">
              {TASKS.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  status={progress.tasks[task.id]}
                  disabled={!connected}
                  onStatus={(s) => setTask(task.id, s)}
                  onServerProgress={applyServerProgress}
                />
              ))}
            </ul>
          </StepBlock>

          {/* ── 3. Address + submit ────────────────────────────────────── */}
          <StepBlock
            n={3}
            title="Where should it land?"
            note={`An EVM address on any chain works — it's just an address. One entry per address.`}
            done={alreadyIn}
            dimmed={!baseTasksDone}
          >
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  className={`w-full rounded-squib border bg-cream px-4 py-3.5 font-mono text-[13px] tracking-tight text-ink outline-none transition placeholder:text-ink/25 disabled:opacity-55 sm:text-sm ${
                    addressError
                      ? "border-flare bg-flare/[0.04]"
                      : "border-hairline focus:border-squib"
                  }`}
                />
                {addressError ? (
                  <p id={errorId} role="alert" className="mt-2 text-sm text-flare">
                    {addressError}
                  </p>
                ) : null}
              </div>

              {/* INTEGRATION: sybil filtering — swap for hCaptcha/Turnstile and
                  verify the token server-side before writing to the ledger. */}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-squib border border-hairline bg-cream px-4 py-3 text-sm ${
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
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-squib border border-squib/30 bg-squib-wash px-4 py-3.5">
                  <p className="text-sm font-medium text-squib-deep">
                    You&apos;re on the allowlist.
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
                  {submitting ? "Locking it in…" : "Claim my spot"}
                </Button>
              )}

              <p className="text-center text-xs leading-relaxed text-ink/45">
                Finish the three base tasks and you are allowlisted — no draw, no
                cut. The top {WL_WINNERS} on the leaderboard get guaranteed spots
                on top.
              </p>
            </form>
          </StepBlock>
        </div>
      </div>

      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        result={result}
      />
    </div>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function StepBar({ step }: { step: number }) {
  const labels = ["Connect", "Tasks", "Address"];
  return (
    <div className="flex items-center gap-2 border-b border-hairline bg-cream px-5 py-3.5 sm:px-8">
      {labels.map((label, i) => {
        const n = i + 1;
        const state = step > n ? "done" : step === n ? "current" : "todo";
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold ${
                state === "done"
                  ? "bg-squib text-white"
                  : state === "current"
                    ? "bg-ink text-cream"
                    : "bg-ink/[0.08] text-ink/40"
              }`}
            >
              {state === "done" ? <Check className="h-3 w-3" /> : n}
            </span>
            <span
              className={`hidden text-xs sm:block ${
                state === "todo" ? "text-ink/35" : "text-ink/70"
              }`}
            >
              {label}
            </span>
            {i < labels.length - 1 ? (
              <span
                aria-hidden
                className={`h-px flex-1 ${step > n ? "bg-squib" : "bg-hairline"}`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

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
        <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
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
  disabled,
  onStatus,
  onServerProgress,
}: {
  task: Task;
  status: "pending" | "verifying" | "done";
  disabled: boolean;
  onStatus: (s: "pending" | "verifying" | "done") => void;
  onServerProgress: (p: UserProgress) => void;
}) {
  const done = status === "done";
  const busy = status === "verifying";

  async function handleVerify() {
    onStatus("verifying");
    try {
      // INTEGRATION: task verification (Zealy / Galxe / TaskOn, or the X API)
      const { verified, progress } = await verifyTask(task.id);
      // In Supabase mode the award already happened server-side and the fresh
      // state comes back with it; locally we set the status ourselves.
      if (progress) onServerProgress(progress);
      else onStatus(verified ? "done" : "pending");
    } catch {
      onStatus("pending");
    }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          done ? "bg-squib text-white" : "bg-ink/[0.06] text-ink/55"
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : <TaskIcon id={task.id as TaskId} />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{task.label}</span>
          {task.bonus ? (
            <Chip tone="outline" className="text-[10px]">
              Bonus
            </Chip>
          ) : null}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-ink/45">
          <span className="font-mono">+{task.points}</span>
          <span aria-hidden>·</span>
          <a
            href={task.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 underline underline-offset-4 transition hover:text-ink ${
              disabled ? "pointer-events-none" : ""
            }`}
          >
            Open on X <ExternalIcon className="h-3 w-3" />
          </a>
        </span>
      </span>

      {done ? (
        <Chip tone="green">
          <Check /> Done
        </Chip>
      ) : (
        <button
          type="button"
          onClick={handleVerify}
          disabled={disabled || busy}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-ink/25 px-3 text-xs font-medium transition hover:border-ink/60 hover:bg-ink/[0.04] disabled:pointer-events-none disabled:opacity-40"
        >
          {busy ? <Spinner className="h-3 w-3" /> : null}
          {busy ? "Checking" : "Verify"}
        </button>
      )}
    </li>
  );
}
