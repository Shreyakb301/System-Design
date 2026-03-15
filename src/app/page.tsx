import type { CSSProperties } from "react";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { Button } from "@/components/ui/button";
import { TOPICS } from "@/lib/topics";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Code2,
  Layers,
  Network,
  Sparkles,
} from "lucide-react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const trackCount = TOPICS.length;
const lessonCount = TOPICS.reduce(
  (count, section) =>
    count + section.categories.reduce((categoryCount, category) => categoryCount + category.items.length, 0),
  0
);
const challengeCount = TOPICS.reduce(
  (count, section) =>
    count + section.categories.filter((category) => category.id.includes("challenge")).length,
  0
);

const tracks = [
  {
    href: "/system-design",
    challengeHref: "/system-design/challenge",
    eyebrow: "Track 01",
    title: "System design studio",
    description:
      "Practice traffic, storage, caching, and failure tradeoffs visually.",
    icon: Layers,
    accentBar: "bg-teal-200",
    iconClass: "border border-teal-100 bg-teal-50 text-teal-800",
    topics: ["Capacity", "Load Balancing", "Caching"],
    primaryLabel: "Explore system design",
    secondaryLabel: "Play architect challenge",
  },
  {
    href: "/data-structures",
    challengeHref: "/data-structures/challenge",
    eyebrow: "Track 02",
    title: "Algorithm lab",
    description:
      "Train arrays, graphs, linked lists, and trees through guided drills.",
    icon: Code2,
    accentBar: "bg-sky-200",
    iconClass: "border border-sky-100 bg-sky-50 text-sky-800",
    topics: ["Two Pointers", "Hash Tables", "BST"],
    primaryLabel: "Explore data structures",
    secondaryLabel: "Enter arena mode",
  },
  {
    href: "/programming-languages",
    challengeHref: "/programming-languages/language-evaluation",
    eyebrow: "Track 03",
    title: "Language design lab",
    description:
      "Compare how language features change readability, writability, reliability, and cost.",
    icon: Network,
    accentBar: "bg-amber-200",
    iconClass: "border border-amber-100 bg-amber-50 text-amber-800",
    topics: ["Readability", "Reliability", "Tradeoffs"],
    primaryLabel: "Explore language design",
    secondaryLabel: "Open evaluation lesson",
  },
];

const drillStack = [
  {
    title: "Load balancing under burst traffic",
    detail: "System design challenge",
    state: "Queued",
  },
  {
    title: "Cache hit ratio tuning",
    detail: "Latency and reliability",
    state: "Active",
  },
  {
    title: "Fast and slow pointer tracing",
    detail: "Algorithm arena",
    state: "Ready",
  },
];

const heroStats = [
  { label: "Tracks", value: trackCount.toString().padStart(2, "0") },
  { label: "Lessons", value: lessonCount.toString().padStart(2, "0") },
  { label: "Challenges", value: challengeCount.toString().padStart(2, "0") },
];

const pageStyle: CSSProperties = {
  ["--page-bg" as string]: "linear-gradient(180deg, #f7f7f2 0%, #fbfbf8 42%, #ffffff 100%)",
  ["--panel-shadow" as string]: "rgba(15, 23, 42, 0.06)",
  ["--panel-border" as string]: "rgba(15, 23, 42, 0.06)",
};

export default function Home() {
  return (
    <div className="relative overflow-x-clip bg-[var(--page-bg)] text-slate-950" style={pageStyle}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.06),transparent_30%)]" />

      <section className="relative px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Interactive engineering practice
            </div>

            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
                Learn by doing
              </p>
              <h1
                className={`${spaceGrotesk.className} max-w-4xl text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl`}
              >
                Practice systems and algorithms visually.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                Three tracks. Live demos. Challenge modes.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-slate-900 px-7 text-base font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <Link href="/system-design/challenge">
                  Start with a challenge
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-black/10 bg-white px-7 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Link href="/#tracks">Browse the learning tracks</Link>
              </Button>
            </div>

            <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-black/5 bg-white px-5 py-4 shadow-sm"
                >
                  <div className={`${spaceGrotesk.className} text-3xl font-bold tracking-[-0.05em]`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-12 h-32 w-32 rounded-full bg-slate-200/50 blur-3xl" />
            <div className="absolute -right-8 bottom-10 h-40 w-40 rounded-full bg-teal-100/50 blur-3xl" />

            <div className="relative rounded-[2rem] border bg-white/80 p-4 [border-color:var(--panel-border)] [box-shadow:0_30px_120px_var(--panel-shadow)] backdrop-blur-xl">
              <div className="grid gap-4">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                        Training board
                      </p>
                      <h2 className={`${spaceGrotesk.className} mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950`}>
                        Daily drill stack
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <Network className="h-6 w-6 text-teal-700" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {drillStack.map((drill, index) => (
                      <div
                        key={drill.title}
                        className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-teal-700 shadow-sm">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{drill.title}</p>
                          <p className="text-sm text-slate-500">{drill.detail}</p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          {drill.state}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-black/5 bg-slate-50 p-5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-sm font-semibold uppercase tracking-[0.25em]">
                        Signal check
                      </span>
                      <Activity className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="mt-5 space-y-4">
                      {[
                        { label: "Architecture recall", value: "86%" },
                        { label: "Latency drill pace", value: "42 ms" },
                        { label: "Tree traversal streak", value: "12 runs" },
                      ].map((signal) => (
                        <div key={signal.label} className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>{signal.label}</span>
                            <span className="font-semibold text-slate-900">{signal.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/80">
                            <div
                              className="h-full rounded-full bg-slate-400"
                              style={{
                                width:
                                  signal.label === "Architecture recall"
                                    ? "86%"
                                    : signal.label === "Latency drill pace"
                                      ? "68%"
                                      : "74%",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-black/5 bg-white p-5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-sm font-semibold uppercase tracking-[0.25em]">
                        Live focus
                      </span>
                      <CheckCircle2 className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Queues", "Caching", "Graphs", "Two Pointers"].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tracks" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              Learning tracks
            </p>
            <h2 className={`${spaceGrotesk.className} text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl`}>
              Pick a track and jump in.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {tracks.map((track) => (
              <article
                key={track.href}
                className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-8 shadow-[0_16px_50px_rgba(15,23,42,0.05)]"
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${track.accentBar}`} />
                <div className="flex flex-col gap-8">
                  <div className="space-y-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${track.iconClass}`}>
                      <track.icon className="h-7 w-7" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                        {track.eyebrow}
                      </p>
                      <h3 className={`${spaceGrotesk.className} text-3xl font-bold tracking-[-0.05em] text-slate-950`}>
                        {track.title}
                      </h3>
                      <p className="max-w-xl text-base leading-7 text-slate-600">
                        {track.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {track.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      asChild
                      className="rounded-full bg-slate-900 px-6 text-white shadow-sm hover:bg-slate-800"
                    >
                      <Link href={track.href}>
                        {track.primaryLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-black/10 bg-white px-6 text-slate-700 hover:bg-slate-50"
                    >
                      <Link href={track.challengeHref}>{track.secondaryLabel}</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              Topic map
            </p>
            <h2 className={`${spaceGrotesk.className} text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl`}>
              Jump straight to a topic.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {TOPICS.map((section) => (
              <div
                key={section.id}
                className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                            {section.id === "system-design"
                              ? "Architecture track"
                              : section.id === "data-structures"
                                ? "Foundations track"
                                : "Language track"}
                    </p>
                    <h3 className={`${spaceGrotesk.className} mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950`}>
                      {section.title}
                    </h3>
                  </div>
                  <Link
                    href={`/${section.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
                  >
                    Open full track
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {section.categories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.items[0]?.href ?? `/${section.id}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        {category.icon && (
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                            <category.icon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{category.title}</div>
                          <div className="text-sm text-slate-500">
                            {category.items.length} {category.items.length === 1 ? "lesson" : "lessons"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-black/5 bg-[#f4f4ef] px-8 py-12 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                Ready to start
              </p>
              <h2 className={`${spaceGrotesk.className} text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl`}>
                Start with a challenge or browse all three tracks.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-slate-900 px-7 text-base font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <Link href="/system-design/challenge">
                  Start training
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-black/10 bg-white px-7 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Link href="/#tracks">Browse both tracks</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
