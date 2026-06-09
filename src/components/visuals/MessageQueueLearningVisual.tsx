"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Cpu,
  Database,
  Inbox,
  Layers,
  Server,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scenario = "checkout" | "video" | "email" | "payment" | "analytics" | "chat";
type Mode = "no-queue" | "queue" | "compare";
type Speed = "slow" | "medium" | "fast";
type Retry = "off" | "one" | "infinite";
type Capacity = "small" | "medium" | "large";
type SolTab = "walkthrough" | "compare" | "interview";
type Tone = "good" | "warn" | "bad" | "neutral";

const pageMotion = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" as const } } };
const cardMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: "easeInOut" as const } };

// ----------------------------------------------------------------------------
// Shared dashboard primitives
// ----------------------------------------------------------------------------
function DashboardCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <motion.section {...cardMotion} className={cn("rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</motion.section>;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="text-base font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>}
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
        "min-h-11 rounded-full border px-4 py-2 text-base font-semibold transition",
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
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M/s`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}K/s`;
  return `${Math.round(v)}/s`;
};
const fmtIncoming = (level: number) => fmtRate(level, 100, 1_000_000);
const incomingRate = (level: number) => 100 * Math.pow(10000, level / 100);

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const MODE_META: Record<Mode, { feel: string }> = {
  "no-queue": { feel: "Everything waits — requests block until the work is done." },
  queue: { feel: "Work gets buffered — the API responds while consumers catch up." },
  compare: { feel: "Same traffic, two architectures, side by side." },
};

type MetricBlock = { value: string; bar: number; tone: Tone; hint: string };
type Model = {
  backlog: number;
  depthPct: number;
  overflow: boolean;
  queueDepth: MetricBlock;
  utilization: MetricBlock;
  delay: MetricBlock;
  dropped: MetricBlock;
  changed: string;
  matters: string;
  bottleneck: string;
  warning: string | null;
  retryNote: string | null;
};

function computeModel(args: {
  mode: Mode; incLevel: number; consumers: number; speed: Speed; retry: Retry; failureRate: number; capacity: Capacity; dlq: boolean;
}): Model {
  const { mode, incLevel, consumers, speed, retry, failureRate, capacity, dlq } = args;
  const incoming = incomingRate(incLevel);
  const perConsumer = speed === "slow" ? 2000 : speed === "medium" ? 8000 : 20000;
  const rawCap = consumers * perConsumer;
  const failFrac = failureRate / 100;
  const retryRecovery = retry === "off" ? 0 : retry === "one" ? 0.6 : 0.85;
  const ultimateFailPct = Math.round(failFrac * (1 - retryRecovery) * 100);
  const cap = rawCap * (1 - failFrac * 0.5) * (retry === "infinite" ? 0.9 : 1);
  const backlog = incoming / Math.max(cap, 1);

  let depthPct = backlog <= 1 ? backlog * 40 : 40 + (backlog - 1) * 110;
  depthPct = clamp(depthPct);
  const capThreshold = capacity === "small" ? 60 : capacity === "medium" ? 80 : 95;
  const overflow = mode !== "no-queue" && depthPct > capThreshold;

  const util = clamp(backlog * 100);
  const baseDelay = speed === "slow" ? 400 : speed === "medium" ? 150 : 60;
  const delayMs = mode === "no-queue"
    ? Math.round(baseDelay * 3 * (backlog > 1 ? backlog : 1))
    : Math.round(baseDelay * (1 + depthPct / 20));

  let droppedPct: number;
  if (mode === "no-queue") droppedPct = (backlog > 1 ? Math.min(80, (backlog - 1) * 60) : 0) + ultimateFailPct;
  else droppedPct = (overflow ? Math.min(60, depthPct - capThreshold) : 0) + ultimateFailPct;
  droppedPct = clamp(droppedPct);

  // tones
  const depthTone: Tone = mode === "no-queue" ? "neutral" : depthPct < capThreshold * 0.6 ? "good" : depthPct < capThreshold ? "warn" : "bad";
  const utilTone: Tone = util < 85 ? "good" : util <= 99 ? "warn" : "bad";
  const delayTone: Tone = delayMs < 200 ? "good" : delayMs < 1000 ? "warn" : "bad";
  const dropTone: Tone = droppedPct === 0 ? "good" : droppedPct <= 8 ? "warn" : "bad";

  const queueDepth: MetricBlock = {
    value: mode === "no-queue" ? "—" : `${depthPct}%`,
    bar: mode === "no-queue" ? 0 : depthPct,
    tone: depthTone,
    hint: mode === "no-queue" ? "No queue — nothing is buffered." : overflow ? "Queue is overflowing." : backlog > 1 ? "Backlog is growing." : "Backlog stays small.",
  };
  const utilization: MetricBlock = {
    value: `${util}%`,
    bar: util,
    tone: utilTone,
    hint: util > 99 ? "Consumers are saturated." : util < 40 ? "Consumers have headroom." : "Consumers are keeping up.",
  };
  const delay: MetricBlock = {
    value: delayMs >= 1000 ? `${(delayMs / 1000).toFixed(1)}s` : `${delayMs}ms`,
    bar: Math.min(100, delayMs / 20),
    tone: delayTone,
    hint: mode === "no-queue" ? "User waits for the full chain." : "Time from enqueue to processed.",
  };
  const dropped: MetricBlock = {
    value: `${droppedPct}%`,
    bar: droppedPct,
    tone: dropTone,
    hint: droppedPct === 0 ? "All work is processed." : mode === "no-queue" ? "Excess requests dropped immediately." : "Overflow + unrecovered failures.",
  };

  // insight + warnings
  let changed: string, matters: string, bottleneck: string;
  if (mode === "no-queue") {
    changed = "Every request is processed synchronously through the chain.";
    matters = "Simple and immediately consistent, but a spike blocks users and overloads services.";
    bottleneck = backlog > 1 ? "The synchronous service chain — it cannot shed load." : "No active bottleneck — the chain is keeping up.";
  } else if (mode === "compare") {
    changed = "The same traffic hits a synchronous chain and a buffered queue.";
    matters = "The queue trades immediate consistency for spike resilience and decoupling.";
    bottleneck = backlog > 1 ? "Consumer throughput on the queued side; the chain just drops on the direct side." : "Neither side is bottlenecked yet.";
  } else if (backlog > 1) {
    changed = "Producers are outpacing consumers; the queue is absorbing the spike.";
    matters = "Queues buffer bursts temporarily — scale consumers to drain the backlog.";
    bottleneck = overflow ? "Consumer throughput — the backlog grows faster than it drains." : "Consumers are falling behind the producers.";
  } else {
    changed = "Requests are buffered; consumers pull work asynchronously.";
    matters = "The API responds fast while work happens in the background.";
    bottleneck = util > 85 ? "Consumers are near saturation." : "No active bottleneck — the system is keeping up.";
  }

  let warning: string | null = null;
  if (mode === "no-queue" && backlog > 1) warning = "No buffer — excess requests are dropped immediately and users wait on a slow chain.";
  else if (overflow) warning = "Queue is overflowing — producers are outpacing consumers and the backlog is dropping work.";
  else if (mode === "queue" && backlog > 1) warning = "Producer rate exceeds consumer capacity — the queue buffers the spike but cannot absorb it forever.";

  let retryNote: string | null = null;
  if (retry !== "off" && failureRate > 0) retryNote = "Retries improve reliability but increase queue pressure.";
  if (retry === "infinite" && failureRate > 0 && !dlq) retryNote = "Infinite retries without a dead-letter queue can loop bad messages forever.";

  return { backlog, depthPct, overflow, queueDepth, utilization, delay, dropped, changed, matters, bottleneck, warning, retryNote };
}

const SCENARIOS: Record<Scenario, { label: string; inc: number; consumers: number; speed: Speed; retry: Retry; failure: number; capacity: Capacity; dlq: boolean; mode: Mode; changed: string; matters: string }> = {
  checkout: { label: "Ecommerce Checkout", inc: 55, consumers: 8, speed: "medium", retry: "one", failure: 5, capacity: "medium", dlq: true, mode: "queue", changed: "Checkout must stay fast even when email and payment side-effects are slow.", matters: "Offload slow work to a queue so the user is never blocked." },
  video: { label: "Video Upload", inc: 40, consumers: 6, speed: "slow", retry: "one", failure: 8, capacity: "large", dlq: true, mode: "queue", changed: "Transcoding is heavy and slow.", matters: "Queue the job and process it in the background." },
  email: { label: "Email Notifications", inc: 60, consumers: 10, speed: "fast", retry: "infinite", failure: 10, capacity: "large", dlq: true, mode: "queue", changed: "Emails are fire-and-forget and tolerate delay.", matters: "A queue is strongly useful — decouple sending from the request." },
  payment: { label: "Payment Processing", inc: 45, consumers: 6, speed: "medium", retry: "one", failure: 6, capacity: "medium", dlq: true, mode: "queue", changed: "Payments need reliability and retries.", matters: "Queues add durability and retries — but watch consistency." },
  analytics: { label: "Analytics Pipeline", inc: 86, consumers: 20, speed: "fast", retry: "off", failure: 2, capacity: "large", dlq: false, mode: "queue", changed: "Massive, delay-tolerant event ingestion.", matters: "A queue plus many consumers absorbs huge write bursts." },
  chat: { label: "Chat System", inc: 70, consumers: 12, speed: "fast", retry: "off", failure: 3, capacity: "medium", dlq: false, mode: "compare", changed: "Mixed — delivery should feel instant but fan-out is async.", matters: "Queue usage is mixed: the real-time path stays sync, fan-out goes async." },
};

const CHALLENGES: { prompt: string; answer: string; solved: (m: Model, s: { mode: Mode; consumers: number; dlq: boolean; failure: number }) => boolean }[] = [
  { prompt: "Email sending slows checkout", answer: "Add a queue", solved: (_m, s) => s.mode === "queue" },
  { prompt: "Traffic spikes suddenly", answer: "Queue buffers work", solved: (m, s) => s.mode === "queue" && !m.overflow },
  { prompt: "Consumers too slow", answer: "Scale consumers", solved: (m, s) => s.mode !== "no-queue" && m.backlog <= 1 && s.consumers >= 4 },
  { prompt: "Messages repeatedly fail", answer: "Dead-letter queue", solved: (_m, s) => s.dlq && s.failure > 0 },
  { prompt: "User expects immediate consistency", answer: "Queues add delay — stay sync", solved: (_m, s) => s.mode === "no-queue" },
];

// ----------------------------------------------------------------------------
// Canvas
// ----------------------------------------------------------------------------
const NODE_STYLES = {
  users: "border-slate-300 bg-white text-slate-700",
  api: "border-sky-300 bg-sky-50 text-sky-700",
  queue: "border-amber-300 bg-amber-50 text-amber-700",
  consumer: "border-indigo-300 bg-indigo-50 text-indigo-700",
  db: "border-purple-300 bg-purple-50 text-purple-700",
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

function Arrow() {
  return <ArrowRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />;
}

const TONE_FILL: Record<Tone, string> = { good: "bg-emerald-400", warn: "bg-amber-400", bad: "bg-red-400", neutral: "bg-slate-300" };

function QueueStack({ depthPct, tone }: { depthPct: number; tone: Tone }) {
  const blocks = Math.max(1, Math.min(8, Math.round(depthPct / 12.5)));
  return (
    <div className="flex flex-col items-center" title="Queue: temporary storage for work">
      <div className="flex flex-col-reverse gap-1 rounded-xl border-2 border-amber-300 bg-amber-50 p-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={cn("h-2.5 w-12 rounded", i < blocks ? TONE_FILL[tone] : "bg-amber-100")} />
        ))}
      </div>
      <span className="mt-1 flex items-center gap-1 text-base font-bold text-slate-950"><Inbox className="h-3.5 w-3.5 text-amber-600" /> Queue</span>
      <span className="text-base text-slate-500">{depthPct}% full</span>
    </div>
  );
}

function ConsumerGroup({ consumers, saturated }: { consumers: number; saturated: boolean }) {
  const shown = Math.min(consumers, 6);
  return (
    <div className="flex flex-col items-center gap-1" title="Consumer: processes queued tasks">
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: shown }).map((_, i) => (
          <span key={i} className={cn("flex h-7 w-7 items-center justify-center rounded-lg border-2", saturated ? "border-red-300 bg-red-50" : "border-indigo-300 bg-indigo-50")}>
            <Cpu className={cn("h-3.5 w-3.5", saturated ? "text-red-500" : "text-indigo-600")} />
          </span>
        ))}
      </div>
      <span className="text-base font-bold text-slate-950">{consumers} consumer{consumers === 1 ? "" : "s"}</span>
    </div>
  );
}

function FlowRow({ mode, model, consumers }: { mode: Mode; model: Model; consumers: number }) {
  const overloaded = model.backlog > 1;
  if (mode === "no-queue") {
    return (
      <div className="flex items-center justify-between gap-2">
        <NodeBox styleKey="users" icon={Users} title="Users" />
        <Arrow />
        <NodeBox styleKey={overloaded ? "danger" : "api"} icon={Server} title="API" />
        <Arrow />
        <NodeBox styleKey={overloaded ? "danger" : "api"} icon={Server} title="Service" sub="blocks" />
        <Arrow />
        <NodeBox styleKey={overloaded ? "danger" : "db"} icon={Database} title="Database" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <NodeBox styleKey="users" icon={Users} title="Users" />
      <Arrow />
      <NodeBox styleKey="api" icon={Server} title="API" sub="responds fast" />
      <Arrow />
      <QueueStack depthPct={model.depthPct} tone={model.queueDepth.tone} />
      <Arrow />
      <ConsumerGroup consumers={consumers} saturated={model.utilization.tone === "bad"} />
      <Arrow />
      <NodeBox styleKey="db" icon={Database} title="Database" />
    </div>
  );
}

function ArchitectureCanvas({ mode, model, incLevel, consumers, noQueueModel, queueModel }: { mode: Mode; model: Model; incLevel: number; consumers: number; noQueueModel: Model; queueModel: Model }) {
  const incoming = incLevel;
  const dotCount = Math.max(3, Math.round(incoming / 12));
  const speed = Math.max(1.6, 3.6 - incoming / 50);
  const overloaded = model.backlog > 1;
  const dotColor = mode === "no-queue" ? (overloaded ? "bg-red-400" : "bg-sky-400") : "bg-sky-400";

  return (
    <DashboardCard className="min-h-[360px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Live architecture</h2>
          <p className="text-base text-slate-600">{MODE_META[mode].feel}</p>
        </div>
        <div className="flex items-center gap-2 text-base font-semibold">
          <span className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700"><span className="h-2 w-2 rounded-full bg-sky-400" /> requests</span>
          {mode !== "no-queue" && <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-400" /> queued</span>}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-amber-50/40 p-5"
        style={{ backgroundImage: "radial-gradient(circle, rgba(120,113,108,0.16) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      >
        {mode !== "compare" && Array.from({ length: dotCount }).map((_, i) => (
          <motion.span
            key={i}
            className={cn("pointer-events-none absolute top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full", dotColor)}
            initial={{ left: "8%", opacity: 0 }}
            animate={{ left: ["8%", "90%"], opacity: [0, 0.85, 0] }}
            transition={{ duration: speed, repeat: Infinity, delay: (speed / dotCount) * i, ease: "linear" }}
          />
        ))}

        <div className="relative z-20">
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}>
              {mode === "compare" ? (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-base font-bold uppercase tracking-[0.12em] text-slate-500">Without queue</p>
                    <FlowRow mode="no-queue" model={noQueueModel} consumers={consumers} />
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-5">
                    <p className="mb-2 text-base font-bold uppercase tracking-[0.12em] text-slate-500">With queue</p>
                    <FlowRow mode="queue" model={queueModel} consumers={consumers} />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[200px] items-center">
                  <FlowRow mode={mode} model={model} consumers={consumers} />
                </div>
              )}
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
const TONE_BORDER: Record<Tone, string> = { good: "border-emerald-200", warn: "border-amber-200", bad: "border-red-200", neutral: "border-slate-200" };
const TONE_BAR: Record<Tone, string> = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500", neutral: "bg-slate-300" };
const TONE_CHIP: Record<Tone, string> = { good: "bg-emerald-50 text-emerald-700", warn: "bg-amber-50 text-amber-700", bad: "bg-red-50 text-red-700", neutral: "bg-slate-50 text-slate-500" };
const TONE_TEXT: Record<Tone, string> = { good: "Healthy", warn: "Warning", bad: "Bad", neutral: "N/A" };

function MetricCard({ icon: Icon, label, block }: { icon: typeof Activity; label: string; block: MetricBlock }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-white p-4 shadow-sm", TONE_BORDER[block.tone])}>
      <div className="flex items-center gap-2 text-base font-semibold text-slate-600"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-3 flex items-end justify-between">
        <motion.span key={block.value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tabular-nums text-slate-950">{block.value}</motion.span>
        <span className={cn("rounded-full px-2 py-0.5 text-base font-semibold", TONE_CHIP[block.tone])}>{TONE_TEXT[block.tone]}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <motion.div className={cn("h-full rounded-full", TONE_BAR[block.tone])} animate={{ width: `${block.bar}%` }} transition={{ duration: 0.3, ease: "easeInOut" }} />
      </div>
      <p className="mt-2 text-base leading-5 text-slate-500">{block.hint}</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Step 01 — Concept snapshot
// ----------------------------------------------------------------------------
function ConceptSnapshot({ scenario, onScenario }: { scenario: Scenario; onScenario: (s: Scenario) => void }) {
  const active = SCENARIOS[scenario];
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 01 · Concept snapshot" title="Buffer work instead of blocking everything" subtitle="See how queues change traffic spikes, reliability, latency, and service communication." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">Without queue</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <NodeBox compact styleKey="users" icon={Users} title="User" />
            <Arrow />
            <NodeBox compact styleKey="api" icon={Server} title="API" />
            <Arrow />
            <NodeBox compact styleKey="db" icon={Database} title="Service" />
            <Arrow />
            <NodeBox compact styleKey="danger" icon={Server} title="Payment" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-800">&ldquo;Everything waits.&rdquo;</p>
          <p className="mt-1 text-base text-slate-600">Work happens immediately — every component blocks the user.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">With queue</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <NodeBox compact styleKey="users" icon={Users} title="User" />
            <Arrow />
            <NodeBox compact styleKey="api" icon={Server} title="API" />
            <Arrow />
            <NodeBox compact styleKey="queue" icon={Inbox} title="Queue" />
            <Arrow />
            <NodeBox compact styleKey="consumer" icon={Cpu} title="Consumers" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-800">&ldquo;Work gets buffered.&rdquo;</p>
          <p className="mt-1 text-base text-slate-600">Work can happen later — it waits in the queue instead of blocking users.</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">Pick a scenario</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(SCENARIOS) as Scenario[]).map((id) => (
            <ToggleChip key={id} active={scenario === id} label={SCENARIOS[id].label} onClick={() => onScenario(id)} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-1 text-base leading-7 text-slate-700">{active.changed}</p></div>
          <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-1 text-base leading-7 text-slate-700">{active.matters}</p></div>
        </div>
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Controls + tabs
// ----------------------------------------------------------------------------
function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const tabs: [Mode, string][] = [["no-queue", "No Queue"], ["queue", "Queue"], ["compare", "Compare"]];
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {tabs.map(([id, label]) => (
        <button key={id} type="button" onClick={() => setMode(id)} className={cn("min-w-[120px] flex-1 rounded-xl px-3 py-2 text-base font-semibold transition", mode === id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{label}</button>
      ))}
    </div>
  );
}

function SegChips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-2 text-base font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, l]) => <ToggleChip key={id} active={value === id} label={l} onClick={() => onChange(id)} />)}
      </div>
    </div>
  );
}

function Controls(props: {
  mode: Mode;
  inc: number; setInc: (v: number) => void;
  consumers: number; setConsumers: (v: number) => void;
  speed: Speed; setSpeed: (s: Speed) => void;
  retry: Retry; setRetry: (r: Retry) => void;
  failure: number; setFailure: (v: number) => void;
  capacity: Capacity; setCapacity: (c: Capacity) => void;
  dlq: boolean; setDlq: (v: boolean) => void;
}) {
  const { mode, inc, setInc, consumers, setConsumers, speed, setSpeed, retry, setRetry, failure, setFailure, capacity, setCapacity, dlq, setDlq } = props;
  const showQueue = mode !== "no-queue";
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 02 · Simulate traffic spikes" title="Stress the system" subtitle="Watch the architecture, queue depth, metrics, and warnings react to every change." />
      <div className="grid gap-3">
        <ScaleControl label="Incoming requests" level={inc} setLevel={setInc} format={fmtIncoming} />
        {showQueue && <IntControl label="Consumer count" value={consumers} min={1} max={50} onChange={setConsumers} />}
        <ScaleControl label="Failure rate" level={failure} setLevel={(v) => setFailure(Math.round((v / 100) * 50))} format={(v) => `${Math.round((v / 100) * 50)}%`} />
      </div>
      <div className="mt-4 space-y-3">
        <SegChips label="Processing speed" value={speed} options={[["slow", "Slow"], ["medium", "Medium"], ["fast", "Fast"]]} onChange={setSpeed} />
        {showQueue && <SegChips label="Retry policy" value={retry} options={[["off", "Off"], ["one", "1 Retry"], ["infinite", "Infinite"]]} onChange={setRetry} />}
        {showQueue && <SegChips label="Queue capacity" value={capacity} options={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} onChange={setCapacity} />}
        {showQueue && (
          <div>
            <p className="mb-2 text-base font-bold uppercase tracking-[0.12em] text-slate-500">Dead-letter queue</p>
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={dlq} label="On" onClick={() => setDlq(true)} />
              <ToggleChip active={!dlq} label="Off" onClick={() => setDlq(false)} />
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Step 05 — sync vs async
// ----------------------------------------------------------------------------
function SyncAsyncPanel() {
  const [sync, setSync] = useState(false);
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 05 · Wait now or process later?" title="Synchronous vs asynchronous" subtitle="The same request — but the user's wait time changes completely." />
      <div className="flex flex-wrap gap-2">
        <ToggleChip active={sync} label="Synchronous" onClick={() => setSync(true)} />
        <ToggleChip active={!sync} label="Asynchronous" onClick={() => setSync(false)} />
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-base font-semibold text-slate-700">User wait time</p>
        <div className="mt-2 h-3 w-full rounded-full bg-slate-200">
          <motion.div className={cn("h-full rounded-full", sync ? "bg-red-400" : "bg-emerald-400")} animate={{ width: sync ? "100%" : "22%" }} transition={{ duration: 0.4, ease: "easeInOut" }} />
        </div>
        <p className="mt-2 text-base text-slate-500">{sync ? "User waits for all work to finish." : "Request returns quickly; work continues in the background."}</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-1 text-base leading-7 text-slate-700">{sync ? "The user waits for all work." : "Work moved into the background."}</p></div>
        <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-1 text-base leading-7 text-slate-700">{sync ? "Simple but slower — and immediately consistent." : "Improves responsiveness, at the cost of eventual consistency."}</p></div>
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Step 09 — eventual consistency timeline
// ----------------------------------------------------------------------------
const TIMELINE = [
  { label: "User places order", icon: Users },
  { label: "API responds", icon: Server },
  { label: "Queue stores event", icon: Inbox },
  { label: "Consumer processes later", icon: Cpu },
];

function EventualConsistencyPanel() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % (TIMELINE.length + 1)), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 09 · Eventual consistency" title="When does the work actually finish?" subtitle="The system can return a response before the work is done." />
      <div className="flex flex-wrap items-center gap-2">
        {TIMELINE.map((t, i) => {
          const done = i < step;
          const Icon = t.icon;
          return (
            <div key={t.label} className="flex items-center gap-2">
              <div className={cn("flex items-center gap-2 rounded-2xl border-2 px-3 py-2 transition", done ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500")}>
                <Icon className="h-4 w-4" />
                <span className="text-base font-semibold">{t.label}</span>
              </div>
              {i < TIMELINE.length - 1 && <Arrow />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-1 text-base leading-7 text-slate-700">The system returned before the work finished.</p></div>
        <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-1 text-base leading-7 text-slate-700">Asynchronous systems often become eventually consistent.</p></div>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-base font-semibold leading-7">Users may temporarily see incomplete state.</p>
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Insight + challenges + solution
// ----------------------------------------------------------------------------
function InsightPanel({ model }: { model: Model }) {
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Steps 06–10 · Cause and effect" title="What just happened?" />
      <div className="grid gap-4 md:grid-cols-3">
        <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-2 text-base leading-7 text-slate-700">{model.changed}</p></div>
        <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-2 text-base leading-7 text-slate-700">{model.matters}</p></div>
        <div><p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">Where&apos;s the bottleneck</p><p className="mt-2 text-base leading-7 text-slate-700">{model.bottleneck}</p></div>
      </div>
      <AnimatePresence>
        {model.warning && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-base font-semibold leading-7">{model.warning}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {model.retryNote && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-base font-semibold leading-7">{model.retryNote}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardCard>
  );
}

function Challenges({ model, mode, consumers, dlq, failure }: { model: Model; mode: Mode; consumers: number; dlq: boolean; failure: number }) {
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 11 · Challenges" title="Match the fix" subtitle="Adjust the controls above. A card turns green when your configuration solves it." />
      <div className="grid gap-4 md:grid-cols-5">
        {CHALLENGES.map((c) => {
          const solved = c.solved(model, { mode, consumers, dlq, failure });
          return (
            <motion.div key={c.prompt} layout animate={solved ? { scale: [1, 1.025, 1] } : { scale: 1 }} className={cn("flex flex-col rounded-2xl border p-4 transition", solved ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
              <div className="flex items-start gap-2">
                <span className={cn("mt-0.5 rounded-full border p-1", solved ? "border-emerald-300 bg-white" : "border-slate-200")}>
                  <Check className={cn("h-4 w-4", solved ? "text-emerald-600" : "text-slate-300")} />
                </span>
                <p className="text-base font-semibold leading-6 text-slate-800">{c.prompt}</p>
              </div>
              <p className={cn("mt-3 text-base font-bold uppercase tracking-wide", solved ? "text-emerald-700" : "text-slate-400")}>{c.answer}</p>
            </motion.div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

function SolutionPanel({ tab, setTab }: { tab: SolTab; setTab: (t: SolTab) => void }) {
  const walkthrough = [
    "Start with a direct synchronous system.",
    "Traffic increases.",
    "Requests block and users wait.",
    "Add a queue between API and work.",
    "Introduce consumers to pull work.",
    "Observe the backlog under a spike.",
    "Scale consumers to drain it.",
    "Add retries for transient failures.",
    "Handle bad messages with a dead-letter queue.",
  ];
  const pros = { without: ["Simpler", "Immediate consistency", "Easier debugging"], with: ["Decoupling", "Traffic buffering", "Scalability", "Reliability"] };
  const cons = { without: ["Poor traffic-spike handling", "Slower user experience", "Tightly coupled services"], with: ["Eventual consistency", "Operational complexity", "Monitoring complexity", "Delayed processing"] };
  const interview = "A message queue lets systems decouple producers from consumers by temporarily storing work before processing. Instead of forcing every task to happen immediately, producers place messages into a queue while consumers process them asynchronously. Queues help absorb traffic spikes, improve reliability, enable retries, and allow independent scaling of consumers. However, they introduce tradeoffs including operational complexity, monitoring challenges, and eventual consistency.";

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
            {walkthrough.map((step, i) => <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-700"><span className="font-bold text-slate-950">Step {i + 1}: </span>{step}</div>)}
          </motion.div>
        )}
        {tab === "compare" && (
          <motion.div key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4 md:grid-cols-2">
            {(["without", "with"] as const).map((k) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  {k === "without" ? <Server className="h-5 w-5 text-sky-600" /> : <Inbox className="h-5 w-5 text-amber-600" />}
                  <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-500">{k === "without" ? "Without queue" : "With queue"}</p>
                </div>
                <p className="mt-3 text-base font-bold uppercase tracking-wide text-emerald-700">Pros</p>
                <ul className="mt-1 space-y-1">{pros[k].map((p) => <li key={p} className="flex items-center gap-2 text-base text-slate-700"><Check className="h-4 w-4 text-emerald-600" />{p}</li>)}</ul>
                <p className="mt-3 text-base font-bold uppercase tracking-wide text-red-600">Cons</p>
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
export function MessageQueueLearningVisual() {
  const [scenario, setScenario] = useState<Scenario>("checkout");
  const [mode, setMode] = useState<Mode>("queue");
  const [inc, setInc] = useState(55);
  const [consumers, setConsumers] = useState(8);
  const [speed, setSpeed] = useState<Speed>("medium");
  const [retry, setRetry] = useState<Retry>("one");
  const [failure, setFailure] = useState(5);
  const [capacity, setCapacity] = useState<Capacity>("medium");
  const [dlq, setDlq] = useState(true);
  const [tab, setTab] = useState<SolTab>("walkthrough");

  const applyScenario = (s: Scenario) => {
    const cfg = SCENARIOS[s];
    setScenario(s);
    setInc(cfg.inc);
    setConsumers(cfg.consumers);
    setSpeed(cfg.speed);
    setRetry(cfg.retry);
    setFailure(cfg.failure);
    setCapacity(cfg.capacity);
    setDlq(cfg.dlq);
    setMode(cfg.mode);
  };

  const model = useMemo(() => computeModel({ mode, incLevel: inc, consumers, speed, retry, failureRate: failure, capacity, dlq }), [mode, inc, consumers, speed, retry, failure, capacity, dlq]);
  const noQueueModel = useMemo(() => computeModel({ mode: "no-queue", incLevel: inc, consumers, speed, retry, failureRate: failure, capacity, dlq }), [inc, consumers, speed, retry, failure, capacity, dlq]);
  const queueModel = useMemo(() => computeModel({ mode: "queue", incLevel: inc, consumers, speed, retry, failureRate: failure, capacity, dlq }), [inc, consumers, speed, retry, failure, capacity, dlq]);
  const metricsModel = mode === "no-queue" ? noQueueModel : queueModel;

  return (
    <motion.div {...pageMotion} className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <ConceptSnapshot scenario={scenario} onScenario={applyScenario} />

        <DashboardCard>
          <SectionHeader eyebrow="Step 03 · Main interaction" title="Same traffic, three views" subtitle="Switch between a direct chain, a queued system, and a side-by-side compare." />
          <ModeTabs mode={mode} setMode={setMode} />
        </DashboardCard>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Controls
            mode={mode}
            inc={inc} setInc={setInc}
            consumers={consumers} setConsumers={setConsumers}
            speed={speed} setSpeed={setSpeed}
            retry={retry} setRetry={setRetry}
            failure={failure} setFailure={setFailure}
            capacity={capacity} setCapacity={setCapacity}
            dlq={dlq} setDlq={setDlq}
          />
          <ArchitectureCanvas mode={mode} model={model} incLevel={inc} consumers={consumers} noQueueModel={noQueueModel} queueModel={queueModel} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Layers} label="Queue depth" block={metricsModel.queueDepth} />
          <MetricCard icon={Activity} label="Consumer utilization" block={metricsModel.utilization} />
          <MetricCard icon={Clock} label="Avg processing delay" block={metricsModel.delay} />
          <MetricCard icon={AlertTriangle} label="Dropped / failed" block={metricsModel.dropped} />
        </div>

        <InsightPanel model={metricsModel} />
        <div className="grid gap-5 lg:grid-cols-2">
          <SyncAsyncPanel />
          <EventualConsistencyPanel />
        </div>
        <Challenges model={metricsModel} mode={mode} consumers={consumers} dlq={dlq} failure={failure} />
        <SolutionPanel tab={tab} setTab={setTab} />

        <DashboardCard>
          <h2 className="text-2xl font-bold text-slate-950">Summary</h2>
          <ul className="mt-4 grid gap-3 text-base leading-7 text-slate-700 md:grid-cols-2">
            <li>Without a queue, work happens immediately — a spike blocks users and overloads the chain.</li>
            <li>With a queue, work is buffered — the API responds fast while consumers process asynchronously.</li>
            <li>Queues buffer bursts but cannot absorb infinite traffic — scale consumers to drain the backlog.</li>
            <li>Queues improve reliability and decoupling, but add eventual consistency and operational complexity.</li>
          </ul>
        </DashboardCard>
      </div>
    </motion.div>
  );
}
