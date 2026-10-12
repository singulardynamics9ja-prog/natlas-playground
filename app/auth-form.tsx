"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signInWithPassword, signUpWithEmail } from "@/lib/supabase";

type AuthFormProps = {
  mode: "signup" | "login";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === "signup";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      if (isSignUp) {
        const name = String(formData.get("name") ?? "").trim();
        const confirmPassword = String(formData.get("confirmPassword") ?? "");
        if (!name) {
          throw new Error("Enter your name.");
        }
        if (password !== confirmPassword) {
          throw new Error("Your passwords do not match.");
        }
        if (password.length < 8) {
          throw new Error("Use a password with at least 8 characters.");
        }
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithPassword(email, password);
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
          {isSignUp ? "Your multilingual AI workspace" : "Welcome back"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {isSignUp ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {isSignUp
            ? "Link this browser's private workspace to your email so you can return to it."
            : "Sign in to continue to your N-ATLAS workspace."}
        </p>

        {complete ? (
          <div className="mt-8 rounded-2xl border border-[#008751]/30 bg-[#008751]/[0.08] p-4">
            <p className="text-sm leading-6 text-emerald-100" role="status">
              {isSignUp
                ? "Your workspace is linked to your account. If email confirmation is enabled, check your inbox to finish confirming your address."
                : "You are signed in."}
            </p>
            <Link
              href="/chat"
              className="mt-4 inline-flex rounded-lg bg-[#008751] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#07975f]"
            >
              Continue to Playground <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label htmlFor="name" className="mb-2 block text-xs font-medium text-slate-300">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={120}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#008751] focus:ring-2 focus:ring-[#008751]/20"
                  placeholder="Your name"
                />
              </div>
            )}
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
            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={isSignUp ? 8 : undefined}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#008751] focus:ring-2 focus:ring-[#008751]/20"
                placeholder={isSignUp ? "At least 8 characters" : "Your password"}
              />
            </div>
            {isSignUp && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#008751] focus:ring-2 focus:ring-[#008751]/20"
                  placeholder="Enter your password again"
                />
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-200" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-xl bg-[#008751] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#07975f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        {!complete && (
          <p className="mt-6 text-center text-xs text-slate-400">
            {isSignUp ? "Already have an account?" : "New to N-ATLAS?"}{" "}
            <Link
              href={isSignUp ? "/login" : "/signup"}
              className="font-medium text-emerald-200 underline decoration-emerald-200/30 underline-offset-4 transition hover:text-white"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        )}
        <Link
          href="/privacy"
          className="mt-5 block text-center text-[11px] text-slate-500 underline decoration-white/15 underline-offset-4 transition hover:text-slate-300"
        >
          Privacy &amp; data controls
        </Link>
      </section>
    </main>
  );
}
