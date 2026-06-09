"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Server, Users, Network, Plus, Minus,
  Shield, ShieldOff, Trophy,
  CheckCircle2, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Algorithm = "round-robin" | "least-connections" | "random" | "weighted" | "ip-hash";
type ServerStatus = "healthy" | "busy" | "overloaded" | "failed";

interface ServerState {
  id: string;
  label: string;
  connections: number;
  cpu: number;
  queue: number;
  status: ServerStatus;
  requestsHandled: number;
  weight: number;
}

interface Packet {
  id: string;
  serverId: string;
  clientColor: string;
  clientId: number;
  isError: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CLIENT_COLORS = ["#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

const DEFAULT_SERVERS: ServerState[] = [
  { id: "A", label: "Server A", connections: 0, cpu: 0, queue: 0, status: "healthy", requestsHandled: 0, weight: 1 },
  { id: "B", label: "Server B", connections: 0, cpu: 0, queue: 0, status: "healthy", requestsHandled: 0, weight: 2 },
  { id: "C", label: "Server C", connections: 0, cpu: 0, queue: 0, status: "healthy", requestsHandled: 0, weight: 1 },
];

// ── Style helpers ──────────────────────────────────────────────────────────────
function statusDot(s: ServerStatus) {
  if (s === "healthy")    return "bg-emerald-500";
  if (s === "busy")       return "bg-amber-500";
  if (s === "overloaded") return "bg-red-500";
  return "bg-slate-300";
}
function statusBorder(s: ServerStatus) {
  if (s === "healthy")    return "border-emerald-400";
  if (s === "busy")       return "border-amber-400";
  if (s === "overloaded") return "border-red-500";
  return "border-slate-200";
}
function statusBg(s: ServerStatus) {
  if (s === "healthy")    return "bg-emerald-50";
  if (s === "busy")       return "bg-amber-50";
  if (s === "overloaded") return "bg-red-50";
  return "bg-slate-100";
}
function cpuBar(v: number) {
  if (v > 80) return "bg-red-500";
  if (v > 60) return "bg-amber-500";
  return "bg-emerald-500";
}

// ── Shared primitives ──────────────────────────────────────────────────────────

/** Compact node shown inside the canvas */
function CanvasNode({ server, onKill, onRecover, showControls = false }: {
  server: ServerState; onKill?: () => void; onRecover?: () => void; showControls?: boolean;
}) {
  return (
    <motion.div layout className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-lg border w-28 shrink-0 transition-colors duration-300",
      statusBorder(server.status), statusBg(server.status),
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot(server.status))} />
      <span className="text-[10px] font-bold font-mono text-slate-700 flex-1 truncate">{server.id}</span>
      {server.status === "overloaded" && (
        <span className="text-[8px] font-semibold text-red-600">high</span>
      )}
      {server.status === "failed" && <span className="text-[8px] font-semibold text-slate-400">down</span>}
      {showControls && (
        <button onClick={server.status === "failed" ? onRecover : onKill}
          className={cn("text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center shrink-0",
            server.status === "failed" ? "bg-emerald-500 text-white" : "bg-red-100 text-red-700 hover:bg-red-200")}>
          {server.status === "failed" ? "+" : "×"}
        </button>
      )}
    </motion.div>
  );
}

/** Inline CPU bar row — no boxes, just bars */
function ServerBars({ servers }: { servers: ServerState[] }) {
  return (
    <div className="flex gap-4">
      {servers.map((s) => (
        <div key={s.id} className="flex-1 min-w-0 space-y-1">
          <div className="flex justify-between text-[10px] font-semibold">
            <div className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", statusDot(s.status))} />
              <span className="text-slate-600">{s.label}</span>
            </div>
            <span className="font-mono text-slate-500">{Math.round(s.cpu)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${s.cpu}%` }} transition={{ type: "spring", stiffness: 180, damping: 28 }}
              className={cn("h-full rounded-full", cpuBar(s.cpu))} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** LB node (static) */
function LBBubble({ size = 16 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-indigo-50 border-2 border-indigo-300 flex items-center justify-center"
      style={{ width: size * 4, height: size * 4 }}
    >
      <Network className="text-indigo-500" style={{ width: size, height: size }} />
    </div>
  );
}

/** Packet dots flying across the canvas */
function PacketLayer({ packets, servers, onDone }: {
  packets: Packet[]; servers: ServerState[]; onDone: (id: string) => void;
}) {
  const slotH = 100 / Math.max(servers.length, 1);
  return (
    <AnimatePresence>
      {packets.map((pkt) => {
        const idx = servers.findIndex((s) => s.id === pkt.serverId);
        const ty = idx * slotH + slotH / 2;
        const left = pkt.isError
          ? ["13%", "34%", "48%", "34%"] as string[]
          : ["13%", "34%", "62%", "66%"] as string[];
        const top = pkt.isError
          ? [`${ty}%`, `${ty}%`, `${ty}%`, `${ty}%`] as string[]
          : ["50%", "50%", `${ty}%`, `${ty}%`] as string[];
        return (
          <motion.div key={pkt.id}
            initial={{ left: "13%", top: "50%", opacity: 0 }}
            animate={{ left, top, opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            onAnimationComplete={() => onDone(pkt.id)}
            className={cn("absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 z-20",
              pkt.isError ? "bg-red-400" : "")}
            style={pkt.isError ? {} : { backgroundColor: pkt.clientColor }}
          />
        );
      })}
    </AnimatePresence>
  );
}

/** The one box we actually need: the simulation canvas */
function SimCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-52 bg-[#f9f9f6] rounded-xl border border-slate-200 overflow-hidden">
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Concept
// ══════════════════════════════════════════════════════════════════════════════
function ConceptSnapshot() {
  const [showWith, setShowWith] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["Without", "With"] as const).map((label, i) => (
          <button key={label} onClick={() => setShowWith(i === 1)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
              showWith === (i === 1)
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
            {label}
          </button>
        ))}
      </div>

      <div className="h-60 bg-[#f9f9f6] rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!showWith ? (
            <motion.div key="without" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Without Load Balancer</p>
              <div className="w-9 h-9 rounded-full border-2 border-blue-400 bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-slate-300 text-xl font-mono">↓</span>
              <div className="px-5 py-3 rounded-xl border-2 border-red-400 bg-red-50 flex flex-col items-center gap-1">
                <Server className="w-5 h-5 text-red-500" />
                <span className="text-[10px] font-bold font-mono text-slate-700">Server</span>
                <span className="text-[9px] text-red-500 font-semibold">overloaded</span>
              </div>
              <p className="text-xs text-red-500 font-medium">Single point of failure.</p>
            </motion.div>
          ) : (
            <motion.div key="with" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">With Load Balancer</p>
              <div className="flex gap-3">
                {CLIENT_COLORS.slice(0, 3).map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: c, backgroundColor: c + "22" }}>
                    <Users className="w-3.5 h-3.5" style={{ color: c }} />
                  </div>
                ))}
              </div>
              <span className="text-slate-300 text-xl font-mono">↓</span>
              <LBBubble size={18} />
              <div className="flex gap-6 text-slate-300 text-base font-mono"><span>↓</span><span>↓</span><span>↓</span></div>
              <div className="flex gap-3">
                {["A", "B", "C"].map((id) => (
                  <div key={id} className="px-3 py-2 rounded-xl border-2 border-emerald-400 bg-emerald-50 flex flex-col items-center gap-1">
                    <Server className="w-4 h-4 text-emerald-600" />
                    <span className="text-[9px] font-bold font-mono text-slate-700">Server {id}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        A load balancer distributes incoming traffic across multiple servers so no single server becomes overwhelmed.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Request Distribution
// ══════════════════════════════════════════════════════════════════════════════
function RequestDistributionSim() {
  const [servers, setServers] = useState<ServerState[]>(DEFAULT_SERVERS.map((s) => ({ ...s })));
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [rps, setRps] = useState(2);
  const [trafficSpike, setTrafficSpike] = useState(false);
  const rrRef = useRef(0);
  const removePacket = useCallback((id: string) => setPackets((p) => p.filter((x) => x.id !== id)), []);

  const getTarget = useCallback(() => {
    const active = servers.filter((s) => s.status !== "failed");
    if (!active.length) return null;
    const t = active[rrRef.current % active.length];
    rrRef.current = (rrRef.current + 1) % active.length;
    return t;
  }, [servers]);

  useEffect(() => {
    if (isPaused) return;
    const rate = trafficSpike ? rps * 4 : rps;
    const iv = setInterval(() => {
      const target = getTarget(); if (!target) return;
      const pkt: Packet = { id: Math.random().toString(36).slice(2), serverId: target.id, clientColor: CLIENT_COLORS[Math.floor(Math.random() * CLIENT_COLORS.length)], clientId: 0, isError: target.status === "failed" };
      setPackets((p) => [...p.slice(-30), pkt]);
      setServers((prev) => prev.map((s) => {
        if (s.id !== target.id) return s;
        const cpu = Math.min(100, s.cpu + 7 + Math.random() * 4); const conn = s.connections + 1;
        const status: ServerStatus = cpu > 85 ? "overloaded" : cpu > 60 ? "busy" : "healthy";
        return { ...s, cpu, connections: conn, queue: Math.max(0, conn - 3), status, requestsHandled: s.requestsHandled + 1 };
      }));
    }, Math.max(120, 1000 / rate));
    return () => clearInterval(iv);
  }, [isPaused, rps, trafficSpike, getTarget]);

  useEffect(() => {
    const iv = setInterval(() => {
      setServers((prev) => prev.map((s) => {
        const cpu = Math.max(0, s.cpu - 7); const conn = Math.max(0, s.connections - 1);
        const status: ServerStatus = s.status === "failed" ? "failed" : cpu > 85 ? "overloaded" : cpu > 60 ? "busy" : "healthy";
        return { ...s, cpu, connections: conn, queue: Math.max(0, conn - 3), status };
      }));
    }, 900);
    return () => clearInterval(iv);
  }, []);

  const reset = () => { setServers(DEFAULT_SERVERS.map((s) => ({ ...s }))); setPackets([]); rrRef.current = 0; };

  return (
    <div className="space-y-3">
      <SimCanvas>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {CLIENT_COLORS.slice(0, 3).map((c, i) => (
            <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: c, backgroundColor: c + "22" }}>
              <Users className="w-3 h-3" style={{ color: c }} />
            </div>
          ))}
        </div>
        <div className="absolute left-[33%] top-1/2 -translate-x-1/2 -translate-y-1/2"><LBBubble size={20} /></div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
          {servers.map((s) => <CanvasNode key={s.id} server={s} />)}
        </div>
        <PacketLayer packets={packets} servers={servers} onDone={removePacket} />
      </SimCanvas>

      <ServerBars servers={servers} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-32">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">
            {trafficSpike ? rps * 4 : rps} req/s
          </span>
          <input type="range" min={1} max={10} value={rps} onChange={(e) => setRps(+e.target.value)}
            className="flex-1 h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
        </div>
        <button onClick={() => setTrafficSpike((v) => !v)}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            trafficSpike ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-600 hover:border-slate-400")}>
          {trafficSpike ? "Spike ON" : "Spike"}
        </button>
        <button onClick={() => setIsPaused((v) => !v)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-400">
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button onClick={reset} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-400">
          Reset
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Algorithms
// ══════════════════════════════════════════════════════════════════════════════
const ALGORITHMS: { id: Algorithm; label: string; description: string }[] = [
  { id: "round-robin",       label: "Round Robin",       description: "Cycles through servers in order. Simple, ignores load." },
  { id: "least-connections", label: "Least Connections", description: "Routes to least busy server. Best for variable workloads." },
  { id: "random",            label: "Random",            description: "Picks randomly. Stateless — can create short hot spots." },
  { id: "weighted",          label: "Weighted RR",       description: "Stronger servers get more traffic proportional to weight." },
  { id: "ip-hash",           label: "IP Hash",           description: "Same client always hits same server. Enables session persistence." },
];

function AlgorithmSim() {
  const [algo, setAlgo] = useState<Algorithm>("round-robin");
  const [servers, setServers] = useState<ServerState[]>(DEFAULT_SERVERS.map((s, i) => ({ ...s, weight: i === 1 ? 3 : 1 })));
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const rrRef = useRef(0); const wRef = useRef(0);
  const removePacket = useCallback((id: string) => setPackets((p) => p.filter((x) => x.id !== id)), []);

  const getTarget = useCallback((clientId: number): ServerState | null => {
    const active = servers.filter((s) => s.status !== "failed");
    if (!active.length) return null;
    if (algo === "round-robin") { const t = active[rrRef.current % active.length]; rrRef.current++; return t; }
    if (algo === "least-connections") return [...active].sort((a, b) => a.connections - b.connections)[0];
    if (algo === "random") return active[Math.floor(Math.random() * active.length)];
    if (algo === "weighted") { const pool: ServerState[] = []; active.forEach((s) => { for (let i = 0; i < s.weight; i++) pool.push(s); }); return pool[wRef.current % pool.length] ?? null; }
    if (algo === "ip-hash") return active[clientId % active.length];
    return active[0];
  }, [algo, servers]);

  // Reset rotation counters and server/packet state when the algorithm changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { rrRef.current = 0; wRef.current = 0; setServers(DEFAULT_SERVERS.map((s, i) => ({ ...s, weight: i === 1 ? 3 : 1 }))); setPackets([]); }, [algo]);

  useEffect(() => {
    if (isPaused) return;
    const iv = setInterval(() => {
      const clientId = Math.floor(Math.random() * 5);
      const target = getTarget(clientId); if (!target) return;
      wRef.current++;
      setPackets((p) => [...p.slice(-20), { id: Math.random().toString(36).slice(2), serverId: target.id, clientColor: CLIENT_COLORS[clientId], clientId, isError: false }]);
      setServers((prev) => prev.map((s) => {
        if (s.id !== target.id) return s;
        const cpu = Math.min(100, s.cpu + 6); const conn = s.connections + 1;
        const status: ServerStatus = cpu > 85 ? "overloaded" : cpu > 60 ? "busy" : "healthy";
        return { ...s, cpu, connections: conn, status, requestsHandled: s.requestsHandled + 1 };
      }));
    }, 550);
    return () => clearInterval(iv);
  }, [isPaused, getTarget]);

  useEffect(() => {
    const iv = setInterval(() => {
      setServers((prev) => prev.map((s) => { const cpu = Math.max(0, s.cpu - 5); const conn = Math.max(0, s.connections - 1); const status: ServerStatus = cpu > 85 ? "overloaded" : cpu > 60 ? "busy" : "healthy"; return { ...s, cpu, connections: conn, status }; }));
    }, 900);
    return () => clearInterval(iv);
  }, []);

  const total = servers.reduce((s, x) => s + x.requestsHandled, 0);
  const info = ALGORITHMS.find((a) => a.id === algo)!;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ALGORITHMS.map((a) => (
          <button key={a.id} onClick={() => setAlgo(a.id)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              algo === a.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
            {a.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        <span className="font-semibold text-slate-700">{info.label}:</span> {info.description}
        {algo === "weighted" && <span className="text-indigo-600"> Server B has weight 3 — gets ~3× more traffic.</span>}
        {algo === "ip-hash" && <span className="text-indigo-600"> Each dot color = same client → same server every time.</span>}
      </p>

      <SimCanvas>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {CLIENT_COLORS.slice(0, 3).map((c, i) => (
            <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: c, backgroundColor: c + "22" }}>
              <Users className="w-3 h-3" style={{ color: c }} />
            </div>
          ))}
        </div>
        <div className="absolute left-[33%] top-1/2 -translate-x-1/2 -translate-y-1/2"><LBBubble size={18} /></div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
          {servers.map((s) => (
            <div key={s.id} className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border w-28 transition-colors", statusBorder(s.status), statusBg(s.status))}>
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot(s.status))} />
              <span className="text-[9px] font-bold font-mono text-slate-700 flex-1">{s.label}</span>
              {algo === "weighted" && <span className="text-[8px] font-mono text-slate-400">w={s.weight}</span>}
            </div>
          ))}
        </div>
        <PacketLayer packets={packets} servers={servers} onDone={removePacket} />
      </SimCanvas>

      <div className="flex gap-4">
        {servers.map((s) => (
          <div key={s.id} className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-600">
              <span>{s.label}</span>
              <span className="font-mono text-slate-400">{total > 0 ? Math.round((s.requestsHandled / total) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${total > 0 ? (s.requestsHandled / total) * 100 : 0}%` }}
                className="h-full bg-slate-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setIsPaused((v) => !v)}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-400">
        {isPaused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Failure Handling
// ══════════════════════════════════════════════════════════════════════════════
function FailureSim() {
  const [servers, setServers] = useState<ServerState[]>(DEFAULT_SERVERS.map((s) => ({ ...s })));
  const [packets, setPackets] = useState<Packet[]>([]);
  const [healthChecks, setHealthChecks] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const rrRef = useRef(0);
  const removePacket = useCallback((id: string) => setPackets((p) => p.filter((x) => x.id !== id)), []);

  const getTarget = useCallback(() => {
    const pool = healthChecks ? servers.filter((s) => s.status !== "failed") : servers;
    if (!pool.length) return null;
    const t = pool[rrRef.current % pool.length]; rrRef.current++; return t;
  }, [servers, healthChecks]);

  useEffect(() => {
    if (isPaused) return;
    const iv = setInterval(() => {
      const target = getTarget(); if (!target) return;
      const isError = target.status === "failed";
      setPackets((p) => [...p.slice(-20), { id: Math.random().toString(36).slice(2), serverId: target.id, clientColor: isError ? "#ef4444" : "#3b82f6", clientId: 0, isError }]);
      if (!isError) setServers((prev) => prev.map((s) => { if (s.id !== target.id) return s; const cpu = Math.min(100, s.cpu + 7); return { ...s, connections: s.connections + 1, cpu, requestsHandled: s.requestsHandled + 1 }; }));
    }, 650);
    return () => clearInterval(iv);
  }, [isPaused, getTarget]);

  useEffect(() => {
    const iv = setInterval(() => {
      setServers((prev) => prev.map((s) => ({ ...s, cpu: Math.max(0, s.cpu - 5), connections: Math.max(0, s.connections - 1) })));
    }, 900);
    return () => clearInterval(iv);
  }, []);

  const killServer = (id: string) => setServers((prev) => prev.map((s) => s.id === id ? { ...s, status: "failed", cpu: 0, connections: 0, queue: 0 } : s));
  const recoverServer = (id: string) => setServers((prev) => prev.map((s) => s.id === id ? { ...s, status: "healthy" } : s));
  const errorCount = packets.filter((p) => p.isError).length;
  const activeCount = servers.filter((s) => s.status !== "failed").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={() => setHealthChecks((v) => !v)}
          className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            healthChecks ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
          {healthChecks ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
          Health Checks {healthChecks ? "ON" : "OFF"}
        </button>
        <span className="text-xs text-slate-400">
          {healthChecks ? "Failed servers skipped automatically." : "Traffic hits dead servers — errors occur."}
        </span>
      </div>

      <SimCanvas>
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full border-2 border-blue-300 bg-blue-50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>
        <div className="absolute left-[33%] top-1/2 -translate-x-1/2 -translate-y-1/2"><LBBubble size={20} /></div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
          {servers.map((s) => <CanvasNode key={s.id} server={s} onKill={() => killServer(s.id)} onRecover={() => recoverServer(s.id)} showControls />)}
        </div>
        <PacketLayer packets={packets} servers={servers} onDone={removePacket} />
      </SimCanvas>

      <div className="flex items-center gap-5 text-xs text-slate-600">
        <span><span className="font-bold text-slate-900">{activeCount}</span> <span className="text-slate-400">active</span></span>
        <span><span className="font-bold text-slate-900">{servers.length - activeCount}</span> <span className="text-slate-400">down</span></span>
        <span><span className="font-bold text-red-500">{errorCount}</span> <span className="text-slate-400">errors (live)</span></span>
      </div>

      <p className="text-xs text-slate-400">
        Click × to kill a server, + to recover. Toggle health checks to see the difference.
      </p>

      <button onClick={() => setIsPaused((v) => !v)}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-400">
        {isPaused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Scaling
// ══════════════════════════════════════════════════════════════════════════════
function ScalingSim() {
  const [servers, setServers] = useState<ServerState[]>(DEFAULT_SERVERS.slice(0, 2).map((s) => ({ ...s })));
  const [traffic, setTraffic] = useState(2);
  const [flashSale, setFlashSale] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const rrRef = useRef(0);
  const removePacket = useCallback((id: string) => setPackets((p) => p.filter((x) => x.id !== id)), []);
  const effectiveRps = flashSale ? traffic * 5 : traffic;

  const addServer = () => {
    if (servers.length >= 6) return;
    const id = String.fromCharCode(65 + servers.length);
    setServers((prev) => [...prev, { id, label: `Server ${id}`, connections: 0, cpu: 0, queue: 0, status: "healthy", requestsHandled: 0, weight: 1 }]);
  };
  const removeServer = () => { if (servers.length <= 1) return; setServers((prev) => prev.slice(0, -1)); };

  useEffect(() => {
    if (isPaused) return;
    const iv = setInterval(() => {
      const active = servers.filter((s) => s.status !== "failed"); if (!active.length) return;
      const target = active[rrRef.current % active.length]; rrRef.current++;
      setPackets((p) => [...p.slice(-30), { id: Math.random().toString(36).slice(2), serverId: target.id, clientColor: CLIENT_COLORS[Math.floor(Math.random() * CLIENT_COLORS.length)], clientId: 0, isError: false }]);
      setServers((prev) => prev.map((s) => {
        if (s.id !== target.id) return s;
        const cpu = Math.min(100, s.cpu + (effectiveRps / Math.max(1, servers.length)) * 3.5);
        const conn = s.connections + 1;
        const status: ServerStatus = cpu > 85 ? "overloaded" : cpu > 60 ? "busy" : "healthy";
        return { ...s, cpu, connections: conn, status, requestsHandled: s.requestsHandled + 1 };
      }));
    }, Math.max(80, 800 / effectiveRps));
    return () => clearInterval(iv);
  }, [isPaused, effectiveRps, servers]);

  useEffect(() => {
    const iv = setInterval(() => {
      setServers((prev) => prev.map((s) => { const cpu = Math.max(0, s.cpu - 8); const conn = Math.max(0, s.connections - 1); const status: ServerStatus = cpu > 85 ? "overloaded" : cpu > 60 ? "busy" : "healthy"; return { ...s, cpu, connections: conn, status }; }));
    }, 800);
    return () => clearInterval(iv);
  }, []);

  const avgCpu = servers.reduce((s, x) => s + x.cpu, 0) / (servers.length || 1);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={addServer} disabled={servers.length >= 6}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-400 bg-emerald-50 text-emerald-700 text-xs font-semibold disabled:opacity-40">
          <Plus className="w-3 h-3" /> Add Server
        </button>
        <button onClick={removeServer} disabled={servers.length <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-400 bg-red-50 text-red-600 text-xs font-semibold disabled:opacity-40">
          <Minus className="w-3 h-3" /> Remove
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-28">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">Traffic ×{effectiveRps}</span>
          <input type="range" min={1} max={8} value={traffic} onChange={(e) => setTraffic(+e.target.value)}
            className="flex-1 h-1 rounded-full bg-slate-200 appearance-none cursor-pointer accent-slate-700" />
        </div>
        <button onClick={() => setFlashSale((v) => !v)}
          className={cn("px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
            flashSale ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-600 hover:border-slate-400")}>
          Flash Sale
        </button>
        <button onClick={() => setIsPaused((v) => !v)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-400">
          {isPaused ? "Resume" : "Pause"}
        </button>
      </div>

      <SimCanvas>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
          {Array.from({ length: Math.min(effectiveRps, 5) }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-300 flex items-center justify-center">
              <Users className="w-2.5 h-2.5 text-blue-500" />
            </div>
          ))}
        </div>
        <div className="absolute left-[33%] top-1/2 -translate-x-1/2 -translate-y-1/2"><LBBubble size={18} /></div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <AnimatePresence>
            {servers.map((s) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                <CanvasNode server={s} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <PacketLayer packets={packets} servers={servers} onDone={removePacket} />
      </SimCanvas>

      <div className="flex items-center gap-5 text-xs text-slate-600">
        <span><span className="font-bold text-slate-900">{servers.length}</span> <span className="text-slate-400">servers</span></span>
        <span><span className={cn("font-bold", avgCpu > 80 ? "text-red-600" : "text-slate-900")}>{Math.round(avgCpu)}%</span> <span className="text-slate-400">avg CPU</span></span>
        <span><span className="font-bold text-slate-900">{Math.max(20, Math.round(avgCpu * 1.8))}ms</span> <span className="text-slate-400">avg latency</span></span>
        {flashSale && <span className="font-semibold text-amber-600">Flash sale active — {effectiveRps}× traffic</span>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Walkthrough
// ══════════════════════════════════════════════════════════════════════════════
const STEPS = [
  { title: "Single Server Overloaded", desc: "All traffic hits one server. CPU spikes, latency rises, and the system is one crash away from total failure.", servers: ["A"], statuses: ["overloaded"] as ServerStatus[], showLB: false, showBackupLB: false },
  { title: "Add a Second Server", desc: "Traffic splits between two servers. Load drops by half — but who decides which requests go where?", servers: ["A", "B"], statuses: ["busy", "busy"] as ServerStatus[], showLB: false, showBackupLB: false },
  { title: "Introduce a Load Balancer", desc: "The load balancer distributes traffic automatically. Both servers stay healthy.", servers: ["A", "B"], statuses: ["healthy", "healthy"] as ServerStatus[], showLB: true, showBackupLB: false },
  { title: "Traffic Keeps Growing", desc: "Add more servers — the load balancer redistributes traffic instantly.", servers: ["A", "B", "C"], statuses: ["healthy", "healthy", "healthy"] as ServerStatus[], showLB: true, showBackupLB: false },
  { title: "Server B Fails", desc: "Health checks detect the failure. Traffic reroutes to A and C — no manual intervention needed.", servers: ["A", "B", "C"], statuses: ["healthy", "failed", "healthy"] as ServerStatus[], showLB: true, showBackupLB: false },
  { title: "Redundant Load Balancers", desc: "The LB is now the single point of failure. A backup in active-passive mode gives true high availability.", servers: ["A", "B", "C"], statuses: ["healthy", "healthy", "healthy"] as ServerStatus[], showLB: true, showBackupLB: true },
];

function SolutionWalkthrough() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {STEPS.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={cn("h-1.5 rounded-full transition-all",
              i === step ? "bg-slate-900 w-6" : i < step ? "bg-slate-400 w-2" : "bg-slate-200 w-2")} />
        ))}
        <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">{step + 1} / {STEPS.length}</span>
      </div>

      <div className="h-14">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="text-sm font-bold text-slate-900">{current.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{current.desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="h-44 bg-[#f9f9f6] rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center gap-5 px-6">
        <div className="flex flex-col gap-2 shrink-0">
          {[0, 1].map((i) => (
            <div key={i} className="w-7 h-7 rounded-full border-2 border-blue-300 bg-blue-50 flex items-center justify-center">
              <Users className="w-3 h-3 text-blue-500" />
            </div>
          ))}
        </div>

        <span className="text-slate-200 text-lg font-mono shrink-0">→</span>

        <div className="w-14 shrink-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {current.showLB ? (
              <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-1">
                {current.showBackupLB && (
                  <div className="w-9 h-9 rounded-full bg-violet-100 border-2 border-violet-400 flex items-center justify-center mb-0.5">
                    <Network className="w-3 h-3 text-violet-600" />
                  </div>
                )}
                <LBBubble size={16} />
                {current.showBackupLB && <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Active-Passive</span>}
              </motion.div>
            ) : <div />}
          </AnimatePresence>
        </div>

        {current.showLB && <span className="text-slate-200 text-lg font-mono shrink-0">→</span>}

        <div className="flex flex-col gap-1.5 shrink-0">
          <AnimatePresence>
            {current.servers.map((id, i) => {
              const st = current.statuses[i];
              return (
                <motion.div key={id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                  className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 w-24 transition-colors", statusBorder(st), statusBg(st))}>
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot(st))} />
                  <span className="text-[9px] font-bold font-mono text-slate-700 flex-1">Server {id}</span>
                  {st === "overloaded" && <span className="text-[7px] font-bold text-red-500">high</span>}
                  {st === "failed" && <span className="text-[7px] font-bold text-slate-400">down</span>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {step === STEPS.length - 1 ? (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Complete
          </div>
        ) : (
          <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — Challenges
// ══════════════════════════════════════════════════════════════════════════════
const CHALLENGES = [
  { title: "Handle 5,000 req/sec", desc: "Your app gets 5,000 requests per second. What do you need?", hint: "A single server has limits. Think distributed.", choices: ["Upgrade to a bigger single server", "Multiple servers behind a load balancer", "Add a CDN only", "Increase database connections"], correct: 1, explanation: "Horizontal scaling with a load balancer handles this scale. A single bigger server still hits limits, and CDN only helps static content." },
  { title: "Reduce Latency to <100ms", desc: "Average latency is 320ms. Users are leaving. What helps most?", hint: "Queuing time is the hidden killer.", choices: ["Switch to least-connections algorithm", "Switch to round-robin algorithm", "Add more servers to reduce per-server load", "Use IP hash for session stickiness"], correct: 2, explanation: "Adding servers reduces per-server queue size, directly cutting latency. The balancing algorithm matters less than raw server capacity." },
  { title: "Server Crashes Mid-Traffic", desc: "One of 3 servers suddenly dies. What happens with health checks on?", hint: "Health checks detect failures automatically.", choices: ["All traffic stops until manual restart", "Users see errors until you fix it", "Load balancer detects failure and reroutes", "All servers restart together"], correct: 2, explanation: "Health checks let the load balancer detect the failure and reroute to healthy servers immediately — no manual intervention required." },
  { title: "Black Friday Traffic", desc: "Expecting 50× traffic in 2 hours. How do you prepare?", hint: "Think ahead, not reactive.", choices: ["Hope the single server holds", "Pre-scale horizontally before the spike", "Switch to weighted algorithm only", "Disable health checks to reduce overhead"], correct: 1, explanation: "Pre-scaling before the event ensures you're ready. Reactive scaling during a spike is too slow. Disabling health checks makes failures worse." },
  { title: "Low Cost + Spike Support", desc: "Traffic is low 90% of the time but spikes unpredictably. Cheapest solution?", hint: "Pay for what you use.", choices: ["Run maximum servers always", "Run minimum servers and manually scale", "Auto-scaling — add/remove servers dynamically", "One very large server"], correct: 2, explanation: "Auto-scaling dynamically matches capacity to demand — you pay only for what you need. Manual scaling is too slow for unpredictable spikes." },
];

function MiniChallenges() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const challenge = CHALLENGES[idx];

  const submit = () => {
    if (selected === null) return;
    setRevealed(true);
    if (selected === challenge.correct && !answered.has(idx)) { setScore((s) => s + 1); setAnswered((p) => new Set(p).add(idx)); }
  };
  const goTo = (i: number) => { setIdx(i); setSelected(null); setRevealed(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-900 tabular-nums">{score} / {CHALLENGES.length}</span>
        </div>
        <div className="flex gap-1.5">
          {CHALLENGES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={cn("h-1.5 rounded-full transition-all",
                i === idx ? "bg-slate-900 w-5" : answered.has(i) ? "bg-emerald-500 w-2" : "bg-slate-200 w-2")} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-900">{challenge.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{challenge.desc}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 italic">Hint: {challenge.hint}</p>
          </div>

          <div className="space-y-1.5">
            {challenge.choices.map((choice, i) => (
              <button key={i} onClick={() => { if (!revealed) setSelected(i); }}
                className={cn("w-full text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all",
                  !revealed && selected === i ? "border-slate-700 bg-slate-50" :
                  revealed && i === challenge.correct ? "border-emerald-400 bg-emerald-50 text-emerald-800" :
                  revealed && selected === i ? "border-red-400 bg-red-50 text-red-700" :
                  "border-slate-200 bg-white hover:border-slate-300")}>
                <span className="font-mono text-slate-300 mr-2">{String.fromCharCode(65 + i)}.</span>
                {choice}
                {revealed && i === challenge.correct && <span className="ml-2 text-emerald-600 font-semibold">Correct</span>}
                {revealed && selected === i && i !== challenge.correct && <span className="ml-2 text-red-500 font-semibold">Wrong</span>}
              </button>
            ))}
          </div>

          <div className="min-h-[48px]">
            {revealed && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Why: </strong>{challenge.explanation}
              </motion.p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            {!revealed ? (
              <button onClick={submit} disabled={selected === null}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">
                Submit
              </button>
            ) : (
              <button onClick={() => goTo(Math.min(CHALLENGES.length - 1, idx + 1))} disabled={idx === CHALLENGES.length - 1}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">
                Next
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
const SECTIONS: { label: string; component: React.ReactNode }[] = [
  { label: "Concept",      component: <ConceptSnapshot /> },
  { label: "Distribution", component: <RequestDistributionSim /> },
  { label: "Algorithms",   component: <AlgorithmSim /> },
  { label: "Failure",      component: <FailureSim /> },
  { label: "Scaling",      component: <ScalingSim /> },
  { label: "Walkthrough",  component: <SolutionWalkthrough /> },
  { label: "Challenges",   component: <MiniChallenges /> },
];

export function LoadBalancingVisual() {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
      {SECTIONS.map((s) => (
        <div key={s.label} className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">{s.label}</p>
          {s.component}
        </div>
      ))}
    </div>
  );
}
