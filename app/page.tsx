import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "N-ATLAS Playground | Multilingual AI Developer Workspace",
  description:
    "Explore prompts and experiment with Nigeria's multilingual AI across English, Yoruba, Hausa, and Igbo.",
};

const features = [
  {
    number: "01",
    title: "Prompt Studio",
    description:
      "Shape ideas into better prompts, then explore responses in a focused workspace built for iteration.",
    mark: "⌘",
  },
  {
    number: "02",
    title: "Multilingual Testing",
    description:
      "Experiment across English, Yoruba, Hausa, and Igbo to build for the languages people use every day.",
    mark: "Aa",
  },
  {
    number: "03",
    title: "Developer Tools",
    description:
      "Prototype, evaluate, and refine AI experiences with an infrastructure-first toolkit.",
    mark: "{ }",
  },
];

const steps = [
  ["01", "Choose a language", "Set the language you want to explore."],
  ["02", "Select a prompt", "Start from a practical example or write your own."],
  ["03", "Test responses", "Review the output and share useful feedback."],
  ["04", "Build solutions", "Take what you learn into products and research."],
];

const audiences = [
  ["Developers", "Prototype language-aware products and evaluate prompts."],
  ["Students", "Explore AI concepts and learn through practical examples."],
  ["Researchers", "Experiment with multilingual interactions and workflows."],
  ["Startups", "Move from an early idea to a tested product direction."],
  ["SMEs", "Explore practical ways AI can support everyday operations."],
];

const statistics = [
  ["04", "Supported languages"],
  ["10+", "Prompt templates"],
  ["Built for", "Developer infrastructure"],
  ["N-ATLAS", "Multilingual AI"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07110d] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,135,81,0.24),transparent_66%)]" />
      <nav className="relative mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="N-ATLAS home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008751] text-sm font-black text-white shadow-[0_8px_28px_rgba(0,135,81,0.24)]">
            N
          </span>
          <span className="text-sm font-semibold tracking-wide">N-ATLAS</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-[#008751]/60 hover:bg-[#008751]/10 hover:text-white"
          >
            Create account
          </Link>
          <Link
            href="/chat"
            className="rounded-lg bg-[#008751] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#07975f]"
          >
            Open Playground <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-28">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#008751]/25 bg-[#008751]/10 px-3.5 py-2 text-[11px] font-medium tracking-wide text-emerald-100/90">
            <span className="h-1.5 w-1.5 rounded-full bg-[#32c786]" />
            A playground for Nigeria&apos;s multilingual AI
          </div>
          <h1 className="text-5xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-7xl lg:text-[5.2rem]">
            N-ATLAS
            <span className="block bg-gradient-to-r from-white via-emerald-100 to-[#d6b45b] bg-clip-text text-transparent">
              Playground
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-base font-medium leading-7 text-emerald-50/85 sm:text-lg">
            Developer Infrastructure for Nigeria&apos;s Multilingual AI Ecosystem
          </p>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
            Test prompts, compare responses, explore multilingual AI, and build with N-ATLAS.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-3 rounded-xl bg-[#008751] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_34px_rgba(0,135,81,0.24)] transition hover:-translate-y-0.5 hover:bg-[#07975f]"
            >
              Open Playground <span aria-hidden="true">→</span>
            </Link>
            <span className="text-xs text-slate-500">Explore four Nigerian languages</span>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400">
            <span className="mr-1 text-slate-600">Built for</span>
            {["English", "Yorùbá", "Hausa", "Igbo"].map((language) => (
              <span
                key={language}
                className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5"
              >
                {language}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="adire-pattern absolute -inset-5 rounded-[2rem] opacity-40" />
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0c1712]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-xs font-semibold text-white">Prompt workspace</p>
                <p className="mt-1 text-[11px] text-slate-500">A place to test and iterate</p>
              </div>
              <span className="rounded-full border border-[#d6b45b]/20 bg-[#d6b45b]/[0.08] px-2.5 py-1 text-[10px] text-[#e3c879]">
                N-ATLAS
              </span>
            </div>
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Prompt
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Explain how digital payments can help a small business grow.
              </p>
            </div>
            <div className="mt-3 rounded-2xl border border-[#008751]/25 bg-[#008751]/[0.08] p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[#32c786]" />
                Multilingual testing
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["English", "Yorùbá", "Hausa", "Igbo"].map((language, index) => (
                  <span
                    key={language}
                    className={`rounded-lg border px-3 py-2 text-[11px] ${
                      index === 0
                        ? "border-[#008751]/50 bg-[#008751]/20 text-emerald-100"
                        : "border-white/[0.08] bg-white/[0.025] text-slate-400"
                    }`}
                  >
                    {language}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-white/[0.08] pt-4">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d6b45b]" />
                <span className="text-[11px] text-slate-400">Ready to explore</span>
                <span className="ml-auto text-[10px] text-[#d6b45b]">TEST PROMPT ↗</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6b45b]">
              Made for exploration
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              A better place to build with language AI.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500">
            From the first prompt to a product-ready idea, explore what multilingual AI can do.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition duration-200 hover:-translate-y-1 hover:border-[#008751]/40 hover:bg-[#008751]/[0.05] sm:p-7"
            >
              <div className="mb-12 flex items-center justify-between">
                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-[#d6b45b]/20 bg-[#d6b45b]/[0.06] px-2 font-mono text-sm text-[#e3c879]">
                  {feature.mark}
                </span>
                <span className="font-mono text-[10px] text-slate-600">{feature.number}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{feature.title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-[#0a1510]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6b45b]">
              A simple workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              A practical path from trying a prompt to building a useful idea.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([number, title, description]) => (
              <article
                key={number}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <span className="font-mono text-xs text-[#d6b45b]">{number}</span>
                <h3 className="mt-6 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6b45b]">
              Built for people building
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Why it matters</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              More ways to experiment with AI in the languages and contexts that shape everyday
              work, learning, and innovation.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {audiences.map(([title, description]) => (
              <article
                key={title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-[#008751]/35"
              >
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-24">
        <div className="rounded-3xl border border-[#008751]/25 bg-gradient-to-br from-[#0b2117] via-[#0b1712] to-[#15170f] p-6 sm:p-9">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6b45b]">
                The platform
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Built to explore. Ready to build.
              </h2>
            </div>
            <Link
              href="/chat"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#008751] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#07975f]"
            >
              Try the Playground <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-3 border-t border-white/[0.08] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map(([value, label]) => (
              <div key={label} className="rounded-xl bg-black/15 p-4">
                <p className="text-lg font-semibold tracking-tight text-white">{value}</p>
                <p className="mt-1 text-[11px] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.06] px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>N-ATLAS Playground</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Developer infrastructure for multilingual AI.</span>
            <Link
              href="/privacy"
              className="rounded text-slate-400 underline decoration-white/20 underline-offset-4 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b45b]"
            >
              Privacy &amp; data controls
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
