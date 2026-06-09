"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Database,
  HardDrive,
  Layers,
  Network,
  PenLine,
  ShieldCheck,
  Split,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "single" | "replication" | "sharding" | "combined";
type Workload = "social" | "banking" | "ecommerce" | "analytics" | "messaging" | "video";
type Consistency = "high" | "medium" | "low";
type SolTab = "walkthrough" | "compare" | "interview";
type Tone = "good" | "warn" | "bad";

const pageMotion = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" as const } } };
const cardMotion = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: 0.24, ease: "easeInOut" as const } };

// ----------------------------------------------------------------------------
// Shared dashboard primitives (soft white + slate, no gradients, light shadow)
// ----------------------------------------------------------------------------
function DashboardCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <motion.section {...cardMotion} className={cn("rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</motion.section>;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      {subtitle && <p className="mt-2 max-w-[720px] text-base leading-7 text-slate-600">{subtitle}</p>}
    </div>
  );
}

function ScaleControl({ label, level, setLevel, format }: { label: string; level: number; setLevel: (v: number) => void; format: (level: number) => string }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="flex items-center justify-between gap-4 text-base font-semibold text-slate-700">
        <span>{label}</span>
        <motion.span key={format(level)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums text-slate-950">{format(level)}</motion.span>
      </span>
      <input className="mt-3 w-full accent-slate-900" type="range" min={0} max={100} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
    </label>
  );
}

function IntControl({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="flex items-center justify-between gap-4 text-base font-semibold text-slate-700">
        <span>{label}</span>
        <motion.span key={value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums text-slate-950">{value}{suffix}</motion.span>
      </span>
      <input className="mt-3 w-full accent-slate-900" type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function ToggleChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
      )}
    >
      {label}
    </motion.button>
  );
}

// ----------------------------------------------------------------------------
// Formatters + model
// ----------------------------------------------------------------------------
const fmtRate = (level: number, min: number, max: number) => {
  const v = min * Math.pow(max / min, level / 100);
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M req/s`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}K req/s`;
  return `${Math.round(v)} req/s`;
};
const fmtReads = (level: number) => fmtRate(level, 100, 1_000_000);
const fmtWrites = (level: number) => fmtRate(level, 10, 500_000);
const fmtStorage = (level: number) => {
  const gb = Math.pow(100 * 1024 * 1024, level / 100); // 1 GB -> 100 PB
  if (gb >= 1024 * 1024) return `${(gb / (1024 * 1024)).toFixed(gb >= 10 * 1024 * 1024 ? 0 : 1)} PB`;
  if (gb >= 1024) return `${(gb / 1024).toFixed(gb >= 10 * 1024 ? 0 : 1)} TB`;
  return `${Math.round(gb)} GB`;
};

const clamp = (n: number) => Math.max(2, Math.min(100, Math.round(n)));
const toneOf = (s: number): Tone => (s >= 70 ? "good" : s >= 42 ? "warn" : "bad");

const MODE_META: Record<Mode, { label: string; feel: string; changed: string; matters: string; bottleneck: string }> = {
  single: {
    label: "Single Database",
    feel: "Everything in one place.",
    changed: "All reads, writes, and storage converge on one database.",
    matters: "It works until any one of reads, writes, or storage exceeds a single machine.",
    bottleneck: "The single database — every request and every byte lands here.",
  },
  replication: {
    label: "Replication",
    feel: "Copy the same thing many times.",
    changed: "Reads are spread across copies; writes still go to the primary.",
    matters: "Copies reduce read pressure and add redundancy — but do not scale writes.",
    bottleneck: "The primary node — all writes still funnel through it.",
  },
  sharding: {
    label: "Sharding",
    feel: "Split the work.",
    changed: "Data is divided; each shard owns a slice of reads, writes, and storage.",
    matters: "Writes and storage scale horizontally — but reliability is unchanged without replicas.",
    bottleneck: "The router — request fan-out and cross-shard coordination.",
  },
  combined: {
    label: "Combined",
    feel: "Split the work, then copy each piece.",
    changed: "Data is sharded for scale, and each shard is replicated for reliability.",
    matters: "You get read, write, and storage scaling plus availability — at the cost of coordination complexity.",
    bottleneck: "Cross-shard coordination and operational complexity.",
  },
};

type MetricBlock = { score: number; tone: Tone; hint: string };
type Metrics = { read: MetricBlock; write: MetricBlock; storage: MetricBlock; availability: MetricBlock; warning: string | null };

function computeMetrics(args: { mode: Mode; read: number; write: number; storage: number; replicas: number; shards: number; failure: boolean; consistency: Consistency }): Metrics {
  const { mode, read, write, storage, replicas, shards, failure, consistency } = args;
  const cAdj = consistency === "high" ? -8 : consistency === "low" ? 6 : 0;

  let readScore = 60, writeScore = 60, storageScore = 60, avail = 60;
  let readHint = "", writeHint = "", storageHint = "", availHint = "";

  if (mode === "single") {
    readScore = 100 - read * 0.92;
    writeScore = 100 - write * 0.92;
    storageScore = 100 - storage * 0.95;
    avail = failure ? 12 : 60;
    readHint = "One database serves every read.";
    writeHint = "One database serves every write.";
    storageHint = "Limited to a single machine.";
    availHint = "Single point of failure.";
  } else if (mode === "replication") {
    readScore = 100 - read / (1 + replicas);
    writeScore = 100 - write * 0.96 + cAdj;
    storageScore = 100 - storage * 0.95 - replicas * 5;
    avail = replicas > 0 ? (failure ? 86 : 96) : (failure ? 26 : 64);
    readHint = `Reads spread across ${replicas} replica${replicas === 1 ? "" : "s"}.`;
    writeHint = "All writes still hit the primary.";
    storageHint = `Data copied ${replicas + 1}× — storage cost grows.`;
    availHint = replicas > 0 ? "A replica can be promoted on failure." : "No replicas — still a single point of failure.";
  } else if (mode === "sharding") {
    readScore = 100 - read / (1 + shards * 0.35);
    writeScore = 100 - write / shards + cAdj;
    storageScore = 100 - storage / shards;
    avail = failure ? 52 : 82;
    readHint = "Partly spread across shards.";
    writeHint = `Writes distributed across ${shards} shards.`;
    storageHint = `Storage split across ${shards} shards.`;
    availHint = "Lose a shard, lose part of the data.";
  } else {
    readScore = 100 - read / ((1 + replicas) * (1 + shards * 0.3));
    writeScore = 100 - write / shards + cAdj;
    storageScore = 100 - storage / shards - replicas * 3;
    avail = replicas > 0 ? (failure ? 90 : 97) : (failure ? 52 : 80);
    readHint = "Spread across replicas of every shard.";
    writeHint = `Writes distributed across ${shards} shards.`;
    storageHint = `Storage split across ${shards} shards.`;
    availHint = replicas > 0 ? "Sharded for scale, replicated for HA." : "Add replicas to each shard for HA.";
  }

  let warning: string | null = null;
  if (mode === "replication" && replicas === 0) warning = "Zero replicas — replication with no copies behaves like a single database.";
  else if ((mode === "sharding" || mode === "combined") && failure) warning = "Sharding creates partial-failure scenarios: losing a shard makes part of the data unavailable.";
  else if (mode === "single" && (read > 70 || write > 70 || storage > 70)) warning = "The single database is saturated — one machine is handling everything.";
  else if (mode === "replication" && write > 70) warning = "Writes still funnel through the primary — replication alone does not scale writes.";

  const block = (s: number, hint: string): MetricBlock => ({ score: clamp(s), tone: toneOf(clamp(s)), hint });
  return {
    read: block(readScore, readHint),
    write: block(writeScore, writeHint),
    storage: block(storageScore, storageHint),
    availability: block(avail, availHint),
    warning,
  };
}

const WORKLOADS: Record<Workload, { label: string; read: number; write: number; storage: number; consistency: Consistency; suggest: Mode; changed: string; matters: string }> = {
  social: { label: "Social Media", read: 82, write: 45, storage: 55, consistency: "medium", suggest: "replication", changed: "Read-heavy — timelines and profiles are read far more than written.", matters: "Replication spreads those reads across copies." },
  banking: { label: "Banking", read: 50, write: 48, storage: 45, consistency: "high", suggest: "replication", changed: "Consistency-critical — every read must reflect the latest write.", matters: "Strong consistency limits how loosely writes can be distributed." },
  ecommerce: { label: "Ecommerce", read: 66, write: 55, storage: 60, consistency: "medium", suggest: "combined", changed: "Mixed — catalog reads are heavy, orders are write-sensitive.", matters: "Often needs read scaling and write/storage scaling together." },
  analytics: { label: "Analytics", read: 48, write: 86, storage: 88, consistency: "low", suggest: "sharding", changed: "Write- and storage-heavy — massive event ingestion.", matters: "Sharding distributes writes and storage horizontally." },
  messaging: { label: "Messaging", read: 60, write: 78, storage: 58, consistency: "medium", suggest: "sharding", changed: "High write throughput from constant message sends.", matters: "Writes must distribute or the primary saturates." },
  video: { label: "Video Platform", read: 78, write: 40, storage: 92, consistency: "low", suggest: "combined", changed: "Huge storage plus heavy reads of popular content.", matters: "Needs storage scale (shards) and read scale (replicas)." },
};

const CHALLENGES: { prompt: string; answer: Mode; answerLabel: string }[] = [
  { prompt: "Read traffic exploded", answer: "replication", answerLabel: "Replication" },
  { prompt: "Writes overloaded the database", answer: "sharding", answerLabel: "Sharding" },
  { prompt: "Storage reached its limit", answer: "sharding", answerLabel: "Sharding" },
  { prompt: "Need better availability", answer: "replication", answerLabel: "Replication" },
  { prompt: "Petabytes + very high reads", answer: "combined", answerLabel: "Both" },
];

// ----------------------------------------------------------------------------
// Canvas
// ----------------------------------------------------------------------------
const NODE_STYLES = {
  users: "border-slate-300 bg-white text-slate-700",
  app: "border-sky-300 bg-sky-50 text-sky-700",
  primary: "border-indigo-300 bg-indigo-50 text-indigo-700",
  replica: "border-cyan-300 bg-cyan-50 text-cyan-700",
  shard: "border-purple-300 bg-purple-50 text-purple-700",
  db: "border-slate-300 bg-white text-slate-700",
  danger: "border-red-300 bg-red-50 text-red-700",
} as const;

function NodeBox({ styleKey, icon: Icon, title, sub, compact }: { styleKey: keyof typeof NODE_STYLES; icon: typeof Database; title: string; sub?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border-2 text-center shadow-sm", NODE_STYLES[styleKey], compact ? "px-2 py-1.5" : "px-3 py-2.5")}>
      <Icon className={cn("text-current", compact ? "h-4 w-4" : "h-5 w-5")} />
      <span className={cn("mt-1 font-bold text-slate-950", compact ? "text-base leading-tight" : "text-base")}>{title}</span>
      {sub && <span className={cn("text-slate-500", compact ? "text-base" : "text-base")}>{sub}</span>}
    </div>
  );
}

function MoreChip({ count }: { count: number }) {
  return <span className="flex items-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-2 py-1 text-base font-semibold text-slate-500">+{count}</span>;
}

function Arrow() {
  return <ArrowRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />;
}

function Cluster({ mode, replicas, shards, failure, saturated }: { mode: Mode; replicas: number; shards: number; failure: boolean; saturated: boolean }) {
  if (mode === "single") {
    return <NodeBox styleKey={saturated || failure ? "danger" : "db"} icon={Database} title="Database" sub={failure ? "down" : saturated ? "overloaded" : "all data"} />;
  }
  if (mode === "replication") {
    const shown = Math.min(replicas, 3);
    return (
      <div className="flex flex-col items-center gap-2">
        <NodeBox styleKey="primary" icon={Database} title="Primary" sub={failure && replicas > 0 ? "promoting…" : "writes"} />
        {replicas > 0 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: shown }).map((_, i) => <NodeBox key={i} compact styleKey="replica" icon={Copy} title="Replica" sub="reads" />)}
            {replicas > shown && <MoreChip count={replicas - shown} />}
          </div>
        )}
      </div>
    );
  }
  if (mode === "sharding") {
    const shown = Math.min(shards, 3);
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: shown }).map((_, i) => (
          <NodeBox key={i} compact styleKey={failure && i === 0 ? "danger" : "shard"} icon={Layers} title={`Shard ${String.fromCharCode(65 + i)}`} sub={failure && i === 0 ? "unavailable" : "owns a slice"} />
        ))}
        {shards > shown && <MoreChip count={shards - shown} />}
      </div>
    );
  }
  // combined
  const shown = Math.min(shards, 3);
  const repShown = Math.min(replicas, 2);
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: shown }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <NodeBox compact styleKey={failure && i === 0 ? "danger" : "shard"} icon={Layers} title={`Shard ${String.fromCharCode(65 + i)}`} />
          {replicas > 0 && Array.from({ length: repShown }).map((_, r) => <span key={r} className="h-6 w-6 rounded-lg border-2 border-cyan-300 bg-cyan-50" title="Replica" />)}
          {replicas > repShown && <span className="text-base font-semibold text-slate-400">+{replicas - repShown}</span>}
        </div>
      ))}
      {shards > shown && <MoreChip count={shards - shown} />}
    </div>
  );
}

function ArchitectureCanvas({ mode, read, write, replicas, shards, failure, saturated }: { mode: Mode; read: number; write: number; replicas: number; shards: number; failure: boolean; saturated: boolean }) {
  const isRouter = mode === "sharding" || mode === "combined";
  const readDots = Math.max(2, Math.round(read / 28));
  const writeDots = Math.max(1, Math.round(write / 40));
  const readSpeed = Math.max(1.6, 3.4 - read / 60);
  const writeSpeed = Math.max(1.6, 3.4 - write / 60);

  return (
    <DashboardCard className="min-h-[360px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Live architecture</h2>
          <p className="text-base text-slate-600">{MODE_META[mode].feel}</p>
        </div>
        <div className="flex items-center gap-2 text-base font-semibold">
          <span className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700"><span className="h-2 w-2 rounded-full bg-sky-400" /> reads</span>
          <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-400" /> writes</span>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-amber-50/40 p-5"
        style={{ backgroundImage: "radial-gradient(circle, rgba(120,113,108,0.16) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      >
        {/* animated traffic */}
        {Array.from({ length: readDots }).map((_, i) => (
          <motion.span
            key={`r${i}`}
            className="pointer-events-none absolute top-[42%] z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-sky-400"
            initial={{ left: "8%", opacity: 0 }}
            animate={{ left: ["8%", "90%"], opacity: [0, 0.85, 0] }}
            transition={{ duration: readSpeed, repeat: Infinity, delay: (readSpeed / readDots) * i, ease: "linear" }}
          />
        ))}
        {Array.from({ length: writeDots }).map((_, i) => (
          <motion.span
            key={`w${i}`}
            className="pointer-events-none absolute top-[58%] z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-400"
            initial={{ left: "8%", opacity: 0 }}
            animate={{ left: ["8%", "90%"], opacity: [0, 0.85, 0] }}
            transition={{ duration: writeSpeed, repeat: Infinity, delay: (writeSpeed / writeDots) * i, ease: "linear" }}
          />
        ))}

        <div className="relative z-20 flex min-h-[260px] items-center justify-between gap-3">
          <NodeBox styleKey="users" icon={Users} title="Users" />
          <Arrow />
          <NodeBox styleKey="app" icon={Network} title={isRouter ? "Router" : "App"} sub={isRouter ? "routes by key" : "serves requests"} />
          <Arrow />
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${replicas}-${shards}-${failure}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <Cluster mode={mode} replicas={replicas} shards={shards} failure={failure} saturated={saturated} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Metric cards
// ----------------------------------------------------------------------------
const TONE_BORDER: Record<Tone, string> = { good: "border-emerald-200", warn: "border-amber-200", bad: "border-red-200" };
const TONE_BAR: Record<Tone, string> = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500" };
const TONE_CHIP: Record<Tone, string> = { good: "bg-emerald-50 text-emerald-700", warn: "bg-amber-50 text-amber-700", bad: "bg-red-50 text-red-700" };
const TONE_TEXT: Record<Tone, string> = { good: "Strong", warn: "Tradeoff", bad: "Weak" };

function MetricCard({ icon: Icon, label, block }: { icon: typeof Activity; label: string; block: MetricBlock }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-white p-4 shadow-sm", TONE_BORDER[block.tone])}>
      <div className="flex items-center gap-2 text-base font-semibold text-slate-600"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-3 flex items-end justify-between">
        <motion.span key={block.score} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tabular-nums text-slate-950">{block.score}</motion.span>
        <span className={cn("rounded-full px-2 py-0.5 text-base font-semibold", TONE_CHIP[block.tone])}>{TONE_TEXT[block.tone]}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <motion.div className={cn("h-full rounded-full", TONE_BAR[block.tone])} animate={{ width: `${block.score}%` }} transition={{ duration: 0.3, ease: "easeInOut" }} />
      </div>
      <p className="mt-2 text-base leading-5 text-slate-500">{block.hint}</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Step 01 — Concept snapshot
// ----------------------------------------------------------------------------
function ConceptSnapshot({ workload, onWorkload }: { workload: Workload; onWorkload: (w: Workload) => void }) {
  const active = WORKLOADS[workload];
  return (
    <DashboardCard className="overflow-hidden">
      <SectionHeader eyebrow="Step 01 · Concept snapshot" title="Copy data or split data?" subtitle="Two different tools solving different bottlenecks." />
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {/* Replication */}
        <div className="flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2"><Copy className="h-5 w-5 text-cyan-600" /><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Replication</p></div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <NodeBox styleKey="primary" icon={Database} title="DB" />
            <Arrow />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map((i) => <NodeBox key={i} compact styleKey="replica" icon={Copy} title="Replica" />)}
            </div>
          </div>
          <p className="mt-auto pt-4 text-base font-semibold text-slate-800">&ldquo;Copy the same thing many times.&rdquo;</p>
          <p className="mt-1 text-base text-slate-600">Same data copied — store multiple copies.</p>
        </div>
        {/* Sharding */}
        <div className="flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2"><Split className="h-5 w-5 text-purple-600" /><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Sharding</p></div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {["A", "B", "C"].map((k) => <NodeBox key={k} compact styleKey="shard" icon={Layers} title={`Shard ${k}`} />)}
          </div>
          <p className="mt-auto pt-4 text-base font-semibold text-slate-800">&ldquo;Split the work.&rdquo;</p>
          <p className="mt-1 text-base text-slate-600">Data divided — store different pieces.</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pick a workload</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(WORKLOADS) as Workload[]).map((id) => (
            <ToggleChip key={id} active={workload === id} label={WORKLOADS[id].label} onClick={() => onWorkload(id)} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-1 text-base leading-7 text-slate-700">{active.changed}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-1 text-base leading-7 text-slate-700">{active.matters}</p></div>
        </div>
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Step 02 — Controls
// ----------------------------------------------------------------------------
function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const tabs: [Mode, string][] = [["single", "Single Database"], ["replication", "Replication"], ["sharding", "Sharding"], ["combined", "Combined"]];
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setMode(id)}
          className={cn("min-w-[120px] flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition", mode === id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Controls(props: {
  read: number; setRead: (v: number) => void;
  write: number; setWrite: (v: number) => void;
  storage: number; setStorage: (v: number) => void;
  replicas: number; setReplicas: (v: number) => void;
  shards: number; setShards: (v: number) => void;
  failure: boolean; setFailure: (v: boolean) => void;
  consistency: Consistency; setConsistency: (c: Consistency) => void;
  mode: Mode;
}) {
  const { read, setRead, write, setWrite, storage, setStorage, replicas, setReplicas, shards, setShards, failure, setFailure, consistency, setConsistency, mode } = props;
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 02 · Stress the database" title="Change traffic, watch bottlenecks move" subtitle="Every control updates the architecture, metrics, and insight together." />
      <div className="grid gap-3">
        <ScaleControl label="Read traffic" level={read} setLevel={setRead} format={fmtReads} />
        <ScaleControl label="Write traffic" level={write} setLevel={setWrite} format={fmtWrites} />
        <ScaleControl label="Storage" level={storage} setLevel={setStorage} format={fmtStorage} />
        {(mode === "replication" || mode === "combined") && <IntControl label="Replication count" value={replicas} min={0} max={5} onChange={setReplicas} />}
        {(mode === "sharding" || mode === "combined") && <IntControl label="Shard count" value={shards} min={1} max={20} onChange={setShards} />}
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Node health</p>
          <div className="flex flex-wrap gap-2">
            <ToggleChip active={!failure} label="Healthy" onClick={() => setFailure(false)} />
            <ToggleChip active={failure} label="Node failure" onClick={() => setFailure(true)} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Consistency</p>
          <div className="flex flex-wrap gap-2">
            {(["high", "medium", "low"] as Consistency[]).map((c) => (
              <ToggleChip key={c} active={consistency === c} label={c[0].toUpperCase() + c.slice(1)} onClick={() => setConsistency(c)} />
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Insight + challenges + solution
// ----------------------------------------------------------------------------
function InsightPanel({ mode, warning }: { mode: Mode; warning: string | null }) {
  const meta = MODE_META[mode];
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 05–09 · Cause and effect" title="What just happened?" />
      <div className="grid gap-4 md:grid-cols-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-2 text-base leading-7 text-slate-700">{meta.changed}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-2 text-base leading-7 text-slate-700">{meta.matters}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Where&apos;s the bottleneck</p><p className="mt-2 text-base leading-7 text-slate-700">{meta.bottleneck}</p></div>
      </div>
      <AnimatePresence>
        {warning && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-base font-semibold leading-7">{warning}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardCard>
  );
}

function Challenges({ mode }: { mode: Mode }) {
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 10 · Challenges" title="Pick the right tool" subtitle="Select a mode above. A card turns green when the current mode is the right answer." />
      <div className="grid gap-4 md:grid-cols-5">
        {CHALLENGES.map((c) => {
          const solved = mode === c.answer;
          return (
            <motion.div
              key={c.prompt}
              layout
              animate={solved ? { scale: [1, 1.025, 1] } : { scale: 1 }}
              className={cn("flex flex-col rounded-2xl border p-4 transition", solved ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}
            >
              <div className="flex items-start gap-2">
                <span className={cn("mt-0.5 rounded-full border p-1", solved ? "border-emerald-300 bg-white" : "border-slate-200")}>
                  <Check className={cn("h-4 w-4", solved ? "text-emerald-600" : "text-slate-300")} />
                </span>
                <p className="text-base font-semibold leading-6 text-slate-800">{c.prompt}</p>
              </div>
              <p className={cn("mt-3 text-xs font-bold uppercase tracking-wide", solved ? "text-emerald-700" : "text-slate-400")}>{c.answerLabel}</p>
            </motion.div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

function SolutionPanel({ tab, setTab }: { tab: SolTab; setTab: (t: SolTab) => void }) {
  const walkthrough = [
    "Start with a single database.",
    "Reads increase → add replicas to spread reads.",
    "Writes increase → add shards to split writes.",
    "Availability required → replicate each shard.",
    "Observe the new complexity: cross-shard coordination.",
  ];
  const pros = {
    replication: ["Read scaling", "Redundancy", "Availability"],
    sharding: ["Write scaling", "Storage scaling", "Distributes load"],
  };
  const cons = {
    replication: ["Storage cost", "Write bottleneck", "Replication lag"],
    sharding: ["Routing complexity", "Distributed transactions", "Debugging difficulty"],
  };
  const interview = "Replication copies the same data across multiple databases to improve read scalability, availability, and fault tolerance. It improves reads but usually still relies on a primary database for writes. Sharding splits data across multiple databases so storage and write traffic can scale horizontally. It improves scalability but introduces routing, coordination, and operational complexity. Large systems commonly shard data first for scale and replicate shards for reliability and read performance.";

  return (
    <section className="rounded-[1.5rem] border-2 border-slate-900 bg-white p-5 shadow-lg">
      <div className="flex flex-wrap gap-3">
        {(["walkthrough", "compare", "interview"] as SolTab[]).map((id) => (
          <ToggleChip key={id} active={tab === id} label={id === "walkthrough" ? "Walkthrough" : id === "compare" ? "Compare" : "Interview"} onClick={() => setTab(id)} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tab === "walkthrough" && (
          <motion.div key="walkthrough" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {walkthrough.map((step, i) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-700"><span className="font-bold text-slate-950">Step {i + 1}: </span>{step}</div>
            ))}
          </motion.div>
        )}
        {tab === "compare" && (
          <motion.div key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4 md:grid-cols-2">
            {(["replication", "sharding"] as const).map((k) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  {k === "replication" ? <Copy className="h-5 w-5 text-cyan-600" /> : <Split className="h-5 w-5 text-purple-600" />}
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{k}</p>
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-emerald-700">Pros</p>
                <ul className="mt-1 space-y-1">{pros[k].map((p) => <li key={p} className="flex items-center gap-2 text-base text-slate-700"><Check className="h-4 w-4 text-emerald-600" />{p}</li>)}</ul>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-red-600">Cons</p>
                <ul className="mt-1 space-y-1">{cons[k].map((c) => <li key={c} className="flex items-center gap-2 text-base text-slate-700"><AlertTriangle className="h-4 w-4 text-red-500" />{c}</li>)}</ul>
              </div>
            ))}
          </motion.div>
        )}
        {tab === "interview" && (
          <motion.div key="interview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-base leading-8 text-slate-700">{interview}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------
export function ReplicationShardingVisual() {
  const [workload, setWorkload] = useState<Workload>("social");
  const [mode, setMode] = useState<Mode>("single");
  const [read, setRead] = useState(60);
  const [write, setWrite] = useState(35);
  const [storage, setStorage] = useState(45);
  const [replicas, setReplicas] = useState(2);
  const [shards, setShards] = useState(3);
  const [failure, setFailure] = useState(false);
  const [consistency, setConsistency] = useState<Consistency>("medium");
  const [tab, setTab] = useState<SolTab>("walkthrough");

  const applyWorkload = (w: Workload) => {
    const cfg = WORKLOADS[w];
    setWorkload(w);
    setRead(cfg.read);
    setWrite(cfg.write);
    setStorage(cfg.storage);
    setConsistency(cfg.consistency);
    setMode(cfg.suggest);
  };

  const metrics = useMemo(
    () => computeMetrics({ mode, read, write, storage, replicas, shards, failure, consistency }),
    [mode, read, write, storage, replicas, shards, failure, consistency],
  );
  const saturated = mode === "single" && (read > 70 || write > 70 || storage > 70);

  return (
    <motion.div {...pageMotion} className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <ConceptSnapshot workload={workload} onWorkload={applyWorkload} />

        <DashboardCard>
          <SectionHeader eyebrow="Step 03 · Main interaction" title="Same problem, four strategies" subtitle="Switch the strategy and stress it. Watch where the bottleneck moves." />
          <ModeTabs mode={mode} setMode={setMode} />
        </DashboardCard>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Controls
            read={read} setRead={setRead}
            write={write} setWrite={setWrite}
            storage={storage} setStorage={setStorage}
            replicas={replicas} setReplicas={setReplicas}
            shards={shards} setShards={setShards}
            failure={failure} setFailure={setFailure}
            consistency={consistency} setConsistency={setConsistency}
            mode={mode}
          />
          <ArchitectureCanvas mode={mode} read={read} write={write} replicas={replicas} shards={shards} failure={failure} saturated={saturated} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Activity} label="Read scalability" block={metrics.read} />
          <MetricCard icon={PenLine} label="Write scalability" block={metrics.write} />
          <MetricCard icon={HardDrive} label="Storage capacity" block={metrics.storage} />
          <MetricCard icon={ShieldCheck} label="Availability" block={metrics.availability} />
        </div>

        <InsightPanel mode={mode} warning={metrics.warning} />
        <Challenges mode={mode} />
        <SolutionPanel tab={tab} setTab={setTab} />

        <DashboardCard>
          <h2 className="text-2xl font-bold text-slate-950">Summary</h2>
          <ul className="mt-4 grid gap-3 text-base leading-7 text-slate-700 md:grid-cols-2">
            <li>Replication copies the same data — it scales reads and adds availability, but writes still hit the primary.</li>
            <li>Sharding splits the data — it scales writes and storage, but a lost shard takes part of the data with it.</li>
            <li>Replication does not scale writes; sharding does not improve reliability on its own.</li>
            <li>Large systems shard for scale, then replicate each shard for reliability — at the cost of coordination.</li>
          </ul>
        </DashboardCard>
      </div>
    </motion.div>
  );
}
