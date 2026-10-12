"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  clearSupabaseSession,
  completePasswordRecoveryFromUrl,
  requestPasswordReset,
  updateSupabasePassword,
} from "@/lib/supabase";

type PasswordRecoveryFormProps = {
  mode: "request" | "reset";
};

export default function PasswordRecoveryForm({ mode }: PasswordRecoveryFormProps) {
  const isReset = mode === "reset";
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(!isReset);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReset) return;

    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        completePasswordRecoveryFromUrl();
        setReady(true);
      } catch (recoveryError) {
        setError(
          recoveryError instanceof Error
            ? recoveryError.message
            : "This password reset link is invalid or has expired.",
        );
      }
    });

    return () => {
      active = false;
    };
  }, [isReset]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    try {
      if (isReset) {
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");
        if (password.length < 8) {
          throw new Error("Use a password with at least 8 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("Your passwords do not match.");
        }
        await updateSupabasePassword(password);
        clearSupabaseSession();
      } else {
        const email = String(formData.get("email") ?? "").trim();
        await requestPasswordReset(email);
      }
      setComplete(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your request could not be completed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110d] px-5 py-12 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,135,81,0.2),transparent_68%)]" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/[0.09] bg-[#0c1712]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur sm:p-9">
        <Link href="/" className="mb-9 inline-flex items-center gap-3" aria-label="N-ATLAS home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008751] text-sm font-black">
            N
          </span>
          <span className="text-sm font-semibold tracking-wide">N-ATLAS</span>
        </Link>

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6b45b]">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {isReset ? "Choose a new password" : "Reset your password"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {isReset
            ? "Choose a new password for your N-ATLAS account."
            : "Enter the email address on your account and we’ll send a secure reset link."}
        </p>

        {complete ? (
          <div className="mt-8 rounded-2xl border border-[#008751]/30 bg-[#008751]/[0.08] p-4">
            <p className="text-sm leading-6 text-emerald-100" role="status">
              {isReset
                ? "Your password has been updated. Sign in with your new password."
                : "If that address belongs to an account, password reset instructions are on their way."}
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-lg bg-[#008751] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#07975f]"
            >
              Back to sign in <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {!isReset ? (
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#008751] focus:ring-2 focus:ring-[#008751]/20"
                  placeholder="you@example.com"
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-medium text-slate-300">
                    New password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={!ready}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#008751] focus:ring-2 focus:ring-[#008751]/20 disabled:opacity-50"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={!ready}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#008751] focus:ring-2 focus:ring-[#008751]/20 disabled:opacity-50"
                    placeholder="Enter your new password again"
                  />
                </div>
              </>
            )}
            {error && (
              <p
                className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-200"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || !ready}
              className="flex w-full items-center justify-center rounded-xl bg-[#008751] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#07975f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Please wait…" : isReset ? "Update password" : "Send reset link"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 block text-center text-xs text-emerald-200 underline decoration-emerald-200/30 underline-offset-4 transition hover:text-white"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
