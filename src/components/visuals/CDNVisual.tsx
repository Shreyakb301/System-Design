"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, Info,
  ChevronLeft, ChevronRight, X, RotateCcw,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type CDNMode     = "off" | "on" | "ttl" | "failure";
type Location    = "us" | "europe" | "india" | "australia";
type AssetType   = "logo.png" | "app.js" | "hero.jpg" | "video.mp4";
type CacheState  = "hit" | "miss" | "expired";
type TTLValue    = "10s" | "1m" | "1h" | "1d";
type ScenarioId  = "image-heavy" | "video" | "saas" | "ecommerce" | "homepage";
type NodeId      = "user" | "cdn_edge" | "origin" | "storage";

interface NodeDef { label: string; x: number; y: number; color: string; tooltip?: string; }
interface Scenario { id: ScenarioId; label: string; description: string; defaultMode: CDNMode; defaultLocation: Location; defaultCacheState: CacheState; defaultTtl: TTLValue; freshWarning?: string; }
interface TrafficPath { from: NodeId; to: NodeId; color: string; delay: number; }
interface MetricValues { latencyMs: number; originPct: number; hitRate: number; freshnessRisk: number; }

// ─── Constants ─────────────────────────────────────────────────────────────────
const NW = 112, NH = 36;

const SCENARIOS: Scenario[] = [
  { id: "image-heavy", label: "Image-heavy site",          description: "Static images dominate. High CDN benefit, low freshness risk.", defaultMode: "on", defaultLocation: "india",     defaultCacheState: "hit",  defaultTtl: "1d" },
  { id: "video",       label: "Video platform",            description: "Large files, high bandwidth savings, higher CDN cost.",       defaultMode: "on", defaultLocation: "australia", defaultCacheState: "hit",  defaultTtl: "1d" },
  { id: "saas",        label: "SaaS dashboard",            description: "Static JS/CSS bundles. Moderate CDN benefit.",               defaultMode: "on", defaultLocation: "europe",    defaultCacheState: "hit",  defaultTtl: "1h" },
  { id: "ecommerce",   label: "Global e-commerce",         description: "Strong latency improvement for global shoppers.",             defaultMode: "on", defaultLocation: "india",     defaultCacheState: "miss", defaultTtl: "1h" },
  { id: "homepage",    label: "Frequently changing page",  description: "Short TTL required. Freshness risk is the key concern.",     defaultMode: "ttl",defaultLocation: "europe",    defaultCacheState: "expired", defaultTtl: "10s", freshWarning: "Frequently updated HTML is hard to cache well. Short TTL helps freshness but increases origin load." },
];

const NODES: Record<NodeId, NodeDef> = {
  user:     { label: "User",           x: 30,  y: 192, color: "#475569",  tooltip: "The end user requesting a static asset from your system." },
  cdn_edge: { label: "CDN Edge",       x: 270, y: 110, color: "#0e7490",  tooltip: "Nearby cache location. Fast when it already has the asset. On miss, fetches from origin." },
  origin:   { label: "Origin Server",  x: 490, y: 192, color: "#4338ca",  tooltip: "Source server. Handles misses, refreshes, and fallback traffic. Expensive to overload." },
  storage:  { label: "Static Storage", x: 630, y: 310, color: "#6d28d9",  tooltip: "Where original static assets live before CDN copies them — S3, GCS, etc." },
};

const BASE_LATENCY: Record<Location, number> = { us: 18, europe: 90, india: 200, australia: 230 };
const EDGE_LATENCY: Record<Location, number> = { us: 5,  europe: 10, india: 14,  australia: 16  };

// ─── Helpers ───────────────────────────────────────────────────────────────────
function computeMetrics(mode: CDNMode, loc: Location, cache: CacheState, ttl: TTLValue): MetricValues {
  const originBase = BASE_LATENCY[loc];
  const edgeBase   = EDGE_LATENCY[loc];
  const ttlRisk: Record<TTLValue, number> = { "10s": 5, "1m": 12, "1h": 55, "1d": 92 };

  if (mode === "off") return { latencyMs: originBase, originPct: 100, hitRate: 0, freshnessRisk: 0 };
  if (mode === "failure") return { latencyMs: originBase, originPct: 100, hitRate: 0, freshnessRisk: 0 };

  if (cache === "hit")     return { latencyMs: edgeBase,       originPct: 4,  hitRate: 96, freshnessRisk: ttlRisk[ttl] };
  if (cache === "miss")    return { latencyMs: originBase + 25, originPct: 100, hitRate: 0,  freshnessRisk: ttlRisk[ttl] };
  /* expired */            return { latencyMs: originBase,       originPct: 35,  hitRate: 65, freshnessRisk: ttlRisk[ttl] };
}

function getTrafficPaths(mode: CDNMode, cache: CacheState, fallback: boolean): TrafficPath[] {
  if (mode === "off")                     return [{ from: "user", to: "origin", color: "#f59e0b", delay: 0 }, { from: "origin", to: "user", color: "#f59e0b", delay: 0.7 }];
  if (mode === "failure" && fallback)     return [{ from: "user", to: "cdn_edge", color: "#ef4444", delay: 0 }, { from: "user", to: "origin", color: "#f59e0b", delay: 0.5 }, { from: "origin", to: "user", color: "#f59e0b", delay: 1.3 }];
  if (mode === "failure" && !fallback)    return [{ from: "user", to: "cdn_edge", color: "#ef4444", delay: 0 }];
  if (cache === "hit")                    return [{ from: "user", to: "cdn_edge", color: "#10b981", delay: 0 }, { from: "cdn_edge", to: "user", color: "#10b981", delay: 0.5 }];
  /* miss / expired */                    return [{ from: "user", to: "cdn_edge", color: "#f59e0b", delay: 0 }, { from: "cdn_edge", to: "origin", color: "#f59e0b", delay: 0.4 }, { from: "origin", to: "cdn_edge", color: "#f59e0b", delay: 1.0 }, { from: "cdn_edge", to: "user", color: "#10b981", delay: 1.6 }];
}

function getActiveNodes(mode: CDNMode): Set<NodeId> {
  const s: Set<NodeId> = new Set(["user", "origin", "storage"]);
  if (mode !== "off") s.add("cdn_edge");
  return s;
}

function computeInsights(mode: CDNMode, cache: CacheState, ttl: TTLValue, loc: Location, assetSizeMB: number, traffic: number): { text: string; type: "success" | "warning" | "neutral" }[] {
  const out: { text: string; type: "success" | "warning" | "neutral" }[] = [];
  if (mode === "off") {
    out.push({ type: "warning", text: `No CDN — users in ${loc === "us" ? "the US" : loc.charAt(0).toUpperCase() + loc.slice(1)} wait ${BASE_LATENCY[loc]}ms for every static asset. Origin handles all bandwidth.` });
  } else if (mode === "failure") {
    out.push({ type: "warning", text: "CDN edge is unavailable. Static assets fail or fall back to origin — latency and origin load spike." });
  } else {
    if (cache === "hit")    out.push({ type: "success", text: `Cache hit — edge serves the file in ~${EDGE_LATENCY[loc]}ms. Origin does zero work for this request.` });
    if (cache === "miss")   out.push({ type: "warning", text: "Cache miss — the edge didn't have the file. It fetched from origin. This request was slower, but future users get a cache hit." });
    if (cache === "expired") out.push({ type: "neutral", text: "TTL expired — edge revalidates with origin. Freshness improves, but origin receives this refresh request." });
  }
  if ((mode === "on" || mode === "ttl") && ttl === "1d") out.push({ type: "warning", text: "Long TTL (1 day) — CDN serves files for 24 hours without checking origin. If you deploy a new version, users may see the old one until TTL expires or you invalidate." });
  if ((mode === "on" || mode === "ttl") && ttl === "10s") out.push({ type: "neutral", text: "Short TTL (10 seconds) — CDN revalidates frequently. Freshness is high, but origin receives more requests." });
  // Asset size + traffic economics
  if (mode !== "off" && mode !== "failure") {
    const savedGB = (assetSizeMB * traffic * (cache === "hit" ? 0.96 : 0.65)) / 1024;
    if (assetSizeMB >= 100) out.push({ type: "neutral", text: `Large asset (${assetSizeMB} MB) — high bandwidth savings per hit, but CDN egress cost rises with volume. At ${traffic.toLocaleString()} req/hr the edge offloads ~${savedGB.toFixed(0)} GB/hr from origin.` });
    else if (traffic >= 50000) out.push({ type: "success", text: `High traffic (${traffic.toLocaleString()} req/hr) — CDN value is strong here. Concentrated requests on one asset keep hit rate high and origin load low.` });
  }
  return out;
}

// ─── SVG Canvas ────────────────────────────────────────────────────────────────
function TrafficDot({ x1, y1, x2, y2, color, delay }: { x1: number; y1: number; x2: number; y2: number; color: string; delay: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <motion.circle r={4} fill={color} fillOpacity={0.85}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, mx, x2], cy: [y1, my, y2], opacity: [0, 0.9, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: delay + 0.4, ease: "linear" }}
    />
  );
}

function CDNCanvas({ mode, cache, fallback, newlyAdded, onTooltip }: {
  mode: CDNMode; cache: CacheState; fallback: boolean; newlyAdded: Set<NodeId>; onTooltip: (t: string | null) => void;
}) {
  const activeNodes = useMemo(() => getActiveNodes(mode), [mode]);
  const paths = useMemo(() => getTrafficPaths(mode, cache, fallback), [mode, cache, fallback]);

  const structuralEdges = useMemo((): Array<[NodeId, NodeId]> => {
    if (mode === "off") return [["user", "origin"], ["origin", "storage"]];
    return [["user", "cdn_edge"], ["cdn_edge", "origin"], ["origin", "storage"]];
  }, [mode]);

  return (
    <svg viewBox="0 0 760 420" className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <pattern id="cdn-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.8" fill="#d9cfbd" />
        </pattern>
      </defs>
      <rect width="760" height="420" fill="#faf6ea" />
      <rect width="760" height="420" fill="url(#cdn-dots)" />

      {/* Structural edges */}
      <AnimatePresence>
        {structuralEdges.map(([a, b]) => {
          if (!activeNodes.has(a) || !activeNodes.has(b)) return null;
          const na = NODES[a], nb = NODES[b];
          const x1 = na.x + NW / 2, y1 = na.y + NH / 2;
          const x2 = nb.x + NW / 2, y2 = nb.y + NH / 2;
          return (
            <motion.line key={`e-${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
          );
        })}
      </AnimatePresence>

      {/* Traffic dots */}
      <AnimatePresence>
        {paths.map((p, i) => {
          if (!activeNodes.has(p.from) || !activeNodes.has(p.to)) return null;
          const na = NODES[p.from], nb = NODES[p.to];
          return (
            <TrafficDot key={`td-${i}`}
              x1={na.x + NW / 2} y1={na.y + NH / 2}
              x2={nb.x + NW / 2} y2={nb.y + NH / 2}
              color={p.color} delay={p.delay} />
          );
        })}
      </AnimatePresence>

      {/* Nodes */}
      <AnimatePresence>
        {(Object.entries(NODES) as Array<[NodeId, NodeDef]>).map(([id, def]) => {
          if (!activeNodes.has(id)) return null;
          const cx = def.x + NW / 2, cy = def.y + NH / 2;
          const isNew = newlyAdded.has(id);
          const isFailing = id === "cdn_edge" && mode === "failure";
          const color = isFailing ? "#dc2626" : def.color;
          return (
            <motion.g key={id}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              onMouseEnter={() => def.tooltip && onTooltip(def.tooltip)}
              onMouseLeave={() => onTooltip(null)}
              className={def.tooltip ? "cursor-help" : ""}>
              {isNew && (
                <motion.rect x={def.x - 5} y={def.y - 5} width={NW + 10} height={NH + 10} rx={10}
                  fill="none" stroke={color} strokeWidth={2.5}
                  initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 1.3 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }} />
              )}
              <rect x={def.x} y={def.y} width={NW} height={NH} rx={7} fill={color} />
              <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={10.5} fontWeight={600}
                style={{ pointerEvents: "none", userSelect: "none", fontFamily: "inherit" }}>
                {id === "cdn_edge" && mode === "failure" ? "CDN Edge (down)" : def.label}
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

// ─── Shared components ─────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: string }) {
  return <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-1">{children}</p>;
}

function MetricCard({ label, value, good, warn }: { label: string; value: string; good: boolean; warn: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <motion.p key={value} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
        className={cn("text-base font-bold tabular-nums leading-none", good ? "text-emerald-600" : warn ? "text-amber-600" : "text-red-500")}>
        {value}
      </motion.p>
    </div>
  );
}

function InsightPanel({ text, type }: { text: string; type: "success" | "warning" | "neutral" }) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    neutral: "bg-slate-50 border-slate-200 text-slate-700",
  };
  const icons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />,
    neutral: <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />,
  };
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      className={cn("flex items-start gap-2.5 p-3 rounded-xl border text-base leading-relaxed", styles[type])}>
      {icons[type]}{text}
    </motion.div>
  );
}

function SegmentedControl<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
      {options.map((o) => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={cn("flex-1 py-1.5 px-2 rounded-lg text-sm font-semibold transition-all",
            value === o.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-700")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Pill<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={cn("px-3 py-1 rounded-full text-sm font-semibold border transition-all",
            value === o ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400")}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ─── Section 01: Intro ──────────────────────────────────────────────────────────
function IntroCard({ scenario, onSelect }: { scenario: ScenarioId; onSelect: (s: ScenarioId) => void }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 01 · Concept Snapshot</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">CDN = serve static files from closer locations</p>
        <p className="text-base text-slate-600 mt-0.5 leading-relaxed">Use this page to see how edge caching changes latency, origin load, freshness, cost, and failure behavior.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Without CDN</p>
          <div className="flex items-center gap-2 text-base text-slate-700 font-mono">
            <span className="px-2 py-1 rounded bg-slate-200 text-slate-700">User</span>
            <span className="text-slate-300">——</span>
            <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700">Origin</span>
          </div>
          <p className="text-base text-slate-500 leading-relaxed">Every static request hits origin. Distant users wait for the full round trip.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">With CDN</p>
          <div className="flex items-center gap-2 text-base font-mono flex-wrap">
            <span className="px-2 py-1 rounded bg-slate-200 text-slate-700">User</span>
            <span className="text-slate-300">—</span>
            <span className="px-2 py-1 rounded bg-sky-100 text-sky-700">Edge</span>
            <span className="text-slate-300">—</span>
            <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700">Origin</span>
            <span className="text-base text-slate-500">(on miss only)</span>
          </div>
          <p className="text-base text-slate-500 leading-relaxed">Static files served from nearby edge. Origin only involved on cache miss.</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Choose a scenario</p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((sc) => (
            <button key={sc.id} onClick={() => onSelect(sc.id)}
              className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
                sc.id === scenario ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900")}>
              {sc.label}
            </button>
          ))}
        </div>
        {(() => { const sc = SCENARIOS.find(s => s.id === scenario)!; return (
          <p className="mt-2 text-base text-slate-600">{sc.description}</p>
        ); })()}
      </div>
    </div>
  );
}

// ─── Section 02: Controls ───────────────────────────────────────────────────────
interface ControlsProps {
  mode: CDNMode; location: Location; asset: AssetType; cacheState: CacheState; ttl: TTLValue; traffic: number; assetSizeMB: number;
  setMode: (v: CDNMode) => void; setLocation: (v: Location) => void; setAsset: (v: AssetType) => void;
  setCacheState: (v: CacheState) => void; setTtl: (v: TTLValue) => void; setTraffic: (v: number) => void; setAssetSize: (v: number) => void;
}

function ControlsCard(p: ControlsProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 02 · CDN Behavior</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Simulate CDN request routing</p>
        <p className="text-base text-slate-600 mt-0.5">Change mode, location, and cache state to see consequences.</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">CDN Mode</p>
        <SegmentedControl
          options={[{ key: "off", label: "CDN Off" }, { key: "on", label: "CDN On" }, { key: "ttl", label: "With TTL" }, { key: "failure", label: "Failure" }]}
          value={p.mode} onChange={p.setMode} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">User Location</p>
        <Pill options={["us", "europe", "india", "australia"] as Location[]} value={p.location} onChange={p.setLocation} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Asset Type</p>
        <Pill options={["logo.png", "app.js", "hero.jpg", "video.mp4"] as AssetType[]} value={p.asset} onChange={p.setAsset} />
      </div>

      {p.mode !== "off" && p.mode !== "failure" && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cache State</p>
          <SegmentedControl
            options={[{ key: "hit", label: "Hit" }, { key: "miss", label: "Miss" }, { key: "expired", label: "Expired" }]}
            value={p.cacheState} onChange={p.setCacheState} />
        </div>
      )}

      {(p.mode === "ttl" || p.mode === "on") && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">TTL Setting</p>
          <Pill options={["10s", "1m", "1h", "1d"] as TTLValue[]} value={p.ttl} onChange={p.setTtl} />
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <span>Traffic</span><span className="text-slate-800 tabular-nums">{p.traffic.toLocaleString()} req/hr</span>
        </div>
        <input type="range" min={10} max={100000} step={10} value={p.traffic} onChange={e => p.setTraffic(+e.target.value)}
          className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <span>Asset Size</span><span className="text-slate-800 tabular-nums">{p.assetSizeMB >= 1 ? `${p.assetSizeMB} MB` : `${Math.round(p.assetSizeMB * 1000)} KB`}</span>
        </div>
        <input type="range" min={0.1} max={500} step={0.1} value={p.assetSizeMB} onChange={e => p.setAssetSize(+e.target.value)}
          className="w-full h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
      </div>
    </div>
  );
}

// ─── Section 03: Canvas ─────────────────────────────────────────────────────────
function CanvasCard({ mode, cache, fallback, newlyAdded }: { mode: CDNMode; cache: CacheState; fallback: boolean; newlyAdded: Set<NodeId> }) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <Eyebrow>Live System View</Eyebrow>
          <p className="text-base text-slate-600">Hover any node to understand its role.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live</span>
        </div>
      </div>
      <div className="relative px-3 pb-3">
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "760/420" }}>
          <CDNCanvas mode={mode} cache={cache} fallback={fallback} newlyAdded={newlyAdded} onTooltip={setTooltip} />
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
  );
}

// ─── Section 04: Metrics ────────────────────────────────────────────────────────
function MetricsCard({ m }: { m: MetricValues }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <Eyebrow>Step 03 · System Metrics</Eyebrow>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
        <MetricCard label="Avg Latency"    value={`${m.latencyMs}ms`}   good={m.latencyMs < 40}   warn={m.latencyMs < 120} />
        <MetricCard label="Origin Requests" value={`${m.originPct}%`}   good={m.originPct < 20}   warn={m.originPct < 60} />
        <MetricCard label="CDN Hit Rate"   value={`${m.hitRate}%`}      good={m.hitRate > 80}     warn={m.hitRate > 40} />
        <MetricCard label="Freshness Risk" value={`${m.freshnessRisk}%`} good={m.freshnessRisk < 20} warn={m.freshnessRisk < 60} />
      </div>
    </div>
  );
}

// ─── Section 05: Insights ──────────────────────────────────────────────────────
function InsightsSection({ mode, cache, ttl, location, assetSizeMB, traffic }: { mode: CDNMode; cache: CacheState; ttl: TTLValue; location: Location; assetSizeMB: number; traffic: number }) {
  const insights = useMemo(() => computeInsights(mode, cache, ttl, location, assetSizeMB, traffic), [mode, cache, ttl, location, assetSizeMB, traffic]);
  if (!insights.length) return null;
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <Eyebrow>Step 04 · What Changed</Eyebrow>
      <div className="space-y-2">
        <AnimatePresence>
          {insights.map((ins, i) => <InsightPanel key={`${i}-${ins.text.slice(0, 20)}`} text={ins.text} type={ins.type} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Section 06: TTL & Freshness ───────────────────────────────────────────────
function TTLFreshnessPanel({ onChallengeComplete }: { onChallengeComplete: (id: string) => void }) {
  const [ttl, setTtl] = useState<TTLValue>("1h");
  const [originVersion, setOriginVersion] = useState(1);
  const [cdnVersion, setCdnVersion] = useState(1);
  const [state, setState] = useState<"idle" | "stale" | "fresh">("idle");

  const updateOrigin = () => {
    setOriginVersion(v => v + 1); // CDN keeps its old version → goes stale
    setState("stale");
  };

  const handleInvalidate = () => {
    setCdnVersion(originVersion);
    setState("fresh");
    onChallengeComplete("c3");
  };

  const isStale = originVersion !== cdnVersion;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 05 · Freshness Tradeoff</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Update the origin and watch the CDN serve old or fresh content</p>
        <p className="text-base text-slate-600 mt-0.5">CDN performance depends on caching, but correctness depends on freshness rules.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={cn("rounded-xl border-2 p-3 space-y-1 transition-colors", "border-indigo-300 bg-indigo-50")}>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Origin Server</p>
          <p className="text-base font-bold font-mono text-slate-800">logo-v{originVersion}.png</p>
          <p className="text-base text-slate-600">Current version</p>
        </div>
        <div className={cn("rounded-xl border-2 p-3 space-y-1 transition-colors", isStale ? "border-amber-400 bg-amber-50" : "border-sky-300 bg-sky-50")}>
          <p className={cn("text-xs font-bold uppercase tracking-wider", isStale ? "text-amber-600" : "text-sky-600")}>CDN Edge</p>
          <p className="text-base font-bold font-mono text-slate-800">logo-v{cdnVersion}.png</p>
          <p className={cn("text-base", isStale ? "text-amber-600 font-semibold" : "text-slate-600")}>{isStale ? "Stale — serving old version" : "Fresh"}</p>
        </div>
      </div>

      {isStale && (
        <InsightPanel type="warning" text="CDN is serving the old file. Users see the outdated version until TTL expires or you explicitly invalidate." />
      )}
      {state === "fresh" && !isStale && (
        <InsightPanel type="success" text="CDN invalidated. Next request fetches the updated file from origin and caches it." />
      )}

      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">TTL Setting</p>
        <Pill options={["10s", "1m", "1h", "1d"] as TTLValue[]} value={ttl} onChange={setTtl} />
        <p className="text-base text-slate-500 mt-1">
          {ttl === "10s" && "TTL 10s — edge revalidates every 10 seconds. Freshness high, origin load higher."}
          {ttl === "1m"  && "TTL 1m — good balance for frequently changing assets like app.js."}
          {ttl === "1h"  && "TTL 1h — suitable for most static assets. Deploy with cache invalidation."}
          {ttl === "1d"  && "TTL 1 day — ideal for images versioned by URL (e.g. logo-v3.png). Never go stale."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={updateOrigin} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">Update origin asset</button>
        <button onClick={handleInvalidate} disabled={!isStale} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40">Invalidate CDN object</button>
        <button onClick={() => { setOriginVersion(1); setCdnVersion(1); setState("idle"); }} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-base font-semibold hover:bg-slate-50">
          <RotateCcw className="w-3 h-3 inline mr-1" />Reset
        </button>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">
        <strong className="text-slate-800">Long TTL</strong> improves cache efficiency but can serve stale content after deployments.
        Use <strong className="text-slate-800">versioned filenames</strong> (logo-v2.png) or <strong className="text-slate-800">explicit invalidation</strong> to control freshness without sacrificing cache hit rate.
      </div>
    </div>
  );
}

// ─── Section 07: Failure / Fallback ────────────────────────────────────────────
function FailurePanel({ onChallengeComplete }: { onChallengeComplete: (id: string) => void }) {
  const [cdnHealthy, setCdnHealthy] = useState(true);
  const [fallback, setFallback] = useState(true);

  useEffect(() => {
    if (!cdnHealthy && fallback) onChallengeComplete("c5");
  }, [cdnHealthy, fallback, onChallengeComplete]);

  const metrics = (() => {
    if (cdnHealthy) return { latency: "14ms", origin: "4%", availability: "99.9%", status: "good" as const };
    if (fallback)   return { latency: "200ms", origin: "100%", availability: "96%", status: "warn" as const };
    return           { latency: "—", origin: "—", availability: "< 50%", status: "bad" as const };
  })();

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 06 · Failure Mode</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">What happens when the CDN goes down?</p>
        <p className="text-base text-slate-600 mt-0.5">CDN improves performance, but the system still needs fallback behavior for outages.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">CDN Status</p>
          <SegmentedControl options={[{ key: "true", label: "Healthy" }, { key: "false", label: "Outage" }] as { key: string; label: string }[]}
            value={String(cdnHealthy)} onChange={v => setCdnHealthy(v === "true")} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fallback</p>
          <SegmentedControl options={[{ key: "true", label: "Enabled" }, { key: "false", label: "Disabled" }] as { key: string; label: string }[]}
            value={String(fallback)} onChange={v => setFallback(v === "true")} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <MetricCard label="Latency"     value={metrics.latency}     good={metrics.status === "good"} warn={metrics.status === "warn"} />
        <MetricCard label="Origin Load" value={metrics.origin}      good={metrics.status === "good"} warn={metrics.status === "warn"} />
        <MetricCard label="Availability" value={metrics.availability} good={metrics.status === "good"} warn={metrics.status === "warn"} />
      </div>

      <AnimatePresence>
        {!cdnHealthy && fallback  && <InsightPanel key="wb" type="warning" text="CDN is down. Users fall back to origin. Latency increases and origin handles full load — ensure it can scale." />}
        {!cdnHealthy && !fallback && <InsightPanel key="nb" type="warning" text="CDN is down and no fallback is configured. Static assets fail to load. Users see broken pages." />}
        {cdnHealthy               && <InsightPanel key="ok" type="success" text="CDN is healthy. Nearby edges serve static assets. Origin handles only cache misses." />}
      </AnimatePresence>
    </div>
  );
}

// ─── Section 08: Cost & Asset Fit ──────────────────────────────────────────────
const ASSETS = [
  { id: "product-img", label: "Product image", desc: "Frequently requested, rarely changes.", benefit: 95, cost: 20, freshness: 5,  fit: "good"    as const },
  { id: "admin-pdf",   label: "Admin PDF",      desc: "Rarely downloaded, internal only.",   benefit: 15, cost: 40, freshness: 5,  fit: "careful" as const },
  { id: "app-js",      label: "Global app.js",  desc: "Downloaded by every user globally.",  benefit: 90, cost: 35, freshness: 50, fit: "good"    as const },
  { id: "user-video",  label: "User video",     desc: "Large file, high bandwidth savings.", benefit: 85, cost: 85, freshness: 5,  fit: "careful" as const },
  { id: "html-page",   label: "Dynamic HTML",   desc: "Changes on every deploy.",            benefit: 30, cost: 30, freshness: 95, fit: "poor"    as const },
];

function CostPanel() {
  const [selected, setSelected] = useState("product-img");
  const asset = ASSETS.find(a => a.id === selected)!;
  const fitColor = { good: "text-emerald-600", careful: "text-amber-600", poor: "text-red-500" };
  const fitLabel = { good: "Good CDN fit", careful: "Use with care", poor: "Poor CDN fit" };
  const fitBorder = { good: "border-emerald-300 bg-emerald-50", careful: "border-amber-300 bg-amber-50", poor: "border-red-300 bg-red-50" };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <Eyebrow>Step 07 · Cost Tradeoff</Eyebrow>
        <p className="text-2xl font-bold text-slate-900">Should this asset be on the CDN?</p>
        <p className="text-base text-slate-600 mt-0.5">Select an asset type to see the cost, benefit, and freshness tradeoffs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ASSETS.map((a) => (
          <button key={a.id} onClick={() => setSelected(a.id)}
            className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-base font-medium transition-all text-left",
              selected === a.id ? "bg-slate-100 border-slate-400 text-slate-900" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50")}>
            <div className={cn("w-2 h-2 rounded-full shrink-0", selected === a.id ? "bg-slate-700" : "bg-slate-300")} />
            <span className="flex-1">{a.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={cn("rounded-xl border-2 p-4 space-y-3", fitBorder[asset.fit])}>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-slate-800">{asset.label}</p>
            <span className={cn("text-base font-bold", fitColor[asset.fit])}>{fitLabel[asset.fit]}</span>
          </div>
          <p className="text-base text-slate-700 leading-relaxed">{asset.desc}</p>
          {[
            { label: "CDN Benefit", value: asset.benefit, good: asset.benefit > 70 },
            { label: "Cost Impact", value: asset.cost,    good: asset.cost < 40 },
            { label: "Freshness Risk", value: asset.freshness, good: asset.freshness < 20 },
          ].map(({ label, value, good }) => (
            <div key={label} className="space-y-0.5">
              <div className="flex justify-between text-base font-semibold text-slate-700">
                <span>{label}</span><span>{value}%</span>
              </div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${value}%` }} transition={{ duration: 0.4 }}
                  className={cn("h-full rounded-full", good ? "bg-emerald-500" : value > 60 ? "bg-red-500" : "bg-amber-500")} />
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Section 09: Challenges ─────────────────────────────────────────────────────
const CHALLENGES = [
  { id: "c1", label: "Reduce global image latency", desc: "Users in India load images from a US origin. Use CDN edge caching." },
  { id: "c2", label: "Handle first request",         desc: "Edge server does not have video.mp4. Fetch from origin, cache, return." },
  { id: "c3", label: "Fix stale CSS after deploy",   desc: "Users still receive old app.css. Invalidate the CDN object." },
  { id: "c4", label: "Lower origin load",            desc: "90% of requests hit the same static asset. Increase CDN hit rate." },
  { id: "c5", label: "Plan outage fallback",          desc: "CDN provider is unavailable. Fallback to origin and monitor load." },
];

function ChallengeCards({ completed }: { completed: Set<string> }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <Eyebrow>Step 08 · Validate Understanding</Eyebrow>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGES.map((ch) => {
          const done = completed.has(ch.id);
          return (
            <motion.div key={ch.id} animate={{ borderColor: done ? "#86efac" : "#e2e8f0" }}
              className={cn("p-4 rounded-xl border-2 transition-colors", done ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200")}>
              <div className="flex items-center gap-2 mb-1">
                {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                <p className={cn("text-base font-bold leading-snug", done ? "text-emerald-700" : "text-slate-700")}>{ch.label}</p>
              </div>
              <p className="text-base text-slate-600 leading-relaxed pl-6">{ch.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section 10: Solution Panel ────────────────────────────────────────────────
const WALKTHROUGH_STEPS = [
  { title: "All users request origin directly",  why: "Without CDN, every image, JS bundle, and video downloads from the origin. Distant users wait for the full round trip — sometimes 200ms+ just for latency.", tradeoff: "Simple setup. But the origin handles all traffic. Bandwidth and compute costs scale with users." },
  { title: "Far users experience high latency",  why: "A user in Australia requesting a file hosted in the US adds ~200–230ms of network latency before a single byte arrives. CDN solves this by moving the file closer.", tradeoff: "Without CDN, the only fix is to deploy your own origin in each region — expensive and complex." },
  { title: "CDN edges deployed near users",      why: "CDN provider deploys edge servers in data centers worldwide. When CDN is enabled, users connect to the nearest edge rather than your origin.", tradeoff: "CDN adds a third party dependency. You must plan for CDN outages with fallback behavior." },
  { title: "First request: cache miss",          why: "The edge doesn't have the file yet. It fetches from origin, serves the user, and stores the asset locally. This first request is slower — but only once per edge per file.", tradeoff: "Cache miss latency is higher than origin-direct for that single request. Subsequent users at that edge benefit." },
  { title: "Subsequent requests: cache hits",    why: "Users at the same edge location now receive the file from the edge — no origin involved. Latency drops to single-digit milliseconds for nearby users.", tradeoff: "Hit rate depends on traffic volume and TTL. Low traffic assets may frequently miss even with CDN." },
  { title: "TTL and freshness management",       why: "TTL (Time To Live) controls how long the edge keeps a file before revalidating with origin. Long TTL = more cache hits, lower origin load, higher freshness risk.", tradeoff: "Use versioned filenames (app-v2.js) for long TTL without staleness risk. Use short TTL for frequently updated content." },
  { title: "Invalidation on deploy",             why: "When you deploy a new version of a file, you must either use a new filename, increase TTL + invalidate, or accept stale content until TTL expires.", tradeoff: "Invalidation APIs exist but have latency. Propagating an invalidation to all edge nodes can take 10–60 seconds globally." },
  { title: "Fallback planning",                  why: "CDN providers have SLAs but do go down. If your DNS points to CDN and CDN fails without fallback, your static assets are unavailable.", tradeoff: "DNS-based fallback adds complexity. Some teams run origin behind a load balancer that CDN traffic and direct traffic both reach." },
];

type SolutionTab = "walkthrough" | "compare" | "interview";

function SolutionPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<SolutionTab>("walkthrough");
  const [step, setStep] = useState(0);
  const current = WALKTHROUGH_STEPS[step];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
      className="rounded-[1.5rem] border-2 border-slate-900 bg-white p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">Solution Walkthrough</p>
          <p className="text-base text-slate-600 mt-0.5">Step-by-step CDN design reasoning.</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50">
          <X className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
        {(["walkthrough", "compare", "interview"] as SolutionTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-700")}>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "walkthrough" && (
          <motion.div key="wt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              {WALKTHROUGH_STEPS.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}
                  className={cn("h-2 rounded-full transition-all", i === step ? "bg-slate-900 w-6" : i < step ? "bg-slate-400 w-2" : "bg-slate-200 w-2")} />
              ))}
              <span className="ml-auto text-base font-bold text-slate-500">{step + 1}/{WALKTHROUGH_STEPS.length}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
                <p className="text-base font-bold text-slate-900">{current.title}</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">{current.why}</div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-base text-amber-800 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span><strong>Tradeoff: </strong>{current.tradeoff}</span>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(i => Math.max(0, i - 1))} disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {step === WALKTHROUGH_STEPS.length - 1 ? (
                <div className="flex items-center gap-2 text-base font-bold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Complete</div>
              ) : (
                <button onClick={() => setStep(i => i + 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {tab === "compare" && (
          <motion.div key="cmp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {[
              { label: "Static requests",   without: "All hit origin",         with: "Served by nearest edge" },
              { label: "Latency",           without: "Full round-trip always", with: "Single-digit ms on hit" },
              { label: "Origin load",       without: "100% of static traffic", with: "Only misses + dynamic" },
              { label: "Global experience", without: "Degrades with distance", with: "Consistent globally" },
              { label: "Complexity",        without: "Simple, no CDN",         with: "TTL, invalidation, fallback" },
              { label: "Cost",              without: "Origin bandwidth only",  with: "CDN fees + origin savings" },
            ].map(row => (
              <div key={row.label}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{row.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-base text-slate-700">{row.without}</div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-base text-emerald-800 font-medium">{row.with}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === "interview" && (
          <motion.div key="int" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">
              A CDN is a geographically distributed network of edge servers that caches static assets such as images, videos, CSS, and JavaScript.
              Instead of every user requesting files from the origin server, users receive them from a nearby edge server.
              This reduces latency, lowers origin bandwidth, and improves global performance.
              On a cache miss, the CDN fetches from the origin and stores the asset for later requests.
              The main tradeoffs are cost, cache freshness, TTL tuning, invalidation complexity, and planning fallback if the CDN is unavailable.
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Use CDN for", items: ["Static images, JS, CSS", "Global user bases", "High traffic assets", "Video delivery"] },
                { label: "Be careful with", items: ["Frequently changing HTML", "Short-lived content", "User-specific responses", "Very low traffic files"] },
              ].map(({ label, items }) => (
                <div key={label} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
                  {items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-base text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />{item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function CDNVisual() {
  const [scenario, setScenario]   = useState<ScenarioId>("image-heavy");
  const [mode, setMode]           = useState<CDNMode>("on");
  const [location, setLocation]   = useState<Location>("india");
  const [asset, setAsset]         = useState<AssetType>("hero.jpg");
  const [cacheState, setCacheState] = useState<CacheState>("hit");
  const [ttl, setTtl]             = useState<TTLValue>("1h");
  const [traffic, setTraffic]     = useState(10000);
  const [assetSizeMB, setAssetSize] = useState(2);
  const [fallback]                = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [newlyAdded, setNewlyAdded] = useState<Set<NodeId>>(new Set());
  const prevNodesRef = useRef<Set<NodeId>>(new Set());

  const completeChallenge = (id: string) => setCompletedChallenges(prev => new Set(prev).add(id));

  // Auto-complete challenges based on state. Monotonic accumulation across the
  // session, so it must persist in state rather than be derived during render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompletedChallenges(prev => {
      const next = new Set(prev);
      if (mode !== "off" && cacheState === "hit" && location !== "us") next.add("c1");
      if (mode !== "off" && cacheState === "miss") next.add("c2");
      if (mode !== "off" && cacheState === "hit" && traffic >= 10000) next.add("c4");
      return next;
    });
  }, [mode, cacheState, location, traffic]);

  // Select scenario
  const selectScenario = (id: ScenarioId) => {
    const sc = SCENARIOS.find(s => s.id === id)!;
    setScenario(id);
    setMode(sc.defaultMode);
    setLocation(sc.defaultLocation);
    setCacheState(sc.defaultCacheState);
    setTtl(sc.defaultTtl);
  };

  // Track newly added nodes for pulse animation
  const activeNodes = useMemo(() => getActiveNodes(mode), [mode]);
  useEffect(() => {
    const prev = prevNodesRef.current;
    const added = new Set<NodeId>();
    for (const id of activeNodes) { if (!prev.has(id)) added.add(id); }
    prevNodesRef.current = new Set(activeNodes);
    if (!added.size) return;
    // Drives a one-shot pulse animation cleared by the timer below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewlyAdded(added);
    const t = setTimeout(() => setNewlyAdded(new Set()), 2000);
    return () => clearTimeout(t);
  }, [activeNodes]);

  const metrics = useMemo(() => computeMetrics(mode, location, cacheState, ttl), [mode, location, cacheState, ttl]);

  const scenarioObj = SCENARIOS.find(s => s.id === scenario)!;

  return (
    <div className="space-y-5">
      {/* Step 01: Intro */}
      <IntroCard scenario={scenario} onSelect={selectScenario} />

      {/* Steps 02+03: Main interaction */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-5">
        <ControlsCard
          mode={mode} location={location} asset={asset} cacheState={cacheState} ttl={ttl} traffic={traffic} assetSizeMB={assetSizeMB}
          setMode={setMode} setLocation={setLocation} setAsset={setAsset} setCacheState={setCacheState} setTtl={setTtl} setTraffic={setTraffic} setAssetSize={setAssetSize} />
        <div className="space-y-4">
          <CanvasCard mode={mode} cache={cacheState} fallback={fallback} newlyAdded={newlyAdded} />
          <MetricsCard m={metrics} />
        </div>
      </div>

      {/* Step 04: Insights */}
      <InsightsSection mode={mode} cache={cacheState} ttl={ttl} location={location} assetSizeMB={assetSizeMB} traffic={traffic} />

      {/* Scenario freshness warning */}
      {scenarioObj.freshWarning && (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <InsightPanel type="warning" text={scenarioObj.freshWarning} />
        </div>
      )}

      {/* Step 05: TTL & Freshness */}
      <TTLFreshnessPanel onChallengeComplete={completeChallenge} />

      {/* Step 06: Failure */}
      <FailurePanel onChallengeComplete={completeChallenge} />

      {/* Step 07: Cost */}
      <CostPanel />

      {/* Step 08: Challenges */}
      <ChallengeCards completed={completedChallenges} />

      {/* Step 09: Solution */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
        <div>
          <Eyebrow>Step 09 · Solution Panel</Eyebrow>
          <p className="text-base text-slate-700">Walkthrough, comparison, and interview answer.</p>
        </div>
        <button onClick={() => setShowSolution(s => !s)}
          className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all",
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
