import Link from "next/link";

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

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080a0e] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(103,232,249,0.1),transparent_62%)]" />
      <nav className="relative mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="N-ATLAS home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-200 text-sm font-black text-slate-950">
            N
          </span>
          <span className="text-sm font-semibold tracking-wide">N-ATLAS</span>
        </Link>
        <Link
          href="/chat"
          className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-cyan-200/40 hover:text-white"
        >
          Open Playground <span aria-hidden="true">↗</span>
        </Link>
      </nav>

      <section className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32 lg:pb-28">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-100/10 bg-cyan-100/[0.04] px-3.5 py-2 text-[11px] font-medium tracking-wide text-cyan-100/80">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
          A playground for Nigeria&apos;s multilingual AI
        </div>
        <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
          N-ATLAS
          <span className="block bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Playground
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-cyan-100/75 sm:text-lg">
          Developer Infrastructure for Nigeria&apos;s Multilingual AI Ecosystem
        </p>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
          Test prompts, compare responses, explore multilingual AI, and build with N-ATLAS.
        </p>
        <Link
          href="/chat"
          className="mt-9 inline-flex items-center gap-3 rounded-xl bg-cyan-200 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_8px_36px_rgba(103,232,249,0.15)] transition hover:-translate-y-0.5 hover:bg-cyan-100"
        >
          Open Playground <span aria-hidden="true">→</span>
        </Link>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-400">
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
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 lg:px-10 lg:pb-32">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
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
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition duration-200 hover:-translate-y-1 hover:border-cyan-100/20 hover:bg-cyan-100/[0.035] sm:p-7"
            >
              <div className="mb-12 flex items-center justify-between">
                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-cyan-100/10 bg-cyan-100/[0.05] px-2 font-mono text-sm text-cyan-100">
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
      <footer className="relative border-t border-white/[0.06] px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>N-ATLAS Playground</span>
          <span>Developer infrastructure for multilingual AI.</span>
        </div>
      </footer>
    </main>
  );
}
