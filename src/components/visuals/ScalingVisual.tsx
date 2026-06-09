"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUp,
  Check,
  CircleDollarSign,
  Layers,
  Plus,
  RotateCcw,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ScalingMode = "vertical" | "horizontal";
type Scenario = "startup" | "traffic-spike" | "steady-growth" | "failure-ready";
type Tab = "walkthrough" | "compare" | "practice";

type NodeState = {
  id: string;
  label: string;
  cpu: number;
  memory: number;
  capacity: number;
  failed: boolean;
  load: number;
};

const scenarios: Record<Scenario, { label: string; traffic: number; mode: ScalingMode; nodes: number; cpu: number; note: string }> = {
  startup: { label: "Startup App", traffic: 180, mode: "vertical", nodes: 1, cpu: 4, note: "One server is simple while traffic is small." },
  "traffic-spike": { label: "Traffic Spike", traffic: 820, mode: "horizontal", nodes: 4, cpu: 4, note: "More nodes spread sudden load." },
  "steady-growth": { label: "Steady Growth", traffic: 520, mode: "horizontal", nodes: 3, cpu: 4, note: "Scaling out adds capacity gradually." },
  "failure-ready": { label: "Failure Ready", traffic: 440, mode: "horizontal", nodes: 3, cpu: 4, note: "Multiple nodes keep the service available." },
};

const pageMotion = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" as const } } };
const cardMotion = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: 0.24, ease: "easeInOut" as const } };

function DashboardCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <motion.section {...cardMotion} className={cn("rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</motion.section>;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      {subtitle && <p className="mt-2 max-w-[760px] text-base leading-7 text-slate-600">{subtitle}</p>}
    </div>
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

function RangeControl({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="flex items-center justify-between gap-4 text-base font-semibold text-slate-700">
        <span>{label}</span>
        <motion.span key={value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums text-slate-950">
          {value}{suffix}
        </motion.span>
      </span>
      <input className="mt-3 w-full accent-slate-900" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function buildNodes({ mode, nodeCount, cpuSize, traffic, failedNode }: { mode: ScalingMode; nodeCount: number; cpuSize: number; traffic: number; failedNode: boolean }) {
  const count = mode === "vertical" ? 1 : nodeCount;
  const activeCount = Math.max(1, count - (failedNode && mode === "horizontal" ? 1 : 0));
  return Array.from({ length: count }, (_, index): NodeState => {
    const failed = failedNode && mode === "horizontal" && index === 0;
    const capacity = cpuSize * 45;
    const load = failed ? 0 : Math.round(traffic / activeCount);
    const cpu = failed ? 0 : Math.min(140, Math.round((load / capacity) * 100));
    const memory = failed ? 0 : Math.min(130, Math.round(cpu * 0.72 + traffic / 24));
    return {
      id: `node-${index + 1}`,
      label: `Node ${index + 1}`,
      cpu,
      memory,
      capacity,
      failed,
      load,
    };
  });
}

function useScalingModel({ mode, traffic, nodeCount, cpuSize, failedNode }: { mode: ScalingMode; traffic: number; nodeCount: number; cpuSize: number; failedNode: boolean }) {
  return useMemo(() => {
    const nodes = buildNodes({ mode, nodeCount, cpuSize, traffic, failedNode });
    const activeNodes = nodes.filter((node) => !node.failed).length;
    const avgCpu = Math.round(nodes.reduce((sum, node) => sum + Math.min(node.cpu, 100), 0) / nodes.length);
    const maxCpu = Math.max(...nodes.map((node) => node.cpu));
    const overloaded = nodes.filter((node) => node.cpu > 90 && !node.failed).length;
    const droppedRequests = Math.round(nodes.filter((node) => node.cpu > 100).reduce((sum, node) => sum + node.load * 0.16, 0) + (mode === "vertical" && failedNode ? traffic : 0));
    const latency = Math.round(42 + avgCpu * 1.1 + overloaded * 35);
    const availability = mode === "vertical" && failedNode ? 0 : Math.max(0, 100 - Math.round((droppedRequests / Math.max(traffic, 1)) * 100));
    const cost = mode === "vertical" ? cpuSize * 42 : activeNodes * cpuSize * 28;
    const headroom = Math.max(0, Math.round(((nodes.reduce((sum, node) => sum + (node.failed ? 0 : node.capacity), 0) - traffic) / Math.max(traffic, 1)) * 100));
    return {
      nodes,
      metrics: {
        activeNodes,
        avgCpu,
        maxCpu,
        latency,
        availability,
        cost,
        headroom,
        droppedRequests,
      },
    };
  }, [cpuSize, failedNode, mode, nodeCount, traffic]);
}

function ScenarioHero({ scenario, onScenario }: { scenario: Scenario; onScenario: (scenario: Scenario) => void }) {
  return (
    <DashboardCard>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(scenarios) as Scenario[]).map((id) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => onScenario(id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "rounded-2xl border bg-white p-4 text-left transition",
                scenario === id ? "border-2 border-slate-900 shadow-lg scale-[1.01]" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="text-base font-bold text-slate-950">{scenarios[id].label}</span>
              <span className="mt-1 block text-base leading-6 text-slate-600">{scenarios[id].note}</span>
              <span className="mt-3 block rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-base font-semibold text-slate-700">
                {scenarios[id].mode === "vertical" ? "Scale up" : "Scale out"}
              </span>
            </motion.button>
          ))}
      </div>
    </DashboardCard>
  );
}

function ControlsPanel({
  mode,
  setMode,
  traffic,
  setTraffic,
  cpuSize,
  setCpuSize,
  nodeCount,
  setNodeCount,
  failedNode,
  setFailedNode,
  reset,
}: {
  mode: ScalingMode;
  setMode: (mode: ScalingMode) => void;
  traffic: number;
  setTraffic: (traffic: number) => void;
  cpuSize: number;
  setCpuSize: (cpu: number) => void;
  nodeCount: number;
  setNodeCount: (count: number) => void;
  failedNode: boolean;
  setFailedNode: (failed: boolean) => void;
  reset: () => void;
}) {
  return (
    <DashboardCard className="max-h-[520px] overflow-hidden">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700"><Activity className="h-5 w-5" /></span>
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Scaling controls</h2>
          <p className="text-base text-slate-600">Change traffic and capacity live.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ToggleChip active={mode === "vertical"} label="Vertical" onClick={() => setMode("vertical")} />
          <ToggleChip active={mode === "horizontal"} label="Horizontal" onClick={() => setMode("horizontal")} />
        </div>
        <RangeControl label="Traffic" value={traffic} min={80} max={1000} step={20} suffix=" rps" onChange={setTraffic} />
        <RangeControl label="Server size" value={cpuSize} min={2} max={16} step={2} suffix=" vCPU" onChange={setCpuSize} />
        {mode === "horizontal" && <RangeControl label="Server count" value={nodeCount} min={2} max={6} step={1} onChange={setNodeCount} />}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => mode === "vertical" ? setCpuSize(Math.min(16, cpuSize + 2)) : setNodeCount(Math.min(6, nodeCount + 1))}
            className="min-h-11 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-base font-semibold text-white"
          >
            {mode === "vertical" ? <ArrowUp className="mr-2 inline h-4 w-4" /> : <Plus className="mr-2 inline h-4 w-4" />}
            {mode === "vertical" ? "Upgrade" : "Add node"}
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-700"
          >
            <RotateCcw className="mr-2 inline h-4 w-4" />
            Reset
          </motion.button>
        </div>
        <ToggleChip active={failedNode} label={failedNode ? "Failure on" : "Simulate failure"} onClick={() => setFailedNode(!failedNode)} />
      </div>
    </DashboardCard>
  );
}

function TrafficDot({ delay, lane, traffic }: { delay: number; lane: number; traffic: number }) {
  return (
    <motion.span
      className="absolute left-[14%] top-1/2 h-2.5 w-2.5 rounded-full bg-slate-800/60"
      style={{ y: lane }}
      animate={{ x: ["0vw", "41vw"], opacity: [0, 0.75, 0] }}
      transition={{ duration: Math.max(1.3, 3.2 - traffic / 360), repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function NodeCard({ node, mode }: { node: NodeState; mode: ScalingMode }) {
  const overloaded = node.cpu > 88 && !node.failed;
  const sizeClass = mode === "vertical" ? (node.capacity >= 540 ? "min-h-64" : node.capacity >= 360 ? "min-h-56" : "min-h-48") : "min-h-40";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 260, damping: 23 }}
      className={cn(
        "group relative rounded-2xl border bg-white p-4 transition",
        sizeClass,
        node.failed ? "border-red-200 bg-red-50" : overloaded ? "border-amber-300 bg-amber-50" : "border-slate-200",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-slate-700" />
          <span className="text-base font-bold text-slate-950">{node.label}</span>
        </div>
        <span className={cn("h-3 w-3 rounded-full", node.failed ? "bg-red-500" : overloaded ? "bg-amber-500" : "bg-emerald-500")} />
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-base font-semibold text-slate-600"><span>CPU</span><span>{node.cpu}%</span></div>
          <div className="h-2 rounded-full bg-slate-200"><motion.div className={cn("h-full rounded-full", overloaded ? "bg-amber-500" : "bg-emerald-500")} animate={{ width: `${Math.min(100, node.cpu)}%` }} /></div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-base font-semibold text-slate-600"><span>Memory</span><span>{node.memory}%</span></div>
          <div className="h-2 rounded-full bg-slate-200"><motion.div className={cn("h-full rounded-full", node.memory > 88 ? "bg-amber-500" : "bg-slate-700")} animate={{ width: `${Math.min(100, node.memory)}%` }} /></div>
        </div>
      </div>
      <p className="mt-4 text-base text-slate-600">{node.failed ? "Removed from traffic" : `${node.load} requests/sec`}</p>
      <div className="pointer-events-none absolute right-4 top-12 z-20 hidden w-56 rounded-2xl border border-slate-200 bg-white p-3 text-base shadow-lg group-hover:block">
        <p className="font-bold text-slate-950">{node.label}</p>
        <p className="mt-1 text-slate-600">Capacity: {node.capacity} rps</p>
        <p className="text-slate-600">Current load: {node.load} rps</p>
        <p className="text-slate-600">State: {node.failed ? "failed" : overloaded ? "overloaded" : "healthy"}</p>
      </div>
    </motion.div>
  );
}

function ScalingCanvas({ mode, nodes, traffic }: { mode: ScalingMode; nodes: NodeState[]; traffic: number }) {
  const dots = Math.min(16, Math.max(5, Math.round(traffic / 80)));
  return (
    <DashboardCard className="min-h-[420px] max-h-[520px] overflow-hidden">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Live scaling model</h2>
          <p className="text-base text-slate-600">{mode === "vertical" ? "One server gets bigger." : "Traffic spreads across multiple nodes."}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-base font-semibold text-slate-700">{mode === "vertical" ? "Scale up" : "Scale out"}</span>
      </div>
      <div
        className="relative min-h-[390px] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-amber-50/40 p-5"
        style={{ backgroundImage: "radial-gradient(circle, rgba(120,113,108,0.16) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 820 390" preserveAspectRatio="none" aria-hidden="true">
          {mode === "vertical" ? (
            <path d="M130 195 C300 195 380 195 470 195" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
          ) : (
            <>
              <path d="M130 195 C220 195 250 195 290 195" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
              <path d="M410 195 C440 195 450 195 480 195" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" fill="none" />
            </>
          )}
        </svg>
        <div className="absolute left-5 top-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Users className="h-6 w-6 text-slate-700" />
          <p className="mt-2 text-base font-bold text-slate-950">Users</p>
          <p className="text-base text-slate-600">{traffic} rps</p>
        </div>
        {mode === "horizontal" && (
          <div className="absolute left-[36%] top-1/2 -translate-y-1/2 rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-lg">
            <Layers className="h-6 w-6 text-slate-800" />
            <p className="mt-2 text-base font-bold text-slate-950">Balancer</p>
          </div>
        )}
        <div className={cn("absolute right-5 grid w-[42%] gap-3", mode === "vertical" ? "inset-y-5 grid-cols-1 content-center" : "top-5 grid-cols-2")}>
          <AnimatePresence initial={false}>{nodes.map((node) => <NodeCard key={node.id} node={node} mode={mode} />)}</AnimatePresence>
        </div>
        {Array.from({ length: dots }).map((_, index) => (
          <TrafficDot key={index} delay={index * 0.16} lane={(index % Math.max(nodes.length, 1)) * 62 - 110} traffic={traffic} />
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
      <div className="flex items-center gap-2 text-base font-semibold text-slate-600"><Icon className="h-4 w-4" />{label}</div>
      <motion.div key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-2xl font-bold tabular-nums text-slate-950">{value}</motion.div>
    </motion.div>
  );
}

function MetricsSummary({ metrics }: { metrics: ReturnType<typeof useScalingModel>["metrics"] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={Activity} label="Avg CPU" value={`${metrics.avgCpu}%`} tone={metrics.avgCpu < 70 ? "good" : metrics.avgCpu < 88 ? "warn" : "bad"} />
      <MetricCard icon={Activity} label="Latency" value={`${metrics.latency}ms`} tone={metrics.latency < 120 ? "good" : metrics.latency < 180 ? "warn" : "bad"} />
      <MetricCard icon={ShieldCheck} label="Availability" value={`${metrics.availability}%`} tone={metrics.availability > 98 ? "good" : metrics.availability > 90 ? "warn" : "bad"} />
      <MetricCard icon={CircleDollarSign} label="Cost Estimate" value={`$${metrics.cost}/hr`} tone="neutral" />
      <MetricCard icon={Server} label="Active Nodes" value={`${metrics.activeNodes}`} tone={metrics.activeNodes > 1 ? "good" : "neutral"} />
      <MetricCard icon={AlertTriangle} label="Peak Node CPU" value={`${metrics.maxCpu}%`} tone={metrics.maxCpu < 80 ? "good" : metrics.maxCpu < 96 ? "warn" : "bad"} />
      <MetricCard icon={Layers} label="Headroom" value={`${metrics.headroom}%`} tone={metrics.headroom > 40 ? "good" : metrics.headroom > 10 ? "warn" : "bad"} />
      <MetricCard icon={AlertTriangle} label="Dropped Requests" value={`${metrics.droppedRequests}`} tone={metrics.droppedRequests < 8 ? "good" : metrics.droppedRequests < 45 ? "warn" : "bad"} />
    </div>
  );
}

function InsightPanel({ mode }: { mode: ScalingMode }) {
  return (
    <DashboardCard>
      <h2 className="text-2xl font-bold text-slate-950">Insight</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">What changed</p>
          <p className="mt-2 text-base leading-7 text-slate-700">{mode === "vertical" ? "The same server receives more CPU and memory." : "Requests are distributed across more servers."}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Why it matters</p>
          <p className="mt-2 text-base leading-7 text-slate-700">{mode === "vertical" ? "Scale-up is simple and keeps architecture small." : "Scale-out raises capacity and improves fault tolerance."}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tradeoff</p>
          <p className="mt-2 text-base leading-7 text-slate-700">{mode === "vertical" ? "Eventually hardware hits a ceiling and one server remains a failure point." : "More nodes need load balancing, coordination, and deployment discipline."}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

function ChallengeCards({ metrics, mode, nodeCount }: { metrics: ReturnType<typeof useScalingModel>["metrics"]; mode: ScalingMode; nodeCount: number }) {
  const challenges = [
    { title: "Keep latency below 120ms", solved: metrics.latency < 120 },
    { title: "Handle high traffic", solved: metrics.droppedRequests < 10 && metrics.headroom > 10 },
    { title: "Avoid one-server failure", solved: mode === "horizontal" && nodeCount >= 3 },
    { title: "Keep peak CPU below 80%", solved: metrics.maxCpu < 80 },
    { title: "Explain the tradeoff", solved: true },
  ];
  return (
    <DashboardCard>
      <SectionHeader eyebrow="Mini challenges" title="Can the system scale safely?" subtitle="Adjust the controls above. Cards solve as the system reaches the target." />
      <div className="grid gap-4 md:grid-cols-5">
        {challenges.map((challenge) => (
          <motion.div
            key={challenge.title}
            layout
            animate={challenge.solved ? { scale: [1, 1.025, 1] } : { scale: 1 }}
            className={cn("rounded-[1.5rem] border p-4 transition", challenge.solved ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600")}
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
              "Start with one server and increase traffic.",
              "Upgrade the server to see vertical scaling improve capacity.",
              "Push traffic higher until one machine becomes risky.",
              "Switch to horizontal scaling and add nodes.",
              "Simulate a failure and observe remaining capacity.",
              "Compare cost, headroom, and availability.",
            ].map((step, index) => <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-700"><span className="font-bold text-slate-950">Step {index + 1}: </span>{step}</div>)}
          </motion.div>
        )}
        {tab === "compare" && (
          <motion.div key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-base">
              <thead className="bg-slate-50 text-slate-600"><tr>{["Strategy", "Best for", "Weakness", "Failure behavior"].map((head) => <th key={head} className="p-4 font-bold">{head}</th>)}</tr></thead>
              <tbody>
                {[
                  ["Vertical", "Simple apps and quick upgrades", "Hard machine limit", "One machine can still fail"],
                  ["Horizontal", "Growth, resilience, and high traffic", "More operational complexity", "Healthy nodes keep serving"],
                ].map((row) => <tr key={row[0]} className="border-t border-slate-200">{row.map((cell) => <td key={cell} className="p-4 text-slate-700">{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </motion.div>
        )}
        {tab === "practice" && (
          <motion.div key="practice" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Why does vertical scaling eventually stop helping?",
              "Why does horizontal scaling need a load balancer?",
              "When is scale-up the pragmatic choice?",
              "What failure risk remains with one large server?",
              "Which metrics tell you when to add more nodes?",
            ].map((question) => <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base font-semibold text-slate-700">{question}</div>)}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function ScalingVisual() {
  const [scenario, setScenario] = useState<Scenario>("startup");
  const [mode, setMode] = useState<ScalingMode>("vertical");
  const [traffic, setTraffic] = useState(180);
  const [nodeCount, setNodeCount] = useState(1);
  const [cpuSize, setCpuSize] = useState(4);
  const [failedNode, setFailedNode] = useState(false);
  const [tab, setTab] = useState<Tab>("walkthrough");

  const applyScenario = (next: Scenario) => {
    const config = scenarios[next];
    setScenario(next);
    setMode(config.mode);
    setTraffic(config.traffic);
    setNodeCount(config.nodes);
    setCpuSize(config.cpu);
    setFailedNode(next === "failure-ready");
  };

  const reset = () => {
    setTraffic(180);
    setNodeCount(1);
    setCpuSize(4);
    setFailedNode(false);
    setMode("vertical");
    setScenario("startup");
  };

  const model = useScalingModel({ mode, traffic, nodeCount: Math.max(nodeCount, mode === "horizontal" ? 2 : 1), cpuSize, failedNode });

  return (
    <motion.div {...pageMotion} className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <ScenarioHero scenario={scenario} onScenario={applyScenario} />
        <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <ControlsPanel
            mode={mode}
            setMode={(next) => {
              setMode(next);
              setNodeCount(next === "horizontal" ? Math.max(2, nodeCount) : 1);
              setFailedNode(false);
            }}
            traffic={traffic}
            setTraffic={setTraffic}
            cpuSize={cpuSize}
            setCpuSize={setCpuSize}
            nodeCount={Math.max(nodeCount, mode === "horizontal" ? 2 : 1)}
            setNodeCount={setNodeCount}
            failedNode={failedNode}
            setFailedNode={setFailedNode}
            reset={reset}
          />
          <ScalingCanvas mode={mode} nodes={model.nodes} traffic={traffic} />
        </div>
        <MetricsSummary metrics={model.metrics} />
        <InsightPanel mode={mode} />
        <ChallengeCards metrics={model.metrics} mode={mode} nodeCount={nodeCount} />
        <SolutionPanel tab={tab} setTab={setTab} />
        <DashboardCard>
          <h2 className="text-2xl font-bold text-slate-950">Summary</h2>
          <ul className="mt-4 grid gap-3 text-base leading-7 text-slate-700 md:grid-cols-2">
            <li>Vertical scaling increases the power of one machine.</li>
            <li>Horizontal scaling adds more machines and distributes traffic.</li>
            <li>Scale-up is simpler, but has a hard ceiling and a single failure point.</li>
            <li>Scale-out improves availability, but needs load balancing and coordination.</li>
          </ul>
        </DashboardCard>
      </div>
    </motion.div>
  );
}
