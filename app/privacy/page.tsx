import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & Data Controls | N-ATLAS Playground",
  description: "Learn what N-ATLAS Playground stores, sends, and how to delete your data.",
};

const sections = [
  {
    title: "Prompts and responses",
    content:
      "When Supabase is configured, your prompts and generated responses are saved to your private workspace so you can reopen conversations. If a model endpoint is configured, the prompt, recent conversation context, and selected language are sent to that endpoint to generate a response. Your Supabase access token is used to validate the request and is not forwarded to the model endpoint. When no model endpoint is configured, the app shows a clearly labeled demo preview instead of sending a model request.",
  },
  {
    title: "Accounts and workspace",
    content:
      "The playground starts with a Supabase anonymous account and does not require an email address to explore. You can link that workspace to an email address and password from Create account, preserving its conversations. Account email addresses and names are handled by Supabase Auth. The session token is kept in this browser tab's session storage; signing in lets you access the account in another browser. Clearing site data removes the local session, but does not delete saved workspace records.",
  },
  {
    title: "Feedback and evaluation",
    content:
      "Response ratings are saved in this browser and, when Supabase is available, synced to your private workspace. They are not shared as project-wide analytics. Judge case labels, response language, and measured round-trip time are stored only in this browser. A judge report is created only when you choose to download it and can contain prompts, responses, timings, and ratings; review it before sharing.",
  },
  {
    title: "Local storage",
    content:
      "This browser stores response feedback, judge metadata, and your preferred response language in local storage. Conversation text is not stored in local storage. Deleting a conversation removes local feedback and judge metadata for its messages while preserving data for other chats. Clearing the browser's site data removes all local preferences and the current anonymous session, but does not delete records already saved in Supabase.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#07110d] px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="N-ATLAS home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008751] text-sm font-black">
              N
            </span>
            <span className="text-sm font-semibold">N-ATLAS</span>
          </Link>
          <Link
            href="/chat"
            className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-[#008751]/50 hover:bg-[#008751]/10"
          >
            Back to Playground
          </Link>
        </nav>

        <header className="pb-9 pt-16 sm:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6b45b]">
            Your data, clearly explained
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Privacy &amp; data controls
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            The playground is an experimental developer tool. Here is what it stores and when
            conversation content leaves the browser.
          </p>
        </header>

        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{section.content}</p>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-2xl border border-[#d6b45b]/20 bg-[#d6b45b]/[0.04] p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">Deleting your data</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            In the chat sidebar, use the delete button beside a saved conversation to permanently
            remove it and its messages and workspace feedback. Feedback and judge metadata for that
            conversation are also removed locally; data for other conversations is kept. The action
            requires confirmation and cannot be undone. Use Settings to clear all browser-local
            ratings and judge data. Clearing this website&apos;s storage in your browser does not
            remove saved workspace conversations.
          </p>
          <Link
            href="/chat"
            className="mt-4 inline-flex rounded-lg bg-[#008751] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#07975f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b45b]"
          >
            Open chat history
          </Link>
        </section>

        <p className="mt-8 border-t border-white/[0.06] py-6 text-[11px] leading-5 text-slate-600">
          Do not submit sensitive personal, financial, health, or confidential information.
          Responses may be inaccurate; verify important information independently.
        </p>
      </div>
    </main>
  );
}
