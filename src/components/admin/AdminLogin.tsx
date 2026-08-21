"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import SquibHead from "../art/SquibHead";
import Button from "../ui/Button";

/**
 * The whole page when locked. A mark, a field, a button.
 *
 * No heading, no description, nothing naming what is behind it. A locked door
 * should not carry a sign saying what is in the room.
 */
export default function AdminLogin() {
  const router = useRouter();
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
        // Re-render the server component, which now passes the cookie check.
        router.refresh();
        return;
      }

      setError(
        res.status === 429
          ? "Too many attempts. Wait fifteen minutes."
          : res.status === 503
            ? "Not configured."
            : "No.",
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] place-items-center px-5 py-16">
      <form onSubmit={submit} className="w-full max-w-xs">
        <SquibHead size={96} className="mx-auto h-12 w-12 object-contain" />

        <label htmlFor="admin-password" className="sr-only">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-6 w-full border-2 border-hairline bg-surface px-4 py-3 text-center font-mono text-sm tracking-widest outline-none focus:border-squib-deep"
        />

        {error ? (
          <p role="alert" className="mt-3 text-center text-sm text-flare">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={busy} size="lg" className="mt-4 w-full">
          {busy ? "" : "Unlock"}
        </Button>
      </form>
    </div>
  );
}
