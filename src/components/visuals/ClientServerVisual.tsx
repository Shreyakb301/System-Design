"use client";

import { useState, useRef, useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  Lightbulb, Eye, EyeOff, Zap, Info, Plus, Minus, Target,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type NodeId =
  | "client" | "internet" | "load_balancer"
  | "server" | "server2" | "server3"
  | "database" | "cache" | "object_storage";

interface NodeDef {
  label: string;
  cx: number;
  cy: number;
  color: string;
  tooltip: string;
}

interface RequestTypeDef {
  id: string;
  label: string;
  icon: string;
  path: NodeId[];
  latency: number;
  responseSize: string;
  color: string;
  description: string;
}

interface Packet {
  id: string;
  color: string;
  cxArr: number[];
  cyArr: number[];
  times: number[];
  duration: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const NW = 100;
const NH = 36;

// cx = x + NW/2, cy = y + NH/2
const NODES: Record<NodeId, NodeDef> = {
  client:         { label: "Client",         cx: 70,  cy: 145, color: "#475569", tooltip: "Device or app that sends requests — browser, mobile app, CLI tool. Never processes data itself." },
  internet:       { label: "Internet",       cx: 230, cy: 145, color: "#64748b", tooltip: "Network layer between client and server. Every packet travels through routers adding milliseconds of latency." },
  load_balancer:  { label: "Load Balancer",  cx: 330, cy: 145, color: "#4338ca", tooltip: "Distributes incoming requests across multiple server instances. Routes around failed servers automatically." },
  server:         { label: "App Server",     cx: 440, cy: 93,  color: "#1e293b", tooltip: "Processes requests, runs business logic, queries the database, and returns a response." },
  server2:        { label: "App Server 2",   cx: 440, cy: 197, color: "#1e293b", tooltip: "Second server instance. Load balancer distributes traffic across both." },
  server3:        { label: "App Server 3",   cx: 440, cy: 253, color: "#1e293b", tooltip: "Third server instance. Three servers can handle 3× the traffic of one." },
  database:       { label: "Database",       cx: 650, cy: 55,  color: "#047857", tooltip: "Stores persistent data — users, posts, orders. Querying the DB is often the main latency bottleneck." },
  cache:          { label: "Cache",          cx: 650, cy: 145, color: "#b91c1c", tooltip: "In-memory store (e.g. Redis). Serves repeated reads 10× faster than the database." },
  object_storage: { label: "Object Storage", cx: 650, cy: 235, color: "#6d28d9", tooltip: "Blob storage for large files — images, videos, documents. Cheap at scale, not meant for queries." },
};

const REQUEST_TYPES: RequestTypeDef[] = [
  {
    id: "login",
    label: "Login",
    icon: "🔐",
    path: ["client", "internet", "server", "server", "database", "database", "server", "internet", "client"],
    latency: 180,
    responseSize: "32 B token",
    color: "#4338ca",
    description: "Check credentials against DB → verify password hash → return session token",
  },
  {
    id: "load_feed",
    label: "Load Feed",
    icon: "📰",
    path: ["client", "internet", "server", "server", "cache", "server", "internet", "client"],
    latency: 90,
    responseSize: "48 KB JSON",
    color: "#0e7490",
    description: "Fetch personalized feed → cache hit serves data → DB query skipped entirely",
  },
  {
    id: "search",
    label: "Search",
    icon: "🔍",
    path: ["client", "internet", "server", "server", "database", "database", "database", "server", "internet", "client"],
    latency: 240,
    responseSize: "12 KB results",
    color: "#b45309",
    description: "Full-text query → scan DB index → rank results → return paginated list",
  },
  {
    id: "upload",
    label: "Upload File",
    icon: "📤",
    path: ["client", "client", "internet", "server", "server", "object_storage", "object_storage", "server", "internet", "client"],
    latency: 850,
    responseSize: "200 B URL",
    color: "#6d28d9",
    description: "Stream large file over network → server forwards to object storage → returns CDN URL",
  },
  {
    id: "submit_form",
    label: "Submit Form",
    icon: "📝",
    path: ["client", "internet", "server", "server", "database", "server", "internet", "client"],
    latency: 150,
    responseSize: "64 B status",
    color: "#047857",
    description: "Validate input → write record to DB → confirm success with status code",
  },
];

const SOLUTION_STEPS = [
  {
    title: "Step 1 — Client initiates a request",
    why: "Every web interaction starts at the client — a browser, mobile app, or CLI. The client packages the request (URL, method, headers, optional body) and fires it across the network. The client never processes data; it only asks.",
    visible: ["client", "internet"] as NodeId[],
    highlighted: ["client"] as NodeId[],
    takeaway: "The client is always the initiator. Servers are passive — they wait and respond.",
  },
  {
    title: "Step 2 — Network adds latency",
    why: "Data travels through routers, switches, and undersea cables between client and server. Each hop adds delay. A user in Tokyo hitting a server in Virginia adds 200–300ms just from the speed of light. This is irreducible physics.",
    visible: ["client", "internet", "server"] as NodeId[],
    highlighted: ["internet"] as NodeId[],
    takeaway: "CDNs exist because of this — they put servers physically closer to users to cut this latency.",
  },
  {
    title: "Step 3 — Server processes business logic",
    why: "The server receives the request, runs authentication checks, rate limiting, input validation, data transformation — all the business logic. This is where your application code lives. The server is stateless by design.",
    visible: ["client", "internet", "server"] as NodeId[],
    highlighted: ["server"] as NodeId[],
    takeaway: "Stateless servers can be horizontally scaled — just add more. Stateful servers are much harder to scale.",
  },
  {
    title: "Step 4 — Server queries the database",
    why: "Most requests need persistent data — user profiles, posts, orders. The server sends a query to the database and waits for the result. This is typically the slowest part of the request path — DB queries are often the main bottleneck.",
    visible: ["client", "internet", "server", "database"] as NodeId[],
    highlighted: ["server", "database"] as NodeId[],
    takeaway: "Reducing DB round-trips is the highest-leverage performance optimization. Every query has a cost.",
  },
  {
    title: "Step 5 — Cache can bypass the database",
    why: "If the data was recently requested, it may already be in cache (Redis, Memcached). Cache serves the result from memory — 10× faster than the database. Read-heavy workloads often have 80–95% cache hit rates.",
    visible: ["client", "internet", "server", "cache", "database"] as NodeId[],
    highlighted: ["cache"] as NodeId[],
    takeaway: "Cache is read-only with an expiry. The tradeoff: stale data. You choose freshness vs. speed.",
  },
  {
    title: "Step 6 — One server hits its limits",
    why: "A typical server handles 200–2,000 requests/sec depending on complexity. As user count grows, the request queue builds up. Latency spikes. Eventually requests start timing out. A single server is a single point of failure.",
    visible: ["client", "internet", "server"] as NodeId[],
    highlighted: ["server"] as NodeId[],
    takeaway: "This is the fundamental scaling challenge — and why every large system uses multiple servers.",
  },
  {
    title: "Step 7 — Load balancer distributes the load",
    why: "A load balancer sits in front of multiple server instances and distributes requests using algorithms like round-robin or least-connections. If one server fails, the load balancer routes around it. Traffic scales linearly with server count.",
    visible: ["client", "internet", "load_balancer", "server", "server2"] as NodeId[],
    highlighted: ["load_balancer", "server", "server2"] as NodeId[],
    takeaway: "Horizontal scaling (more servers) is elastic and has no single point of failure. Vertical scaling (bigger server) has a hard ceiling.",
  },
];

const MINI_CHALLENGES = [
  {
    id: "c1",
    label: "Trace a login request",
    icon: "🔐",
    description: "Send a Login request and identify exactly where the database is accessed in the path.",
    hint: "Select 'Login' then click Send Request. Watch the packet travel: Client → Internet → Server → Database → Server → Internet → Client. The DB is hit for credential verification.",
  },
  {
    id: "c2",
    label: "Cache vs Database",
    icon: "⚡",
    description: "Compare the latency of 'Load Feed' (cache) vs 'Login' (database). What's the difference?",
    hint: "Load Feed uses cache (90ms). Login hits the DB (180ms). Cache is 2× faster because memory access is faster than disk I/O.",
  },
  {
    id: "c3",
    label: "Survive 5000 users",
    icon: "📈",
    description: "In the Overload tab: scale to 5,000 users without the server failing.",
    hint: "Enable Load Balancer + add 3 servers + enable Cache. Cache absorbs 75% of reads, LB distributes the rest across servers.",
  },
  {
    id: "c4",
    label: "Fix the bottleneck",
    icon: "🔧",
    description: "In the Overload tab: create a bottleneck (traffic > 80%), then fix it.",
    hint: "Drag Users past 3000 with 1 server. See the red overload warning. Then add servers + enable LB to bring it back to green.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _pktId = 0;
function nextPktId() { return `pkt-${++_pktId}`; }

function buildPacket(req: RequestTypeDef): Packet {
  const path = req.path;
  const n = path.length;
  const cxArr = path.map(id => NODES[id as NodeId]?.cx ?? 0);
  const cyArr = path.map(id => NODES[id as NodeId]?.cy ?? 0);
  const times = path.map((_, i) => i / (n - 1));
  const duration = 1.2 + (req.latency / 300);
  return { id: nextPktId(), color: req.color, cxArr, cyArr, times, duration };
}

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

function edgesFor(visible: Set<NodeId>): Array<[NodeId, NodeId]> {
  const edges: Array<[NodeId, NodeId]> = [];
  const has = (id: NodeId) => visible.has(id);
  const lb = has("load_balancer");
  if (has("client") && has("internet")) edges.push(["client", "internet"]);
  if (lb) {
    if (has("internet")) edges.push(["internet", "load_balancer"]);
    if (has("server"))   edges.push(["load_balancer", "server"]);
    if (has("server2"))  edges.push(["load_balancer", "server2"]);
    if (has("server3"))  edges.push(["load_balancer", "server3"]);
  } else {
    if (has("internet") && has("server")) edges.push(["internet", "server"]);
  }
  if (has("server") && has("database"))       edges.push(["server", "database"]);
  if (has("server") && has("cache"))          edges.push(["server", "cache"]);
  if (has("server") && has("object_storage")) edges.push(["server", "object_storage"]);
  if (has("server2") && has("database"))      edges.push(["server2", "database"]);
  if (has("server2") && has("cache"))         edges.push(["server2", "cache"]);
  if (has("server3") && has("database"))      edges.push(["server3", "database"]);
  return edges;
}

// ─── Shared SVG Canvas ────────────────────────────────────────────────────────

function ArchCanvas({
  visibleNodes,
  highlightedNodes,
  packets,
  onNodeHover,
  onPacketDone,
  height = 290,
}: {
  visibleNodes: Set<NodeId>;
  highlightedNodes: Set<NodeId>;
  packets: Packet[];
  onNodeHover: (t: string | null) => void;
  onPacketDone: (id: string) => void;
  height?: number;
}) {
  const edges = edgesFor(visibleNodes);
  const vb = `0 0 760 ${height}`;

  return (
    <svg viewBox={vb} className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <pattern id="cs-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.8" fill="#cbd5e1" />
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="760" height={height} fill="#f9f9f6" />
      <rect width="760" height={height} fill="url(#cs-dots)" />

      {/* Edges */}
      <AnimatePresence>
        {edges.map(([a, b]) => {
          const na = NODES[a], nb = NODES[b];
          return (
            <motion.line key={`e-${a}-${b}`}
              x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
              stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </AnimatePresence>

      {/* Packets */}
      <AnimatePresence>
        {packets.map(p => (
          <motion.circle
            key={p.id}
            r={5}
            fill={p.color}
            filter="url(#glow)"
            initial={{ cx: p.cxArr[0], cy: p.cyArr[0], opacity: 0 }}
            animate={{
              cx: p.cxArr,
              cy: p.cyArr,
              opacity: [0, 1, 1, 1, 1, 1, 1, 0],
            }}
            transition={{
              cx: { duration: p.duration, times: p.times, ease: "linear" },
              cy: { duration: p.duration, times: p.times, ease: "linear" },
              opacity: { duration: p.duration, times: [0, 0.05, 0.1, 0.3, 0.7, 0.9, 0.95, 1.0] },
            }}
            onAnimationComplete={() => onPacketDone(p.id)}
          />
        ))}
      </AnimatePresence>

      {/* Nodes */}
      <AnimatePresence>
        {(Object.entries(NODES) as Array<[NodeId, NodeDef]>).map(([id, def]) => {
          if (!visibleNodes.has(id)) return null;
          const highlighted = highlightedNodes.has(id);
          const x = def.cx - NW / 2;
          const y = def.cy - NH / 2;
          return (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ transformOrigin: `${def.cx}px ${def.cy}px` }}
              onMouseEnter={() => onNodeHover(def.tooltip)}
              onMouseLeave={() => onNodeHover(null)}
              className="cursor-help"
            >
              {/* Glow ring when highlighted */}
              {highlighted && (
                <motion.rect
                  x={x - 5} y={y - 5} width={NW + 10} height={NH + 10}
                  rx={11} ry={11}
                  fill="none" stroke={def.color} strokeWidth={2}
                  animate={{ opacity: [0.8, 0.3, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <rect x={x} y={y} width={NW} height={NH} rx={7} ry={7} fill={def.color} />
              <text x={def.cx} y={def.cy + 0.5}
                textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={10.5} fontWeight={600}
                style={{ pointerEvents: "none", userSelect: "none", fontFamily: "inherit" }}>
                {def.label}
              </text>
              {/* Small info dot */}
              <circle cx={x + NW - 7} cy={y + 7} r={3.5} fill="rgba(255,255,255,0.3)" />
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

// ─── Section 1: Concept Snapshot ─────────────────────────────────────────────

function ConceptSnapshot() {
  const flow = [
    { label: "Client",    sub: "browser / app",    color: "#475569", right: "Request →" },
    { label: "Network",   sub: "adds latency",      color: "#64748b", right: "→" },
    { label: "Server",    sub: "processes logic",   color: "#1e293b", right: "Query →" },
    { label: "Database",  sub: "stores data",       color: "#047857", right: null },
  ];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">The core idea</p>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
          A client asks for something. A server processes the request, queries a database if needed, and sends a response back. This cycle — repeated billions of times per day — is the foundation of every web application.
        </p>
      </div>

      {/* Visual flow */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-stretch gap-0 min-w-max">
          {flow.map((node, i) => (
            <div key={node.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="px-4 py-2.5 rounded-xl text-center min-w-[90px]" style={{ backgroundColor: node.color }}>
                  <p className="text-xs font-bold text-white">{node.label}</p>
                  <p className="text-[9px] text-white/70 mt-0.5">{node.sub}</p>
                </div>
              </div>
              {node.right && (
                <div className="flex flex-col items-center mx-2 gap-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-0.5 bg-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{node.right}</span>
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-indigo-400" />
                    <div className="w-8 h-0.5 bg-indigo-300" style={{ borderTop: "1px dashed #818cf8" }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-0 min-w-max mt-1">
          <div className="min-w-[90px]" />
          <div className="flex items-center mx-2 min-w-[80px] justify-center">
            <span className="text-[9px] font-bold text-indigo-400">← Response</span>
          </div>
          <div className="min-w-[90px]" />
          <div className="flex items-center mx-2 min-w-[80px] justify-center">
            <span className="text-[9px] font-bold text-indigo-400">← Response</span>
          </div>
          <div className="min-w-[90px]" />
          <div className="flex items-center mx-2 min-w-[80px] justify-center">
            <span className="text-[9px] font-bold text-indigo-400">← Results</span>
          </div>
        </div>
      </div>

      {/* Three key facts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Client never stores data", sub: "It just renders and sends requests" },
          { label: "Server is stateless", sub: "Each request is independent by design" },
          { label: "DB is the bottleneck", sub: "Disk I/O is 100× slower than memory" },
        ].map(f => (
          <div key={f.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-700">{f.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{f.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section 2: Request / Response Simulation ─────────────────────────────────

function RequestFlowSim() {
  const [reqTypeId, setReqTypeId] = useState("login");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ completed: 0, failed: 0, lastLatency: 0, lastSize: "" });
  const [sending, setSending] = useState(false);
  const sendCooldown = useRef<ReturnType<typeof setTimeout> | null>(null);

  const req = REQUEST_TYPES.find(r => r.id === reqTypeId)!;

  const visibleNodes = useMemo(() => {
    const path = new Set(req.path as NodeId[]);
    path.add("client");
    path.add("internet");
    path.add("server");
    return path;
  }, [req]);

  const highlightedNodes = useMemo(() => {
    if (packets.length === 0) return new Set<NodeId>();
    return new Set(req.path as NodeId[]);
  }, [packets, req]);

  const sendRequest = useCallback(() => {
    if (packets.length >= 5) return; // max 5 simultaneous
    const pkt = buildPacket(req);
    setPackets(ps => [...ps, pkt]);
    setSending(true);
    if (sendCooldown.current) clearTimeout(sendCooldown.current);
    sendCooldown.current = setTimeout(() => setSending(false), 400);
  }, [req, packets.length]);

  const onPacketDone = useCallback((id: string) => {
    setPackets(ps => ps.filter(p => p.id !== id));
    setMetrics(m => ({
      ...m,
      completed: m.completed + 1,
      lastLatency: req.latency,
      lastSize: req.responseSize,
    }));
  }, [req]);

  useEffect(() => () => { if (sendCooldown.current) clearTimeout(sendCooldown.current); }, []);

  return (
    <div className="space-y-4">
      {/* Request type selector */}
      <div className="flex flex-wrap gap-2">
        {REQUEST_TYPES.map(r => (
          <button key={r.id} onClick={() => { setReqTypeId(r.id); setPackets([]); }}
            className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all",
              r.id === reqTypeId
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            )}>
            <span>{r.icon}</span>{r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        {/* Controls + metrics */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{req.icon} {req.label}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{req.description}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Latency</span>
                <span className="font-bold text-slate-700">{req.latency} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Response size</span>
                <span className="font-bold text-slate-700">{req.responseSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Path length</span>
                <span className="font-bold text-slate-700">{new Set(req.path).size} nodes</span>
              </div>
            </div>

            <button onClick={sendRequest}
              disabled={packets.length >= 5}
              className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                sending ? "scale-95" : "",
                packets.length >= 5
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
              )}>
              <Zap className="w-4 h-4" />
              Send Request
            </button>
          </div>

          {/* Live metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Completed", value: metrics.completed.toString(), sub: "requests" },
              { label: "In flight",  value: packets.length.toString(),    sub: packets.length === 5 ? "max!" : "packets" },
              { label: "Last latency", value: metrics.lastLatency ? `${metrics.lastLatency}ms` : "—", sub: "round trip" },
              { label: "Last size",  value: metrics.lastSize || "—",      sub: "response" },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                <motion.p key={m.value} initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-bold text-slate-900 tabular-nums leading-none">
                  {m.value}
                </motion.p>
                <p className="text-[9px] text-slate-400">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SVG canvas */}
        <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] overflow-hidden relative">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Request path — hover nodes for details</p>
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", packets.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
              <span className="text-[10px] font-bold text-slate-400">{packets.length > 0 ? "Active" : "Idle"}</span>
            </div>
          </div>
          <div className="relative px-2 pb-2">
            <div style={{ aspectRatio: "760/290" }} className="relative">
              <ArchCanvas
                visibleNodes={visibleNodes}
                highlightedNodes={highlightedNodes}
                packets={packets}
                onNodeHover={setTooltip}
                onPacketDone={onPacketDone}
                height={290}
              />
              <AnimatePresence>
                {tooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl leading-relaxed pointer-events-none z-10">
                    <Info className="inline w-3 h-3 mr-1.5 opacity-60" />
                    {tooltip}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Server Overload Simulation ────────────────────────────────────

function OverloadSim() {
  const [users,        setUsers]        = useState(500);
  const [serverCount,  setServerCount]  = useState(1);
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [lbEnabled,    setLbEnabled]    = useState(false);
  const [spiking,      setSpiking]      = useState(false);
  const [tooltip,      setTooltip]      = useState<string | null>(null);
  const spikeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (spikeTimer.current) clearTimeout(spikeTimer.current); }, []);

  const triggerSpike = () => {
    setSpiking(true);
    if (spikeTimer.current) clearTimeout(spikeTimer.current);
    spikeTimer.current = setTimeout(() => setSpiking(false), 6000);
  };

  const effectiveUsers = spiking ? users * 8 : users;
  const reqPerSec      = Math.round(effectiveUsers * 1.5);
  const afterCache     = cacheEnabled ? Math.round(reqPerSec * 0.25) : reqPerSec;
  const serverCap      = serverCount * 250;
  const serverLoad     = afterCache / serverCap;
  const dbLoad         = afterCache / 350;
  const latency        = Math.round(
    60 +
    (serverLoad > 0.7 ? (serverLoad - 0.7) * 500 : 0) +
    (dbLoad > 0.7 ? (dbLoad - 0.7) * 700 : 0) +
    (!cacheEnabled ? 40 : 0)
  );
  const failRate       = Math.max(0, Math.round((serverLoad - 1.0) * 100));
  const overloaded     = serverLoad >= 1.0;
  const status         = serverLoad < 0.5 ? "Healthy" : serverLoad < 0.8 ? "Busy" : serverLoad < 1.0 ? "Overloaded" : "Failing";
  const statusColor    = serverLoad < 0.5 ? "text-emerald-600" : serverLoad < 0.8 ? "text-amber-600" : "text-red-600";

  const heatColor = (v: number) => v >= 1 ? "#ef4444" : v >= 0.75 ? "#f59e0b" : "#1e293b";

  // Overload sim uses its own simpler canvas
  const visibleNodes = useMemo((): Set<NodeId> => {
    const s = new Set<NodeId>(["client", "internet", "server", "database"]);
    if (lbEnabled) s.add("load_balancer");
    if (serverCount >= 2) s.add("server2");
    if (serverCount >= 3) s.add("server3");
    if (cacheEnabled) s.add("cache");
    return s;
  }, [lbEnabled, serverCount, cacheEnabled]);

  const highlightedNodes = useMemo((): Set<NodeId> => {
    const s = new Set<NodeId>();
    if (overloaded) { s.add("server"); if (serverCount >= 2) s.add("server2"); }
    if (dbLoad > 0.8) s.add("database");
    return s;
  }, [overloaded, serverCount, dbLoad]);

  // Animated traffic dots for the overload visual
  const dotCount = Math.min(40, Math.max(2, Math.round(Math.sqrt(afterCache) * 0.8)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        {/* Controls */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-4 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Traffic controls</p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500 uppercase tracking-wider">Concurrent users</span>
                <span className="font-bold text-slate-700 tabular-nums">{users.toLocaleString()}</span>
              </div>
              <input type="range" min={100} max={10000} step={100} value={users}
                onChange={e => setUsers(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-slate-700" />
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Infrastructure</p>
              {[
                { label: "Cache (Redis)", val: cacheEnabled, set: setCacheEnabled },
                { label: "Load Balancer", val: lbEnabled,    set: setLbEnabled    },
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(!val)}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all",
                    val ? "bg-white border-slate-300 text-slate-800" : "bg-slate-100 border-slate-200 text-slate-400"
                  )}>
                  {label}
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
                    val ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  )}>{val ? "ON" : "OFF"}</span>
                </button>
              ))}

              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-white">
                <span className="text-xs font-semibold text-slate-700">App Servers</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setServerCount(c => Math.max(1, c - 1))}
                    className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{serverCount}</span>
                  <button onClick={() => setServerCount(c => Math.min(3, c + 1))}
                    className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <button onClick={triggerSpike}
              className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                spiking ? "bg-red-100 text-red-700 border border-red-300 animate-pulse"
                        : "bg-slate-900 text-white hover:bg-slate-800"
              )}>
              <Zap className="w-4 h-4" />
              {spiking ? "Spike: 8× traffic!" : "Simulate traffic spike"}
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Status",    value: status,            extra: statusColor },
              { label: "Latency",   value: `${latency}ms`,    extra: latency > 300 ? "text-red-600" : latency > 150 ? "text-amber-600" : "text-emerald-600" },
              { label: "Req / sec", value: afterCache.toString(), extra: "text-slate-900" },
              { label: "Fail rate", value: failRate > 0 ? `${failRate}%` : "0%", extra: failRate > 0 ? "text-red-600" : "text-emerald-600" },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                <motion.p key={m.value} initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("text-sm font-bold tabular-nums leading-none", m.extra)}>
                  {m.value}
                </motion.p>
              </div>
            ))}
          </div>
        </div>

        {/* Visualization */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] overflow-hidden relative">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Architecture under load</p>
              {overloaded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                  <AlertTriangle className="w-3 h-3" /> Bottleneck!
                </motion.div>
              )}
            </div>

            <div className="px-2 pb-2">
              <div style={{ aspectRatio: "760/290" }} className="relative">
                {/* Animated traffic dots */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 760 290">
                  {Array.from({ length: dotCount }).map((_, i) => {
                    const targetServer = lbEnabled ? (i % serverCount) : 0;
                    const targetNode = ["server", "server2", "server3"][targetServer] as NodeId;
                    const srcCx = NODES.internet.cx;
                    const srcCy = NODES.internet.cy;
                    const midCx = lbEnabled ? NODES.load_balancer.cx : (NODES.server.cx + NODES.internet.cx) / 2;
                    const dstCx = NODES[targetNode]?.cx ?? NODES.server.cx;
                    const dstCy = NODES[targetNode]?.cy ?? NODES.server.cy;
                    const delay = (i / dotCount) * 1.5;
                    const col = overloaded ? "#ef4444" : spiking ? "#f59e0b" : "#6366f1";
                    const jitter = ((i % 5) - 2) * 8;
                    return (
                      <motion.circle key={i} r={3.5} fill={col} fillOpacity={0.75}
                        initial={{ cx: srcCx, cy: srcCy + jitter }}
                        animate={{
                          cx: [srcCx, midCx, dstCx],
                          cy: [srcCy + jitter, srcCy + jitter, dstCy],
                          opacity: overloaded && i % 4 === 0 ? [0, 1, 0.2, 0] : [0, 0.9, 0],
                        }}
                        transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, repeatDelay: delay, ease: "linear" }}
                      />
                    );
                  })}
                </svg>

                {/* Architecture nodes */}
                <ArchCanvas
                  visibleNodes={visibleNodes}
                  highlightedNodes={highlightedNodes}
                  packets={[]}
                  onNodeHover={setTooltip}
                  onPacketDone={() => {}}
                  height={290}
                />

                <AnimatePresence>
                  {tooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl leading-relaxed pointer-events-none z-10">
                      <Info className="inline w-3 h-3 mr-1.5 opacity-60" />
                      {tooltip}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Heat bars */}
            <div className="px-4 pb-4 space-y-2">
              {[
                { label: `Server load (${serverCount} server${serverCount > 1 ? "s" : ""})`, v: clamp(serverLoad, 0, 1.3) },
                { label: "Database load", v: clamp(dbLoad, 0, 1.3) },
              ].map(({ label, v }) => {
                const barColor = v >= 1 ? "bg-red-500" : v >= 0.7 ? "bg-amber-500" : "bg-emerald-500";
                const textColor = v >= 1 ? "text-red-600" : v >= 0.7 ? "text-amber-600" : "text-emerald-600";
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span className="text-slate-500 uppercase tracking-wider">{label}</span>
                      <span className={textColor}>{Math.round(v * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div animate={{ width: `${Math.min(v, 1) * 100}%` }} transition={{ duration: 0.3 }}
                        className={cn("h-full rounded-full", barColor)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overload recommendation */}
          <AnimatePresence>
            {overloaded && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-white border-2 border-red-200 space-y-2">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider">How to fix this</p>
                {!lbEnabled && <p className="text-xs text-slate-700 flex gap-2"><span className="text-red-500 font-bold">→</span> Enable Load Balancer to distribute traffic across multiple servers</p>}
                {serverLoad > 1 && serverCount < 3 && <p className="text-xs text-slate-700 flex gap-2"><span className="text-red-500 font-bold">→</span> Add more app servers (click + above)</p>}
                {!cacheEnabled && <p className="text-xs text-slate-700 flex gap-2"><span className="text-red-500 font-bold">→</span> Enable Cache — it absorbs ~75% of reads, dramatically reducing server pressure</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: Solution Walkthrough ─────────────────────────────────────────

function SolutionWalkthrough({ onClose }: { onClose: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const step = SOLUTION_STEPS[stepIdx];
  const visibleNodes = useMemo(() => new Set(step.visible), [step]);
  const highlightedNodes = useMemo(() => new Set(step.highlighted), [step]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      className="rounded-[1.5rem] border-2 border-slate-900 bg-white p-5 shadow-lg space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Solution Walkthrough</p>
          <p className="text-xs text-slate-500">Step through how client–server works, from first request to horizontal scaling.</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50">
          <span className="text-slate-500 text-sm">✕</span>
        </button>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1.5">
        {SOLUTION_STEPS.map((_, i) => (
          <button key={i} onClick={() => setStepIdx(i)}
            className={cn("h-2 rounded-full transition-all",
              i === stepIdx ? "bg-slate-900 w-6" : i < stepIdx ? "bg-slate-400 w-2" : "bg-slate-200 w-2"
            )} />
        ))}
        <span className="ml-auto text-[10px] font-bold text-slate-400">{stepIdx + 1}/{SOLUTION_STEPS.length}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4">
        {/* Explanation */}
        <AnimatePresence mode="wait">
          <motion.div key={stepIdx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-sm font-bold text-slate-900">{step.title}</p>

            <div className="flex flex-wrap gap-1.5">
              {step.highlighted.map(nodeId => (
                <span key={nodeId}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-sky-100 border-sky-300 text-sky-800">
                  {NODES[nodeId]?.label}
                </span>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {step.why}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 leading-relaxed">
              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-500" />
              <span>{step.takeaway}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mini canvas */}
        <div className="rounded-xl border border-slate-200 overflow-hidden relative" style={{ aspectRatio: "760/290" }}>
          <ArchCanvas
            visibleNodes={visibleNodes}
            highlightedNodes={highlightedNodes}
            packets={[]}
            onNodeHover={setTooltip}
            onPacketDone={() => {}}
            height={290}
          />
          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl leading-relaxed pointer-events-none z-10">
                <Info className="inline w-3 h-3 mr-1.5 opacity-60" />
                {tooltip}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={stepIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {stepIdx === SOLUTION_STEPS.length - 1 ? (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Walkthrough complete
          </div>
        ) : (
          <button onClick={() => setStepIdx(i => i + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section 5: Mini Challenges ───────────────────────────────────────────────

function MiniChallenges() {
  const [completed,  setCompleted]  = useState<Set<string>>(new Set());
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());

  const toggle = (id: string, setState: Dispatch<SetStateAction<Set<string>>>) =>
    setState(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Mini Challenges</p>
        <p className="text-sm text-slate-500 mt-0.5">Apply what you&apos;ve learned by solving these hands-on problems.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MINI_CHALLENGES.map(ch => {
          const done      = completed.has(ch.id);
          const hintShown = shownHints.has(ch.id);
          return (
            <div key={ch.id}
              className={cn("p-4 rounded-xl border-2 space-y-2 transition-all", done ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{ch.icon}</span>
                <p className={cn("text-xs font-bold", done ? "text-emerald-700" : "text-slate-700")}>{ch.label}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{ch.description}</p>

              <AnimatePresence>
                {hintShown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-sky-50 border border-sky-200">
                      <Lightbulb className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-sky-800 leading-relaxed">{ch.hint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-1.5">
                <button onClick={() => toggle(ch.id, setShownHints)}
                  className={cn("flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all flex-1",
                    hintShown ? "bg-sky-100 text-sky-700 border-sky-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}>
                  {hintShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {hintShown ? "Hide" : "Hint"}
                </button>
                <button onClick={() => toggle(ch.id, setCompleted)}
                  className={cn("flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex-1",
                    done ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}>
                  {done ? <><CheckCircle2 className="w-3 h-3" /> Done!</> : "Mark done"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

type SimTab = "flow" | "overload";

// ─── Main export ──────────────────────────────────────────────────────────────

export function ClientServerVisual() {
  const [tab,          setTab]          = useState<SimTab>("flow");
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="space-y-5">

      {/* Section 1: Concept Snapshot */}
      <ConceptSnapshot />

      {/* Simulation tabs */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            {([
              { key: "flow" as const,     label: "Request / Response", icon: "📡" },
              { key: "overload" as const, label: "Overload & Scaling",  icon: "🔴" },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                  tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          {tab === "overload" && (
            <p className="text-[10px] text-slate-400 font-medium">Drag users up until the server fails, then fix it.</p>
          )}
          {tab === "flow" && (
            <p className="text-[10px] text-slate-400 font-medium">Pick a request type, then click Send Request to watch the packet travel.</p>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "flow"    && <RequestFlowSim />}
            {tab === "overload" && <OverloadSim />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Section 4: Solution Walkthrough toggle */}
      <div className="flex justify-center">
        <button onClick={() => setShowSolution(s => !s)}
          className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all",
            showSolution ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:border-slate-700"
          )}>
          <Target className="w-4 h-4" />
          {showSolution ? "Hide Solution" : "Show Solution Walkthrough"}
        </button>
      </div>

      <AnimatePresence>
        {showSolution && (
          <SolutionWalkthrough onClose={() => setShowSolution(false)} />
        )}
      </AnimatePresence>

      {/* Section 5: Mini Challenges */}
      <MiniChallenges />
    </div>
  );
}
