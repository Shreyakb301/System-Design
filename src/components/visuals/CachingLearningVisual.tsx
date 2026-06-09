"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Database,
  Layers,
  Server,
  Target,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scenario = "catalog" | "profiles" | "feed" | "video" | "banking" | "analytics";
type Mode = "no-cache" | "cache" | "compare";
type Size = "small" | "medium" | "large";
type Eviction = "lru" | "lfu" | "fifo";
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

function SegChips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, l]) => <ToggleChip key={id} active={value === id} label={l} onClick={() => onChange(id)} />)}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Formatters + model
// ----------------------------------------------------------------------------
const fmtReqLevel = (level: number) => fmtReqValue(100 * Math.pow(10000, level / 100));
const reqRate = (level: number) => 100 * Math.pow(10000, level / 100);
function fmtReqValue(v: number) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M/s`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}K/s`;
  return `${Math.round(v)}/s`;
}
const dbLatencyMs = (level: number) => Math.round(10 + (level / 100) * 490);
const ttlSeconds = (level: number) => 10 * Math.pow(8640, level / 100); // 10s -> 1 day
const fmtTTL = (level: number) => {
  const s = ttlSeconds(level);
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return "1d";
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const MODE_FEEL: Record<Mode, string> = {
  "no-cache": "Repeat expensive work — every request hits the database.",
  cache: "Reuse previous work — repeated reads are served from cache.",
  compare: "Same traffic, two architectures, side by side.",
};

type MetricBlock = { value: string; bar: number; tone: Tone; hint: string };
type Model = {
  hitRate: number;
  dbReqPct: number;
  overloaded: boolean;
  latency: MetricBlock;
  hit: MetricBlock;
  dbReq: MetricBlock;
  stale: MetricBlock;
  changed: string;
  matters: string;
  bottleneck: string;
  warning: string | null;
};

function computeModel(args: { mode: Mode; reqLevel: number; repeat: number; latLevel: number; size: Size; ttlLevel: number; failure: boolean; fallback: boolean }): Model {
  const { mode, reqLevel, repeat, latLevel, size, ttlLevel, failure, fallback } = args;
  const rate = reqRate(reqLevel);
  const sizeFactor = size === "small" ? 0.6 : size === "medium" ? 0.85 : 1;
  const cacheOk = mode === "cache" && !failure;
  const hitRate = cacheOk ? Math.min(1, (repeat / 100) * sizeFactor) : 0;

  const dbLat = dbLatencyMs(latLevel);
  const cacheLat = 6;
  const serverBase = 8;
  const errored = mode === "cache" && failure && !fallback;
  const avgLatency = mode === "no-cache"
    ? serverBase + dbLat
    : Math.round(serverBase + hitRate * cacheLat + (1 - hitRate) * dbLat);

  const dbReqRate = mode === "no-cache" ? rate : errored ? 0 : Math.round(rate * (1 - hitRate));
  const dbReqPct = dbReqRate / Math.max(rate, 1);
  const dbCapacity = 250_000 / Math.max(dbLat / 100, 0.2);
  const overloaded = dbReqRate > dbCapacity;

  const staleScore = mode === "no-cache" || !cacheOk ? 0 : clamp(ttlLevel * 0.92);

  // tones
  const latTone: Tone = errored ? "bad" : avgLatency < 50 ? "good" : avgLatency < 200 ? "warn" : "bad";
  const hitTone: Tone = mode === "no-cache" ? "neutral" : !cacheOk ? "bad" : hitRate >= 0.7 ? "good" : hitRate >= 0.4 ? "warn" : "bad";
  const dbTone: Tone = overloaded ? "bad" : dbReqPct < 0.3 ? "good" : dbReqPct < 0.7 ? "warn" : "bad";
  const staleTone: Tone = mode === "no-cache" ? "neutral" : staleScore < 30 ? "good" : staleScore < 60 ? "warn" : "bad";

  const latency: MetricBlock = {
    value: errored ? "errors" : `${avgLatency}ms`,
    bar: errored ? 100 : Math.min(100, avgLatency / 5),
    tone: latTone,
    hint: mode === "no-cache" ? "Every read pays full DB latency." : errored ? "Requests fail with no fallback." : `${Math.round(hitRate * 100)}% of reads return from cache.`,
  };
  const hit: MetricBlock = {
    value: mode === "no-cache" ? "—" : `${Math.round(hitRate * 100)}%`,
    bar: hitRate * 100,
    tone: hitTone,
    hint: mode === "no-cache" ? "No cache in this mode." : !cacheOk ? "Cache is unavailable." : hitRate < 0.4 ? "Low repetition means mostly misses." : "Repeated reads are being served.",
  };
  const dbReq: MetricBlock = {
    value: fmtReqValue(dbReqRate),
    bar: dbReqPct * 100,
    tone: dbTone,
    hint: mode === "no-cache" ? "The database serves 100% of reads." : overloaded ? "Database is overloaded." : `${Math.round(dbReqPct * 100)}% of reads reach the DB.`,
  };
  const stale: MetricBlock = {
    value: mode === "no-cache" ? "None" : `${staleScore}%`,
    bar: staleScore,
    tone: staleTone,
    hint: mode === "no-cache" ? "Always reads the source of truth." : staleScore >= 60 ? "Long TTL — data can drift." : "TTL keeps data reasonably fresh.",
  };

  // insight
  let changed: string, matters: string, bottleneck: string;
  if (mode === "no-cache") {
    changed = "Every request recomputes work and hits the database.";
    matters = "Simple and always fresh, but latency and DB load scale with traffic.";
    bottleneck = overloaded ? "The database — it serves every request and is overloaded." : "The database — it serves every request.";
  } else if (mode === "compare") {
    changed = "The same traffic hits a direct DB path and a cached path.";
    matters = "The cache trades freshness for lower latency and reduced DB load.";
    bottleneck = "The database on the uncached side; the cache shields the other.";
  } else if (!cacheOk) {
    changed = "The cache is unavailable.";
    matters = "Caching must not become a single point of failure — fall back to the DB.";
    bottleneck = "The database — it now absorbs all traffic.";
  } else if (hitRate >= 0.6) {
    changed = "Repeated results are served straight from cache.";
    matters = "Reads get fast and the database is shielded from repeated work.";
    bottleneck = overloaded ? "The database still strains on the miss traffic." : "None — the cache is absorbing repeated reads.";
  } else {
    changed = "Few requests repeat, so most miss the cache.";
    matters = "Misses still hit the database and pay full latency.";
    bottleneck = "The database — the hit rate is too low to shield it.";
  }

  let warning: string | null = null;
  if (errored) warning = "Cache failed and fallback is disabled — requests are erroring instead of reading the DB.";
  else if (mode === "cache" && failure) warning = "Cache is down — all traffic falls back to the database and load spikes.";
  else if (overloaded) warning = "Database is overloaded — raise the hit rate (more repetition or a larger cache) to shield it.";
  else if (mode === "cache" && staleScore >= 60) warning = "Long TTL improves performance but increases stale-data risk.";
  else if (mode === "cache" && hitRate < 0.4) warning = "Low repetition means mostly misses — the cache adds little here.";

  return { hitRate, dbReqPct, overloaded, latency, hit, dbReq, stale, changed, matters, bottleneck, warning };
}

const SCENARIOS: Record<Scenario, { label: string; req: number; repeat: number; lat: number; size: Size; ttl: number; mode: Mode; changed: string; matters: string }> = {
  catalog: { label: "Product Catalog", req: 60, repeat: 88, lat: 35, size: "large", ttl: 65, mode: "cache", changed: "Catalog reads repeat constantly and rarely change.", matters: "Strong cache candidate — high hit rate, low staleness." },
  profiles: { label: "User Profiles", req: 55, repeat: 72, lat: 25, size: "medium", ttl: 45, mode: "cache", changed: "Profiles are read often and updated occasionally.", matters: "Cache with a moderate TTL." },
  feed: { label: "News Feed", req: 70, repeat: 58, lat: 30, size: "large", ttl: 30, mode: "cache", changed: "Feeds are read-heavy but change frequently.", matters: "Cache helps, but watch freshness with a short TTL." },
  video: { label: "Video Platform", req: 82, repeat: 84, lat: 40, size: "large", ttl: 70, mode: "cache", changed: "Popular content is requested repeatedly.", matters: "Cache (and a CDN) absorb huge read volume." },
  banking: { label: "Banking App", req: 45, repeat: 40, lat: 18, size: "small", ttl: 6, mode: "compare", changed: "Balances must be fresh — staleness is dangerous.", matters: "Freshness important — cache carefully with a very short TTL." },
  analytics: { label: "Analytics Dashboard", req: 50, repeat: 62, lat: 70, size: "medium", ttl: 50, mode: "cache", changed: "Expensive aggregations are recomputed often.", matters: "Cache the expensive query results to cut load." },
};

const CHALLENGES: { prompt: string; answer: string; solved: (m: Model, s: { mode: Mode; ttlLevel: number; size: Size; failure: boolean; fallback: boolean }) => boolean }[] = [
  { prompt: "Users repeatedly load same products", answer: "Cache", solved: (_m, s) => s.mode === "cache" },
  { prompt: "Data changes constantly", answer: "Be careful — short TTL", solved: (_m, s) => s.mode === "no-cache" || s.ttlLevel <= 30 },
  { prompt: "Database overloaded", answer: "Raise cache effectiveness", solved: (m, s) => s.mode === "cache" && !m.overloaded && m.hitRate >= 0.6 },
  { prompt: "Cache full", answer: "Eviction required", solved: (_m, s) => s.size === "small" },
  { prompt: "Cache server dies", answer: "Fallback to DB", solved: (_m, s) => s.failure && s.fallback },
];

// ----------------------------------------------------------------------------
// Canvas
// ----------------------------------------------------------------------------
const NODE_STYLES = {
  users: "border-slate-300 bg-white text-slate-700",
  server: "border-sky-300 bg-sky-50 text-sky-700",
  cache: "border-amber-300 bg-amber-50 text-amber-700",
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

function FlowRow({ mode, model }: { mode: Mode; model: Model }) {
  if (mode === "no-cache") {
    return (
      <div className="flex items-center justify-between gap-2">
        <NodeBox styleKey="users" icon={Users} title="Users" />
        <Arrow />
        <NodeBox styleKey="server" icon={Server} title="Server" />
        <Arrow />
        <NodeBox styleKey={model.overloaded ? "danger" : "db"} icon={Database} title="Database" sub={model.overloaded ? "overloaded" : "all reads"} />
      </div>
    );
  }
  const cacheDown = model.hit.tone === "bad" && model.hitRate === 0;
  return (
    <div className="flex items-center justify-between gap-2">
      <NodeBox styleKey="users" icon={Users} title="Users" />
      <Arrow />
      <NodeBox styleKey="server" icon={Server} title="Server" />
      <Arrow />
      <NodeBox styleKey={cacheDown ? "danger" : "cache"} icon={Layers} title="Cache" sub={cacheDown ? "down" : `${Math.round(model.hitRate * 100)}% hit`} />
      <Arrow />
      <NodeBox styleKey={model.overloaded ? "danger" : "db"} icon={Database} title="Database" sub="source of truth" />
    </div>
  );
}

function ArchitectureCanvas({ mode, model, reqLevel, noCacheModel, cacheModel }: { mode: Mode; model: Model; reqLevel: number; noCacheModel: Model; cacheModel: Model }) {
  const total = Math.max(3, Math.round(reqLevel / 14));
  const speed = Math.max(1.6, 3.6 - reqLevel / 50);
  const hitDots = mode === "cache" ? Math.round(total * model.hitRate) : 0;

  return (
    <DashboardCard className="min-h-[360px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Live architecture</h2>
          <p className="text-base text-slate-600">{MODE_FEEL[mode]}</p>
        </div>
        <div className="flex items-center gap-2 text-base font-semibold">
          {mode === "cache"
            ? <>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-400" /> hit</span>
                <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-400" /> miss</span>
              </>
            : <span className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700"><span className="h-2 w-2 rounded-full bg-sky-400" /> requests</span>}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-amber-50/40 p-5"
        style={{ backgroundImage: "radial-gradient(circle, rgba(120,113,108,0.16) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      >
        {mode !== "compare" && Array.from({ length: total }).map((_, i) => {
          const isHit = mode === "cache" && i < hitDots;
          const color = mode === "no-cache" ? (model.overloaded ? "bg-red-400" : "bg-sky-400") : isHit ? "bg-emerald-400" : "bg-amber-400";
          // hits return early (shorter route), misses travel further to the DB
          const end = isHit ? "62%" : "90%";
          const top = mode === "cache" ? (isHit ? "42%" : "58%") : "50%";
          return (
            <motion.span
              key={i}
              className={cn("pointer-events-none absolute z-10 h-2 w-2 -translate-y-1/2 rounded-full", color)}
              style={{ top }}
              initial={{ left: "8%", opacity: 0 }}
              animate={{ left: ["8%", end], opacity: [0, 0.85, 0] }}
              transition={{ duration: speed, repeat: Infinity, delay: (speed / total) * i, ease: "linear" }}
            />
          );
        })}

        <div className="relative z-20">
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}>
              {mode === "compare" ? (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Without cache</p>
                    <FlowRow mode="no-cache" model={noCacheModel} />
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">With cache</p>
                    <FlowRow mode="cache" model={cacheModel} />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[200px] items-center">
                  <FlowRow mode={mode} model={model} />
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
const TONE_TEXT: Record<Tone, string> = { good: "Healthy", warn: "Warning", bad: "Poor", neutral: "N/A" };

function MetricCard({ icon: Icon, label, block }: { icon: typeof Zap; label: string; block: MetricBlock }) {
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
      <SectionHeader eyebrow="Step 01 · Concept snapshot" title="Store expensive work closer" subtitle="See how a cache changes latency, database load, and system behavior." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Without cache</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <NodeBox compact styleKey="users" icon={Users} title="User" />
            <Arrow />
            <NodeBox compact styleKey="server" icon={Server} title="Server" />
            <Arrow />
            <NodeBox compact styleKey="db" icon={Database} title="Database" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-800">&ldquo;Repeat expensive work.&rdquo;</p>
          <p className="mt-1 text-base text-slate-600">Every request performs the work again — the database handles everything.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">With cache</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <NodeBox compact styleKey="users" icon={Users} title="User" />
            <Arrow />
            <NodeBox compact styleKey="server" icon={Server} title="Server" />
            <Arrow />
            <NodeBox compact styleKey="cache" icon={Layers} title="Cache" />
            <Arrow />
            <NodeBox compact styleKey="db" icon={Database} title="DB" sub="sometimes" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-800">&ldquo;Reuse previous work.&rdquo;</p>
          <p className="mt-1 text-base text-slate-600">Repeated results are reused — only misses reach the database.</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pick a scenario</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(SCENARIOS) as Scenario[]).map((id) => (
            <ToggleChip key={id} active={scenario === id} label={SCENARIOS[id].label} onClick={() => onScenario(id)} />
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
// Controls
// ----------------------------------------------------------------------------
function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const tabs: [Mode, string][] = [["no-cache", "No Cache"], ["cache", "Cache"], ["compare", "Compare"]];
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {tabs.map(([id, label]) => (
        <button key={id} type="button" onClick={() => setMode(id)} className={cn("min-w-[120px] flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition", mode === id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{label}</button>
      ))}
    </div>
  );
}

function Controls(props: {
  mode: Mode;
  req: number; setReq: (v: number) => void;
  repeat: number; setRepeat: (v: number) => void;
  lat: number; setLat: (v: number) => void;
  size: Size; setSize: (s: Size) => void;
  ttl: number; setTtl: (v: number) => void;
  failure: boolean; setFailure: (v: boolean) => void;
  fallback: boolean; setFallback: (v: boolean) => void;
}) {
  const { mode, req, setReq, repeat, setRepeat, lat, setLat, size, setSize, ttl, setTtl, failure, setFailure, fallback, setFallback } = props;
  const showCache = mode !== "no-cache";
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 02 · Simulate repeated requests" title="Stress the system" subtitle="Watch cache hits, misses, and database pressure react to every change." />
      <div className="grid gap-3">
        <ScaleControl label="Request rate" level={req} setLevel={setReq} format={fmtReqLevel} />
        <ScaleControl label="Repeated requests" level={repeat} setLevel={setRepeat} format={(v) => `${Math.round(v)}%`} />
        <ScaleControl label="Database latency" level={lat} setLevel={setLat} format={(v) => `${dbLatencyMs(v)}ms`} />
        {showCache && <ScaleControl label="TTL" level={ttl} setLevel={setTtl} format={fmtTTL} />}
      </div>
      <div className="mt-4 space-y-3">
        {showCache && <SegChips label="Cache size" value={size} options={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} onChange={setSize} />}
        {showCache && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Cache health</p>
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={!failure} label="Healthy" onClick={() => setFailure(false)} />
              <ToggleChip active={failure} label="Cache failure" onClick={() => setFailure(true)} />
            </div>
          </div>
        )}
        {showCache && failure && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">On failure</p>
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={fallback} label="Fallback to DB" onClick={() => setFallback(true)} />
              <ToggleChip active={!fallback} label="No fallback" onClick={() => setFallback(false)} />
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Step 06 — TTL & stale data
// ----------------------------------------------------------------------------
function StalePanel({ ttl, setTtl }: { ttl: number; setTtl: (v: number) => void }) {
  const [dbPrice, setDbPrice] = useState(25);
  const [cachePrice, setCachePrice] = useState(25);
  const stale = dbPrice !== cachePrice;

  useEffect(() => {
    if (!stale) return;
    const delay = 1200 + ttl * 22;
    const t = setTimeout(() => setCachePrice(dbPrice), delay);
    return () => clearTimeout(t);
  }, [stale, dbPrice, ttl]);

  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 06 · TTL & stale data" title="How long should data stay cached?" subtitle="Update the database and watch the cache lag behind until its TTL expires." />
      <div className="flex flex-wrap gap-2">
        {([["10s", 0], ["1m", 20], ["1h", 65], ["1d", 100]] as [string, number][]).map(([l, v]) => (
          <ToggleChip key={l} active={fmtTTL(ttl) === l} label={l} onClick={() => setTtl(v)} />
        ))}
        <button type="button" onClick={() => setDbPrice((p) => p + 5)} className="min-h-11 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-base font-semibold text-white">Update database</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2 text-base font-semibold text-purple-700"><Database className="h-4 w-4" /> Database</div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">${dbPrice}</p>
          <p className="text-base text-slate-500">source of truth</p>
        </div>
        <div className={cn("rounded-2xl border p-4", stale ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")}>
          <div className={cn("flex items-center gap-2 text-base font-semibold", stale ? "text-red-700" : "text-amber-700")}><Layers className="h-4 w-4" /> Cache</div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">${cachePrice}</p>
          <p className="text-base text-slate-500">{stale ? "stale — serving old value" : "fresh"}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-1 text-base leading-7 text-slate-700">{stale ? "The database changed but the cache still serves the old value." : "Cache and database agree."}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-1 text-base leading-7 text-slate-700">Caching introduces freshness problems — readers can see old data until the TTL expires.</p></div>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-base font-semibold leading-7">Long TTL improves performance but increases stale-data risk.</p>
      </div>
    </DashboardCard>
  );
}

// ----------------------------------------------------------------------------
// Step 07 — eviction
// ----------------------------------------------------------------------------
const EVICTION_TEXT: Record<Eviction, string> = {
  lru: "Removes the least recently used item.",
  lfu: "Removes the least frequently used item.",
  fifo: "Removes the oldest inserted item.",
};

function EvictionPanel() {
  const [strategy, setStrategy] = useState<Eviction>("lru");
  const [slots, setSlots] = useState(4);
  const [items, setItems] = useState<string[]>(["A", "B", "C"]);
  const [next, setNext] = useState(3);

  const insert = () => {
    const key = String.fromCharCode(65 + (next % 26));
    setNext((n) => n + 1);
    setItems((prev) => {
      const updated = [...prev, key];
      while (updated.length > slots) updated.shift();
      return updated;
    });
  };
  const reset = () => { setItems(["A", "B", "C"]); setNext(3); };

  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 07 · Eviction" title="What happens when the cache is full?" subtitle="Limited memory forces a choice about what to drop." />
      <SegChips label="Eviction strategy" value={strategy} options={[["lru", "LRU"], ["lfu", "LFU"], ["fifo", "FIFO"]]} onChange={setStrategy} />
      <div className="mt-3 flex items-center gap-3">
        <input type="range" min={2} max={8} step={1} value={slots} onChange={(e) => { const v = Number(e.target.value); setSlots(v); setItems((prev) => prev.slice(-v)); }} className="w-40 accent-slate-900" />
        <span className="text-base font-semibold text-slate-700">{slots} slots</span>
        <button type="button" onClick={insert} className="min-h-9 rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">Insert next</button>
        <button type="button" onClick={reset} className="min-h-9 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-300">Reset</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: slots }).map((_, i) => {
          const key = items[i];
          return (
            <div key={i} className={cn("flex h-12 w-12 items-center justify-center rounded-xl border-2 text-base font-bold", key ? "border-amber-300 bg-amber-50 text-amber-700" : "border-dashed border-slate-200 bg-slate-50 text-slate-300")}>
              <AnimatePresence mode="wait">
                <motion.span key={key ?? "empty"} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }}>{key ?? "·"}</motion.span>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <p className="text-base leading-7 text-slate-700"><span className="font-bold text-slate-950">{strategy.toUpperCase()}: </span>{EVICTION_TEXT[strategy]} Limited memory forces tradeoffs about what to keep.</p>
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
      <SectionHeader eyebrow="Steps 05 / 08 / 09 · Cause and effect" title="What just happened?" />
      <div className="grid gap-4 md:grid-cols-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-2 text-base leading-7 text-slate-700">{model.changed}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-2 text-base leading-7 text-slate-700">{model.matters}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Where&apos;s the bottleneck</p><p className="mt-2 text-base leading-7 text-slate-700">{model.bottleneck}</p></div>
      </div>
      <AnimatePresence>
        {model.warning && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-base font-semibold leading-7">{model.warning}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardCard>
  );
}

function Challenges({ model, mode, ttlLevel, size, failure, fallback }: { model: Model; mode: Mode; ttlLevel: number; size: Size; failure: boolean; fallback: boolean }) {
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Step 10 · Challenges" title="Match the fix" subtitle="Adjust the controls above. A card turns green when your configuration solves it." />
      <div className="grid gap-4 md:grid-cols-5">
        {CHALLENGES.map((c) => {
          const solved = c.solved(model, { mode, ttlLevel, size, failure, fallback });
          return (
            <motion.div key={c.prompt} layout animate={solved ? { scale: [1, 1.025, 1] } : { scale: 1 }} className={cn("flex flex-col rounded-2xl border p-4 transition", solved ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
              <div className="flex items-start gap-2">
                <span className={cn("mt-0.5 rounded-full border p-1", solved ? "border-emerald-300 bg-white" : "border-slate-200")}>
                  <Check className={cn("h-4 w-4", solved ? "text-emerald-600" : "text-slate-300")} />
                </span>
                <p className="text-base font-semibold leading-6 text-slate-800">{c.prompt}</p>
              </div>
              <p className={cn("mt-3 text-xs font-bold uppercase tracking-wide", solved ? "text-emerald-700" : "text-slate-400")}>{c.answer}</p>
            </motion.div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

function SolutionPanel({ tab, setTab }: { tab: SolTab; setTab: (t: SolTab) => void }) {
  const walkthrough = [
    "Database handles every request.",
    "Repeated requests start appearing.",
    "Add a cache in front of the DB.",
    "Observe cache hits returning fast.",
    "Observe misses falling through to the DB.",
    "Introduce a TTL to bound staleness.",
    "Handle stale data on writes.",
    "Add eviction when the cache fills.",
    "Handle cache failures with a fallback.",
  ];
  const pros = { without: ["Simpler", "Always fresh", "Fewer moving parts"], with: ["Lower latency", "Reduced DB load", "Improved scalability"] };
  const cons = { without: ["High latency", "Database overload", "Repeated work"], with: ["Stale data", "Invalidation complexity", "Memory limits", "Operational complexity"] };
  const interview = "Caching stores frequently accessed or expensive-to-compute data in faster temporary storage so repeated requests avoid recomputing work or repeatedly hitting the database. Cache hits return data directly from cache, while cache misses fetch from the source of truth and store the result for later use. Caching reduces latency and database load but introduces tradeoffs including stale data, invalidation complexity, memory limits, and failure handling.";

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
                  {k === "without" ? <Database className="h-5 w-5 text-purple-600" /> : <Layers className="h-5 w-5 text-amber-600" />}
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{k === "without" ? "Without cache" : "With cache"}</p>
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
export function CachingLearningVisual() {
  const [scenario, setScenario] = useState<Scenario>("catalog");
  const [mode, setMode] = useState<Mode>("cache");
  const [req, setReq] = useState(60);
  const [repeat, setRepeat] = useState(88);
  const [lat, setLat] = useState(35);
  const [size, setSize] = useState<Size>("large");
  const [ttl, setTtl] = useState(65);
  const [failure, setFailure] = useState(false);
  const [fallback, setFallback] = useState(true);
  const [tab, setTab] = useState<SolTab>("walkthrough");

  const applyScenario = (s: Scenario) => {
    const cfg = SCENARIOS[s];
    setScenario(s);
    setReq(cfg.req);
    setRepeat(cfg.repeat);
    setLat(cfg.lat);
    setSize(cfg.size);
    setTtl(cfg.ttl);
    setMode(cfg.mode);
    setFailure(false);
    setFallback(true);
  };

  const model = useMemo(() => computeModel({ mode, reqLevel: req, repeat, latLevel: lat, size, ttlLevel: ttl, failure, fallback }), [mode, req, repeat, lat, size, ttl, failure, fallback]);
  const noCacheModel = useMemo(() => computeModel({ mode: "no-cache", reqLevel: req, repeat, latLevel: lat, size, ttlLevel: ttl, failure, fallback }), [req, repeat, lat, size, ttl, failure, fallback]);
  const cacheModel = useMemo(() => computeModel({ mode: "cache", reqLevel: req, repeat, latLevel: lat, size, ttlLevel: ttl, failure, fallback }), [req, repeat, lat, size, ttl, failure, fallback]);
  const metricsModel = mode === "no-cache" ? noCacheModel : mode === "compare" ? cacheModel : model;

  return (
    <motion.div {...pageMotion} className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <ConceptSnapshot scenario={scenario} onScenario={applyScenario} />

        <DashboardCard>
          <SectionHeader eyebrow="Step 03 · Main interaction" title="Same traffic, three views" subtitle="Switch between a direct DB path, a cached path, and a side-by-side compare." />
          <ModeTabs mode={mode} setMode={setMode} />
        </DashboardCard>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Controls
            mode={mode}
            req={req} setReq={setReq}
            repeat={repeat} setRepeat={setRepeat}
            lat={lat} setLat={setLat}
            size={size} setSize={setSize}
            ttl={ttl} setTtl={setTtl}
            failure={failure} setFailure={setFailure}
            fallback={fallback} setFallback={setFallback}
          />
          <ArchitectureCanvas mode={mode} model={model} reqLevel={req} noCacheModel={noCacheModel} cacheModel={cacheModel} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Zap} label="Average latency" block={metricsModel.latency} />
          <MetricCard icon={Target} label="Cache hit rate" block={metricsModel.hit} />
          <MetricCard icon={Database} label="Database requests/sec" block={metricsModel.dbReq} />
          <MetricCard icon={Clock} label="Stale data risk" block={metricsModel.stale} />
        </div>

        <InsightPanel model={metricsModel} />
        <div className="grid gap-5 lg:grid-cols-2">
          <StalePanel ttl={ttl} setTtl={setTtl} />
          <EvictionPanel />
        </div>
        <Challenges model={metricsModel} mode={mode} ttlLevel={ttl} size={size} failure={failure} fallback={fallback} />
        <SolutionPanel tab={tab} setTab={setTab} />

        <DashboardCard>
          <h2 className="text-2xl font-bold text-slate-950">Summary</h2>
          <ul className="mt-4 grid gap-3 text-base leading-7 text-slate-700 md:grid-cols-2">
            <li>Without a cache, every request repeats expensive work and the database absorbs full load.</li>
            <li>With a cache, repeated reads are reused — latency drops and the database is shielded.</li>
            <li>Hit rate depends on repetition and cache size; misses still pay full database latency.</li>
            <li>Caching adds TTL, staleness, eviction, and failure handling — it must not be a single point of failure.</li>
          </ul>
        </DashboardCard>
      </div>
    </motion.div>
  );
}
