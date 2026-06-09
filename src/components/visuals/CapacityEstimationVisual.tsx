"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, Info,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ScenarioId = "social" | "url" | "video" | "chat" | "delivery";
type ReadRatio  = 1 | 10 | 100;
type Retention  = 30 | 365 | 1825 | 3650;
type PayloadKB  = 1 | 10 | 100 | 1000;
type NodeId     = "users" | "api" | "cache" | "db" | "object" | "cdn";
type PeakMult   = 2 | 3 | 5 | 10;
type Pattern    = "flat" | "workday" | "evening" | "flash";

interface NodeDef { label: string; x: number; y: number; color: string; tooltip: string; }
interface Scenario {
  id: ScenarioId; label: string; description: string;
  mau: number; dauPct: number; actions: number; readRatio: ReadRatio; payloadKB: PayloadKB; retention: Retention;
}

// ─── Formatting ────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}
function fmtBytes(b: number): string {
  if (b >= 1e15) return `${(b / 1e15).toFixed(1)} PB`;
  if (b >= 1e12) return `${(b / 1e12).toFixed(1)} TB`;
  if (b >= 1e9)  return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6)  return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3)  return `${(b / 1e3).toFixed(1)} KB`;
  return `${b.toFixed(0)} B`;
}

// ─── Scenarios ─────────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  { id: "social",   label: "Social app",     description: "Read-heavy feed. Many small posts, some media. Long retention.",   mau: 100e6, dauPct: 50, actions: 10, readRatio: 100, payloadKB: 10,   retention: 1825 },
  { id: "url",      label: "URL shortener",  description: "Tiny records, extreme read:write ratio, minimal storage.",         mau: 10e6,  dauPct: 30, actions: 5,  readRatio: 100, payloadKB: 1,    retention: 3650 },
  { id: "video",    label: "Video platform", description: "Huge media payloads. Storage and bandwidth dominate everything.", mau: 100e6, dauPct: 40, actions: 3,  readRatio: 100, payloadKB: 1000, retention: 1825 },
  { id: "chat",     label: "Chat app",       description: "Write-heavy. Many small messages, balanced read/write.",          mau: 50e6,  dauPct: 60, actions: 50, readRatio: 10,  payloadKB: 1,    retention: 365  },
  { id: "delivery", label: "Food delivery",  description: "Moderate traffic, transactional writes, medium payloads.",        mau: 10e6,  dauPct: 40, actions: 8,  readRatio: 10,  payloadKB: 10,   retention: 365  },
];

// ─── Canvas nodes ──────────────────────────────────────────────────────────────
const NW = 108, NH = 36;
const NODES: Record<NodeId, NodeDef> = {
  users:  { label: "Users",          x: 30,  y: 192, color: "#475569", tooltip: "User count and activity drive request volume." },
  api:    { label: "API Servers",    x: 250, y: 192, color: "#1e293b", tooltip: "Handle every request. Peak QPS determines how many you need." },
  cache:  { label: "Cache",          x: 470, y: 60,  color: "#b91c1c", tooltip: "High read traffic may benefit from caching to offload the database." },
  db:     { label: "Database",       x: 470, y: 192, color: "#4338ca", tooltip: "Writes and metadata increase database load." },
  object: { label: "Object Storage", x: 470, y: 324, color: "#6d28d9", tooltip: "Large files usually belong in object storage, not the database." },
  cdn:    { label: "CDN",            x: 630, y: 324, color: "#0e7490", tooltip: "Large static/media content may benefit from edge delivery." },
};

// ─── Core estimation math ──────────────────────────────────────────────────────
interface Estimates {
  dau: number; writesPerDay: number; writeQps: number; readQps: number; avgQps: number; peakQps: number;
  dailyStorage: number; totalStorage: number; bandwidthPerSec: number;
}
function estimate(mau: number, dauPct: number, actions: number, readRatio: ReadRatio, payloadKB: PayloadKB, retention: Retention, peakMult: PeakMult): Estimates {
  const dau = mau * (dauPct / 100);
  const writesPerDay = dau * actions;
  const writeQps = writesPerDay / 86400;
  const readQps = writeQps * readRatio;
  const avgQps = writeQps + readQps;
  const peakQps = avgQps * peakMult;
  const payloadBytes = payloadKB * 1024;
  const dailyStorage = writesPerDay * payloadBytes;
  const totalStorage = dailyStorage * retention;
  const bandwidthPerSec = avgQps * payloadBytes;
  return { dau, writesPerDay, writeQps, readQps, avgQps, peakQps, dailyStorage, totalStorage, bandwidthPerSec };
}

function getActiveNodes(payloadKB: PayloadKB, readRatio: ReadRatio): Set<NodeId> {
  const s = new Set<NodeId>(["users", "api", "db"]);
  if (readRatio >= 10) s.add("cache");
  if (payloadKB >= 100) { s.add("object"); s.add("cdn"); }
  return s;
}

// ─── Shared components ─────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: string }) {
  return <p className="text-base font-bold uppercase tracking-[0.3em] text-slate-500 mb-1">{children}</p>;
}

function MetricCard({ label, value, good, warn }: { label: string; value: string; good: boolean; warn: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
      <p className="text-base font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <motion.p key={value} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
        className={cn("text-base font-bold tabular-nums leading-none", good ? "text-emerald-600" : warn ? "text-amber-600" : "text-red-500")}>
        {value}
      </motion.p>
    </div>
  );
}

function InsightPanel({ text, type }: { text: string; type: "success" | "warning" | "risk" | "neutral" }) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    risk:    "bg-red-50 border-red-200 text-red-700",
    neutral: "bg-slate-50 border-slate-200 text-slate-700",
  };
  const icon = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />,
    risk:    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />,
    neutral: <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />,
  };
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      className={cn("flex items-start gap-2.5 p-3 rounded-xl border text-base leading-relaxed", styles[type])}>
      {icon[type]}{text}
    </motion.div>
  );
}

function SegmentedControl<T extends string | number>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
      {options.map((o) => (
        <button key={String(o.key)} onClick={() => onChange(o.key)}
          className={cn("flex-1 py-1.5 px-2 rounded-lg text-base font-semibold transition-all",
            value === o.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-700")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Pill<T extends string | number>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={String(o.key)} onClick={() => onChange(o.key)}
          className={cn("px-3 py-1 rounded-full text-base font-semibold border transition-all",
            value === o.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── SVG Canvas ────────────────────────────────────────────────────────────────
function TrafficDot({ x1, y1, x2, y2, color, delay, dur }: { x1: number; y1: number; x2: number; y2: number; color: string; delay: number; dur: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <motion.circle r={3.5} fill={color} fillOpacity={0.85}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, mx, x2], cy: [y1, my, y2], opacity: [0, 0.9, 0] }}
      transition={{ duration: dur, repeat: Infinity, repeatDelay: delay, ease: "linear" }}
    />
  );
}

function CapacityCanvas({ active, e, readRatio, onTooltip }: {
  active: Set<NodeId>; e: Estimates; readRatio: ReadRatio; onTooltip: (t: string | null) => void;
}) {
  const overload = e.peakQps > 50000;
  const dotDur = overload ? 0.8 : 1.5;
  const readHeavy = readRatio >= 100;

  const edges = useMemo((): Array<{ a: NodeId; b: NodeId; color: string }> => {
    const out: Array<{ a: NodeId; b: NodeId; color: string }> = [{ a: "users", b: "api", color: "#64748b" }];
    if (active.has("cache")) out.push({ a: "api", b: "cache", color: "#0ea5e9" });
    out.push({ a: "api", b: "db", color: "#f59e0b" });
    if (active.has("object")) out.push({ a: "api", b: "object", color: "#8b5cf6" });
    if (active.has("cdn") && active.has("object")) out.push({ a: "object", b: "cdn", color: "#06b6d4" });
    return out;
  }, [active]);

  return (
    <svg viewBox="0 0 760 420" className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <pattern id="cap-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.8" fill="#d9cfbd" />
        </pattern>
      </defs>
      <rect width="760" height="420" fill="#faf6ea" />
      <rect width="760" height="420" fill="url(#cap-dots)" />

      <AnimatePresence>
        {edges.map(({ a, b }) => {
          const na = NODES[a], nb = NODES[b];
          const x1 = na.x + NW / 2, y1 = na.y + NH / 2, x2 = nb.x + NW / 2, y2 = nb.y + NH / 2;
          return (
            <motion.line key={`e-${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {edges.flatMap(({ a, b, color }, ei) => {
          const na = NODES[a], nb = NODES[b];
          const count = a === "api" && b === "cache" && readHeavy ? 3 : 2;
          return Array.from({ length: count }).map((_, di) => (
            <TrafficDot key={`td-${a}-${b}-${di}`}
              x1={na.x + NW / 2} y1={na.y + NH / 2} x2={nb.x + NW / 2} y2={nb.y + NH / 2}
              color={color} delay={ei * 0.25 + di * 0.5} dur={dotDur} />
          ));
        })}
      </AnimatePresence>

      <AnimatePresence>
        {(Object.entries(NODES) as Array<[NodeId, NodeDef]>).map(([id, def]) => {
          if (!active.has(id)) return null;
          const cx = def.x + NW / 2, cy = def.y + NH / 2;
          const isApiOverload = id === "api" && overload;
          const color = isApiOverload ? "#dc2626" : def.color;
          return (
            <motion.g key={id}
              initial={{ opacity: 0, scale: 0.55 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.55 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              onMouseEnter={() => onTooltip(def.tooltip)} onMouseLeave={() => onTooltip(null)}
              className="cursor-help">
              <rect x={def.x} y={def.y} width={NW} height={NH} rx={7} fill={color} />
              <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={10.5} fontWeight={600}
                style={{ pointerEvents: "none", userSelect: "none", fontFamily: "inherit" }}>
                {isApiOverload ? "API (peak risk)" : def.label}
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

// ─── Step 01: Intro ─────────────────────────────────────────────────────────────
function IntroCard({ scenario, onSelect }: { scenario: ScenarioId; onSelect: (s: ScenarioId) => void }) {
  const flow = ["Users", "Activity/user", "Requests/day", "QPS", "Peak QPS", "Storage", "Bandwidth"];
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 01 · Concept Snapshot</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Capacity estimation = rough math before architecture</p>
        <p className="text-base text-slate-600 mt-0.5 leading-relaxed">Use assumptions to estimate how much traffic, storage, bandwidth, and infrastructure the system needs.</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {flow.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-base font-semibold text-slate-700">{step}</span>
            {i < flow.length - 1 && <span className="text-slate-300 text-base">→</span>}
          </span>
        ))}
      </div>

      <p className="text-base text-slate-600 leading-relaxed">
        Capacity estimation is not about perfect math. It is about checking whether your design can survive the expected scale.
      </p>

      <div>
        <p className="text-base font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Choose a scenario</p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((sc) => (
            <button key={sc.id} onClick={() => onSelect(sc.id)}
              className={cn("px-4 py-1.5 rounded-full text-base font-semibold border transition-all",
                sc.id === scenario ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900")}>
              {sc.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-base text-slate-600">{SCENARIOS.find(s => s.id === scenario)!.description}</p>
      </div>
    </div>
  );
}

// ─── Step 02: Assumption builder ───────────────────────────────────────────────
interface AssumptionProps {
  mau: number; dauPct: number; actions: number; readRatio: ReadRatio; payloadKB: PayloadKB; retention: Retention;
  setMau: (v: number) => void; setDauPct: (v: number) => void; setActions: (v: number) => void;
  setReadRatio: (v: ReadRatio) => void; setPayloadKB: (v: PayloadKB) => void; setRetention: (v: Retention) => void;
}
function AssumptionCard(p: AssumptionProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 02 · Assumption Builder</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Start with assumptions</p>
        <p className="text-base text-slate-600 mt-0.5">Change product assumptions and watch estimates update live.</p>
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">Monthly active users</p>
        <Pill options={[{ key: 1e6, label: "1M" }, { key: 10e6, label: "10M" }, { key: 100e6, label: "100M" }, { key: 1e9, label: "1B" }]} value={p.mau} onChange={p.setMau} />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-base font-semibold text-slate-600 uppercase tracking-wider">
          <span>Daily active %</span><span className="text-slate-800 tabular-nums">{p.dauPct}%</span>
        </div>
        <input type="range" min={10} max={80} step={5} value={p.dauPct} onChange={e => p.setDauPct(+e.target.value)}
          className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-base font-semibold text-slate-600 uppercase tracking-wider">
          <span>Actions / user / day</span><span className="text-slate-800 tabular-nums">{p.actions}</span>
        </div>
        <input type="range" min={1} max={100} step={1} value={p.actions} onChange={e => p.setActions(+e.target.value)}
          className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">Read : Write ratio</p>
        <SegmentedControl options={[{ key: 1, label: "1:1" }, { key: 10, label: "10:1" }, { key: 100, label: "100:1" }]} value={p.readRatio} onChange={p.setReadRatio} />
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">Average payload</p>
        <Pill options={[{ key: 1, label: "1KB" }, { key: 10, label: "10KB" }, { key: 100, label: "100KB" }, { key: 1000, label: "1MB" }]} value={p.payloadKB} onChange={p.setPayloadKB} />
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">Data retention</p>
        <Pill options={[{ key: 30, label: "30 days" }, { key: 365, label: "1 year" }, { key: 1825, label: "5 years" }, { key: 3650, label: "10 years" }]} value={p.retention} onChange={p.setRetention} />
      </div>
    </div>
  );
}

// ─── Step 05: QPS simulation ───────────────────────────────────────────────────
function QpsSimPanel({ avgQps, peakMult, setPeakMult, pattern, setPattern }: {
  avgQps: number; peakMult: PeakMult; setPeakMult: (v: PeakMult) => void; pattern: Pattern; setPattern: (v: Pattern) => void;
}) {
  const curve = useMemo(() => {
    const pts: number[] = [];
    for (let h = 0; h < 24; h++) {
      let factor = 1;
      if (pattern === "flat") factor = 1;
      else if (pattern === "workday") factor = h >= 9 && h <= 17 ? 1 + (peakMult - 1) * 0.9 : 0.4;
      else if (pattern === "evening") factor = h >= 18 && h <= 23 ? 1 + (peakMult - 1) * 0.95 : 0.5;
      else if (pattern === "flash") factor = h === 12 ? peakMult : 0.45;
      pts.push(avgQps * factor);
    }
    return pts;
  }, [avgQps, peakMult, pattern]);

  const maxQps = Math.max(...curve, avgQps * peakMult);
  const W = 480, H = 150, pad = 4;
  const path = curve.map((q, i) => {
    const x = pad + (i / 23) * (W - pad * 2);
    const y = H - pad - (q / maxQps) * (H - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const avgY = H - pad - (avgQps / maxQps) * (H - pad * 2);
  const peakY = H - pad - ((avgQps * peakMult) / maxQps) * (H - pad * 2);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 05 · QPS Simulation</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Estimate average and peak QPS</p>
        <p className="text-base text-slate-600 mt-0.5">Traffic is never flat. Peak multiplier is what your servers must survive.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">Peak multiplier</p>
          <Pill options={[{ key: 2, label: "2x" }, { key: 3, label: "3x" }, { key: 5, label: "5x" }, { key: 10, label: "10x" }]} value={peakMult} onChange={setPeakMult} />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">Traffic pattern</p>
          <Pill options={[{ key: "flat", label: "Flat" }, { key: "workday", label: "Workday" }, { key: "evening", label: "Evening" }, { key: "flash", label: "Flash" }]} value={pattern} onChange={setPattern} />
        </div>
      </div>

      <div className="rounded-xl bg-[#f9f9f6] border border-slate-200 p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
          <line x1={pad} y1={avgY} x2={W - pad} y2={avgY} stroke="#10b981" strokeWidth="1" strokeDasharray="4 3" />
          <line x1={pad} y1={peakY} x2={W - pad} y2={peakY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" />
          <motion.path key={path} d={path} fill="none" stroke="#0ea5e9" strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} />
          <text x={pad + 2} y={avgY - 3} fontSize="8" fill="#059669" fontWeight="600">avg {fmtNum(avgQps)}</text>
          <text x={pad + 2} y={peakY + 9} fontSize="8" fill="#dc2626" fontWeight="600">peak {fmtNum(avgQps * peakMult)}</text>
        </svg>
        <div className="flex justify-between text-base text-slate-500 font-mono px-1"><span>00:00</span><span>12:00</span><span>24:00</span></div>
      </div>

      <InsightPanel type="warning" text={`Peak QPS is ${peakMult}x average. Designing only for average QPS (${fmtNum(avgQps)}) would underestimate real load — your servers must handle ${fmtNum(avgQps * peakMult)} at peak.`} />
    </div>
  );
}

// ─── Step 06: Storage estimation ───────────────────────────────────────────────
function StoragePanel({ writesPerDay, retention }: { writesPerDay: number; retention: Retention }) {
  const [recordKB, setRecordKB] = useState(2);
  const [mediaPct, setMediaPct] = useState(10);
  const [mediaMB, setMediaMB] = useState(1);
  const [replication, setReplication] = useState<1 | 2 | 3>(3);

  const metaBytesDay  = writesPerDay * recordKB * 1024;
  const mediaBytesDay = writesPerDay * (mediaPct / 100) * mediaMB * 1024 * 1024;
  const rawDay = metaBytesDay + mediaBytesDay;
  const totalRaw = rawDay * retention;
  const totalReplicated = totalRaw * replication;
  const mediaShare = rawDay > 0 ? (mediaBytesDay / rawDay) * 100 : 0;
  const metaW = rawDay > 0 ? (metaBytesDay / rawDay) * 100 : 50;
  const mediaW = 100 - metaW;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 06 · Storage Estimation</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Estimate storage growth</p>
        <p className="text-base text-slate-600 mt-0.5">Media and replication usually dominate raw record size.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* Left column: controls + raw mix */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-base font-semibold text-slate-600 uppercase tracking-wider"><span>Record size</span><span className="text-slate-800 tabular-nums">{recordKB} KB</span></div>
              <input type="range" min={0.5} max={20} step={0.5} value={recordKB} onChange={e => setRecordKB(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-base font-semibold text-slate-600 uppercase tracking-wider"><span>Media %</span><span className="text-slate-800 tabular-nums">{mediaPct}%</span></div>
              <input type="range" min={0} max={100} step={5} value={mediaPct} onChange={e => setMediaPct(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-base font-semibold text-slate-600 uppercase tracking-wider"><span>Media size</span><span className="text-slate-800 tabular-nums">{mediaMB} MB</span></div>
              <input type="range" min={0.1} max={50} step={0.1} value={mediaMB} onChange={e => setMediaMB(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">Replication</p>
              <SegmentedControl options={[{ key: 1, label: "1x" }, { key: 2, label: "2x" }, { key: 3, label: "3x" }]} value={replication} onChange={v => setReplication(v as 1 | 2 | 3)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex h-6 rounded-lg overflow-hidden border border-slate-200">
              <motion.div animate={{ width: `${metaW}%` }} className="bg-indigo-400 flex items-center justify-center">
                {metaW > 12 && <span className="text-base font-bold text-white">Metadata</span>}
              </motion.div>
              <motion.div animate={{ width: `${mediaW}%` }} className="bg-purple-400 flex items-center justify-center">
                {mediaW > 12 && <span className="text-base font-bold text-white">Media</span>}
              </motion.div>
            </div>
            <p className="text-base text-slate-500">Daily raw mix · replication adds {replication}x on top for durability</p>
          </div>
        </div>

        {/* Right column: results */}
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard label="Per day"   value={fmtBytes(rawDay)}          good={rawDay < 1e9}        warn={rawDay < 1e12} />
          <MetricCard label="Per year"  value={fmtBytes(rawDay * 365)}    good={rawDay * 365 < 1e12} warn={rawDay * 365 < 1e15} />
          <MetricCard label="Retained"  value={fmtBytes(totalRaw)}        good={totalRaw < 1e12}     warn={totalRaw < 1e15} />
          <MetricCard label={`With ${replication}x`} value={fmtBytes(totalReplicated)} good={totalReplicated < 1e12} warn={totalReplicated < 1e15} />
        </div>
      </div>

      {mediaShare > 70 && <InsightPanel type="warning" text={`Media is ${mediaShare.toFixed(0)}% of storage even though only ${mediaPct}% of records include it. Large files dominate — store them in object storage, not the database.`} />}
      {replication > 1 && <InsightPanel type="neutral" text={`Replication factor ${replication}x means real storage is ${replication}x the raw data. Durability and availability cost storage.`} />}
    </div>
  );
}

// ─── Step 07: Bandwidth estimation ─────────────────────────────────────────────
function BandwidthPanel({ avgQps }: { avgQps: number }) {
  const [responseKB, setResponseKB] = useState(50);
  const [cacheHit, setCacheHit] = useState(70);
  const [cdnEnabled, setCdnEnabled] = useState(true);

  const totalBps = avgQps * responseKB * 1024;
  const afterCache = totalBps * (1 - cacheHit / 100);
  const originBps = cdnEnabled ? afterCache * 0.2 : afterCache;
  const cdnBps = cdnEnabled ? afterCache * 0.8 : 0;
  const maxBps = Math.max(totalBps, 1);
  const pipe = (v: number) => Math.max(4, (v / maxBps) * 100);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 07 · Bandwidth Estimation</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Estimate bandwidth pressure</p>
        <p className="text-base text-slate-600 mt-0.5">Bandwidth grows fast with payload size, even at moderate QPS.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-base font-semibold text-slate-600 uppercase tracking-wider"><span>Response size</span><span className="text-slate-800 tabular-nums">{responseKB} KB</span></div>
          <input type="range" min={1} max={2000} step={1} value={responseKB} onChange={e => setResponseKB(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-base font-semibold text-slate-600 uppercase tracking-wider"><span>Cache hit rate</span><span className="text-slate-800 tabular-nums">{cacheHit}%</span></div>
          <input type="range" min={0} max={95} step={5} value={cacheHit} onChange={e => setCacheHit(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <p className="text-base font-semibold text-slate-600 uppercase tracking-wider">CDN</p>
          <SegmentedControl options={[{ key: "on", label: "Enabled" }, { key: "off", label: "Disabled" }]} value={cdnEnabled ? "on" : "off"} onChange={v => setCdnEnabled(v === "on")} />
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          { label: "Total user traffic", v: totalBps, color: "bg-slate-400" },
          { label: "Origin bandwidth",   v: originBps, color: "bg-indigo-400" },
          { label: "CDN bandwidth",       v: cdnBps, color: "bg-sky-400" },
        ].map(({ label, v, color }) => (
          <div key={label} className="space-y-0.5">
            <div className="flex justify-between text-base font-semibold text-slate-700"><span>{label}</span><span className="tabular-nums">{fmtBytes(v)}/s</span></div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${pipe(v)}%` }} transition={{ duration: 0.4 }} className={cn("h-full rounded-full", color)} />
            </div>
          </div>
        ))}
      </div>

      <InsightPanel type={cdnEnabled ? "success" : "warning"} text={cdnEnabled
        ? `CDN serves ${fmtBytes(cdnBps)}/s, leaving origin at just ${fmtBytes(originBps)}/s. Cache hit rate + CDN dramatically cut origin egress.`
        : `Without a CDN, origin must serve ${fmtBytes(originBps)}/s directly. Large payloads make this expensive fast.`} />
    </div>
  );
}

// ─── Step 08: Recommendations ──────────────────────────────────────────────────
function getRecommendations(e: Estimates, readRatio: ReadRatio, payloadKB: PayloadKB): { title: string; what: string; why: string; tradeoff: string }[] {
  const recs: { title: string; what: string; why: string; tradeoff: string }[] = [];
  if (readRatio >= 10 || e.readQps > e.writeQps * 5)
    recs.push({ title: "Add Cache", what: "Read QPS is much higher than write QPS.", why: "Repeated reads can be served from memory instead of hitting the database.", tradeoff: "Cache adds invalidation and consistency complexity." });
  if (payloadKB >= 100)
    recs.push({ title: "Add CDN", what: "Payloads are large (static/media).", why: "Edge delivery cuts latency and offloads origin bandwidth.", tradeoff: "CDN adds cost, TTL tuning, and cache-freshness concerns." });
  if (e.peakQps > 10000)
    recs.push({ title: "Add Load Balancer", what: `Peak QPS (${fmtNum(e.peakQps)}) exceeds single-server comfort.`, why: "Traffic spreads across multiple API servers for headroom and failover.", tradeoff: "Adds a component that must itself be highly available." });
  if (payloadKB >= 100)
    recs.push({ title: "Use Object Storage", what: "Large media files are in scope.", why: "Object storage holds blobs cheaply, keeping the database lean.", tradeoff: "Two stores to coordinate: metadata in DB, bytes in object storage." });
  if (e.totalStorage > 1e12)
    recs.push({ title: "Consider Sharding", what: `Total storage (${fmtBytes(e.totalStorage)}) is very large.`, why: "Partitioning spreads data and writes across nodes for horizontal scale.", tradeoff: "Cross-shard queries and rebalancing add significant complexity." });
  return recs;
}

function RecommendationsCard({ recs }: { recs: ReturnType<typeof getRecommendations> }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div>
        <Eyebrow>Step 08 · Architecture Recommendation</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Turn estimates into architecture choices</p>
      </div>
      {recs.length === 0 ? (
        <InsightPanel type="success" text="Current estimates are modest — a single database and API tier can likely handle this. Add components only as scale demands." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence>
            {recs.map((r) => (
              <motion.div key={r.title} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <p className="text-base font-bold text-slate-900">{r.title}</p>
                <p className="text-base text-slate-700 leading-relaxed"><span className="font-semibold text-slate-700">What changed:</span> {r.what}</p>
                <p className="text-base text-slate-700 leading-relaxed"><span className="font-semibold text-slate-700">Why it matters:</span> {r.why}</p>
                <p className="text-base text-amber-700 leading-relaxed"><span className="font-semibold">Tradeoff:</span> {r.tradeoff}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Step 10: Challenges ────────────────────────────────────────────────────────
const CHALLENGES = [
  { id: "c1", label: "Calculate DAU",           scenario: "100M MAU, 30% daily active", options: ["3M DAU", "30M DAU", "300M DAU"], correct: 1 },
  { id: "c2", label: "Estimate write QPS",       scenario: "30M DAU, 2 writes/day each",  options: ["≈ 69 writes/sec", "≈ 694 writes/sec", "≈ 6,940 writes/sec"], correct: 1 },
  { id: "c3", label: "Find peak QPS",            scenario: "Avg 1,000 QPS, peak 3x",      options: ["1,300 QPS", "3,000 QPS", "10,000 QPS"], correct: 1 },
  { id: "c4", label: "Spot storage pressure",    scenario: "10% of posts have 1MB media", options: ["Metadata dominates", "Media dominates", "Both equal"], correct: 1 },
  { id: "c5", label: "Choose architecture help", scenario: "Read QPS is 100x write QPS",  options: ["Add sharding", "Add a cache", "Add object storage"], correct: 1 },
];

function ChallengeCards() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answer = (id: string, idx: number) => setAnswers(prev => ({ ...prev, [id]: idx }));
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div>
        <Eyebrow>Step 10 · Validate Your Instinct</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Quick estimation checks</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGES.map((ch) => {
          const picked = answers[ch.id];
          const solved = picked === ch.correct;
          return (
            <motion.div key={ch.id} animate={{ borderColor: solved ? "#86efac" : "#e2e8f0" }}
              className={cn("p-4 rounded-xl border-2 transition-colors space-y-2", solved ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200")}>
              <div className="flex items-center gap-2">
                {solved ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                <p className={cn("text-base font-bold", solved ? "text-emerald-700" : "text-slate-700")}>{ch.label}</p>
              </div>
              <p className="text-base text-slate-600 leading-relaxed">{ch.scenario}</p>
              <div className="flex flex-col gap-1">
                {ch.options.map((opt, i) => (
                  <button key={i} onClick={() => answer(ch.id, i)}
                    className={cn("text-left px-2 py-1 rounded-lg border text-base font-medium transition-all",
                      picked === i && i === ch.correct ? "border-emerald-400 bg-emerald-100 text-emerald-800" :
                      picked === i ? "border-red-300 bg-red-50 text-red-700" :
                      "border-slate-200 bg-white text-slate-700 hover:border-slate-300")}>
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 11: Solution Panel ────────────────────────────────────────────────────
const WALKTHROUGH = [
  { title: "Define product assumptions", body: "Write down MAU, daily-active %, actions per user, payload size, read/write ratio, and retention. State them explicitly." },
  { title: "Estimate DAU from MAU",      body: "DAU = MAU × daily-active %. For 100M MAU at 30%, DAU = 30M." },
  { title: "Estimate writes per day",    body: "Writes/day = DAU × actions per user. This is your daily write volume." },
  { title: "Convert to QPS",             body: "Write QPS = writes per day ÷ 86,400 (seconds in a day). Round to a clean number." },
  { title: "Estimate read QPS",          body: "Read QPS = write QPS × read/write ratio. Read-heavy systems multiply quickly." },
  { title: "Estimate peak QPS",          body: "Peak QPS = average QPS × peak multiplier (commonly 2x–10x). Design for peak, not average." },
  { title: "Estimate daily storage",     body: "Daily storage = writes per day × payload size. Separate metadata from media." },
  { title: "Multiply by retention",      body: "Total storage = daily storage × retention days. Long retention compounds fast." },
  { title: "Add replication overhead",   body: "Real storage = total × replication factor (often 3x) for durability and availability." },
  { title: "Guide architecture",         body: "Use results to decide on cache, CDN, load balancer, object storage, replication, or sharding." },
];

type SolutionTab = "walkthrough" | "compare" | "interview";
function SolutionPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<SolutionTab>("walkthrough");
  const [step, setStep] = useState(0);
  const current = WALKTHROUGH[step];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
      className="rounded-[1.5rem] border-2 border-slate-900 bg-white p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">Solution Walkthrough</p>
          <p className="text-base text-slate-600 mt-0.5">The repeatable estimation method.</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"><X className="w-4 h-4 text-slate-600" /></button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
        {(["walkthrough", "compare", "interview"] as SolutionTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 rounded-lg text-base font-semibold transition-all capitalize",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-700")}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "walkthrough" && (
          <motion.div key="wt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              {WALKTHROUGH.map((_, i) => (
                <button key={i} onClick={() => setStep(i)} className={cn("h-2 rounded-full transition-all", i === step ? "bg-slate-900 w-6" : i < step ? "bg-slate-400 w-2" : "bg-slate-200 w-2")} />
              ))}
              <span className="ml-auto text-base font-bold text-slate-500">{step + 1}/{WALKTHROUGH.length}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
                <p className="text-base font-bold text-slate-900">{step + 1}. {current.title}</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">{current.body}</div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(i => Math.max(0, i - 1))} disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /> Previous</button>
              {step === WALKTHROUGH.length - 1 ? (
                <div className="flex items-center gap-2 text-base font-bold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Complete</div>
              ) : (
                <button onClick={() => setStep(i => i + 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800">Next <ChevronRight className="w-4 h-4" /></button>
              )}
            </div>
          </motion.div>
        )}

        {tab === "compare" && (
          <motion.div key="cmp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-base font-bold uppercase tracking-wider text-red-500">Weak estimation</p>
              {["Jumps into architecture", "No written assumptions", "No labeled units", "Ignores peak traffic", "Ignores storage growth"].map(t => (
                <div key={t} className="flex items-center gap-2 text-base text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{t}</div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold uppercase tracking-wider text-emerald-600">Strong estimation</p>
              {["Writes assumptions first", "Rounds to clean numbers", "Labels every unit", "Estimates QPS + storage", "Discusses bottlenecks & tradeoffs"].map(t => (
                <div key={t} className="flex items-center gap-2 text-base text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{t}</div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "interview" && (
          <motion.div key="int" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">
            Capacity estimation is a rough calculation process used to understand expected scale before choosing architecture.
            I start by writing assumptions such as monthly users, daily active percentage, actions per user, payload size, read/write ratio, and retention.
            Then I estimate DAU, QPS, peak QPS, storage, bandwidth, and possible bottlenecks.
            The goal is not exact math, but to check whether the design needs components like caching, CDN, load balancing, object storage, replication, or sharding.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function CapacityEstimationVisual() {
  const [scenario, setScenario] = useState<ScenarioId>("social");
  const [mau, setMau] = useState(100e6);
  const [dauPct, setDauPct] = useState(50);
  const [actions, setActions] = useState(10);
  const [readRatio, setReadRatio] = useState<ReadRatio>(100);
  const [payloadKB, setPayloadKB] = useState<PayloadKB>(10);
  const [retention, setRetention] = useState<Retention>(1825);
  const [peakMult, setPeakMult] = useState<PeakMult>(3);
  const [pattern, setPattern] = useState<Pattern>("evening");
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const selectScenario = (id: ScenarioId) => {
    const sc = SCENARIOS.find(s => s.id === id)!;
    setScenario(id);
    setMau(sc.mau); setDauPct(sc.dauPct); setActions(sc.actions);
    setReadRatio(sc.readRatio); setPayloadKB(sc.payloadKB); setRetention(sc.retention);
  };

  const e = useMemo(() => estimate(mau, dauPct, actions, readRatio, payloadKB, retention, peakMult), [mau, dauPct, actions, readRatio, payloadKB, retention, peakMult]);
  const active = useMemo(() => getActiveNodes(payloadKB, readRatio), [payloadKB, readRatio]);
  const recs = useMemo(() => getRecommendations(e, readRatio, payloadKB), [e, readRatio, payloadKB]);

  const insights = useMemo(() => {
    const out: { text: string; type: "success" | "warning" | "risk" | "neutral" }[] = [];
    if (e.peakQps > 50000) out.push({ type: "risk", text: `Peak QPS is ${fmtNum(e.peakQps)} — well beyond a single server. Load balancing and horizontal scaling are required.` });
    if (readRatio >= 100) out.push({ type: "neutral", text: "Read-heavy traffic (100:1) — caching can serve most reads without touching the database." });
    if (payloadKB >= 100) out.push({ type: "warning", text: "Large payloads suggest CDN delivery and object storage rather than storing blobs in the database." });
    if (e.totalStorage > 1e15) out.push({ type: "risk", text: `Total storage reaches ${fmtBytes(e.totalStorage)} — sharding and tiered storage become necessary.` });
    else if (retention >= 1825 && e.dailyStorage > 1e9) out.push({ type: "warning", text: "QPS may be manageable, but storage grows quickly because retention is long. Plan archival or tiering." });
    out.push({ type: "neutral", text: "Always label units (QPS, GB, MB/s) so estimates stay unambiguous in interviews." });
    return out;
  }, [e, readRatio, payloadKB, retention]);

  return (
    <div className="space-y-5">
      {/* Step 01 */}
      <IntroCard scenario={scenario} onSelect={selectScenario} />

      {/* Steps 02 + 03 + 04 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-5">
        <AssumptionCard
          mau={mau} dauPct={dauPct} actions={actions} readRatio={readRatio} payloadKB={payloadKB} retention={retention}
          setMau={setMau} setDauPct={setDauPct} setActions={setActions} setReadRatio={setReadRatio} setPayloadKB={setPayloadKB} setRetention={setRetention} />

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <Eyebrow>Step 03 · Live System View</Eyebrow>
                <p className="text-base text-slate-600">Assumptions become system pressure. Hover any node.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-base font-bold text-slate-500 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="relative px-3 pb-3">
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "760/420" }}>
                <CapacityCanvas active={active} e={e} readRatio={readRatio} onTooltip={setTooltip} />
                <AnimatePresence>
                  {tooltip && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900 text-white text-base rounded-xl shadow-lg leading-relaxed pointer-events-none z-10">
                      <Info className="inline w-3 h-3 mr-1.5 opacity-60" />{tooltip}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <Eyebrow>Step 04 · System Metrics</Eyebrow>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
              <MetricCard label="Daily Active Users" value={fmtNum(e.dau)}            good={e.dau < 10e6}      warn={e.dau < 100e6} />
              <MetricCard label="Average QPS"         value={fmtNum(e.avgQps)}         good={e.avgQps < 5000}   warn={e.avgQps < 50000} />
              <MetricCard label="Peak QPS"            value={fmtNum(e.peakQps)}        good={e.peakQps < 10000} warn={e.peakQps < 100000} />
              <MetricCard label="Total Storage"       value={fmtBytes(e.totalStorage)} good={e.totalStorage < 1e12} warn={e.totalStorage < 1e15} />
            </div>
          </div>
        </div>
      </div>

      {/* Step 05 */}
      <QpsSimPanel avgQps={e.avgQps} peakMult={peakMult} setPeakMult={setPeakMult} pattern={pattern} setPattern={setPattern} />

      {/* Step 06 */}
      <StoragePanel writesPerDay={e.writesPerDay} retention={retention} />

      {/* Step 07 */}
      <BandwidthPanel avgQps={e.avgQps} />

      {/* Step 08 */}
      <RecommendationsCard recs={recs} />

      {/* Step 09 */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <Eyebrow>Step 09 · Insights & Warnings</Eyebrow>
        <div className="space-y-2">
          <AnimatePresence>
            {insights.map((ins, i) => <InsightPanel key={`${i}-${ins.text.slice(0, 16)}`} text={ins.text} type={ins.type} />)}
          </AnimatePresence>
        </div>
      </div>

      {/* Step 10 */}
      <ChallengeCards />

      {/* Step 11 */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
        <div>
          <Eyebrow>Step 11 · Solution Panel</Eyebrow>
          <p className="text-base text-slate-700">Method walkthrough, weak-vs-strong, and interview answer.</p>
        </div>
        <button onClick={() => setShowSolution(s => !s)}
          className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-base font-semibold border transition-all",
            showSolution ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:border-slate-700")}>
          {showSolution ? "Hide" : "Open Solution"}
        </button>
      </div>

      <AnimatePresence>
        {showSolution && <SolutionPanel onClose={() => setShowSolution(false)} />}
      </AnimatePresence>
    </div>
  );
}
