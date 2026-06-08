"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Check,
  CircleDot,
  Database,
  GitBranch,
  Server,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scenario = "small" | "viral" | "global" | "unstable";
type Algorithm = "round-robin" | "least-connections" | "weighted" | "ip-hash" | "random";
type Tab = "walkthrough" | "compare" | "practice";

type ServerState = {
  id: string;
  name: string;
  failed: boolean;
  load: number;
  utilization: number;
  latency: number;
  activeConnections: number;
  receivesTraffic: boolean;
};

const scenarios: Record<Scenario, { label: string; requests: number; servers: number; capacity: number; failed: string[]; algorithm: Algorithm; note: string }> = {
  small: { label: "Small App", requests: 260, servers: 3, capacity: 140, failed: [], algorithm: "round-robin", note: "Even routing is enough when servers are similar." },
  viral: { label: "Viral Traffic", requests: 860, servers: 4, capacity: 190, failed: [], algorithm: "least-connections", note: "High traffic needs load-aware routing." },
  global: { label: "Global Users", requests: 620, servers: 4, capacity: 170, failed: [], algorithm: "ip-hash", note: "Sticky sessions help users keep local state." },
  unstable: { label: "Unstable Servers", requests: 520, servers: 3, capacity: 150, failed: ["B"], algorithm: "least-connections", note: "Health checks keep traffic away from failed nodes." },
};

const algorithms: Record<Algorithm, { label: string; changed: string; matters: string; use: string; tradeoff: string }> = {
  "round-robin": {
    label: "Round Robin",
    changed: "Requests are distributed evenly across servers.",
    matters: "This works well when servers have similar capacity.",
    use: "Simple apps with uniform servers.",
    tradeoff: "It ignores current load, so slow servers may still receive traffic.",
  },
  "least-connections": {
    label: "Least Connections",
    changed: "New requests go to the server with the fewest active connections.",
    matters: "This helps when requests take different amounts of time.",
    use: "Mixed workloads and uneven request duration.",
    tradeoff: "It requires the load balancer to track server state.",
  },
  weighted: {
    label: "Weighted Round Robin",
    changed: "Larger servers receive more traffic.",
    matters: "This is useful when servers have different capacities.",
    use: "Fleets with different server sizes.",
    tradeoff: "Bad weights can create overload hotspots.",
  },
  "ip-hash": {
    label: "IP Hash",
    changed: "The same user tends to reach the same server.",
    matters: "This supports sticky sessions.",
    use: "Stateful sessions and user affinity.",
    tradeoff: "It can create uneven distribution if many users hash to the same server.",
  },
  random: {
    label: "Random",
    changed: "Requests are sent randomly.",
    matters: "It is simple and low overhead.",
    use: "Low overhead distribution where precision is not critical.",
    tradeoff: "It can be less predictable under uneven traffic.",
  },
};

const serverIds = ["A", "B", "C", "D"];
const baseWeights = [1, 1.25, 0.9, 1.55];
const pageMotion = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } } };
const cardMotion = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: 0.24, ease: "easeInOut" } };

function DashboardCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <motion.section {...cardMotion} className={cn("rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</motion.section>;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      {subtitle && <p className="mt-2 max-w-[720px] text-base leading-7 text-slate-600">{subtitle}</p>}
    </div>
  );
}

function RangeControl({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        <motion.span key={value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums text-slate-950">
          {value}{suffix}
        </motion.span>
      </span>
      <input className="mt-3 w-full accent-slate-900" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
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

function getShares(algorithm: Algorithm, count: number, stickySessions: boolean) {
  const ids = serverIds.slice(0, count);
  if (algorithm === "weighted") return ids.map((_, index) => baseWeights[index]);
  if (algorithm === "least-connections") return ids.map((_, index) => 1 + (count - index) * 0.18);
  if (algorithm === "ip-hash") return ids.map((_, index) => (stickySessions ? [1.55, 1.1, 0.8, 0.55][index] : [1.3, 1.05, 0.9, 0.75][index]));
  if (algorithm === "random") return ids.map((_, index) => [1.22, 0.82, 1.08, 0.88][index]);
  return ids.map(() => 1);
}

function useLoadBalancerModel({
  requestRate,
  serverCount,
  serverCapacity,
  failedServers,
  healthChecks,
  algorithm,
  stickySessions,
}: {
  requestRate: number;
  serverCount: number;
  serverCapacity: number;
  failedServers: Set<string>;
  healthChecks: boolean;
  algorithm: Algorithm;
  stickySessions: boolean;
}) {
  return useMemo(() => {
    const ids = serverIds.slice(0, serverCount);
    const routeable = ids.filter((id) => !(healthChecks && failedServers.has(id)));
    const shares = getShares(algorithm, serverCount, stickySessions);
    const shareTotal = ids.reduce((total, id, index) => total + (routeable.includes(id) ? shares[index] : 0), 0) || 1;

    const servers: ServerState[] = ids.map((id, index) => {
      const failed = failedServers.has(id);
      const receivesTraffic = !healthChecks || !failed;
      const share = receivesTraffic ? shares[index] / shareTotal : 0;
      const load = Math.max(0, Math.round(requestRate * share));
      const effectiveCapacity = Math.round(serverCapacity * baseWeights[index]);
      const utilization = Math.min(140, Math.round((load / effectiveCapacity) * 100));
      return {
        id,
        name: `Server ${id}`,
        failed,
        load,
        utilization,
        latency: Math.round(44 + utilization * 1.05 + (failed && !healthChecks ? 90 : 0)),
        activeConnections: Math.round(load / 7 + utilization / 4),
        receivesTraffic,
      };
    });

    const failedTraffic = servers.filter((server) => server.failed && server.receivesTraffic).reduce((sum, server) => sum + server.load, 0);
    const overloadedTraffic = servers.filter((server) => server.utilization > 100 && !server.failed).reduce((sum, server) => sum + server.load * 0.12, 0);
    const droppedRequests = Math.round(failedTraffic + overloadedTraffic);
    const healthyServers = servers.filter((server) => !server.failed).length;
    const avgUtilization = Math.round(servers.reduce((sum, server) => sum + Math.min(server.utilization, 100), 0) / servers.length);
    const hotspotRisk = Math.max(...servers.map((server) => server.utilization)) - Math.min(...servers.map((server) => server.utilization));
    const errorRate = Math.min(100, Math.round((droppedRequests / requestRate) * 100));
    const avgLatency = Math.round(servers.reduce((sum, server) => sum + server.latency * Math.max(server.load, 1), 0) / servers.reduce((sum, server) => sum + Math.max(server.load, 1), 0));
    const availability = Math.max(0, 100 - errorRate - (healthyServers === 0 ? 100 : 0));

    return {
      servers,
      metrics: {
        avgLatency,
        errorRate,
        utilization: avgUtilization,
        requests: requestRate,
        availability,
        hotspotRisk,
        droppedRequests,
        healthyServers,
      },
    };
  }, [algorithm, failedServers, healthChecks, requestRate, serverCapacity, serverCount, stickySessions]);
}

function ScenarioHero({ scenario, onScenario }: { scenario: Scenario; onScenario: (scenario: Scenario) => void }) {
  return (
    <DashboardCard className="overflow-hidden">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(scenarios) as Scenario[]).map((id) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => onScenario(id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-white p-4 text-left transition",
                scenario === id ? "border-2 border-slate-900 shadow-lg" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="text-base font-bold text-slate-950">{scenarios[id].label}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">{scenarios[id].note}</span>
              <span className="mt-auto pt-4">
                <span className="block text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">Recommended</span>
                <span className="mt-1 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-700">
                  {algorithms[scenarios[id].algorithm].label}
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

function AlgorithmSelector({ algorithm, onAlgorithm }: { algorithm: Algorithm; onAlgorithm: (algorithm: Algorithm) => void }) {
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Algorithms" title="Pick a routing strategy" subtitle="Every strategy changes how requests move through the same architecture." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(Object.keys(algorithms) as Algorithm[]).map((id) => {
          const item = algorithms[id];
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onAlgorithm(id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "rounded-[1.5rem] border bg-white p-4 text-left transition",
                algorithm === id ? "border-2 border-slate-900 shadow-lg scale-[1.01]" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="block text-base font-bold text-slate-950">{item.label}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">{item.changed}</span>
              <span className="mt-3 block text-sm font-semibold text-slate-700">Best: {item.use}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">Tradeoff: {item.tradeoff}</span>
            </motion.button>
          );
        })}
      </div>
    </DashboardCard>
  );
}

function TrafficControls({
  requestRate,
  setRequestRate,
  serverCount,
  setServerCount,
  serverCapacity,
  setServerCapacity,
  stickySessions,
  setStickySessions,
  healthChecks,
  setHealthChecks,
}: {
  requestRate: number;
  setRequestRate: (value: number) => void;
  serverCount: number;
  setServerCount: (value: number) => void;
  serverCapacity: number;
  setServerCapacity: (value: number) => void;
  stickySessions: boolean;
  setStickySessions: (value: boolean) => void;
  healthChecks: boolean;
  setHealthChecks: (value: boolean) => void;
}) {
  return (
    <DashboardCard className="max-h-[520px] overflow-hidden">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700"><Settings2 className="h-5 w-5" /></span>
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Traffic controls</h2>
          <p className="text-base text-slate-600">Change inputs and watch the system react.</p>
        </div>
      </div>
      <div className="space-y-4">
        <RangeControl label="Request rate" value={requestRate} min={100} max={1000} step={20} suffix="/sec" onChange={setRequestRate} />
        <RangeControl label="Number of servers" value={serverCount} min={2} max={4} step={1} onChange={setServerCount} />
        <RangeControl label="Server capacity" value={serverCapacity} min={90} max={240} step={10} suffix=" rps" onChange={setServerCapacity} />
        <div className="grid grid-cols-2 gap-3">
          <ToggleChip active={stickySessions} label={stickySessions ? "Sticky on" : "Sticky off"} onClick={() => setStickySessions(!stickySessions)} />
          <ToggleChip active={healthChecks} label={healthChecks ? "Checks on" : "Checks off"} onClick={() => setHealthChecks(!healthChecks)} />
        </div>
      </div>
    </DashboardCard>
  );
}

function TrafficDot({ delay, y, load }: { delay: number; y: number; load: number }) {
  return (
    <motion.span
      className="absolute left-[37%] top-1/2 h-2.5 w-2.5 rounded-full bg-slate-800/60"
      style={{ y }}
      animate={{ x: ["0vw", "20vw"], opacity: [0, 0.75, 0] }}
      transition={{ duration: Math.max(1.4, 3.2 - load / 340), repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function ServerNode({ server }: { server: ServerState }) {
  const overloaded = server.utilization > 88 && !server.failed;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 23 }}
      className={cn(
        "group relative rounded-2xl border bg-white p-4 transition",
        server.failed ? "border-red-200 bg-red-50 text-red-900" : overloaded ? "border-amber-300 bg-amber-50" : "border-slate-200",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-slate-700" />
          <span className="text-base font-bold text-slate-950">{server.name}</span>
        </div>
        <span className={cn("h-3 w-3 rounded-full", server.failed ? "bg-red-500" : "bg-emerald-500")} />
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <motion.div
          className={cn("h-full rounded-full", server.failed ? "bg-red-400" : overloaded ? "bg-amber-500" : "bg-emerald-500")}
          animate={{ width: `${Math.min(100, server.utilization)}%` }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-sm text-slate-600">
        <span>{server.load} rps</span>
        <span>{server.utilization}%</span>
      </div>
      <div className="pointer-events-none absolute right-4 top-12 z-20 hidden w-56 rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-lg group-hover:block">
        <p className="font-bold text-slate-950">{server.name}</p>
        <p className="mt-1 text-slate-600">Load: {server.load} rps</p>
        <p className="text-slate-600">Connections: {server.activeConnections}</p>
        <p className="text-slate-600">Health: {server.failed ? "failed" : "healthy"}</p>
        <p className="text-slate-600">Latency: {server.latency}ms</p>
      </div>
    </motion.div>
  );
}

function ArchitectureCanvas({ servers, requestRate, healthChecks }: { servers: ServerState[]; requestRate: number; healthChecks: boolean }) {
  const dots = Math.min(18, Math.max(6, Math.round(requestRate / 70)));
  return (
    <DashboardCard className="min-h-[420px] max-h-[520px] overflow-hidden">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Live architecture</h2>
          <p className="text-base text-slate-600">Traffic dots move toward the servers receiving load.</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold", healthChecks ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
          {healthChecks ? "Health checks enabled" : "Health checks disabled"}
        </span>
      </div>
      <div
        className="relative min-h-[390px] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5"
        style={{ backgroundImage: "radial-gradient(circle, rgba(100,116,139,0.18) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 820 390" preserveAspectRatio="none" aria-hidden="true">
          <path d="M130 185 C220 185 250 185 330 185" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
          <path d="M470 185 C545 80 605 70 705 70" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
          <path d="M470 185 C555 150 605 145 705 145" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
          <path d="M470 185 C555 225 605 230 705 230" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
          <path d="M470 185 C545 310 605 315 705 315" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
          <path d="M705 350 C640 355 565 335 520 300" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
        </svg>
        <div className="absolute left-5 top-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Users className="h-6 w-6 text-slate-700" />
          <p className="mt-2 text-base font-bold text-slate-950">Clients</p>
          <p className="text-sm text-slate-600">{requestRate}/sec</p>
        </div>
        <div className="absolute left-[39%] top-1/2 -translate-y-1/2 rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-lg">
          <GitBranch className="h-7 w-7 text-slate-800" />
          <p className="mt-2 text-base font-bold text-slate-950">Load Balancer</p>
          <p className="text-sm text-slate-600">routes requests</p>
        </div>
        <div className="absolute bottom-5 right-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Database className="h-6 w-6 text-slate-700" />
          <p className="mt-2 text-base font-bold text-slate-950">Database</p>
        </div>
        <div className="absolute right-5 top-5 grid w-[34%] gap-3">
          <AnimatePresence initial={false}>
            {servers.map((server) => <ServerNode key={server.id} server={server} />)}
          </AnimatePresence>
        </div>
        {Array.from({ length: dots }).map((_, index) => (
          <TrafficDot key={index} delay={index * 0.16} y={(index % Math.max(servers.length, 1)) * 78 - 126} load={requestRate} />
        ))}
      </div>
    </DashboardCard>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }) {
  return (
    <motion.div
      layout
      className={cn(
        "rounded-[1.5rem] border bg-white p-5 shadow-sm transition",
        tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "bad" && "border-red-200 bg-red-50 text-red-800",
        tone === "neutral" && "border-slate-200 text-slate-900",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <motion.div key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-2xl font-bold tabular-nums text-slate-950">
        {value}
      </motion.div>
    </motion.div>
  );
}

function MetricsSummary({ metrics }: { metrics: ReturnType<typeof useLoadBalancerModel>["metrics"] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={Activity} label="Avg Latency" value={`${metrics.avgLatency}ms`} tone={metrics.avgLatency < 120 ? "good" : metrics.avgLatency < 180 ? "warn" : "bad"} />
      <MetricCard icon={AlertTriangle} label="Error Rate" value={`${metrics.errorRate}%`} tone={metrics.errorRate < 3 ? "good" : metrics.errorRate < 10 ? "warn" : "bad"} />
      <MetricCard icon={Server} label="Server Utilization" value={`${metrics.utilization}%`} tone={metrics.utilization < 70 ? "good" : metrics.utilization < 88 ? "warn" : "bad"} />
      <MetricCard icon={CircleDot} label="Requests/sec" value={`${metrics.requests}`} tone="neutral" />
      <MetricCard icon={ShieldCheck} label="Availability" value={`${metrics.availability}%`} tone={metrics.availability > 98 ? "good" : metrics.availability > 92 ? "warn" : "bad"} />
      <MetricCard icon={GitBranch} label="Hotspot Risk" value={`${metrics.hotspotRisk}`} tone={metrics.hotspotRisk < 28 ? "good" : metrics.hotspotRisk < 55 ? "warn" : "bad"} />
      <MetricCard icon={AlertTriangle} label="Dropped Requests" value={`${metrics.droppedRequests}`} tone={metrics.droppedRequests < 8 ? "good" : metrics.droppedRequests < 45 ? "warn" : "bad"} />
      <MetricCard icon={Check} label="Healthy Servers" value={`${metrics.healthyServers}`} tone={metrics.healthyServers >= 3 ? "good" : metrics.healthyServers >= 2 ? "warn" : "bad"} />
    </div>
  );
}

function InsightPanel({ algorithm }: { algorithm: Algorithm }) {
  const item = algorithms[algorithm];
  return (
    <DashboardCard>
      <h2 className="text-2xl font-bold text-slate-950">Insight</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div><p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p><p className="mt-2 text-base leading-7 text-slate-700">{item.changed}</p></div>
        <div><p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p><p className="mt-2 text-base leading-7 text-slate-700">{item.matters}</p></div>
        <div><p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Tradeoff</p><p className="mt-2 text-base leading-7 text-slate-700">{item.tradeoff}</p></div>
      </div>
    </DashboardCard>
  );
}

function FailureSimulation({
  failedServers,
  setFailedServers,
  healthChecks,
  setHealthChecks,
}: {
  failedServers: Set<string>;
  setFailedServers: (next: Set<string>) => void;
  healthChecks: boolean;
  setHealthChecks: (value: boolean) => void;
}) {
  const toggleFailure = (id: string) => {
    const next = new Set(failedServers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFailedServers(next);
  };

  return (
    <DashboardCard>
      <SectionHeader eyebrow="Failure simulation" title="Fail and recover servers" subtitle="With health checks enabled, failed servers stop receiving traffic." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {serverIds.slice(0, 3).map((id) => (
          <ToggleChip key={id} active={failedServers.has(id)} label={failedServers.has(id) ? `Recover ${id}` : `Fail Server ${id}`} onClick={() => toggleFailure(id)} />
        ))}
        <ToggleChip active={false} label="Recover All" onClick={() => setFailedServers(new Set())} />
        <ToggleChip active={healthChecks} label="Enable Checks" onClick={() => setHealthChecks(true)} />
        <ToggleChip active={!healthChecks} label="Disable Checks" onClick={() => setHealthChecks(false)} />
      </div>
    </DashboardCard>
  );
}

function ChallengeCards({ metrics, algorithm, serverCount, healthChecks }: { metrics: ReturnType<typeof useLoadBalancerModel>["metrics"]; algorithm: Algorithm; serverCount: number; healthChecks: boolean }) {
  const challenges = [
    { title: "Keep latency below 120ms", solved: metrics.avgLatency < 120 },
    { title: "Handle 2x traffic without errors", solved: metrics.errorRate < 4 && serverCount >= 4 },
    { title: "Survive one server failure", solved: healthChecks && metrics.availability >= 95 },
    { title: "Avoid server hotspot", solved: metrics.hotspotRisk < 35 },
    { title: "Pick sticky session strategy", solved: algorithm === "ip-hash" },
  ];

  return (
    <DashboardCard>
      <SectionHeader eyebrow="Mini challenges" title="Can the system meet the goal?" subtitle="Change controls above. Cards solve immediately when the system satisfies the condition." />
      <div className="grid gap-4 md:grid-cols-5">
        {challenges.map((challenge) => (
          <motion.div
            key={challenge.title}
            layout
            animate={challenge.solved ? { scale: [1, 1.025, 1] } : { scale: 1 }}
            className={cn(
              "rounded-[1.5rem] border p-4 transition",
              challenge.solved ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600",
            )}
          >
            <div className="flex min-h-11 items-start gap-3">
              <span className={cn("mt-1 rounded-full border p-1", challenge.solved ? "border-emerald-300 bg-white" : "border-slate-200")}>
                <Check className={cn("h-4 w-4", challenge.solved ? "text-emerald-600" : "text-slate-300")} />
              </span>
              <p className="text-base font-semibold leading-6">{challenge.title}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
}

function SolutionPanel({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const rows = [
    ["Round Robin", "Similar servers", "Ignores current load", "No"],
    ["Least Connections", "Uneven workloads", "Needs server state", "Yes"],
    ["Weighted Round Robin", "Mixed capacities", "Bad weights create hotspots", "No"],
    ["IP Hash", "Sticky sessions", "Can be uneven", "No"],
    ["Random", "Low overhead", "Less predictable", "No"],
  ];
  const practice = [
    "Why do we need a load balancer?",
    "What happens if health checks are disabled?",
    "When would you use Least Connections over Round Robin?",
    "Why can sticky sessions be useful?",
    "What is the tradeoff of Weighted Round Robin?",
  ];

  return (
    <section className="rounded-[1.5rem] border-2 border-slate-900 bg-white p-5 shadow-lg">
      <div className="flex flex-wrap gap-3">
        {(["walkthrough", "compare", "practice"] as Tab[]).map((id) => (
          <ToggleChip key={id} active={tab === id} label={id === "walkthrough" ? "Walkthrough" : id === "compare" ? "Compare" : "Interview / Practice"} onClick={() => setTab(id)} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tab === "walkthrough" && (
          <motion.div key="walkthrough" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              "Start with Round Robin and observe even distribution.",
              "Increase traffic and watch utilization rise.",
              "Add another server to reduce latency.",
              "Fail one server and compare health checks on/off.",
              "Switch to Least Connections for uneven workloads.",
              "Use Weighted Round Robin when stronger servers exist.",
            ].map((step, index) => <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-700"><span className="font-bold text-slate-950">Step {index + 1}: </span>{step}</div>)}
          </motion.div>
        )}
        {tab === "compare" && (
          <motion.div key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>{["Algorithm", "Best for", "Weakness", "State required?"].map((head) => <th key={head} className="p-4 font-bold">{head}</th>)}</tr></thead>
              <tbody>{rows.map((row) => <tr key={row[0]} className="border-t border-slate-200">{row.map((cell) => <td key={cell} className="p-4 text-slate-700">{cell}</td>)}</tr>)}</tbody>
            </table>
          </motion.div>
        )}
        {tab === "practice" && (
          <motion.div key="practice" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-3 md:grid-cols-2">
            {practice.map((question) => <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base font-semibold text-slate-700">{question}</div>)}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function LoadBalancerVisual() {
  const [scenario, setScenario] = useState<Scenario>("small");
  const [algorithm, setAlgorithm] = useState<Algorithm>("round-robin");
  const [requestRate, setRequestRate] = useState(260);
  const [serverCount, setServerCount] = useState(3);
  const [serverCapacity, setServerCapacity] = useState(140);
  const [stickySessions, setStickySessions] = useState(false);
  const [healthChecks, setHealthChecks] = useState(true);
  const [failedServers, setFailedServers] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("walkthrough");

  const applyScenario = (next: Scenario) => {
    const config = scenarios[next];
    setScenario(next);
    setRequestRate(config.requests);
    setServerCount(config.servers);
    setServerCapacity(config.capacity);
    setAlgorithm(config.algorithm);
    setFailedServers(new Set(config.failed));
    setStickySessions(config.algorithm === "ip-hash");
    setHealthChecks(true);
  };

  const model = useLoadBalancerModel({ requestRate, serverCount, serverCapacity, failedServers, healthChecks, algorithm, stickySessions });

  return (
    <motion.div {...pageMotion} className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <ScenarioHero scenario={scenario} onScenario={applyScenario} />
        <AlgorithmSelector algorithm={algorithm} onAlgorithm={setAlgorithm} />
        <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <TrafficControls
            requestRate={requestRate}
            setRequestRate={setRequestRate}
            serverCount={serverCount}
            setServerCount={setServerCount}
            serverCapacity={serverCapacity}
            setServerCapacity={setServerCapacity}
            stickySessions={stickySessions}
            setStickySessions={setStickySessions}
            healthChecks={healthChecks}
            setHealthChecks={setHealthChecks}
          />
          <ArchitectureCanvas servers={model.servers} requestRate={requestRate} healthChecks={healthChecks} />
        </div>
        <MetricsSummary metrics={model.metrics} />
        <InsightPanel algorithm={algorithm} />
        <FailureSimulation failedServers={failedServers} setFailedServers={setFailedServers} healthChecks={healthChecks} setHealthChecks={setHealthChecks} />
        <ChallengeCards metrics={model.metrics} algorithm={algorithm} serverCount={serverCount} healthChecks={healthChecks} />
        <SolutionPanel tab={tab} setTab={setTab} />
        <DashboardCard>
          <h2 className="text-2xl font-bold text-slate-950">Summary</h2>
          <ul className="mt-4 grid gap-3 text-base leading-7 text-slate-700 md:grid-cols-2">
            <li>Load balancers distribute requests so one server does not absorb all traffic.</li>
            <li>Algorithms change behavior: even routing, load-aware routing, weights, affinity, or randomness.</li>
            <li>Health checks protect availability by avoiding failed servers.</li>
            <li>Scaling helps latency, but shared dependencies can still become bottlenecks.</li>
          </ul>
        </DashboardCard>
      </div>
    </motion.div>
  );
}
