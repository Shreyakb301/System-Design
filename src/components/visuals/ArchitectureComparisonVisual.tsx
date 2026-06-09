"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, Info,
  ChevronLeft, ChevronRight, X, Boxes, Box,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ScenarioId = "startup" | "small" | "growth" | "large" | "global" | "highdeploy";
type Mode       = "monolith" | "microservices" | "compare";
type DeployFreq = "weekly" | "daily" | "hourly" | "continuous";
type Growth     = "low" | "medium" | "high";
type KillTarget = "none" | "app" | "auth" | "orders" | "db";
type NodeId     = "users" | "gateway" | "monolith" | "auth" | "orders" | "payments" | "inventory" | "notification" | "db";
type MicroNodeId = "users" | "gateway" | "auth" | "orders" | "payments" | "inventory" | "notification" | "db";

interface NodeDef { label: string; x: number; y: number; w: number; h: number; color: string; tooltip: string; }
interface Scenario { id: ScenarioId; label: string; description: string; favored: Mode; traffic: number; teamSize: number; deploy: DeployFreq; services: number; growth: Growth; }

// ─── Scenarios ─────────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  { id: "startup",    label: "Startup",            description: "Tiny team, MVP speed matters most. Keep it simple.",          favored: "monolith",      traffic: 500,    teamSize: 3,   deploy: "weekly",     services: 1,  growth: "low" },
  { id: "small",      label: "Small Team",          description: "A handful of engineers. One codebase is easier to reason about.", favored: "monolith",  traffic: 5000,   teamSize: 8,   deploy: "daily",      services: 1,  growth: "medium" },
  { id: "growth",     label: "Rapid Growth",        description: "Traffic and team growing fast. Splitting hot paths starts to help.", favored: "microservices", traffic: 80000, teamSize: 40, deploy: "daily",   services: 5,  growth: "high" },
  { id: "large",      label: "Large Organization",  description: "Many teams need independent ownership and deployment.",       favored: "microservices", traffic: 300000, teamSize: 200, deploy: "hourly",     services: 12, growth: "high" },
  { id: "global",     label: "Global Product",      description: "Massive scale, regional traffic, isolated failure domains.",  favored: "microservices", traffic: 800000, teamSize: 350, deploy: "continuous", services: 18, growth: "high" },
  { id: "highdeploy", label: "High Deploy Freq",    description: "Continuous delivery across teams demands small blast radius.", favored: "microservices", traffic: 200000, teamSize: 120, deploy: "continuous", services: 14, growth: "high" },
];

// ─── Canvas node definitions ────────────────────────────────────────────────────
const MONO_NODES: Record<string, NodeDef> = {
  users:    { label: "Users",    x: 40,  y: 185, w: 100, h: 44, color: "#475569", tooltip: "Clients sending requests to the application." },
  monolith: { label: "Application", x: 300, y: 110, w: 200, h: 200, color: "#1e293b", tooltip: "One deployable unit containing multiple responsibilities." },
  db:       { label: "Database", x: 620, y: 185, w: 100, h: 44, color: "#6d28d9", tooltip: "Shared database for the whole application." },
};

const MICRO_NODES: Record<MicroNodeId, NodeDef> = {
  users:        { label: "Users",        x: 30,  y: 192, w: 96,  h: 40, color: "#475569", tooltip: "Clients sending requests." },
  gateway:      { label: "API Gateway",  x: 200, y: 192, w: 108, h: 40, color: "#0e7490", tooltip: "Routes traffic between clients and services." },
  auth:         { label: "Auth",         x: 400, y: 40,  w: 104, h: 38, color: "#4338ca", tooltip: "One independently deployable service: authentication." },
  orders:       { label: "Orders",       x: 400, y: 110, w: 104, h: 38, color: "#4338ca", tooltip: "One independently deployable service: orders." },
  payments:     { label: "Payments",     x: 400, y: 180, w: 104, h: 38, color: "#4338ca", tooltip: "One independently deployable service: payments." },
  inventory:    { label: "Inventory",    x: 400, y: 250, w: 104, h: 38, color: "#4338ca", tooltip: "One independently deployable service: inventory." },
  notification: { label: "Notification", x: 400, y: 320, w: 104, h: 38, color: "#4338ca", tooltip: "One independently deployable service: notifications." },
  db:           { label: "Databases",    x: 600, y: 180, w: 104, h: 40, color: "#6d28d9", tooltip: "Each service owns its own data store." },
};
const MICRO_SERVICE_IDS: MicroNodeId[] = ["auth", "orders", "payments", "inventory", "notification"];

// ─── Metrics math ──────────────────────────────────────────────────────────────
interface Metrics { deployComplexity: number; scalability: number; opsOverhead: number; teamIndependence: number; }
function clamp(v: number) { return Math.max(2, Math.min(98, Math.round(v))); }
function monolithMetrics(traffic: number, teamSize: number, growth: Growth): Metrics {
  const growthW = growth === "high" ? 30 : growth === "medium" ? 15 : 5;
  return {
    deployComplexity: clamp(20 + teamSize * 0.15 + growthW),
    scalability:      clamp(85 - Math.log10(Math.max(traffic, 100)) * 14),
    opsOverhead:      clamp(15 + teamSize * 0.05),
    teamIndependence: clamp(70 - teamSize * 0.25),
  };
}
function microMetrics(traffic: number, teamSize: number, services: number, growth: Growth): Metrics {
  const growthW = growth === "high" ? 6 : 0;
  return {
    deployComplexity: clamp(35 + services * 2.5),
    scalability:      clamp(60 + Math.log10(Math.max(traffic, 100)) * 6 + services * 1.5),
    opsOverhead:      clamp(30 + services * 3.2 + growthW),
    teamIndependence: clamp(45 + services * 3 + teamSize * 0.05),
  };
}

function fmtTraffic(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

// ─── Shared components ─────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: string }) {
  return <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-1">{children}</p>;
}

function MetricCard({ label, value, higherIsBetter, suffix = "%" }: { label: string; value: number; higherIsBetter: boolean; suffix?: string }) {
  const score = higherIsBetter ? value : 100 - value;
  const good = score >= 66, warn = score >= 40;
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <motion.p key={value} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
        className={cn("text-lg font-bold tabular-nums leading-none", good ? "text-emerald-600" : warn ? "text-amber-600" : "text-red-500")}>
        {value}{suffix}
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
          className={cn("flex-1 py-1.5 px-2 rounded-lg text-sm font-semibold transition-all",
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
          className={cn("px-3 py-1 rounded-full text-sm font-semibold border transition-all",
            value === o.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── SVG canvas ─────────────────────────────────────────────────────────────────
function TrafficDot({ x1, y1, x2, y2, color, delay }: { x1: number; y1: number; x2: number; y2: number; color: string; delay: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <motion.circle r={3.5} fill={color} fillOpacity={0.85}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, mx, x2], cy: [y1, my, y2], opacity: [0, 0.9, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: delay, ease: "linear" }} />
  );
}

function NodeRect({ def, fill, label, onTooltip, dim }: { def: NodeDef; fill: string; label?: string; onTooltip: (t: string | null) => void; dim?: boolean }) {
  const cx = def.x + def.w / 2, cy = def.y + def.h / 2;
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.55 }} animate={{ opacity: dim ? 0.4 : 1, scale: 1 }} exit={{ opacity: 0, scale: 0.55 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
      onMouseEnter={() => onTooltip(def.tooltip)} onMouseLeave={() => onTooltip(null)} className="cursor-help">
      <rect x={def.x} y={def.y} width={def.w} height={def.h} rx={8} fill={fill} />
      <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={10.5} fontWeight={600}
        style={{ pointerEvents: "none", userSelect: "none" }}>{label ?? def.label}</text>
    </motion.g>
  );
}

function MonolithCanvas({ growth, killed, scaledUp, onTooltip }: { growth: Growth; killed: boolean; scaledUp: boolean; onTooltip: (t: string | null) => void }) {
  const grow = growth === "high" ? 30 : growth === "medium" ? 14 : 0;
  const scaleBump = scaledUp ? 20 : 0;
  const mono = { ...MONO_NODES.monolith, x: 300 - (grow + scaleBump) / 2, y: 110 - (grow + scaleBump) / 2, w: 200 + grow + scaleBump, h: 200 + grow + scaleBump };
  const fill = killed ? "#dc2626" : MONO_NODES.monolith.color;
  const modules = ["Auth", "Payments", "Orders", "Users", "Inventory"];
  return (
    <svg viewBox="0 0 760 420" className="w-full h-full" style={{ display: "block" }}>
      <defs><pattern id="mono-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="0.8" cy="0.8" r="0.8" fill="#d9cfbd" /></pattern></defs>
      <rect width="760" height="420" fill="#faf6ea" /><rect width="760" height="420" fill="url(#mono-dots)" />
      <line x1={MONO_NODES.users.x + MONO_NODES.users.w} y1={207} x2={mono.x} y2={207} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" />
      <line x1={mono.x + mono.w} y1={207} x2={MONO_NODES.db.x} y2={207} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" />
      {!killed && <>
        <TrafficDot x1={MONO_NODES.users.x + MONO_NODES.users.w} y1={207} x2={mono.x} y2={207} color="#64748b" delay={0.2} />
        <TrafficDot x1={mono.x + mono.w} y1={207} x2={MONO_NODES.db.x} y2={207} color="#8b5cf6" delay={0.6} />
      </>}
      <NodeRect def={MONO_NODES.users} fill={MONO_NODES.users.color} onTooltip={onTooltip} />
      <NodeRect def={MONO_NODES.db} fill={MONO_NODES.db.color} onTooltip={onTooltip} />
      <motion.g onMouseEnter={() => onTooltip(MONO_NODES.monolith.tooltip)} onMouseLeave={() => onTooltip(null)} className="cursor-help">
        <motion.rect animate={{ x: mono.x, y: mono.y, width: mono.w, height: mono.h, fill }} transition={{ duration: 0.4, ease: "easeInOut" }} rx={12} />
        <text x={mono.x + mono.w / 2} y={mono.y + 16} textAnchor="middle" fill="white" fontSize={10} fontWeight={700} style={{ pointerEvents: "none" }}>ONE APPLICATION</text>
        {modules.map((m, i) => (
          <g key={m} style={{ pointerEvents: "none" }}>
            <rect x={mono.x + 16} y={mono.y + 30 + i * ((mono.h - 44) / 5)} width={mono.w - 32} height={(mono.h - 44) / 5 - 6} rx={5} fill="rgba(255,255,255,0.14)" />
            <text x={mono.x + mono.w / 2} y={mono.y + 30 + i * ((mono.h - 44) / 5) + ((mono.h - 44) / 5 - 6) / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={9} fontWeight={500}>{m}</text>
          </g>
        ))}
      </motion.g>
      {killed && <text x={mono.x + mono.w / 2} y={mono.y + mono.h + 16} textAnchor="middle" fill="#dc2626" fontSize={10} fontWeight={700}>entire app down</text>}
    </svg>
  );
}

function MicroCanvas({ serviceCount, killed, scaledService, onTooltip }: { serviceCount: number; killed: KillTarget; scaledService: MicroNodeId | null; onTooltip: (t: string | null) => void }) {
  const visibleServices = MICRO_SERVICE_IDS.slice(0, Math.min(5, Math.max(1, Math.ceil(serviceCount / 6))));
  return (
    <svg viewBox="0 0 760 420" className="w-full h-full" style={{ display: "block" }}>
      <defs><pattern id="micro-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="0.8" cy="0.8" r="0.8" fill="#d9cfbd" /></pattern></defs>
      <rect width="760" height="420" fill="#faf6ea" /><rect width="760" height="420" fill="url(#micro-dots)" />
      <line x1={MICRO_NODES.users.x + MICRO_NODES.users.w} y1={212} x2={MICRO_NODES.gateway.x} y2={212} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" />
      <TrafficDot x1={MICRO_NODES.users.x + MICRO_NODES.users.w} y1={212} x2={MICRO_NODES.gateway.x} y2={212} color="#64748b" delay={0.2} />
      <AnimatePresence>
        {visibleServices.map((sid, i) => {
          const node = MICRO_NODES[sid];
          const gx = MICRO_NODES.gateway.x + MICRO_NODES.gateway.w, gy = 212;
          const sx = node.x, sy = node.y + node.h / 2;
          const dead = killed === sid;
          return (
            <g key={sid}>
              <motion.line x1={gx} y1={gy} x2={sx} y2={sy} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />
              <motion.line x1={node.x + node.w} y1={sy} x2={MICRO_NODES.db.x} y2={200} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4"
                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />
              {!dead && killed !== "db" && <TrafficDot x1={gx} y1={gy} x2={sx} y2={sy} color="#6366f1" delay={i * 0.25} />}
            </g>
          );
        })}
      </AnimatePresence>
      <NodeRect def={MICRO_NODES.users} fill={MICRO_NODES.users.color} onTooltip={onTooltip} />
      <NodeRect def={MICRO_NODES.gateway} fill={MICRO_NODES.gateway.color} onTooltip={onTooltip} />
      <NodeRect def={MICRO_NODES.db} fill={killed === "db" ? "#dc2626" : MICRO_NODES.db.color} onTooltip={onTooltip} dim={killed === "db"} />
      <AnimatePresence>
        {visibleServices.map((sid) => {
          const node = MICRO_NODES[sid];
          const dead = killed === sid;
          const scaled = scaledService === sid;
          return (
            <g key={sid}>
              <NodeRect def={node} fill={dead ? "#dc2626" : node.color} onTooltip={onTooltip} dim={dead} />
              {scaled && (
                <motion.rect initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  x={node.x + 10} y={node.y + 5} width={node.w} height={node.h} rx={8} fill={node.color} fillOpacity={0.25} style={{ pointerEvents: "none" }} />
              )}
            </g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

// ─── Step 01: Intro ─────────────────────────────────────────────────────────────
function IntroCard({ scenario, onSelect }: { scenario: ScenarioId; onSelect: (s: ScenarioId) => void }) {
  const sc = SCENARIOS.find(s => s.id === scenario)!;
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 01 · Concept Snapshot</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">One application vs many cooperating services</p>
        <p className="text-base text-slate-600 mt-0.5 leading-relaxed">See how architecture changes scaling, deployments, failures, and team ownership.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-slate-700" /><span className="text-xs font-bold uppercase tracking-widest text-slate-600">Monolith</span></div>
          <div className="rounded-lg border-2 border-slate-700 bg-white p-1.5 space-y-1">
            {["Auth", "Payments", "Orders", "Users", "Inventory"].map(m => (
              <div key={m} className="rounded bg-slate-100 text-base font-semibold text-slate-700 text-center py-0.5">{m}</div>
            ))}
          </div>
          <p className="text-base text-slate-500">Everything ships together.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center gap-1.5"><Boxes className="w-3.5 h-3.5 text-indigo-600" /><span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Microservices</span></div>
          <div className="grid grid-cols-2 gap-1">
            {["Auth", "Orders", "Payments", "Inventory"].map(m => (
              <div key={m} className="rounded border border-indigo-300 bg-white text-base font-semibold text-indigo-700 text-center py-1">{m}</div>
            ))}
          </div>
          <p className="text-base text-slate-500">Independent services communicate.</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Choose a context</p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => onSelect(s.id)}
              className={cn("px-4 py-1.5 rounded-full text-base font-semibold border transition-all",
                s.id === scenario ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900")}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-base text-slate-600">{sc.description} <span className="font-semibold text-slate-700">Favored: {sc.favored === "monolith" ? "Monolith" : "Microservices"}.</span></p>
      </div>
    </div>
  );
}

// ─── Step 05: Deployment panel ─────────────────────────────────────────────────
function DeploymentPanel({ mode, services }: { mode: Exclude<Mode, "compare">; services: number }) {
  const [progress, setProgress] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [targetService, setTargetService] = useState<MicroNodeId | null>(null);

  const runDeploy = () => {
    setDeploying(true); setProgress(0);
    if (mode === "microservices") setTargetService(MICRO_SERVICE_IDS[Math.floor(Math.random() * Math.min(5, services))]);
    const dur = mode === "monolith" ? 1800 : 700;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / dur) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick); else setDeploying(false);
    };
    requestAnimationFrame(tick);
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 05 · Deployment Simulation</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">What happens when shipping a feature?</p>
        <p className="text-base text-slate-600 mt-0.5">Showing: {mode === "monolith" ? "Monolith" : "Microservices"} (switch mode above).</p>
      </div>
      {mode === "monolith" ? (
        <div className="rounded-xl border-2 border-slate-700 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between"><span className="text-lg font-bold text-slate-700">Entire application redeploys</span><span className="text-base text-slate-500 tabular-nums">{Math.round(progress)}%</span></div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden"><motion.div animate={{ width: `${progress}%` }} className="h-full bg-slate-700 rounded-full" /></div>
          <div className="grid grid-cols-5 gap-1">
            {["Auth", "Payments", "Orders", "Users", "Inventory"].map(m => (
              <div key={m} className={cn("text-sm font-semibold text-center py-1 rounded transition-colors", deploying ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>{m}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {MICRO_SERVICE_IDS.slice(0, Math.min(5, services)).map(sid => {
            const active = targetService === sid && deploying;
            const done = targetService === sid && !deploying && progress === 100;
            return (
              <div key={sid} className={cn("rounded-xl border-2 p-2 text-center transition-colors", active ? "border-amber-400 bg-amber-50" : done ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
                <p className="text-base font-bold text-slate-700 capitalize">{sid}</p>
                {active && <div className="h-1 mt-1 bg-amber-200 rounded-full overflow-hidden"><motion.div animate={{ width: `${progress}%` }} className="h-full bg-amber-500" /></div>}
                {done && <CheckCircle2 className="w-3 h-3 text-emerald-500 mx-auto mt-1" />}
              </div>
            );
          })}
        </div>
      )}
      <button onClick={runDeploy} disabled={deploying} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 disabled:opacity-40">
        {deploying ? "Deploying..." : "Deploy new feature"}
      </button>
      <InsightPanel type={mode === "monolith" ? "warning" : "success"} text={mode === "monolith"
        ? "What changed: one deployment affects the entire application. Why it matters: simple at first, but larger deployments become riskier and slower."
        : "What changed: only one service redeployed. Why it matters: smaller deployments reduce blast radius and let teams ship independently."} />
    </div>
  );
}

// ─── Step 06: Failure panel ────────────────────────────────────────────────────
function FailurePanel({ mode, killed, setKilled }: { mode: Exclude<Mode, "compare">; killed: KillTarget; setKilled: (v: KillTarget) => void }) {
  const targets: { key: KillTarget; label: string }[] = mode === "monolith"
    ? [{ key: "none", label: "Healthy" }, { key: "app", label: "Kill app" }, { key: "db", label: "Kill DB" }]
    : [{ key: "none", label: "Healthy" }, { key: "auth", label: "Kill Auth" }, { key: "orders", label: "Kill Orders" }, { key: "db", label: "Kill DB" }];

  const availability = (() => {
    if (killed === "none") return 99;
    if (mode === "monolith") return killed === "app" ? 0 : 10;
    if (killed === "auth") return 60;
    if (killed === "orders") return 75;
    if (killed === "db") return 20;
    return 99;
  })();

  const effect = (() => {
    if (killed === "none") return { type: "success" as const, text: "All systems healthy. Traffic flows normally." };
    if (mode === "monolith") return { type: "risk" as const, text: "Monolith failure takes down the entire application — every feature stops at once. One fault, total outage." };
    if (killed === "auth") return { type: "warning" as const, text: "Auth is down, but browsing and inventory still respond. Failure is isolated to login-dependent paths." };
    if (killed === "orders") return { type: "warning" as const, text: "Orders failed, yet payments and browsing keep working. Microservices contain the blast radius." };
    if (killed === "db") return { type: "risk" as const, text: "A shared database failure still hurts every service that depends on it — isolation has limits." };
    return { type: "neutral" as const, text: "" };
  })();

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 06 · Failure Simulation</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">What breaks when something fails?</p>
        <p className="text-base text-slate-600 mt-0.5">Showing: {mode === "monolith" ? "Monolith" : "Microservices"} (switch mode above).</p>
      </div>
      <Pill options={targets} value={killed} onChange={setKilled} />
      <div className="relative rounded-xl overflow-hidden border border-slate-100" style={{ aspectRatio: "760/300" }}>
        {mode === "monolith"
          ? <MonolithCanvas growth="low" killed={killed === "app" || killed === "db"} scaledUp={false} onTooltip={() => {}} />
          : <MicroCanvas serviceCount={18} killed={killed} scaledService={null} onTooltip={() => {}} />}
      </div>
      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider mb-0.5"><span>Availability</span><span className={cn("tabular-nums", availability > 80 ? "text-emerald-600" : availability > 40 ? "text-amber-600" : "text-red-500")}>{availability}%</span></div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><motion.div animate={{ width: `${availability}%` }} className={cn("h-full rounded-full", availability > 80 ? "bg-emerald-500" : availability > 40 ? "bg-amber-500" : "bg-red-500")} /></div>
      </div>
      <InsightPanel type={effect.type} text={effect.text} />
      <InsightPanel type="neutral" text="Microservices improve isolation but create distributed failure scenarios — shared dependencies like a database can still cause wide outages." />
    </div>
  );
}

// ─── Step 07: Scaling panel ─────────────────────────────────────────────────────
function ScalingPanel({ mode }: { mode: Exclude<Mode, "compare"> }) {
  const [monoScaled, setMonoScaled] = useState(false);
  const [scaledService, setScaledService] = useState<MicroNodeId>("auth");
  const [cost, setCost] = useState(100);
  const targets: { key: MicroNodeId; label: string }[] = [{ key: "auth", label: "Login traffic" }, { key: "orders", label: "Order traffic" }, { key: "payments", label: "Payment traffic" }];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 07 · Scaling Simulation</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">What needs more capacity?</p>
        <p className="text-base text-slate-600 mt-0.5">Showing: {mode === "monolith" ? "Monolith" : "Microservices"} (switch mode above).</p>
      </div>
      {mode === "monolith" ? (
        <>
          <button onClick={() => { setMonoScaled(true); setCost(c => Math.min(900, c + 200)); }} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-lg font-semibold hover:bg-slate-800">Scale for more login traffic</button>
          <div className="relative rounded-xl overflow-hidden border border-slate-100" style={{ aspectRatio: "760/300" }}>
            <MonolithCanvas growth="low" killed={false} scaledUp={monoScaled} onTooltip={() => {}} />
          </div>
          <InsightPanel type="warning" text="What changed: the entire application scaled. Why it matters: unrelated functionality (payments, inventory) consumes extra resources just to handle more logins." />
        </>
      ) : (
        <>
          <Pill options={targets} value={scaledService} onChange={(v) => { setScaledService(v); setCost(c => Math.min(500, c + 60)); }} />
          <div className="relative rounded-xl overflow-hidden border border-slate-100" style={{ aspectRatio: "760/300" }}>
            <MicroCanvas serviceCount={18} killed="none" scaledService={scaledService} onTooltip={() => {}} />
          </div>
          <InsightPanel type="success" text="What changed: only the busy service scaled (duplicated). Why it matters: other services stay untouched, so scaling is far more resource-efficient." />
        </>
      )}
      <div className="flex items-center gap-2 text-base text-slate-700">
        <span className="font-semibold">Relative cost:</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><motion.div animate={{ width: `${Math.min(100, cost / 9)}%` }} className={cn("h-full rounded-full", cost > 500 ? "bg-red-500" : cost > 300 ? "bg-amber-500" : "bg-emerald-500")} /></div>
        <span className="tabular-nums font-bold">${cost}</span>
      </div>
    </div>
  );
}

// ─── Step 08: Communication panel ──────────────────────────────────────────────
function CommunicationPanel({ services, setServices }: { services: number; setServices: (v: number) => void }) {
  const connections = Math.round(services * 1.6);
  const networkCalls = services * 4;
  const failureSurface = Math.min(98, services * 4);
  const debugDifficulty = Math.min(98, 20 + services * 3);
  const cx = 130, cy = 90, r = 68;
  const count = Math.min(services, 12);
  const pts = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 08 · Communication Complexity</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">How much coordination is required?</p>
        <p className="text-base text-slate-600 mt-0.5">Increase service count and watch the network grow.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-4 items-center">
        <div className="rounded-xl bg-[#f9f9f6] border border-slate-200 p-2">
          <svg viewBox="0 0 260 180" className="w-full" style={{ height: 170 }}>
            {pts.map((p, i) => pts.slice(i + 1).map((q, j) => (
              <motion.line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#cbd5e1" strokeWidth="0.7"
                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ duration: 0.3 }} />
            )))}
            {pts.map((p, i) => (
              <motion.circle key={i} cx={p.x} cy={p.y} r={6} fill="#4338ca"
                initial={{ scale: 0.55, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.02 }} />
            ))}
          </svg>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider"><span>Service count</span><span className="text-slate-800 tabular-nums">{services}</span></div>
            <input type="range" min={1} max={30} step={1} value={services} onChange={e => setServices(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard label="Services" value={services} higherIsBetter={true} suffix="" />
            <MetricCard label="Calls/req" value={networkCalls} higherIsBetter={false} suffix="" />
            <MetricCard label="Failure surface" value={failureSurface} higherIsBetter={false} />
            <MetricCard label="Debug difficulty" value={debugDifficulty} higherIsBetter={false} />
          </div>
        </div>
      </div>
      <InsightPanel type={services > 12 ? "risk" : "neutral"} text={`What changed: ${services} services with ~${connections} communication paths. Why it matters: distributed systems multiply network calls, failure points, and debugging effort as services grow.`} />
    </div>
  );
}

// ─── Step 09: Challenges ────────────────────────────────────────────────────────
const CHALLENGES = [
  { id: "c1", label: "Two engineers building an MVP", options: ["Monolith", "Microservices"], correct: 0, explanation: "Keep complexity low. A monolith ships fastest with a tiny team." },
  { id: "c2", label: "Hundreds of engineers, many teams", options: ["Monolith", "Microservices"], correct: 1, explanation: "Independent ownership and deployment matter more than simplicity at this size." },
  { id: "c3", label: "Scale only the login service", options: ["Monolith", "Microservices"], correct: 1, explanation: "Microservices scale one service independently without touching the rest." },
  { id: "c4", label: "Need the simplest possible deployment", options: ["Monolith", "Microservices"], correct: 0, explanation: "One deployable unit is the simplest thing to ship and operate." },
  { id: "c5", label: "Isolate failures so one crash isn't total", options: ["Monolith", "Microservices"], correct: 1, explanation: "Microservices contain failures to individual services (given no shared dependency)." },
];

function ChallengeCards() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div><Eyebrow>Validate Your Instinct</Eyebrow><p className="text-2xl font-bold text-slate-900">Which architecture fits?</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHALLENGES.map(ch => {
          const picked = answers[ch.id];
          const solved = picked === ch.correct;
          return (
            <motion.div key={ch.id} animate={{ borderColor: solved ? "#86efac" : "#e2e8f0" }}
              className={cn("p-4 rounded-xl border-2 transition-colors space-y-2", solved ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200")}>
              <div className="flex items-center gap-2">
                {solved ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                <p className={cn("text-base font-bold leading-snug", solved ? "text-emerald-700" : "text-slate-700")}>{ch.label}</p>
              </div>
              <div className="flex gap-2">
                {ch.options.map((opt, i) => (
                  <button key={i} onClick={() => setAnswers(p => ({ ...p, [ch.id]: i }))}
                    className={cn("flex-1 px-3 py-2 rounded-lg border text-base font-semibold transition-all",
                      picked === i && i === ch.correct ? "border-emerald-400 bg-emerald-100 text-emerald-800" :
                      picked === i ? "border-red-300 bg-red-50 text-red-700" :
                      "border-slate-200 bg-white text-slate-700 hover:border-slate-300")}>{opt}</button>
                ))}
              </div>
              {picked !== undefined && <p className="text-base text-slate-600 leading-relaxed">{ch.explanation}</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 10: Solution panel ────────────────────────────────────────────────────
const WALKTHROUGH = [
  { title: "Start with a simple application", body: "A monolith is the right default. One codebase, one deploy, fast iteration with a small team." },
  { title: "Traffic and features increase", body: "More users and modules pile into the single application. It still works, but it grows heavy." },
  { title: "Observe deployment complexity", body: "Every change redeploys everything. Releases get riskier as more teams touch one codebase." },
  { title: "Observe scaling limitations", body: "You can only scale the whole app together, even when just one module is hot." },
  { title: "Split responsibilities", body: "Carve out the hot or independently-owned parts into separate services behind a gateway." },
  { title: "Add service communication", body: "Services now talk over the network. This adds latency, retries, and new failure modes." },
  { title: "Observe operational tradeoffs", body: "You gained independent scaling and deployment, but pay with observability, coordination, and distributed debugging." },
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
        <div><p className="text-2xl font-bold text-slate-900">Solution Panel</p><p className="text-base text-slate-600 mt-0.5">From monolith to microservices, and when to switch.</p></div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"><X className="w-4 h-4 text-slate-600" /></button>
      </div>
      <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
        {(["walkthrough", "compare", "interview"] as SolutionTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize", tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-700")}>{t}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tab === "walkthrough" && (
          <motion.div key="wt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              {WALKTHROUGH.map((_, i) => <button key={i} onClick={() => setStep(i)} className={cn("h-2 rounded-full transition-all", i === step ? "bg-slate-900 w-6" : i < step ? "bg-slate-400 w-2" : "bg-slate-200 w-2")} />)}
              <span className="ml-auto text-base font-bold text-slate-500">{step + 1}/{WALKTHROUGH.length}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
                <p className="text-2xl font-bold text-slate-900">{step + 1}. {current.title}</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">{current.body}</div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(i => Math.max(0, i - 1))} disabled={step === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /> Previous</button>
              {step === WALKTHROUGH.length - 1
                ? <div className="flex items-center gap-2 text-lg font-bold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Complete</div>
                : <button onClick={() => setStep(i => i + 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-lg font-semibold hover:bg-slate-800">Next <ChevronRight className="w-4 h-4" /></button>}
            </div>
          </motion.div>
        )}
        {tab === "compare" && (
          <motion.div key="cmp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Monolith</p>
              {([["Simpler architecture", true], ["Easier deployment initially", true], ["Easier debugging", true], ["Fewer moving parts", true], ["Difficult to scale", false], ["Large deployments", false], ["Lower team independence", false], ["Larger blast radius", false]] as [string, boolean][]).map(([t, good]) => (
                <div key={t} className="flex items-center gap-2 text-base text-slate-700"><div className={cn("w-1.5 h-1.5 rounded-full shrink-0", good ? "bg-emerald-500" : "bg-red-400")} />{t}</div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Microservices</p>
              {([["Independent scaling", true], ["Independent deployments", true], ["Team ownership", true], ["Better isolation", true], ["Operational complexity", false], ["Networking overhead", false], ["Distributed debugging", false], ["Service coordination", false]] as [string, boolean][]).map(([t, good]) => (
                <div key={t} className="flex items-center gap-2 text-base text-slate-700"><div className={cn("w-1.5 h-1.5 rounded-full shrink-0", good ? "bg-emerald-500" : "bg-red-400")} />{t}</div>
              ))}
            </div>
          </motion.div>
        )}
        {tab === "interview" && (
          <motion.div key="int" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed space-y-2">
            <p>A monolith packages multiple responsibilities into a single deployable application. It is simpler initially — fewer moving parts, easier debugging, and simpler deployments.</p>
            <p>Microservices split functionality into independently deployable services that communicate over a network. This improves scalability, team ownership, deployment independence, and fault isolation, but introduces operational complexity, distributed debugging, networking overhead, and service coordination.</p>
            <p>Many systems begin as monoliths and adopt microservices when scaling requirements, deployment frequency, or organizational complexity increase.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function ArchitectureComparisonVisual() {
  const [scenario, setScenario] = useState<ScenarioId>("startup");
  const [mode, setMode] = useState<Mode>("monolith");
  const [traffic, setTraffic] = useState(500);
  const [teamSize, setTeamSize] = useState(3);
  const [deploy, setDeploy] = useState<DeployFreq>("weekly");
  const [services, setServices] = useState(1);
  const [growth, setGrowth] = useState<Growth>("low");
  const [killed, setKilled] = useState<KillTarget>("none");
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const selectScenario = (id: ScenarioId) => {
    const sc = SCENARIOS.find(s => s.id === id)!;
    setScenario(id);
    setMode(sc.favored);
    setTraffic(sc.traffic); setTeamSize(sc.teamSize); setDeploy(sc.deploy); setServices(sc.services); setGrowth(sc.growth);
    setKilled("none");
  };

  const monoM  = useMemo(() => monolithMetrics(traffic, teamSize, growth), [traffic, teamSize, growth]);
  const microM = useMemo(() => microMetrics(traffic, teamSize, services, growth), [traffic, teamSize, services, growth]);
  const shownM = mode === "microservices" ? microM : monoM;
  const panelMode: Exclude<Mode, "compare"> = mode === "compare" ? "monolith" : mode;

  const insights = useMemo(() => {
    const out: { text: string; type: "success" | "warning" | "risk" | "neutral" }[] = [];
    if (mode === "monolith") {
      if (traffic > 100000) out.push({ type: "risk", text: `At ${fmtTraffic(traffic)}/sec the whole monolith must scale together — unrelated modules consume capacity they don't need.` });
      else out.push({ type: "success", text: "One deployable unit. Simple to build, debug, and ship while traffic and team are small." });
      if (teamSize > 60) out.push({ type: "warning", text: `${teamSize} engineers on one codebase creates merge contention and release coordination overhead.` });
    } else if (mode === "microservices") {
      if (services > 12) out.push({ type: "warning", text: `${services} services means heavy operational overhead — observability, tracing, and coordination become real work.` });
      else out.push({ type: "success", text: "Teams own and deploy their services independently. Failures can be isolated to one service." });
      out.push({ type: "neutral", text: `Deploying ${deploy} across ${services} services favors small blast radius — exactly what microservices provide.` });
    } else {
      out.push({ type: "neutral", text: "Compare side by side. Notice the crossover: monolith wins early; microservices win as scale and team size grow." });
    }
    return out;
  }, [mode, traffic, teamSize, services, deploy]);

  return (
    <div className="space-y-5">
      {/* Step 01 */}
      <IntroCard scenario={scenario} onSelect={selectScenario} />

      {/* Steps 02 + 03 + 04 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-5">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <Eyebrow>Step 02 · Simulate Growth</Eyebrow>
            <p className="text-2xl font-bold text-slate-900">Tune scale, team, and deployment</p>
            <p className="text-base text-slate-600 mt-0.5">Watch architecture respond as the system grows.</p>
          </div>
          <SegmentedControl options={[{ key: "monolith", label: "Monolith" }, { key: "microservices", label: "Microservices" }, { key: "compare", label: "Compare" }]} value={mode} onChange={setMode} />
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider"><span>Traffic</span><span className="text-slate-800 tabular-nums">{fmtTraffic(traffic)}/sec</span></div>
            <input type="range" min={100} max={1000000} step={100} value={traffic} onChange={e => setTraffic(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider"><span>Team size</span><span className="text-slate-800 tabular-nums">{teamSize} eng</span></div>
            <input type="range" min={2} max={500} step={1} value={teamSize} onChange={e => setTeamSize(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Deployment frequency</p>
            <SegmentedControl options={[{ key: "weekly", label: "Weekly" }, { key: "daily", label: "Daily" }, { key: "hourly", label: "Hourly" }, { key: "continuous", label: "Cont." }]} value={deploy} onChange={setDeploy} />
          </div>
          {mode !== "monolith" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider"><span>Service count</span><span className="text-slate-800 tabular-nums">{services}</span></div>
              <input type="range" min={1} max={30} step={1} value={services} onChange={e => setServices(+e.target.value)} className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Feature growth</p>
            <SegmentedControl options={[{ key: "low", label: "Low" }, { key: "medium", label: "Medium" }, { key: "high", label: "High" }]} value={growth} onChange={setGrowth} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <Eyebrow>Step 03 · Live System View</Eyebrow>
                <p className="text-base text-slate-600">{mode === "compare" ? "Both architectures shown." : "Hover any node."}</p>
              </div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live</span></div>
            </div>
            <div className="relative px-3 pb-3">
              {mode === "compare" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-100" style={{ aspectRatio: "760/420" }}>
                    <MonolithCanvas growth={growth} killed={false} scaledUp={false} onTooltip={setTooltip} />
                    <span className="absolute top-2 left-2 text-xs font-bold uppercase tracking-widest text-slate-500">Monolith</span>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-slate-100" style={{ aspectRatio: "760/420" }}>
                    <MicroCanvas serviceCount={services} killed="none" scaledService={null} onTooltip={setTooltip} />
                    <span className="absolute top-2 left-2 text-xs font-bold uppercase tracking-widest text-indigo-400">Microservices</span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "760/420" }}>
                  {mode === "monolith"
                    ? <MonolithCanvas growth={growth} killed={false} scaledUp={false} onTooltip={setTooltip} />
                    : <MicroCanvas serviceCount={services} killed="none" scaledService={null} onTooltip={setTooltip} />}
                  <AnimatePresence>
                    {tooltip && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900 text-white text-lg rounded-xl shadow-lg leading-relaxed pointer-events-none z-10">
                        <Info className="inline w-3 h-3 mr-1.5 opacity-60" />{tooltip}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <Eyebrow>Step 04 · System Metrics</Eyebrow>
            {mode === "compare" ? (
              <div className="grid grid-cols-2 gap-3 mt-1">
                {([["Monolith", monoM], ["Microservices", microM]] as [string, Metrics][]).map(([label, m]) => (
                  <div key={label} className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <MetricCard label="Deploy Cmplx" value={m.deployComplexity} higherIsBetter={false} />
                      <MetricCard label="Scalability" value={m.scalability} higherIsBetter={true} />
                      <MetricCard label="Ops Overhead" value={m.opsOverhead} higherIsBetter={false} />
                      <MetricCard label="Team Indep." value={m.teamIndependence} higherIsBetter={true} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                <MetricCard label="Deploy Complexity" value={shownM.deployComplexity} higherIsBetter={false} />
                <MetricCard label="Scalability" value={shownM.scalability} higherIsBetter={true} />
                <MetricCard label="Ops Overhead" value={shownM.opsOverhead} higherIsBetter={false} />
                <MetricCard label="Team Independence" value={shownM.teamIndependence} higherIsBetter={true} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 05 */}
      <DeploymentPanel mode={panelMode} services={services} />
      {/* Step 06 */}
      <FailurePanel mode={panelMode} killed={killed} setKilled={setKilled} />
      {/* Step 07 */}
      <ScalingPanel mode={panelMode === "monolith" ? "monolith" : "microservices"} />
      {/* Step 08 */}
      <CommunicationPanel services={services} setServices={setServices} />

      {/* Insights */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <Eyebrow>Insights & Warnings</Eyebrow>
        <div className="space-y-2">
          <AnimatePresence>
            {insights.map((ins, i) => <InsightPanel key={`${i}-${ins.text.slice(0, 14)}`} text={ins.text} type={ins.type} />)}
          </AnimatePresence>
        </div>
      </div>

      {/* Step 09 */}
      <ChallengeCards />

      {/* Step 10 */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
        <div>
          <Eyebrow>Step 10 · Solution Panel</Eyebrow>
          <p className="text-base text-slate-700">Walkthrough, comparison, and interview answer.</p>
        </div>
        <button onClick={() => setShowSolution(s => !s)}
          className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-base font-semibold border transition-all",
            showSolution ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:border-slate-700")}>
          {showSolution ? "Hide" : "Open Solution"}
        </button>
      </div>
      <AnimatePresence>{showSolution && <SolutionPanel onClose={() => setShowSolution(false)} />}</AnimatePresence>
    </div>
  );
}
