"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  RotateCcw, AlertTriangle, Info, CheckCircle2,
  ChevronLeft, ChevronRight, X,
  Database,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type NodeId =
  | "client" | "app" | "cache"
  | "sql_db" | "read_replica" | "acid" | "join_engine"
  | "doc_store" | "shard_a" | "shard_b" | "shard_c" | "msg_queue" | "geo";

interface NodeDef {
  label: string; x: number; y: number;
  always?: boolean; color: string;
  tooltip?: string;
  triggeredBy?: string[];
}

interface Req {
  id: string; label: string;
  category: "functional" | "nonFunctional" | "outOfScope";
  nodeImpact: NodeId[];
  sqlDelta: number; nosqlDelta: number;
  warning?: string;
}

interface Scenario {
  id: string; label: string;
  description: string;
  defaultReqs: string[];
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  { id: "social",     label: "Social Feed",       description: "500M DAU · Read & write heavy · Media uploads · Global users",  defaultReqs: ["write_heavy", "flexible_schema", "horizontal_scale", "global"] },
  { id: "ecommerce",  label: "E-commerce",         description: "Orders, inventory, payments · Relational data · Audits required", defaultReqs: ["complex_joins", "transactions", "audit_trail", "low_latency"] },
  { id: "banking",    label: "Banking",             description: "Financial transactions · Zero data loss · Regulatory compliance", defaultReqs: ["transactions", "strong_consistency", "audit_trail", "complex_joins"] },
  { id: "analytics",  label: "Analytics",           description: "Billions of events/day · Append-only · Schema changes often",    defaultReqs: ["write_heavy", "flexible_schema", "horizontal_scale", "event_logs"] },
  { id: "chat",       label: "Global Chat",          description: "Millions of messages/sec · Low latency · Region-distributed",   defaultReqs: ["write_heavy", "global", "horizontal_scale", "low_latency"] },
];

const REQS: Req[] = [
  // Functional
  { id: "complex_joins",     label: "Complex relational queries",      category: "functional",    nodeImpact: ["sql_db", "join_engine"],        sqlDelta:  3, nosqlDelta: -2 },
  { id: "transactions",      label: "ACID transactions",               category: "functional",    nodeImpact: ["sql_db", "acid"],               sqlDelta:  3, nosqlDelta: -3, warning: "ACID transactions add write latency. NoSQL eventual consistency can cause data divergence in financial contexts." },
  { id: "write_heavy",       label: "High write throughput (M+/sec)",  category: "functional",    nodeImpact: ["msg_queue", "shard_a", "shard_b"], sqlDelta: -2, nosqlDelta:  3 },
  { id: "flexible_schema",   label: "Schema changes frequently",       category: "functional",    nodeImpact: ["doc_store"],                   sqlDelta: -2, nosqlDelta:  2 },
  { id: "global",            label: "Global distribution",             category: "functional",    nodeImpact: ["shard_a", "shard_b", "geo"],    sqlDelta: -1, nosqlDelta:  2 },
  { id: "event_logs",        label: "Append-only event stream",        category: "functional",    nodeImpact: ["msg_queue", "shard_c"],         sqlDelta: -1, nosqlDelta:  2 },
  // Non-functional
  { id: "strong_consistency",label: "Strong consistency (no stale reads)", category: "nonFunctional", nodeImpact: ["acid"],                    sqlDelta:  2, nosqlDelta: -2, warning: "Strong consistency limits horizontal scaling — distributed systems must coordinate every write." },
  { id: "horizontal_scale",  label: "Horizontal scalability",          category: "nonFunctional", nodeImpact: ["shard_a", "shard_b", "shard_c"], sqlDelta: -1, nosqlDelta:  3 },
  { id: "low_latency",       label: "Sub-50ms read latency",           category: "nonFunctional", nodeImpact: ["cache"],                       sqlDelta:  0, nosqlDelta:  1 },
  { id: "audit_trail",       label: "Audit trail / compliance",        category: "nonFunctional", nodeImpact: ["read_replica", "sql_db"],       sqlDelta:  2, nosqlDelta: -1 },
  // Out of scope
  { id: "ml_features",       label: "ML / recommendation engine",      category: "outOfScope",    nodeImpact: [],                              sqlDelta:  0, nosqlDelta:  0 },
  { id: "realtime_push",     label: "Real-time push notifications",    category: "outOfScope",    nodeImpact: [],                              sqlDelta:  0, nosqlDelta:  0 },
  { id: "search",            label: "Full-text search index",          category: "outOfScope",    nodeImpact: [],                              sqlDelta:  0, nosqlDelta:  0 },
];

// ─── Canvas nodes ──────────────────────────────────────────────────────────────
const NW = 112, NH = 36;

const NODES: Record<NodeId, NodeDef> = {
  client:      { label: "Client",          x: 30,  y: 192, always: true,  color: "#475569" },
  app:         { label: "App Server",      x: 300, y: 192, always: true,  color: "#1e293b" },
  cache:       { label: "Cache (Redis)",   x: 165, y: 52,  color: "#b91c1c", tooltip: "Caches hot reads — cuts DB pressure 70%+.",  triggeredBy: ["low_latency"] },
  sql_db:      { label: "SQL Database",    x: 460, y: 192, color: "#1d4ed8", tooltip: "Relational engine — tables, constraints, indexes.", triggeredBy: ["complex_joins", "transactions", "audit_trail"] },
  join_engine: { label: "Join Engine",     x: 620, y: 100, color: "#1d4ed8", tooltip: "Executes multi-table JOIN queries with indexes.",  triggeredBy: ["complex_joins"] },
  acid:        { label: "ACID Block",      x: 620, y: 192, color: "#92400e", tooltip: "BEGIN / COMMIT guarantees atomicity across writes.", triggeredBy: ["transactions", "strong_consistency"] },
  read_replica:{ label: "Read Replica",    x: 620, y: 312, color: "#047857", tooltip: "Offloads read queries — increases read throughput.", triggeredBy: ["audit_trail", "low_latency"] },
  doc_store:   { label: "Document Store",  x: 460, y: 80,  color: "#5b21b6", tooltip: "Schema-free documents — each record can have any fields.", triggeredBy: ["flexible_schema", "event_logs"] },
  msg_queue:   { label: "Message Queue",   x: 460, y: 312, color: "#c2410c", tooltip: "Buffers write bursts — decouples producers from DB.",  triggeredBy: ["write_heavy", "event_logs"] },
  shard_a:     { label: "Shard A (US)",    x: 620, y: 52,  color: "#6d28d9", tooltip: "Horizontal partition — US region traffic and data.",   triggeredBy: ["write_heavy", "global", "horizontal_scale"] },
  shard_b:     { label: "Shard B (EU)",    x: 620, y: 160, color: "#6d28d9", tooltip: "Horizontal partition — EU region traffic and data.",   triggeredBy: ["global", "horizontal_scale"] },
  shard_c:     { label: "Shard C",         x: 620, y: 268, color: "#6d28d9", tooltip: "Additional shard for overflow or time-series data.",   triggeredBy: ["event_logs", "horizontal_scale"] },
  geo:         { label: "Geo Routing",     x: 165, y: 332, color: "#0e7490", tooltip: "Routes users to nearest region — reduces global RTT.", triggeredBy: ["global"] },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function computeActiveNodes(selected: Set<string>): Set<NodeId> {
  const active = new Set<NodeId>(["client", "app"]);
  for (const [id, def] of Object.entries(NODES) as Array<[NodeId, NodeDef]>) {
    if (def.always) continue;
    if (def.triggeredBy?.some((r) => selected.has(r))) active.add(id);
  }
  return active;
}

function computeEdges(active: Set<NodeId>): Array<[NodeId, NodeId]> {
  const edges: Array<[NodeId, NodeId]> = [];
  if (active.has("cache"))       edges.push(["client", "cache"], ["cache", "app"]);
  else                           edges.push(["client", "app"]);
  if (active.has("geo"))         edges.push(["client", "geo"], ["geo", "app"]);
  if (active.has("sql_db"))      edges.push(["app", "sql_db"]);
  if (active.has("doc_store"))   edges.push(["app", "doc_store"]);
  if (active.has("msg_queue"))   edges.push(["app", "msg_queue"]);
  if (active.has("join_engine")) edges.push(["sql_db", "join_engine"]);
  if (active.has("acid"))        edges.push(["sql_db", "acid"]);
  if (active.has("read_replica"))edges.push(["sql_db", "read_replica"]);
  if (active.has("shard_a"))     edges.push(["msg_queue", "shard_a"]);
  if (active.has("shard_b"))     edges.push(["msg_queue", "shard_b"]);
  if (active.has("shard_c"))     edges.push(["msg_queue", "shard_c"]);
  if (active.has("shard_a") && !active.has("msg_queue")) edges.push(["app", "shard_a"]);
  if (active.has("shard_b") && !active.has("msg_queue")) edges.push(["app", "shard_b"]);
  if (active.has("doc_store") && active.has("shard_a"))  edges.push(["doc_store", "shard_a"]);
  return edges;
}

function computeMetrics(selected: Set<string>) {
  let sqlScore = 0, nosqlScore = 0;
  for (const r of REQS) {
    if (!selected.has(r.id)) continue;
    sqlScore   += r.sqlDelta;
    nosqlScore += r.nosqlDelta;
  }
  const base = 50;
  return {
    consistency:   Math.min(98, Math.max(30, base + sqlScore * 5)),
    scalability:   Math.min(98, Math.max(20, base + nosqlScore * 5)),
    joinComplexity:Math.min(95, selected.has("complex_joins") ? 75 + sqlScore * 3 : 10),
    writeThroughput:Math.min(95, selected.has("write_heavy") ? 40 + nosqlScore * 6 : 15),
    cost:          Math.min(95, 30 + (sqlScore + nosqlScore) * 3),
  };
}

function getRecommendation(selected: Set<string>): "sql" | "nosql" | "hybrid" {
  let sqlScore = 0, nosqlScore = 0;
  for (const r of REQS) {
    if (!selected.has(r.id)) continue;
    sqlScore   += Math.max(0, r.sqlDelta);
    nosqlScore += Math.max(0, r.nosqlDelta);
  }
  if (sqlScore > nosqlScore + 2) return "sql";
  if (nosqlScore > sqlScore + 2) return "nosql";
  return "hybrid";
}

function computeInsights(selected: Set<string>, active: Set<NodeId>): string[] {
  const out: string[] = [];
  if (active.has("acid"))         out.push("ACID block added — all writes are atomic. Debit + credit always succeed together or both roll back.");
  if (active.has("shard_a"))      out.push("Shards distribute writes across nodes. Each shard owns a key range — no single bottleneck.");
  if (active.has("join_engine"))  out.push("Join engine activated — multi-table queries use indexes to avoid full table scans.");
  if (active.has("doc_store"))    out.push("Document store enabled — each record can have any fields. Schema migrations no longer needed.");
  if (active.has("read_replica")) out.push("Read replica added — reads routed away from the primary, increasing read throughput and availability.");
  if (active.has("msg_queue"))    out.push("Message queue inserted — write bursts buffer instead of hitting the database directly.");
  if (active.has("geo"))          out.push("Geo routing added — users connect to the nearest regional shard, cutting global round-trip time.");
  return out;
}

// ─── Challenges ────────────────────────────────────────────────────────────────
const CHALLENGES = [
  {
    id: "c1",
    label: "ACID + relational queries",
    description: "Select requirements that strongly justify SQL — transactions and complex joins.",
    check: (selected: Set<string>) => selected.has("transactions") && selected.has("complex_joins"),
  },
  {
    id: "c2",
    label: "Billion-scale write throughput",
    description: "Configure a write-heavy, horizontally scaled system that can't use SQL.",
    check: (selected: Set<string>) => selected.has("write_heavy") && selected.has("horizontal_scale") && !selected.has("transactions"),
  },
  {
    id: "c3",
    label: "Hybrid justified",
    description: "Add both SQL-favoring and NoSQL-favoring requirements to reach a Hybrid recommendation.",
    check: (selected: Set<string>) => getRecommendation(selected) === "hybrid",
  },
];

// ─── Walkthrough scenarios ──────────────────────────────────────────────────────
interface WalkthroughStep {
  title: string; why: string; reqs: string[]; nodes: NodeId[]; tradeoff: string;
}

const WALKTHROUGH: Record<string, { systemType: string; steps: WalkthroughStep[] }> = {
  banking: {
    systemType: "Write-careful · consistency-critical · auditable",
    steps: [
      { title: "Start with a relational model", why: "Banks need structured data: accounts, transactions, balances. Every field has a type. NULL values are unacceptable.", reqs: ["complex_joins"], nodes: ["client", "app", "sql_db"], tradeoff: "A schema enforces correctness but requires migration when columns change." },
      { title: "Add ACID transactions", why: "A bank transfer debits one account and credits another. Both must succeed or neither should. NoSQL eventual consistency is a legal liability here.", reqs: ["complex_joins", "transactions"], nodes: ["client", "app", "sql_db", "acid"], tradeoff: "ACID adds ~20–50ms write latency. This is acceptable for financial operations but not for high-frequency trading." },
      { title: "Add audit trail", why: "Regulators require a complete history of every change. A read replica can serve audit queries without impacting the primary.", reqs: ["complex_joins", "transactions", "audit_trail"], nodes: ["client", "app", "sql_db", "acid", "read_replica"], tradeoff: "Replication lag means audit queries may be seconds behind. Usually acceptable for compliance." },
      { title: "Cache hot reads", why: "Account balance reads are extremely frequent. Cache the last-known balance to reduce DB pressure by 60–80%.", reqs: ["complex_joins", "transactions", "audit_trail", "low_latency"], nodes: ["client", "app", "sql_db", "acid", "read_replica", "cache"], tradeoff: "Cached balances can briefly be stale. Banks use write-through caching with short TTLs to manage this risk." },
    ],
  },
  social: {
    systemType: "Write-heavy · flexible · globally distributed",
    steps: [
      { title: "Start with a document model", why: "Social posts have varied structure — some have images, polls, videos, or none. A fixed schema would require constant migration.", reqs: ["flexible_schema"], nodes: ["client", "app", "doc_store"], tradeoff: "Without schema enforcement, invalid data can enter the store. Application-level validation is required." },
      { title: "Handle high write throughput", why: "500M users posting, liking, and commenting — millions of writes per second. A queue buffers spikes; shards distribute the load.", reqs: ["flexible_schema", "write_heavy"], nodes: ["client", "app", "doc_store", "msg_queue", "shard_a", "shard_b"], tradeoff: "Sharding makes cross-shard queries expensive. Fan-out reads (timeline construction) become complex." },
      { title: "Go global", why: "Users in Tokyo shouldn't hit a US server. Geo routing sends each user to the nearest shard, keeping latency under 50ms.", reqs: ["flexible_schema", "write_heavy", "global"], nodes: ["client", "app", "doc_store", "msg_queue", "shard_a", "shard_b", "geo"], tradeoff: "Global distribution means data is eventually consistent across regions. A post may appear seconds later in distant regions." },
      { title: "Add cache for feed reads", why: "Feed reads (timeline fetches) dominate the read pattern. Caching pre-computed feeds in Redis reduces DB reads by 90%.", reqs: ["flexible_schema", "write_heavy", "global", "low_latency"], nodes: ["client", "app", "doc_store", "msg_queue", "shard_a", "shard_b", "geo", "cache"], tradeoff: "Cache invalidation on 'delete post' is complex at scale. Feed data is often 15–60 seconds stale." },
    ],
  },
};

// ─── SVG sub-components ────────────────────────────────────────────────────────
function TrafficDot({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <motion.circle r={3} fill="#6366f1" fillOpacity={0.7}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, mx, x2], cy: [y1, my, y2], opacity: [0, 0.85, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, repeatDelay: delay, ease: "linear" }}
    />
  );
}

function ArchCanvas({ activeNodes, newlyAdded, onTooltip }: {
  activeNodes: Set<NodeId>; newlyAdded: Set<NodeId>; onTooltip: (t: string | null) => void;
}) {
  const edges = useMemo(() => computeEdges(activeNodes), [activeNodes]);
  return (
    <svg viewBox="0 0 760 420" className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <pattern id="sq-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.8" fill="#d9cfbd" />
        </pattern>
      </defs>
      <rect width="760" height="420" fill="#faf6ea" />
      <rect width="760" height="420" fill="url(#sq-dots)" />

      <AnimatePresence>
        {edges.map(([a, b]) => {
          const na = NODES[a], nb = NODES[b];
          const x1 = na.x + NW / 2, y1 = na.y + NH / 2;
          const x2 = nb.x + NW / 2, y2 = nb.y + NH / 2;
          return (
            <motion.line key={`e-${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {edges.map(([a, b], i) => {
          const na = NODES[a], nb = NODES[b];
          return <TrafficDot key={`td-${a}-${b}`} x1={na.x + NW / 2} y1={na.y + NH / 2} x2={nb.x + NW / 2} y2={nb.y + NH / 2} delay={i * 0.35} />;
        })}
      </AnimatePresence>

      <AnimatePresence>
        {(Object.entries(NODES) as Array<[NodeId, NodeDef]>).map(([id, def]) => {
          if (!activeNodes.has(id)) return null;
          const cx = def.x + NW / 2, cy = def.y + NH / 2;
          const isNew = newlyAdded.has(id);
          return (
            <motion.g key={id}
              initial={{ opacity: 0, scale: 0.55 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.55 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              onMouseEnter={() => def.tooltip && onTooltip(def.tooltip)}
              onMouseLeave={() => onTooltip(null)}
              className={def.tooltip ? "cursor-help" : ""}>
              {isNew && (
                <motion.rect x={def.x - 6} y={def.y - 6} width={NW + 12} height={NH + 12} rx={12}
                  fill="none" stroke={def.color} strokeWidth={2.5}
                  initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 1.25 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }} />
              )}
              <rect x={def.x} y={def.y} width={NW} height={NH} rx={7} fill={def.color} />
              <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={10.5} fontWeight={600}
                style={{ pointerEvents: "none", userSelect: "none", fontFamily: "inherit" }}>
                {def.label}
              </text>
              {def.tooltip && <circle cx={def.x + NW - 7} cy={def.y + 7} r={4} fill="rgba(255,255,255,0.3)" />}
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

// ─── Chip components ────────────────────────────────────────────────────────────
function ReqChip({ req, selected, onToggle }: { req: Req; selected: boolean; onToggle: () => void }) {
  const accent = req.category === "functional" ? "sky" : "amber";
  const on  = accent === "sky"   ? "bg-sky-50 border-sky-300 text-sky-900"     : "bg-amber-50 border-amber-300 text-amber-900";
  const dot = accent === "sky"   ? "bg-sky-500"   : "bg-amber-500";
  const tag = accent === "sky"   ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700";
  const n = req.nodeImpact.length;
  return (
    <motion.button layout onClick={onToggle}
      className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-base font-medium transition-all text-left",
        selected ? on : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50")}>
      <div className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", selected ? dot : "bg-slate-300")} />
      <span className="flex-1 leading-snug">{req.label}</span>
      <AnimatePresence>
        {selected && n > 0 && (
          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className={cn("text-base font-bold px-1.5 py-0.5 rounded-md shrink-0", tag)}>
            +{n}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function OutOfScopeChip({ req, selected, onToggle }: { req: Req; selected: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-base transition-all text-left",
        selected ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50")}>
      <div className={cn("w-2 h-2 rounded-full shrink-0", selected ? "bg-slate-400" : "bg-slate-300")} />
      <span className={cn("flex-1", selected && "line-through")}>{req.label}</span>
      {selected && <span className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">Deferred</span>}
    </button>
  );
}

// ─── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, good, warn }: { label: string; value: string; good: boolean; warn: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <motion.p key={value} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
        className={cn("text-base font-bold tabular-nums leading-none",
          good ? "text-emerald-600" : warn ? "text-amber-600" : "text-red-500")}>
        {value}
      </motion.p>
    </div>
  );
}

// ─── Recommendation badge ──────────────────────────────────────────────────────
function RecommendationBadge({ rec }: { rec: "sql" | "nosql" | "hybrid" }) {
  const map = {
    sql:    { label: "SQL",           cls: "bg-sky-50 border-sky-300 text-sky-800" },
    nosql:  { label: "NoSQL",         cls: "bg-purple-50 border-purple-300 text-purple-800" },
    hybrid: { label: "SQL + NoSQL",   cls: "bg-slate-100 border-slate-300 text-slate-800" },
  };
  return (
    <motion.span key={rec} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-base font-bold", map[rec].cls)}>
      <Database className="w-3 h-3" />{map[rec].label}
    </motion.span>
  );
}

// ─── Walkthrough view ──────────────────────────────────────────────────────────
function WalkthroughView({ scenarioId }: { scenarioId: string }) {
  const key = scenarioId === "banking" || scenarioId === "ecommerce" ? "banking" : "social";
  const solution = WALKTHROUGH[key];
  const [stepIdx, setStepIdx] = useState(0);
  // Reset to the first step when the scenario key changes (render-phase reset pattern).
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setStepIdx(0);
  }
  const step = solution.steps[stepIdx];
  const stepNodes = useMemo(() => new Set<NodeId>(step.nodes), [step]);
  const prevNodes = useMemo(() => stepIdx > 0 ? new Set<NodeId>(solution.steps[stepIdx - 1].nodes) : new Set<NodeId>(), [stepIdx, solution.steps]);
  const newlyAdded = useMemo(() => { const s = new Set<NodeId>(); for (const n of stepNodes) { if (!prevNodes.has(n)) s.add(n); } return s; }, [stepNodes, prevNodes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {solution.steps.map((_, i) => (
          <button key={i} onClick={() => setStepIdx(i)}
            className={cn("h-2 rounded-full transition-all", i === stepIdx ? "bg-slate-900 w-6" : i < stepIdx ? "bg-slate-400 w-2" : "bg-slate-200 w-2")} />
        ))}
        <span className="ml-auto text-xs font-bold text-slate-500 uppercase tracking-wider">{stepIdx + 1} / {solution.steps.length}</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-4">
        <AnimatePresence mode="wait">
          <motion.div key={stepIdx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
            <p className="text-base font-bold text-slate-900">{step.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {step.reqs.map((rid) => {
                const r = REQS.find((x) => x.id === rid);
                if (!r) return null;
                const isNew = stepIdx > 0 && !solution.steps[stepIdx - 1].reqs.includes(rid);
                return (
                  <span key={rid} className={cn("px-2.5 py-1 rounded-lg text-base font-semibold border",
                    isNew ? "bg-sky-100 border-sky-300 text-sky-800" : "bg-slate-100 border-slate-200 text-slate-700")}>
                    {r.label}
                  </span>
                );
              })}
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">{step.why}</div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-base text-amber-800 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span><strong>Tradeoff: </strong>{step.tradeoff}</span>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="rounded-xl border border-slate-200 overflow-hidden" style={{ aspectRatio: "760/420" }}>
          <ArchCanvas activeNodes={stepNodes} newlyAdded={newlyAdded} onTooltip={() => {}} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {stepIdx === solution.steps.length - 1 ? (
          <div className="flex items-center gap-2 text-base font-bold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Walkthrough complete</div>
        ) : (
          <button onClick={() => setStepIdx((i) => i + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Compare view ──────────────────────────────────────────────────────────────
const COMPARE_ROWS = [
  { key: "Consistency",      sql: "ACID — strong",        nosql: "BASE — eventual" },
  { key: "Scalability",      sql: "Vertical (ceiling)",   nosql: "Horizontal (unlimited)" },
  { key: "Schema",           sql: "Fixed, enforced",      nosql: "Flexible, dynamic" },
  { key: "Joins",            sql: "Native + indexed",     nosql: "Manual / embedded" },
  { key: "Write throughput", sql: "Limited by ACID",      nosql: "Millions/sec with shards" },
  { key: "Best for",         sql: "Finance, e-commerce",  nosql: "Social, IoT, analytics" },
];

function CompareView() {
  return (
    <div className="space-y-2">
      {COMPARE_ROWS.map((row) => (
        <div key={row.key}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{row.key}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="px-2.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-base font-semibold text-sky-800">{row.sql}</div>
            <div className="px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-base font-semibold text-purple-800">{row.nosql}</div>
          </div>
        </div>
      ))}
      <div className="pt-2 grid grid-cols-2 gap-2 text-base font-bold text-center">
        <div className="py-1 bg-sky-600 text-white rounded-lg">SQL</div>
        <div className="py-1 bg-purple-600 text-white rounded-lg">NoSQL</div>
      </div>
    </div>
  );
}

// ─── Interview view ─────────────────────────────────────────────────────────────
function InterviewView() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Standard interview answer</p>
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700 leading-relaxed">
        SQL databases store structured relational data and excel when relationships, joins, and transactions matter.
        NoSQL databases prioritize scalability, flexibility, and distribution — often sacrificing some consistency guarantees depending on design.
        The choice depends on workload pattern, scale requirements, consistency needs, and data access patterns.
        Most production systems at scale use <strong>both</strong>: SQL for transactional data where correctness is critical, NoSQL for high-volume reads and writes where flexibility matters.
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Use SQL when", items: ["Transactions are critical", "Data has many relationships", "Schema is stable", "Compliance / audit required"] },
          { label: "Use NoSQL when", items: ["Write volume is very high", "Schema evolves frequently", "Global distribution needed", "Horizontal scale is priority"] },
        ].map(({ label, items }) => (
          <div key={label} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
            {items.map((item) => (
              <div key={item} className="flex items-center gap-2 text-base text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />{item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Solution panel ─────────────────────────────────────────────────────────────
type SolutionMode = "walkthrough" | "compare" | "interview";

function SolutionPanel({ scenarioId, onClose }: { scenarioId: string; onClose: () => void }) {
  const [mode, setMode] = useState<SolutionMode>("walkthrough");
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
      className="rounded-[1.5rem] border-2 border-slate-900 bg-white p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-slate-900">Solution Mode</p>
          <p className="text-base text-slate-600 mt-0.5">Step-by-step reasoning for this scenario.</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50">
          <X className="w-4 h-4 text-slate-600" />
        </button>
      </div>
      <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
        {([["walkthrough", "Walkthrough"], ["compare", "Compare"], ["interview", "Interview"]] as [SolutionMode, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
              mode === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-700")}>
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {mode === "walkthrough" && <WalkthroughView scenarioId={scenarioId} />}
          {mode === "compare"     && <CompareView />}
          {mode === "interview"   && <InterviewView />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function SQLNoSQLVisual() {
  const [scenarioId, setScenarioId]   = useState("ecommerce");
  const [selected, setSelected]       = useState<Set<string>>(() => new Set(SCENARIOS[1].defaultReqs));
  const [tooltip, setTooltip]         = useState<string | null>(null);
  const [newlyAdded, setNewlyAdded]   = useState<Set<NodeId>>(new Set());
  const [activeTab, setActiveTab]     = useState<"functional" | "nonFunctional" | "outOfScope">("functional");
  const [showSolution, setShowSolution] = useState(false);
  const prevActiveRef = useRef<Set<NodeId>>(new Set(["client", "app"]));

  const activeNodes  = useMemo(() => computeActiveNodes(selected), [selected]);
  const metrics      = useMemo(() => computeMetrics(selected), [selected]);
  const insights     = useMemo(() => computeInsights(selected, activeNodes), [selected, activeNodes]);
  const warnings     = useMemo(() => REQS.filter((r) => selected.has(r.id) && r.warning).map((r) => r.warning!), [selected]);
  const rec          = useMemo(() => getRecommendation(selected), [selected]);

  useEffect(() => {
    const prev = prevActiveRef.current;
    const added = new Set<NodeId>();
    for (const id of activeNodes) { if (!prev.has(id)) added.add(id); }
    prevActiveRef.current = new Set(activeNodes);
    if (!added.size) return;
    // Drives a one-shot pulse animation cleared by the timer below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewlyAdded(added);
    const t = setTimeout(() => setNewlyAdded(new Set()), 2000);
    return () => clearTimeout(t);
  }, [activeNodes]);

  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const selectScenario = (sc: Scenario) => {
    setScenarioId(sc.id);
    setSelected(new Set(sc.defaultReqs));
    setShowSolution(false);
  };

  const currentScenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const funcReqs  = REQS.filter((r) => r.category === "functional");
  const nfReqs    = REQS.filter((r) => r.category === "nonFunctional");
  const oosReqs   = REQS.filter((r) => r.category === "outOfScope");
  const tabs = [
    { key: "functional"    as const, label: "Functional",     count: funcReqs.filter((r) => selected.has(r.id)).length },
    { key: "nonFunctional" as const, label: "Non-Functional", count: nfReqs.filter((r) => selected.has(r.id)).length },
    { key: "outOfScope"    as const, label: "Out of Scope",   count: oosReqs.filter((r) => selected.has(r.id)).length },
  ];

  const challenges = CHALLENGES.map((ch) => ({ ...ch, solved: ch.check(selected) }));

  return (
    <div className="space-y-5">

      {/* Step 1 — Scenario selector */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Step 1 — Pick a scenario</p>
            <p className="text-base text-slate-600 mt-0.5">Your requirements will shape the architecture recommendation.</p>
          </div>
          <button onClick={() => selectScenario(currentScenario)}
            className="flex items-center gap-1.5 text-base text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((sc) => (
            <button key={sc.id} onClick={() => selectScenario(sc)}
              className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
                sc.id === scenarioId ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900")}>
              {sc.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">{currentScenario.description}</span>
        </p>
      </div>

      {/* Step 2 + 3 — Requirements + Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.65fr] gap-5">

        {/* Left: requirement chips */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Step 2 — Set requirements</p>
            <p className="text-base text-slate-600 mt-0.5">Toggle on/off — the recommendation updates live.</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  activeTab === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-700")}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn("w-4 h-4 rounded-full text-base flex items-center justify-center font-bold",
                    activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-300 text-slate-700")}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2 min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeTab === "functional" && (
                <motion.div key="fn" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  {funcReqs.map((r) => <ReqChip key={r.id} req={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} />)}
                </motion.div>
              )}
              {activeTab === "nonFunctional" && (
                <motion.div key="nf" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  {nfReqs.map((r) => <ReqChip key={r.id} req={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} />)}
                </motion.div>
              )}
              {activeTab === "outOfScope" && (
                <motion.div key="oos" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-base text-slate-500 pb-1">Mark these as explicitly deferred — shows scope discipline.</p>
                  {oosReqs.map((r) => <OutOfScopeChip key={r.id} req={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recommendation */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recommendation</p>
              <RecommendationBadge rec={rec} />
            </div>
            <button onClick={() => setShowSolution((s) => !s)}
              className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all",
                showSolution ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:border-slate-700")}>
              <Info className="w-3.5 h-3.5" />{showSolution ? "Hide Solution" : "Explain Design"}
            </button>
          </div>
        </div>

        {/* Right: canvas + metrics */}
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Step 3 — Architecture</p>
                <p className="text-base text-slate-600 mt-0.5">Hover any node to understand its role.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="relative px-3 pb-3">
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "760/420" }}>
                <ArchCanvas activeNodes={activeNodes} newlyAdded={newlyAdded} onTooltip={setTooltip} />
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

          {/* Metrics */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-3">System metrics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <MetricCard label="Consistency"      value={`${metrics.consistency}%`}      good={metrics.consistency >= 80} warn={metrics.consistency >= 60} />
              <MetricCard label="Scalability"      value={`${metrics.scalability}%`}      good={metrics.scalability >= 70} warn={metrics.scalability >= 50} />
              <MetricCard label="Write Throughput" value={`${metrics.writeThroughput}%`}  good={metrics.writeThroughput >= 60} warn={metrics.writeThroughput >= 40} />
              <MetricCard label="Cost Index"       value={`${metrics.cost}%`}             good={metrics.cost <= 50} warn={metrics.cost <= 75} />
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 — Insights */}
      {(insights.length > 0 || warnings.length > 0) && (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Step 4 — Design insights</p>
          <div className="space-y-2">
            <AnimatePresence>
              {warnings.map((w) => (
                <motion.div key={w} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-base leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />{w}
                </motion.div>
              ))}
              {insights.map((ins) => (
                <motion.div key={ins} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-base leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-2" />{ins}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mini challenges */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Mini Challenges</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {challenges.map((ch) => (
            <motion.div key={ch.id} animate={{ borderColor: ch.solved ? "#86efac" : "#e2e8f0" }}
              className={cn("p-4 rounded-xl border-2 transition-colors", ch.solved ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200")}>
              <div className="flex items-center gap-2 mb-1">
                {ch.solved ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                <p className={cn("text-base font-bold", ch.solved ? "text-emerald-700" : "text-slate-700")}>{ch.label}</p>
              </div>
              <p className="text-base text-slate-600 leading-relaxed pl-6">{ch.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Solution panel */}
      <AnimatePresence>
        {showSolution && <SolutionPanel scenarioId={scenarioId} onClose={() => setShowSolution(false)} />}
      </AnimatePresence>

    </div>
  );
}
