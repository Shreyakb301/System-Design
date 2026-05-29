"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  Lightbulb, Eye, EyeOff, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceId = "auth" | "search" | "cart" | "orders" | "payment" | "notifs";
type FailureId = "payment_fails" | "db_fails" | "notif_bug" | "auth_slow";
type SimTab = "arch" | "failure" | "scale";

interface ServiceDef {
  id: ServiceId;
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}

interface FailureEventDef {
  id: FailureId;
  label: string;
  emoji: string;
  monolithAffected: ServiceId[];
  msAffected: ServiceId[];
  msWarning: ServiceId[];
  monolithMessage: string;
  msMessage: string;
  monoAvail: number;
  msAvail: number;
  monoErrors: number;
  msErrors: number;
}

interface ScenarioDef {
  id: string;
  label: string;
  hotService: ServiceId | null;
  monoNote: string;
  msNote: string;
  monoInstances: number;
  hotInstances: number;
}

interface SolutionStep {
  title: string;
  why: string;
  highlight: ServiceId[];
  recommendation: string;
  icon: string;
}

interface Challenge {
  id: string;
  icon: string;
  label: string;
  description: string;
  answer: "monolith" | "microservices";
  answerLabel: string;
  explanation: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES: ServiceDef[] = [
  { id: "auth",    label: "Auth",    icon: "🔑", color: "#4338ca", bg: "#eef2ff", description: "Handles login and session tokens." },
  { id: "search",  label: "Search",  icon: "🔍", color: "#0e7490", bg: "#ecfeff", description: "Indexes and queries restaurant data." },
  { id: "cart",    label: "Cart",    icon: "🛒", color: "#d97706", bg: "#fffbeb", description: "Manages user cart and item selection." },
  { id: "orders",  label: "Orders",  icon: "📦", color: "#1e40af", bg: "#eff6ff", description: "Processes order placement and tracking." },
  { id: "payment", label: "Payment", icon: "💳", color: "#6d28d9", bg: "#f5f3ff", description: "Handles payment processing and refunds." },
  { id: "notifs",  label: "Notifs",  icon: "🔔", color: "#047857", bg: "#ecfdf5", description: "Sends push / email / SMS notifications." },
];

const FAILURE_EVENTS: FailureEventDef[] = [
  {
    id: "payment_fails", label: "Payment Crashes", emoji: "💳",
    monolithAffected: ["auth", "search", "cart", "orders", "payment", "notifs"],
    msAffected: ["payment"], msWarning: ["orders", "cart"],
    monolithMessage: "Shared process crash. Entire app is down — browsing, auth, and orders all unavailable.",
    msMessage: "Only Payment fails. Users can still browse, search, and add to cart.",
    monoAvail: 0, msAvail: 80, monoErrors: 100, msErrors: 20,
  },
  {
    id: "db_fails", label: "Database Fails", emoji: "🗄️",
    monolithAffected: ["auth", "search", "cart", "orders", "payment", "notifs"],
    msAffected: ["orders", "cart"], msWarning: ["payment", "notifs"],
    monolithMessage: "Single shared DB crash. Every feature that persists data is broken.",
    msMessage: "Only services sharing this DB are affected. Auth and Search keep working.",
    monoAvail: 0, msAvail: 60, monoErrors: 100, msErrors: 40,
  },
  {
    id: "notif_bug", label: "Notif Bug", emoji: "🔔",
    monolithAffected: ["orders", "payment", "notifs"],
    msAffected: ["notifs"], msWarning: [],
    monolithMessage: "Memory leak in notifications causes process instability. Orders start timing out.",
    msMessage: "Notifications crash in isolation. Orders complete normally — just no email confirmation.",
    monoAvail: 60, msAvail: 97, monoErrors: 40, msErrors: 3,
  },
  {
    id: "auth_slow", label: "Auth Slow", emoji: "🔑",
    monolithAffected: ["auth", "search", "cart", "orders"],
    msAffected: ["auth"], msWarning: ["search", "cart"],
    monolithMessage: "Slow auth blocks the shared thread pool. All features requiring login degrade.",
    msMessage: "Auth is slow but isolated. Existing sessions stay active. Only new logins are affected.",
    monoAvail: 40, msAvail: 85, monoErrors: 60, msErrors: 15,
  },
];

const SCALING_SCENARIOS: ScenarioDef[] = [
  {
    id: "search_spike", label: "Search 5×",
    hotService: "search",
    monoNote: "Full monolith duplicates — auth, payment, and orders all replicate even though only Search is hot.",
    msNote: "Only Search scales from 1 → 3 instances. All other services stay at 1.",
    monoInstances: 3, hotInstances: 3,
  },
  {
    id: "payment_spike", label: "Payment 10×",
    hotService: "payment",
    monoNote: "4× full-stack duplication. Every module gets replicated regardless of load.",
    msNote: "Payment auto-scales to 4 instances. Others are untouched.",
    monoInstances: 4, hotInstances: 4,
  },
  {
    id: "peak_load", label: "Peak Load",
    hotService: null,
    monoNote: "Scale 5 complete monolith copies — every feature scales together whether it needs it or not.",
    msNote: "Each service scales to its own demand. Total footprint is more efficient.",
    monoInstances: 5, hotInstances: 3,
  },
];

const SOLUTION_STEPS: SolutionStep[] = [
  { title: "Start with product scale", icon: "🌱", highlight: [],
    why: "Small teams and early products benefit from a single codebase. Microservices' operational overhead isn't worth it yet.",
    recommendation: "≤ 5 devs / startup → Start with Monolith" },
  { title: "Identify pain points", icon: "🔍", highlight: ["payment", "search"],
    why: "If one module causes slow deploys, reliability issues, or scaling needs — that module is your first microservice candidate.",
    recommendation: "One hot module → Extract it first" },
  { title: "Check team structure", icon: "👥", highlight: ["orders", "notifs"],
    why: "Conway's Law: systems mirror teams. Multiple independent teams naturally own and deploy separate services.",
    recommendation: "5+ independent teams → Microservices fit naturally" },
  { title: "Evaluate failure isolation", icon: "🛡️", highlight: ["payment"],
    why: "High-value features like payments benefit from isolation so a bug can't bring down the entire product.",
    recommendation: "Critical / risky features → Isolate them" },
  { title: "Consider operational cost", icon: "⚙️", highlight: [],
    why: "Microservices require service discovery, distributed tracing, per-service CI/CD, API versioning, and network reliability.",
    recommendation: "High ops maturity required before splitting" },
  { title: "The recommended path", icon: "🗺️", highlight: [],
    why: "Shopify, Twitter, Airbnb all started as monoliths and extracted services selectively as they scaled.",
    recommendation: "Monolith first → Extract microservices as needed" },
];

const CHALLENGES: Challenge[] = [
  { id: "c1", icon: "🚀", label: "MVP — 3 Developers",
    description: "Building a food delivery MVP with 3 developers. Which architecture is better right now?",
    answer: "monolith", answerLabel: "Monolith",
    explanation: "Simpler deployment, no network overhead, faster iteration. Operational simplicity wins at this scale." },
  { id: "c2", icon: "📈", label: "Payment Traffic 10×",
    description: "Payment gets 10× more traffic than any other feature. Scale it efficiently.",
    answer: "microservices", answerLabel: "Extract Payment Service",
    explanation: "Independent scaling means only Payment gets more instances — much cheaper than duplicating the whole monolith." },
  { id: "c3", icon: "🛡️", label: "Notif Bug Breaks Orders",
    description: "A notification bug is causing order placement failures. Fix the blast radius.",
    answer: "microservices", answerLabel: "Isolate Notifications",
    explanation: "A separate Notifications service crashes in isolation — orders keep completing normally." },
  { id: "c4", icon: "🚢", label: "Deploy Search Daily",
    description: "Your search team deploys updates daily. Reduce deployment risk for other features.",
    answer: "microservices", answerLabel: "Independent Search Service",
    explanation: "A standalone Search service deploys without restarting or affecting any other service." },
];

// ─── SVG Architecture Canvas ──────────────────────────────────────────────────

const MNW = 148, MNH = 34;
const SNW = 128, SNH = 30;

const MONO_POS: Record<ServiceId, { x: number; y: number }> = {
  auth:    { x: 15,  y: 35 },
  search:  { x: 183, y: 35 },
  cart:    { x: 15,  y: 82 },
  orders:  { x: 183, y: 82 },
  payment: { x: 15,  y: 129 },
  notifs:  { x: 183, y: 129 },
};

const MS_POS: Record<ServiceId, { x: number; y: number }> = {
  auth:    { x: 378, y: 25 },
  search:  { x: 552, y: 25 },
  cart:    { x: 378, y: 90 },
  orders:  { x: 552, y: 90 },
  payment: { x: 378, y: 155 },
  notifs:  { x: 552, y: 155 },
};

const MS_CONNECTIONS: Array<{ from: ServiceId; to: ServiceId }> = [
  { from: "auth",   to: "orders"  },
  { from: "cart",   to: "orders"  },
  { from: "orders", to: "payment" },
  { from: "orders", to: "notifs"  },
];

const SHAKE_T = { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] };

interface ArchCanvasProps {
  monoAffected: Set<ServiceId>;
  msAffected: Set<ServiceId>;
  msWarning: Set<ServiceId>;
  shakeKey?: number;
}

function ArchCanvas({ monoAffected, msAffected, msWarning, shakeKey = 0 }: ArchCanvasProps) {
  const monoErr = monoAffected.size > 0;

  return (
    <svg viewBox="0 0 720 210" className="w-full rounded-xl" style={{ background: "#f9f9f6" }}>
      <defs>
        <pattern id="archDotPat" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="9" r="0.8" fill="#e2e8f0" />
        </pattern>
      </defs>
      <rect width="720" height="210" fill="url(#archDotPat)" />

      <text x="178" y="13" fontSize={9} fontWeight="700" textAnchor="middle" fill="#94a3b8" letterSpacing="2" fontFamily="system-ui,sans-serif">MONOLITH</text>
      <text x="558" y="13" fontSize={9} fontWeight="700" textAnchor="middle" fill="#94a3b8" letterSpacing="2" fontFamily="system-ui,sans-serif">MICROSERVICES</text>
      <line x1="365" y1="0" x2="365" y2="210" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />

      {/* ── Monolith ── */}
      <motion.g
        key={`mono-${shakeKey}`}
        animate={monoErr ? { x: [-3, 3, -2, 2, -1, 0] } : { x: 0 }}
        transition={monoErr ? SHAKE_T : {}}
      >
        <rect x="5" y="20" width="352" height="183" rx="10"
          fill={monoErr ? "#fff5f5" : "white"}
          stroke={monoErr ? "#ef4444" : "#e2e8f0"}
          strokeWidth="1.5"
        />
        {SERVICES.map(s => {
          const p = MONO_POS[s.id];
          const err = monoAffected.has(s.id);
          return (
            <g key={s.id}>
              <rect x={p.x} y={p.y} width={MNW} height={MNH} rx={6}
                fill={err ? "#fef2f2" : s.bg} stroke={err ? "#ef4444" : s.color} strokeWidth="1.5" />
              <text x={p.x + 10} y={p.y + MNH / 2} fontSize={13} dominantBaseline="middle">{s.icon}</text>
              <text x={p.x + 28} y={p.y + MNH / 2} fontSize={9} fontWeight="600"
                fill={err ? "#dc2626" : "#475569"} dominantBaseline="middle" fontFamily="system-ui,sans-serif">{s.label}</text>
              {err && <circle cx={p.x + MNW - 8} cy={p.y + 8} r={5} fill="#ef4444" />}
            </g>
          );
        })}
        <rect x="101" y="172" width="155" height="24" rx={5}
          fill={monoErr ? "#fef2f2" : "#f8fafc"}
          stroke={monoErr ? "#ef4444" : "#94a3b8"}
          strokeWidth="1.5" strokeDasharray="4,3" />
        <text x="178" y="184" fontSize={9} fontWeight="600"
          fill={monoErr ? "#dc2626" : "#64748b"}
          textAnchor="middle" dominantBaseline="middle" fontFamily="system-ui,sans-serif">🗄️ Shared Database</text>
      </motion.g>

      {/* ── Microservices ── */}
      {MS_CONNECTIONS.map(c => {
        const f = MS_POS[c.from], t = MS_POS[c.to];
        return (
          <line key={`${c.from}-${c.to}`}
            x1={f.x + SNW / 2} y1={f.y + SNH / 2}
            x2={t.x + SNW / 2} y2={t.y + SNH / 2}
            stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
        );
      })}

      {SERVICES.map(s => {
        const p = MS_POS[s.id];
        const err = msAffected.has(s.id);
        const warn = msWarning.has(s.id);
        return (
          <motion.g
            key={`${s.id}-${shakeKey}-${err ? 1 : 0}`}
            animate={err ? { x: [-2, 2, -1, 1, 0] } : { x: 0 }}
            transition={err ? SHAKE_T : {}}
          >
            <rect x={p.x} y={p.y} width={SNW} height={SNH} rx={6}
              fill={err ? "#fef2f2" : warn ? "#fffbeb" : s.bg}
              stroke={err ? "#ef4444" : warn ? "#f59e0b" : s.color}
              strokeWidth={err || warn ? 2 : 1.5} />
            <text x={p.x + 9} y={p.y + SNH / 2} fontSize={12} dominantBaseline="middle">{s.icon}</text>
            <text x={p.x + 26} y={p.y + SNH / 2} fontSize={9} fontWeight="600"
              fill={err ? "#dc2626" : warn ? "#b45309" : "#475569"}
              dominantBaseline="middle" fontFamily="system-ui,sans-serif">{s.label}</text>
            {err && <circle cx={p.x + SNW - 8} cy={p.y + 8} r={5} fill="#ef4444" />}
            {warn && !err && <circle cx={p.x + SNW - 8} cy={p.y + 8} r={5} fill="#f59e0b" />}
            <rect x={p.x + SNW / 2 - 18} y={p.y + SNH + 6} width="36" height="12" rx={3}
              fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
          </motion.g>
        );
      })}
    </svg>
  );
}

// ─── Section 1: Concept Snapshot ─────────────────────────────────────────────

function ConceptSnapshot() {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Concept Snapshot</p>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          A monolith keeps all features in one app; microservices split them into independent services that communicate over a network.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Monolith */}
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">🏢 Monolith</p>
          <div className="rounded-lg border border-slate-200 bg-white p-2 space-y-1.5">
            {SERVICES.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600"
                style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
                <span>{s.icon}</span> {s.label}
              </div>
            ))}
            <div className="mt-1 px-2 py-1 rounded-md text-[10px] text-center text-slate-500 border border-dashed border-slate-300 bg-slate-50">
              🗄️ Shared DB
            </div>
          </div>
        </div>

        {/* Microservices */}
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">🔷 Microservices</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SERVICES.map(s => (
              <div key={s.id} className="rounded-lg border p-1.5 space-y-1" style={{ background: s.bg, borderColor: s.color + "44" }}>
                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <span>{s.icon}</span> {s.label}
                </div>
                <div className="text-[9px] text-slate-500 border border-dashed border-slate-300 bg-white rounded px-1 text-center">db</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Simulations ───────────────────────────────────────────────────

function ArchTab() {
  return (
    <div className="space-y-3">
      <ArchCanvas
        monoAffected={new Set()} msAffected={new Set()} msWarning={new Set()} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🏢 Monolith</p>
          <p className="text-xs text-slate-500 leading-relaxed">One process, one deploy, one database. Simple to build and reason about early on.</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {["Simple deploy", "Low overhead", "Shared memory"].map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] text-slate-500">{t}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🔷 Microservices</p>
          <p className="text-xs text-slate-500 leading-relaxed">Each service owns its data and deploys independently. More complexity, more flexibility.</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {["Independent scale", "Fault isolation", "Network overhead"].map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] text-slate-500">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, mono, ms }: { label: string; mono: number; ms: number }) {
  const betterMs = ms >= mono;
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-500">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>Monolith</span><span className="font-bold text-slate-600">{mono}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div className="h-full rounded-full bg-red-400" animate={{ width: `${mono}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>Microservices</span><span className={cn("font-bold", betterMs ? "text-emerald-600" : "text-red-600")}>{ms}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div className={cn("h-full rounded-full", betterMs ? "bg-emerald-400" : "bg-red-400")} animate={{ width: `${ms}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FailureTab() {
  const [activeId, setActiveId] = useState<FailureId | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const event = FAILURE_EVENTS.find(e => e.id === activeId) ?? null;

  const select = useCallback((id: FailureId) => {
    setActiveId(id);
    setShakeKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const t = setTimeout(() => setActiveId(null), 6000);
    return () => clearTimeout(t);
  }, [activeId, shakeKey]);

  const monoAffected = new Set<ServiceId>(event?.monolithAffected ?? []);
  const msAffected = new Set<ServiceId>(event?.msAffected ?? []);
  const msWarning = new Set<ServiceId>(event?.msWarning ?? []);

  return (
    <div className="space-y-3">
      {/* Failure buttons */}
      <div className="flex flex-wrap gap-2">
        {FAILURE_EVENTS.map(e => (
          <button key={e.id} onClick={() => select(e.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
              activeId === e.id
                ? "bg-red-600 text-white border-red-600 shadow"
                : "bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50"
            )}>
            <span>{e.emoji}</span> {e.label}
          </button>
        ))}
        {activeId && (
          <button onClick={() => setActiveId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <ArchCanvas monoAffected={monoAffected} msAffected={msAffected} msWarning={msWarning} shakeKey={shakeKey} />

      <AnimatePresence mode="wait">
        {event ? (
          <motion.div key={event.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">🏢 Monolith</p>
                <p className="text-xs text-red-700 leading-relaxed">{event.monolithMessage}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {event.monolithAffected.map(id => {
                    const s = SERVICES.find(x => x.id === id)!;
                    return <span key={id} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-red-700 bg-red-100">{s.icon} {s.label}</span>;
                  })}
                </div>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">🔷 Microservices</p>
                <p className="text-xs text-emerald-800 leading-relaxed">{event.msMessage}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {event.msAffected.map(id => {
                    const s = SERVICES.find(x => x.id === id)!;
                    return <span key={id} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-red-700 bg-red-100">{s.icon} {s.label}</span>;
                  })}
                  {event.msWarning.map(id => {
                    const s = SERVICES.find(x => x.id === id)!;
                    return <span key={id} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-amber-700 bg-amber-100">{s.icon} {s.label} ⚠</span>;
                  })}
                  {event.msAffected.length === 0 && event.msWarning.length === 0 && (
                    <span className="text-[10px] text-emerald-600">All services healthy ✓</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Impact Metrics</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <MetricBar label="Availability" mono={event.monoAvail} ms={event.msAvail} />
                <MetricBar label="Error Rate" mono={event.monoErrors} ms={event.msErrors} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500">Pick a failure event above to see how the blast radius differs between architectures.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScaleInstance({ label, hot, isNew }: { label: string; hot?: boolean; isNew?: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, scaleY: 0 } : false}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.3 }}
      style={{ transformOrigin: "top" }}
      className={cn("rounded-xl border-2 p-2 space-y-1", hot ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white")}
    >
      <p className={cn("text-[9px] font-bold uppercase tracking-widest", hot ? "text-violet-600" : "text-slate-400")}>{label}</p>
      <div className="grid grid-cols-3 gap-1">
        {SERVICES.map(s => (
          <div key={s.id} className="flex items-center justify-center gap-0.5 rounded px-1 py-0.5 text-[9px]"
            style={{ background: s.bg }}>
            {s.icon}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ScaleTab() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState<"mono" | "ms" | null>(null);

  const scenario = SCALING_SCENARIOS.find(s => s.id === activeId) ?? null;

  const deploy = useCallback((target: "mono" | "ms") => {
    setIsDeploying(target);
    setTimeout(() => setIsDeploying(null), 3000);
  }, []);

  const monoInstances = scenario?.monoInstances ?? 1;
  const msHotService = scenario?.hotService ?? null;
  const msHotInstances = scenario?.hotInstances ?? 1;

  return (
    <div className="space-y-3">
      {/* Scenario buttons */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Traffic Scenarios</p>
        <div className="flex flex-wrap gap-2">
          {SCALING_SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setActiveId(prev => prev === s.id ? null : s.id)}
              className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                activeId === s.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
              )}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scale visual */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monolith scaling */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">🏢 Monolith</p>
          <div className="space-y-2">
            <AnimatePresence>
              {Array.from({ length: monoInstances }, (_, i) => (
                <ScaleInstance key={i} label={`Instance ${i + 1}`} isNew={i > 0 && !!scenario} />
              ))}
            </AnimatePresence>
          </div>
          {scenario && (
            <p className="text-[10px] text-red-600 leading-relaxed pt-1">{scenario.monoNote}</p>
          )}
        </div>

        {/* Microservices scaling */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">🔷 Microservices</p>
          <div className="grid grid-cols-2 gap-2">
            {SERVICES.map(s => {
              const isHot = s.id === msHotService;
              const count = isHot ? msHotInstances : 1;
              return (
                <div key={s.id} className="space-y-1">
                  {Array.from({ length: count }, (_, i) => (
                    <motion.div key={i}
                      initial={i > 0 && !!scenario ? { opacity: 0, scaleY: 0 } : false}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: "top" }}
                      className={cn("rounded-lg border-2 p-1.5 flex items-center gap-1",
                        isHot && i > 0 ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"
                      )}>
                      <span className="text-sm">{s.icon}</span>
                      <span className="text-[9px] font-semibold text-slate-600">{s.label}</span>
                      {isHot && i === 0 && scenario && (
                        <span className="ml-auto text-[8px] font-bold text-violet-600 bg-violet-100 px-1 rounded">HOT</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
          {scenario && (
            <p className="text-[10px] text-emerald-700 leading-relaxed pt-1">{scenario.msNote}</p>
          )}
        </div>
      </div>

      {/* Deploy section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Deployment Impact</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => deploy("mono")}
            disabled={isDeploying !== null}
            className={cn("flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold border-2 transition-all",
              isDeploying === "mono"
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 disabled:opacity-40"
            )}>
            {isDeploying === "mono"
              ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block">↺</motion.span> Deploying all…</>
              : "Deploy (Monolith)"}
          </button>
          <button onClick={() => deploy("ms")}
            disabled={isDeploying !== null}
            className={cn("flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold border-2 transition-all",
              isDeploying === "ms"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 disabled:opacity-40"
            )}>
            {isDeploying === "ms"
              ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block">↺</motion.span> Updating one…</>
              : "Deploy (Microservices)"}
          </button>
        </div>
        <AnimatePresence>
          {isDeploying && (
            <motion.p key={isDeploying}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="text-[10px] leading-relaxed overflow-hidden">
              {isDeploying === "mono"
                ? "⚠️ Full monolith restart — all 6 features briefly unavailable during rollout."
                : "✅ Only the changed service restarts. All other services stay live and unaffected."}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SimulationPanel() {
  const [tab, setTab] = useState<SimTab>("arch");

  const tabs: { id: SimTab; label: string }[] = [
    { id: "arch",    label: "Architecture" },
    { id: "failure", label: "Failure Blast Radius" },
    { id: "scale",   label: "Scale & Deploy" },
  ];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Interactive Simulation</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}>
          {tab === "arch"    && <ArchTab />}
          {tab === "failure" && <FailureTab />}
          {tab === "scale"   && <ScaleTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Section 3: Solution Walkthrough ─────────────────────────────────────────

function SolutionWalkthrough() {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const step = SOLUTION_STEPS[stepIdx];
  const highlightSet = new Set<ServiceId>(step.highlight as ServiceId[]);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Solution Walkthrough</p>
          <p className="text-xs text-slate-500 mt-0.5">When should you choose monolith vs microservices?</p>
        </div>
        <button onClick={() => { setOpen(o => !o); setStepIdx(0); }}
          className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border-2 transition-all",
            open ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-900"
          )}>
          {open ? "Hide" : "Show Solution"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="space-y-4 pt-1">
              {/* Step navigator */}
              <div className="flex items-center gap-2">
                <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={stepIdx === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <div className="flex gap-1">
                  {SOLUTION_STEPS.map((_, i) => (
                    <button key={i} onClick={() => setStepIdx(i)}
                      className={cn("h-1.5 rounded-full transition-all", i === stepIdx ? "w-6 bg-slate-900" : "w-1.5 bg-slate-300")} />
                  ))}
                </div>
                <button onClick={() => setStepIdx(i => Math.min(SOLUTION_STEPS.length - 1, i + 1))} disabled={stepIdx === SOLUTION_STEPS.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <span className="text-[10px] text-slate-400 ml-1">Step {stepIdx + 1} of {SOLUTION_STEPS.length}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={stepIdx}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="grid gap-3 md:grid-cols-2">
                  {/* Step info */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{step.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{step.why}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white">
                      <span className="text-[10px] font-semibold leading-relaxed">{step.recommendation}</span>
                    </div>
                    {step.highlight.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-slate-400">Highlighted:</span>
                        {step.highlight.map(id => {
                          const s = SERVICES.find(x => x.id === id)!;
                          return (
                            <span key={id} className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700"
                              style={{ background: s.bg, border: `1px solid ${s.color}55` }}>
                              {s.icon} {s.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Mini canvas */}
                  <div className="overflow-hidden rounded-xl">
                    <ArchCanvas
                      monoAffected={new Set()} msAffected={new Set()} msWarning={new Set()} />
                    {step.highlight.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {step.highlight.map(id => {
                          const s = SERVICES.find(x => x.id === id)!;
                          return (
                            <span key={id} className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-2"
                              style={{ background: s.bg, color: s.color, outlineColor: s.color }}>
                              ↑ {s.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section 4: Mini Challenges ───────────────────────────────────────────────

function MiniChallenges() {
  const [answers, setAnswers] = useState<Record<string, "monolith" | "microservices">>({});
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());

  const toggleHint = useCallback((id: string) =>
    setShownHints(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

  const answer = useCallback((id: string, val: "monolith" | "microservices") =>
    setAnswers(prev => ({ ...prev, [id]: val })), []);

  const solved = Object.values(answers).length;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Mini Challenges</p>
          <p className="text-xs text-slate-500 mt-0.5">Apply what you&apos;ve learned.</p>
        </div>
        {solved > 0 && (
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {solved} / {CHALLENGES.length} solved
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHALLENGES.map(ch => {
          const chosen = answers[ch.id];
          const correct = chosen === ch.answer;
          const hintShown = shownHints.has(ch.id);

          return (
            <div key={ch.id} className={cn("p-4 rounded-xl border-2 space-y-2 transition-all",
              !chosen ? "border-slate-200 bg-slate-50"
              : correct ? "border-emerald-300 bg-emerald-50"
              : "border-red-200 bg-red-50")}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{ch.icon}</span>
                <p className={cn("text-xs font-bold", chosen ? (correct ? "text-emerald-700" : "text-red-700") : "text-slate-700")}>{ch.label}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{ch.description}</p>

              {!chosen && (
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => answer(ch.id, "monolith")}
                    className="py-1.5 rounded-lg text-[11px] font-semibold border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-900 hover:bg-slate-50 transition-all">
                    Monolith
                  </button>
                  <button onClick={() => answer(ch.id, "microservices")}
                    className="py-1.5 rounded-lg text-[11px] font-semibold border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-900 hover:bg-slate-50 transition-all">
                    Microservices
                  </button>
                </div>
              )}

              {chosen && (
                <div className={cn("flex items-center gap-1.5 text-[11px] font-bold",
                  correct ? "text-emerald-700" : "text-red-600")}>
                  {correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {correct ? `Correct — ${ch.answerLabel}` : `Not quite. Best answer: ${ch.answerLabel}`}
                </div>
              )}

              <AnimatePresence>
                {hintShown && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-sky-50 border border-sky-200">
                      <Lightbulb className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-sky-800 leading-relaxed">{ch.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => toggleHint(ch.id)}
                className={cn("flex items-center gap-1 text-[10px] font-semibold transition-colors",
                  hintShown ? "text-sky-600" : "text-slate-400 hover:text-slate-600")}>
                {hintShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {hintShown ? "Hide explanation" : "See explanation"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ArchitectureComparisonVisual() {
  return (
    <div className="space-y-4">
      <ConceptSnapshot />
      <SimulationPanel />
      <SolutionWalkthrough />
      <MiniChallenges />
    </div>
  );
}
