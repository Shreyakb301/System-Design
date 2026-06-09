import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { Button } from "@/components/ui/button";
import { TOPICS } from "@/lib/topics";
import {
  ArrowRight,
  Code2,
  Layers,
  Network,
} from "lucide-react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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

const pageStyle: CSSProperties = {
  ["--page-bg" as string]: "#ffffff",
};

export default function Home() {
  return (
    <div
      className="relative overflow-x-clip bg-[var(--page-bg)] text-slate-950"
      style={pageStyle}
    >
      <section className="relative overflow-hidden px-4 pb-6 pt-2 sm:px-6 lg:px-8 lg:pt-3">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid min-h-[500px] items-start gap-8 pt-8 lg:grid-cols-[590px_minmax(0,1fr)] xl:grid-cols-[610px_minmax(0,1fr)]">
            <div className="relative z-10 max-w-[640px] space-y-12">
              <div className="space-y-9">
                <p className="text-sm font-semibold uppercase tracking-[0.55em] text-slate-500">
                  Learn by doing
                </p>
                <br></br>
                <h1
                  className={`${spaceGrotesk.className} text-4xl font-bold leading-[1.12] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[3.55rem] xl:text-[4rem]`}
                >
                  Practice systems and algorithms visually.
                </h1>
                <br></br>
                <p className="max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                  Three tracks. Live demos. Challenge modes.
                </p>
              </div>
              <br></br>
              <div className="flex flex-wrap gap-5">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-black/10 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Link href="/#tracks">Browse the learning tracks</Link>
                </Button>
              </div>
            </div>

            <div className="relative flex min-h-[460px] items-start justify-end lg:min-h-[540px]">
              <Image
                src="/computer-science-islands.png"
                alt="Computer science island map with systems, databases, networking, algorithms, and operating systems"
                width={1536}
                height={1024}
                priority
                sizes="(min-width: 1280px) 940px, (min-width: 1024px) 760px, 100vw"
                className="w-full max-w-[760px] object-contain xl:max-w-[940px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="tracks" className="relative px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              Learning tracks
            </p>
            <h2
              className={`${spaceGrotesk.className} text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl`}
            >
              Pick a track and jump in.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {tracks.map((track) => (
              <article
                key={track.href}
                className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-8 shadow-[0_16px_50px_rgba(15,23,42,0.05)]"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${track.accentBar}`}
                />
                <div className="flex flex-col gap-8">
                  <div className="space-y-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${track.iconClass}`}
                    >
                      <track.icon className="h-7 w-7" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                        {track.eyebrow}
                      </p>
                      <h3
                        className={`${spaceGrotesk.className} text-3xl font-bold tracking-[-0.05em] text-slate-950`}
                      >
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
                      <Link href={track.challengeHref}>
                        {track.secondaryLabel}
                      </Link>
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
            <h2
              className={`${spaceGrotesk.className} text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl`}
            >
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
                    <h3
                      className={`${spaceGrotesk.className} mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950`}
                    >
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
                          <div className="font-semibold text-slate-900">
                            {category.title}
                          </div>
                          <div className="text-sm text-slate-500">
                            {category.items.length}{" "}
                            {category.items.length === 1 ? "lesson" : "lessons"}
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
              <h2
                className={`${spaceGrotesk.className} text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl`}
              >
                Browse all three tracks and start practicing.
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
                <Link href="/#tracks">Browse the learning tracks</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
