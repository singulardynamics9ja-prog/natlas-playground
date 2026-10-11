import Link from "next/link";

const prompts = [
  {
    title: "Business Plan Generator",
    category: "Startups",
    description: "Outline a practical business plan for an early-stage Nigerian fintech.",
  },
  {
    title: "Yoruba Translator",
    category: "Languages",
    description: "Explore translation prompts for Yoruba-language experiences.",
  },
  {
    title: "Hausa Translator",
    category: "Languages",
    description: "Test a translation workflow for Hausa-speaking audiences.",
  },
  {
    title: "Igbo Translator",
    category: "Languages",
    description: "Try prompts for clear and useful Igbo translations.",
  },
  {
    title: "Grant Proposal Assistant",
    category: "Funding",
    description: "Build a structured outline for a compelling grant proposal.",
  },
  {
    title: "AI Tutor",
    category: "Learning",
    description: "Explain a complex idea in plain language for a secondary school student.",
  },
  {
    title: "Professional CV Summary",
    category: "Careers",
    description: "Turn experience and strengths into a focused professional summary.",
  },
  {
    title: "Investor Funding Pitch",
    category: "Startups",
    description: "Structure a concise funding pitch around a clear business opportunity.",
  },
  {
    title: "Startup Marketing Strategy",
    category: "Growth",
    description: "Explore a practical marketing strategy for a Nigerian startup.",
  },
  {
    title: "Product Requirements Document",
    category: "Product",
    description: "Turn a product idea into a clear, actionable requirements outline.",
  },
];

export default function PromptsPage() {
  return (
    <main className="min-h-screen bg-[#07110d] px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
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
            Open Playground <span aria-hidden="true">↗</span>
          </Link>
        </nav>

        <header className="max-w-2xl pb-10 pt-16 sm:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6b45b]">
            Find your starting point
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Prompt Library</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Explore practical prompts for language testing, learning, product development, and
            business. Choose one to continue in the playground.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt, index) => (
            <article
              key={prompt.title}
              className="flex min-h-52 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-[#008751]/40 hover:bg-[#008751]/[0.04]"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[#008751]/25 bg-[#008751]/[0.08] px-2.5 py-1 text-[10px] text-emerald-100">
                  {prompt.category}
                </span>
                <span className="font-mono text-[10px] text-slate-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h2 className="mt-6 text-base font-semibold text-white">{prompt.title}</h2>
              <p className="mt-2 flex-1 text-xs leading-5 text-slate-400">{prompt.description}</p>
              <Link
                href="/chat"
                className="mt-5 inline-flex w-fit items-center gap-2 text-xs font-medium text-[#d6b45b] transition hover:text-[#ecd58d]"
              >
                Open in playground <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>

        <footer className="mt-16 flex flex-col gap-3 border-t border-white/[0.06] py-6 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>N-ATLAS Playground · Developer infrastructure for multilingual AI.</span>
          <Link
            href="/privacy"
            className="w-fit text-slate-400 underline decoration-white/20 underline-offset-4 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b45b]"
          >
            Privacy &amp; data controls
          </Link>
        </footer>
      </div>
    </main>
  );
}
