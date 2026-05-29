"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  RotateCcw, Zap, HardDrive,
  Server, CheckCircle2, AlertTriangle, Plus, Minus,
  ChevronLeft, ChevronRight, Lightbulb, Eye, EyeOff,
} from "lucide-react";

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(n < 10 ? 1 : 0);
}

function fmtBytes(b: number): string {
  if (b >= 1e15) return `${(b / 1e15).toFixed(1)} PB`;
  if (b >= 1e12) return `${(b / 1e12).toFixed(1)} TB`;
  if (b >= 1e9)  return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6)  return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3)  return `${(b / 1e3).toFixed(1)} KB`;
  return `${b.toFixed(0)} B`;
}

function fmtCost(usd: number): string {
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

// ─── Shared components ────────────────────────────────────────────────────────

function Slider({
  label, valueLabel, min, max, step, value, onChange, accent = "slate",
}: {
  label: string; valueLabel: string; min: number; max: number;
  step: number; value: number; onChange: (v: number) => void; accent?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={cn("font-bold tabular-nums", accent === "sky" ? "text-sky-700" : accent === "amber" ? "text-amber-700" : "text-slate-700")}>
          {valueLabel}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={cn("w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200",
          accent === "sky" ? "accent-sky-600" : accent === "amber" ? "accent-amber-500" : "accent-slate-700"
        )}
      />
    </div>
  );
}

function HeatBar({ value, label }: { value: number; label: string }) {
  const color = value >= 0.9 ? "bg-red-500" : value >= 0.6 ? "bg-amber-500" : "bg-emerald-500";
  const text  = value >= 0.9 ? "text-red-600" : value >= 0.6 ? "text-amber-600" : "text-emerald-600";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold">
        <span className="text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={text}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div animate={{ width: `${clamp(value, 0, 1) * 100}%` }} transition={{ duration: 0.3 }}
          className={cn("h-full rounded-full", color)} />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <motion.p key={value} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
        className="text-base font-bold text-slate-900 tabular-nums leading-none">
        {value}
      </motion.p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Capacity Walkthrough ─────────────────────────────────────────────────────

function CapacityWalkthrough({
  dau, rpu, peak, reqDay, avgQps, peakQps, onHighlightChange,
}: {
  dau: number; rpu: number; peak: number;
  reqDay: number; avgQps: number; peakQps: number;
  onHighlightChange: (indices: number[]) => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);

  const serversNeeded  = Math.ceil(peakQps / 500);
  const cacheNodes     = Math.max(1, Math.ceil(peakQps / 5000));
  const dbInstances    = Math.max(1, Math.ceil(peakQps / 300));

  const steps = [
    {
      title: "Step 1 — Anchor to users",
      explanation: `Start with your user base: ${fmt(dau)} DAU. This single number drives every other capacity estimate. Always clarify in an interview: is this DAU or MAU? Concurrent users? Active vs registered?`,
      tip: "In interviews, state your assumptions explicitly. '10M DAU, each active for 30 min/day' is much cleaner than just '10M users.'",
      highlight: [0],
    },
    {
      title: "Step 2 — Total requests per day",
      explanation: `${fmt(dau)} users × ${rpu} requests/user = ${fmt(reqDay)} total requests/day. This is your daily load budget. For YouTube, a user might generate 20–30 requests (feed load, search, video play, comments, etc.).`,
      tip: "Think about what counts as a 'request' for your system. A single page view might generate 5–10 API calls. Factor that in.",
      highlight: [0, 1, 2],
    },
    {
      title: "Step 3 — Average QPS",
      explanation: `Divide by seconds in a day: ${fmt(reqDay)} ÷ 86,400 = ${fmt(avgQps)} average QPS. This assumes perfectly uniform traffic — which never happens in reality. Treat this as a floor, not a ceiling.`,
      tip: "86,400 = 24 × 60 × 60. Memorize this. Interviewers expect you to do this division confidently and quickly.",
      highlight: [2, 3],
    },
    {
      title: "Step 4 — Peak QPS",
      explanation: `Apply the peak multiplier (${peak}×): ${fmt(avgQps)} × ${peak} = ${fmt(peakQps)} peak QPS. Traffic concentrates during specific hours — evenings for social apps, mornings for news. A viral event can spike 10–50× instantly.`,
      tip: "A 3× peak is conservative for most apps. Design for the spike you can predict; use autoscaling for the one you can't.",
      highlight: [3, 4],
    },
    {
      title: "Step 5 — Infrastructure sizing",
      explanation: `${fmt(peakQps)} peak QPS implies: ${serversNeeded} app servers (at 500 QPS each), ${cacheNodes} cache node${cacheNodes > 1 ? "s" : ""}, ${dbInstances} DB instance${dbInstances > 1 ? "s" : ""}. Now you can defend these numbers in the interview.`,
      tip: "Always add 20–30% headroom above your calculated peak. Never size exactly to the expected maximum — you need room for unexpected spikes and deployments.",
      highlight: [4],
    },
  ];

  const step = steps[stepIdx];

  useEffect(() => {
    onHighlightChange(step.highlight);
  }, [stepIdx, step.highlight, onHighlightChange]);

  // Clear highlights on unmount
  useEffect(() => () => onHighlightChange([]), [onHighlightChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-xl border-2 border-slate-900 bg-white p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Capacity Walkthrough</p>
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <button key={i} onClick={() => setStepIdx(i)}
              className={cn("h-2 rounded-full transition-all",
                i === stepIdx ? "bg-slate-900 w-6" : i < stepIdx ? "bg-slate-400 w-2" : "bg-slate-200 w-2"
              )}
            />
          ))}
          <span className="ml-2 text-[10px] font-bold text-slate-400">{stepIdx + 1}/{steps.length}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={stepIdx}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <p className="text-sm font-bold text-slate-800">{step.title}</p>
          <p className="text-sm text-slate-600 leading-relaxed">{step.explanation}</p>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 leading-relaxed">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-500" />
            <span><strong>Interview tip: </strong>{step.tip}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={stepIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {stepIdx < steps.length - 1 ? (
          <button onClick={() => setStepIdx(i => i + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Walkthrough complete
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Simulation 1: Traffic Growth ─────────────────────────────────────────────

function Sim1Traffic() {
  const [dau,     setDau]     = useState(100_000);
  const [rpu,     setRpu]     = useState(10);
  const [peak,    setPeak]    = useState(3);
  const [spiking, setSpiking] = useState(false);
  const spikeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const qps     = (dau * rpu) / 86400;
  const peakQps = qps * (spiking ? 10 : peak);
  const servers = Math.max(1, Math.ceil(peakQps / 200));
  const dots    = Math.min(60, Math.max(3, Math.round(Math.sqrt(peakQps) * 1.2)));

  const triggerSpike = () => {
    setSpiking(true);
    if (spikeTimer.current) clearTimeout(spikeTimer.current);
    spikeTimer.current = setTimeout(() => setSpiking(false), 5000);
  };

  useEffect(() => () => { if (spikeTimer.current) clearTimeout(spikeTimer.current); }, []);

  const serverLoad = peakQps / (servers * 200);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-4 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Traffic inputs</p>
          <Slider label="Daily Active Users" valueLabel={fmt(dau)} min={1000} max={50_000_000} step={1000} value={dau} onChange={setDau} accent="sky" />
          <Slider label="Requests / user / day" valueLabel={rpu.toString()} min={1} max={100} step={1} value={rpu} onChange={setRpu} accent="sky" />
          <Slider label="Peak multiplier" valueLabel={`${peak}×`} min={1} max={20} step={1} value={peak} onChange={setPeak} accent="amber" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Avg QPS" value={fmt(qps)} sub="requests/sec" />
          <StatBox label="Peak QPS" value={fmt(peakQps)} sub={spiking ? "SPIKE!" : `${peak}× peak`} />
          <StatBox label="Servers needed" value={`${servers}`} sub="at full peak" />
          <StatBox label="Req / day" value={fmt(dau * rpu)} sub="total" />
        </div>

        <button onClick={triggerSpike}
          className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
            spiking ? "bg-amber-100 text-amber-700 border border-amber-300 animate-pulse"
                    : "bg-slate-900 text-white hover:bg-slate-800"
          )}>
          <Zap className="w-4 h-4" />
          {spiking ? "Spike active — watch servers!" : "Trigger viral spike"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] overflow-hidden">
        <div className="p-4 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">System under traffic</p>
        </div>
        <div className="relative" style={{ height: 280 }}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
              <span className="text-xl">👥</span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 text-center">{fmt(dau)} DAU</p>
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {Array.from({ length: dots }).map((_, i) => {
              const delay = (i / dots) * 2;
              const yJitter = ((i % 7) - 3) * 18;
              const startY = 140 + yJitter;
              const endY   = 140 + ((i % servers) - (servers - 1) / 2) * 50;
              const color  = spiking ? "#f59e0b" : "#6366f1";
              return (
                <motion.circle key={i} r={3} fill={color} fillOpacity={0.8}
                  initial={{ cx: "12%", cy: startY }}
                  animate={{ cx: ["12%", "55%", "70%"], cy: [startY, startY + yJitter * 0.3, endY] }}
                  transition={{ duration: 0.9 + Math.random() * 0.4, repeat: Infinity, repeatDelay: delay, ease: "linear" }}
                />
              );
            })}
          </svg>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {Array.from({ length: Math.min(servers, 6) }).map((_, i) => {
              const load = serverLoad;
              const isHot = load >= 0.8;
              const isWarm = load >= 0.5;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn("w-20 h-9 rounded-lg border-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors",
                    isHot ? "border-red-400 bg-red-50 text-red-700" :
                    isWarm ? "border-amber-400 bg-amber-50 text-amber-700" :
                    "border-slate-200 bg-white text-slate-600"
                  )}>
                  <Server className="w-3 h-3" />
                  S{i + 1}
                  {isHot && <span className="text-[8px]">🔥</span>}
                </motion.div>
              );
            })}
            {servers > 6 && (
              <div className="text-[10px] font-bold text-slate-400 text-center">+{servers - 6} more</div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2">
          <HeatBar value={clamp(serverLoad, 0, 1.2)} label={`Server load — ${fmt(peakQps)} QPS across ${servers} servers`} />
        </div>
      </div>
    </div>
  );
}

// ─── Simulation 2: QPS Formula Pipeline ───────────────────────────────────────

function Sim2QPS() {
  const [dau,   setDau]   = useState(1_000_000);
  const [rpu,   setRpu]   = useState(10);
  const [peak,  setPeak]  = useState(3);
  const [spike, setSpike] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [highlightedSteps, setHighlightedSteps] = useState<number[]>([]);
  const spikeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (spikeTimer.current) clearTimeout(spikeTimer.current); }, []);

  const reqDay  = dau * rpu;
  const avgQps  = reqDay / 86400;
  const peakQps = avgQps * (spike ? 15 : peak);

  const triggerSpike = () => {
    setSpike(true);
    if (spikeTimer.current) clearTimeout(spikeTimer.current);
    spikeTimer.current = setTimeout(() => setSpike(false), 5000);
  };

  const steps = [
    { label: "Daily Active Users",    value: fmt(dau),    unit: "DAU",       color: "bg-sky-50 border-sky-200 text-sky-800" },
    { label: "Requests / user / day", value: rpu.toString(), unit: "req/user", color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
    { label: "Total requests / day",  value: fmt(reqDay), unit: "req/day",   color: "bg-violet-50 border-violet-200 text-violet-800" },
    { label: "Average QPS",           value: fmt(avgQps), unit: "QPS",       color: "bg-amber-50 border-amber-200 text-amber-800" },
    { label: "Peak QPS",              value: fmt(peakQps), unit: spike ? "⚡ SPIKE" : `${peak}× peak`, color: spike ? "bg-red-50 border-red-300 text-red-800" : "bg-red-50 border-red-200 text-red-800" },
  ];

  const ops = ["×", "÷ 86,400", "×"];

  return (
    <div className="space-y-5">
      {/* Formula pipeline */}
      <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">QPS derivation — live formula</p>
          <button onClick={() => setShowWalkthrough(s => !s)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
              showWalkthrough
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-300 text-slate-600 hover:border-slate-700"
            )}>
            {showWalkthrough ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showWalkthrough ? "Hide walkthrough" : "Reveal walkthrough"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, i) => {
            const isHighlighted = highlightedSteps.includes(i);
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={cn("rounded-xl border-2 p-3 min-w-[90px] text-center transition-all duration-300",
                  step.color,
                  isHighlighted && "ring-2 ring-slate-900 ring-offset-2 scale-105 shadow-md"
                )}>
                  <motion.p key={step.value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-black tabular-nums leading-none">
                    {step.value}
                  </motion.p>
                  <p className="text-[10px] font-semibold mt-1 opacity-70">{step.unit}</p>
                  <p className="text-[9px] mt-0.5 opacity-60">{step.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="text-slate-400 font-bold text-xs">{ops[i]}</div>
                    <div className="w-6 h-0.5 bg-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Walkthrough panel */}
      <AnimatePresence>
        {showWalkthrough && (
          <CapacityWalkthrough
            dau={dau} rpu={rpu} peak={peak}
            reqDay={reqDay} avgQps={avgQps} peakQps={peakQps}
            onHighlightChange={setHighlightedSteps}
          />
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inputs</p>
          <Slider label="DAU" valueLabel={fmt(dau)} min={10_000} max={500_000_000} step={10_000} value={dau} onChange={setDau} accent="sky" />
          <Slider label="Requests / user" valueLabel={rpu.toString()} min={1} max={200} step={1} value={rpu} onChange={setRpu} accent="sky" />
          <Slider label="Peak multiplier" valueLabel={`${peak}×`} min={1} max={20} step={1} value={peak} onChange={setPeak} accent="amber" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Benchmarks</p>
          {[
            { name: "Twitter at scale", dau: 350_000_000, rpu: 15 },
            { name: "Netflix",          dau: 230_000_000, rpu: 5  },
            { name: "Small startup",    dau: 10_000,      rpu: 8  },
          ].map(b => (
            <button key={b.name} onClick={() => { setDau(b.dau); setRpu(b.rpu); }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors">
              {b.name} <span className="text-slate-400 font-normal">— {fmt(b.dau)} DAU</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Events</p>
          <button onClick={triggerSpike}
            className={cn("w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
              spike ? "bg-red-100 text-red-700 border border-red-300 animate-pulse"
                    : "bg-slate-900 text-white hover:bg-slate-800"
            )}>
            <Zap className="w-4 h-4" />
            {spike ? "Viral spike (15×)!" : "Simulate viral spike"}
          </button>
          <div className={cn("p-3 rounded-xl text-xs leading-relaxed",
            spike ? "bg-red-50 border border-red-200 text-red-700" : "bg-slate-50 border border-slate-200 text-slate-600"
          )}>
            {spike
              ? `⚡ Peak QPS jumped to ${fmt(peakQps)} — your servers need to handle this instantly.`
              : "A viral post or product launch can spike traffic 10–20× in seconds."}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simulation 3: Storage Estimation ─────────────────────────────────────────

function Sim3Storage() {
  const [uploadsDay,   setUploadsDay]   = useState(100_000);
  const [fileSize,     setFileSize]     = useState(5);
  const [retention,    setRetention]    = useState(12);
  const [replication,  setReplication]  = useState(3);
  const [showCost,     setShowCost]     = useState(false);

  const rawPerDay      = uploadsDay * fileSize * 1e6;
  const rawPerMonth    = rawPerDay * 30;
  const storedPerMonth = rawPerMonth * replication;
  const totalStored    = storedPerMonth * retention;
  const monthlyBandwidth = rawPerDay * 30;
  const costPerTB      = 23;
  const monthlyCost    = (storedPerMonth / 1e12) * costPerTB;

  const months = Array.from({ length: Math.min(retention, 12) }, (_, i) => i + 1);
  const maxBar = storedPerMonth * replication * months.length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-5">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-4 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Storage inputs</p>
          <Slider label="Uploads / day" valueLabel={fmt(uploadsDay)} min={1000} max={10_000_000} step={1000} value={uploadsDay} onChange={setUploadsDay} accent="sky" />
          <Slider label="Avg file size (MB)" valueLabel={`${fileSize} MB`} min={0.1} max={500} step={0.1} value={fileSize} onChange={setFileSize} accent="sky" />
          <Slider label="Retention (months)" valueLabel={`${retention} mo`} min={1} max={60} step={1} value={retention} onChange={setRetention} accent="amber" />

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Replication factor</p>
            <div className="flex gap-2">
              {[1, 2, 3, 5].map(r => (
                <button key={r} onClick={() => setReplication(r)}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all",
                    replication === r ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  )}>
                  ×{r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Per month" value={fmtBytes(storedPerMonth)} sub="with replication" />
          <StatBox label="Total storage" value={fmtBytes(totalStored)} sub={`over ${retention} mo`} />
          <StatBox label="Monthly bandwidth" value={fmtBytes(monthlyBandwidth)} sub="upload traffic" />
          <StatBox label="Monthly cost" value={fmtCost(monthlyCost)} sub="~S3 pricing" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Cumulative storage growth</p>
          <button onClick={() => setShowCost(!showCost)}
            className="text-[10px] font-bold text-slate-500 border border-slate-200 rounded-lg px-2 py-1 hover:bg-white transition-colors">
            {showCost ? "Show storage" : "Show cost"}
          </button>
        </div>

        <div className="flex items-end gap-1.5 h-44">
          {months.map(m => {
            const cumulativeRaw = rawPerMonth * m;
            const cumWithRep    = cumulativeRaw * replication;
            const barHeight     = (cumWithRep / maxBar) * 160;
            const barValue      = showCost ? fmtCost(monthlyCost * m) : fmtBytes(cumWithRep);
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="relative flex flex-col justify-end" style={{ height: 160 }}>
                  <motion.div
                    animate={{ height: barHeight }}
                    transition={{ duration: 0.4, delay: m * 0.03 }}
                    className={cn("w-full rounded-t-md min-h-[4px]",
                      replication >= 3 ? "bg-violet-400" : replication >= 2 ? "bg-sky-400" : "bg-emerald-400"
                    )}
                  />
                </div>
                <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                  Month {m}: {barValue}
                </div>
                <p className="text-[9px] text-slate-400 font-medium">{m}</p>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-400 mt-2 text-center">Month →</p>

        {replication > 1 && (
          <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: replication }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-7 h-9 rounded-md border-2 border-violet-300 bg-violet-50 flex items-center justify-center">
                  <HardDrive className="w-3 h-3 text-violet-600" />
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-slate-600">
              ×{replication} replication means your actual storage is <strong>{replication}× the raw data</strong>.
              {replication === 3 && " This is the AWS standard (3 copies across AZs)."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Simulation 4: System Bottleneck ─────────────────────────────────────────

const S4_SERVER_CAP = 200;
const S4_DB_CAP    = 300;
const S4_CACHE_CAP = 5000;

function Sim4Bottleneck() {
  const [traffic,      setTraffic]      = useState(30);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [lbEnabled,    setLbEnabled]    = useState(true);
  const [serverCount,  setServerCount]  = useState(2);
  const [spiking,      setSpiking]      = useState(false);
  const spikeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (spikeTimer.current) clearTimeout(spikeTimer.current); }, []);

  const triggerSpike = () => {
    setSpiking(true);
    if (spikeTimer.current) clearTimeout(spikeTimer.current);
    spikeTimer.current = setTimeout(() => setSpiking(false), 5000);
  };

  const baseQps    = Math.round((traffic / 100) * 2000 * (spiking ? 5 : 1));
  const cacheQps   = cacheEnabled ? Math.round(baseQps * 0.75) : 0;
  const backendQps = baseQps - cacheQps;
  const perServerQps = lbEnabled ? backendQps / serverCount : backendQps;
  const dbQps      = backendQps;

  const serverUtil = perServerQps / S4_SERVER_CAP;
  const dbUtil     = dbQps / S4_DB_CAP;
  const cacheUtil  = cacheQps / S4_CACHE_CAP;
  const lbUtil     = baseQps / 10000;

  const latency = Math.round(
    20 +
    (serverUtil > 0.8 ? (serverUtil - 0.8) * 500 : 0) +
    (dbUtil > 0.8 ? (dbUtil - 0.8) * 800 : 0) +
    (!cacheEnabled ? 80 : 0)
  );

  const overloaded = serverUtil > 1 || dbUtil > 1;

  const nodes: Array<{ id: string; label: string; sub: string; util: number; x: number; y: number; show: boolean }> = [
    { id: "client",  label: "Clients",       sub: `${fmt(baseQps)} QPS`,       util: 0.1,       x: 50,  y: 130, show: true },
    { id: "lb",      label: "Load Balancer", sub: lbEnabled ? "active" : "off", util: lbUtil,   x: 170, y: 130, show: lbEnabled },
    { id: "cache",   label: "Cache",         sub: cacheEnabled ? `${fmt(cacheQps)} hits` : "disabled", util: cacheUtil, x: 260, y: 50, show: cacheEnabled },
    { id: "app1",    label: "App Server 1",  sub: `${fmt(perServerQps)} QPS`,  util: serverUtil, x: 350, y: serverCount > 1 ? 80 : 130, show: true },
    { id: "app2",    label: "App Server 2",  sub: `${fmt(perServerQps)} QPS`,  util: serverUtil, x: 350, y: 180, show: serverCount >= 2 },
    { id: "app3",    label: "App Server 3",  sub: `${fmt(perServerQps)} QPS`,  util: serverUtil, x: 350, y: 250, show: serverCount >= 3 },
    { id: "db",      label: "Database",      sub: `${fmt(dbQps)} QPS`,         util: dbUtil,     x: 490, y: 130, show: true },
  ];

  const nodeColor = (util: number) =>
    util >= 1   ? "#ef4444" :
    util >= 0.7 ? "#f59e0b" : "#1e293b";

  const NW = 100, NH = 34;
  const visibleNodes = nodes.filter(n => n.show);

  const edges: Array<[string, string]> = [
    ["client", lbEnabled ? "lb" : "app1"],
    ...(lbEnabled ? [["lb", "app1"] as [string, string]] : []),
    ...(lbEnabled && serverCount >= 2 ? [["lb", "app2"] as [string, string]] : []),
    ...(lbEnabled && serverCount >= 3 ? [["lb", "app3"] as [string, string]] : []),
    ...(!lbEnabled ? [["client", "app1"] as [string, string]] : []),
    ...(cacheEnabled ? [["client", "cache"] as [string, string], ["cache", "app1"] as [string, string]] : []),
    ["app1", "db"], ...(serverCount >= 2 ? [["app2", "db"] as [string, string]] : []),
    ...(serverCount >= 3 ? [["app3", "db"] as [string, string]] : []),
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-5">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-4 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Stress test</p>
          <Slider label="Traffic level" valueLabel={`${traffic}%`} min={0} max={100} step={1} value={traffic} onChange={setTraffic} accent="amber" />

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
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Latency" value={`${latency}ms`} sub={latency > 200 ? "⚠ high" : "ok"} />
          <StatBox label="DB load" value={`${Math.min(999, Math.round(dbUtil * 100))}%`} sub={dbUtil > 1 ? "OVERLOAD" : "fine"} />
        </div>

        <button onClick={triggerSpike}
          className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
            spiking ? "bg-red-100 text-red-700 border border-red-300 animate-pulse"
                    : "bg-slate-900 text-white hover:bg-slate-800"
          )}>
          <Zap className="w-4 h-4" />
          {spiking ? "SPIKE: 5× traffic!" : "Inject traffic spike"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] overflow-hidden">
          <div className="p-4 pb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Live architecture</p>
            {overloaded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                <AlertTriangle className="w-3 h-3" /> Bottleneck detected
              </motion.div>
            )}
          </div>

          <div className="relative" style={{ height: 310 }}>
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="bt-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="0.5" cy="0.5" r="0.5" fill="#e2e8f0" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#f9f9f6" />
              <rect width="100%" height="100%" fill="url(#bt-dots)" />

              {edges.map(([a, b]) => {
                const na = visibleNodes.find(n => n.id === a);
                const nb = visibleNodes.find(n => n.id === b);
                if (!na || !nb) return null;
                const x1 = na.x + NW / 2, y1 = na.y + NH / 2;
                const x2 = nb.x + NW / 2, y2 = nb.y + NH / 2;
                return (
                  <motion.line key={`${a}-${b}`}
                    x1={`${(x1 / 620) * 100}%`} y1={y1}
                    x2={`${(x2 / 620) * 100}%`} y2={y2}
                    stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  />
                );
              })}

              {edges.slice(0, 4).map(([a, b], i) => {
                const na = visibleNodes.find(n => n.id === a);
                const nb = visibleNodes.find(n => n.id === b);
                if (!na || !nb) return null;
                const x1 = (na.x + NW / 2) / 620 * 100;
                const y1 = na.y + NH / 2;
                const x2 = (nb.x + NW / 2) / 620 * 100;
                const y2 = nb.y + NH / 2;
                const dotColor = overloaded ? "#ef4444" : spiking ? "#f59e0b" : "#6366f1";
                return Array.from({ length: Math.min(3, Math.max(1, Math.round(traffic / 20))) }).map((_, j) => (
                  <motion.circle key={`dot-${a}-${b}-${j}`} r={3} fill={dotColor} fillOpacity={0.7}
                    initial={{ cx: `${x1}%`, cy: y1 }}
                    animate={{ cx: [`${x1}%`, `${x2}%`], cy: [y1, y2], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: i * 0.3 + j * 0.4, ease: "linear" }}
                  />
                ));
              })}

              {visibleNodes.map(node => {
                const color = nodeColor(node.util);
                const isHot = node.util >= 0.9;
                const cx = (node.x + NW / 2) / 620 * 100;
                const cy = node.y + NH / 2;
                return (
                  <g key={node.id}>
                    {isHot && (
                      <motion.rect x={`${((node.x - 5) / 620) * 100}%`} y={node.y - 5} width={`${((NW + 10) / 620) * 100}%`} height={NH + 10} rx={10}
                        fill="none" stroke="#ef4444" strokeWidth={2}
                        animate={{ opacity: [0.8, 0.2, 0.8] }} transition={{ duration: 1, repeat: Infinity }} />
                    )}
                    <rect x={`${(node.x / 620) * 100}%`} y={node.y} width={`${(NW / 620) * 100}%`} height={NH} rx={7} fill={color} />
                    <text x={`${cx}%`} y={cy - 4} textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize={9.5} fontWeight={600} style={{ userSelect: "none" }}>
                      {node.label}
                    </text>
                    <text x={`${cx}%`} y={cy + 8} textAnchor="middle" dominantBaseline="central"
                      fill="rgba(255,255,255,0.65)" fontSize={8} style={{ userSelect: "none" }}>
                      {node.sub}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="px-4 pb-4 space-y-2">
            <HeatBar value={clamp(serverUtil, 0, 1.2)} label="App server load" />
            <HeatBar value={clamp(dbUtil, 0, 1.2)} label="Database load" />
          </div>
        </div>

        {/* Overload recommendation */}
        <AnimatePresence>
          {overloaded && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-white border-2 border-red-200 space-y-2"
            >
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider">How to fix this bottleneck</p>
              {serverUtil > 1 && !lbEnabled && (
                <p className="text-xs text-slate-700 flex gap-2"><span className="text-red-500 font-bold">→</span> Enable the Load Balancer to distribute traffic across multiple app servers.</p>
              )}
              {serverUtil > 1 && lbEnabled && serverCount < 3 && (
                <p className="text-xs text-slate-700 flex gap-2"><span className="text-red-500 font-bold">→</span> App servers are overloaded — add more servers (click + above) to spread the load.</p>
              )}
              {dbUtil > 1 && !cacheEnabled && (
                <p className="text-xs text-slate-700 flex gap-2"><span className="text-red-500 font-bold">→</span> Enable Cache (Redis) — it absorbs ~75% of DB reads, immediately cutting database pressure.</p>
              )}
              {dbUtil > 1 && cacheEnabled && (
                <p className="text-xs text-slate-700 flex gap-2"><span className="text-red-500 font-bold">→</span> DB still overloaded despite cache — the next step is a read replica or database sharding.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Simulation 5: Scaling Strategies ─────────────────────────────────────────

function Sim5Scaling() {
  const [cdn,      setCdn]      = useState(false);
  const [cache,    setCache]    = useState(false);
  const [lb,       setLb]       = useState(false);
  const [replica,  setReplica]  = useState(false);
  const [sharding, setSharding] = useState(false);

  const toggles = [
    { key: "cdn",      label: "CDN",           active: cdn,      set: setCdn,      cost: 30,  desc: "Caches static content at edge nodes globally — cuts latency for distant users." },
    { key: "cache",    label: "Cache (Redis)", active: cache,    set: setCache,    cost: 45,  desc: "Stores hot data in memory — serves reads 10× faster than hitting the database." },
    { key: "lb",       label: "Load Balancer", active: lb,       set: setLb,       cost: 20,  desc: "Distributes traffic across multiple app servers — removes single point of failure." },
    { key: "replica",  label: "Read Replica",  active: replica,  set: setReplica,  cost: 60,  desc: "Copy of the DB handling read traffic — offloads the primary database." },
    { key: "sharding", label: "DB Sharding",   active: sharding, set: setSharding, cost: 100, desc: "Splits data across multiple DB nodes — scales write throughput horizontally." },
  ];

  const baseCost    = 100;
  const totalCost   = baseCost + toggles.filter(t => t.active).reduce((s, t) => s + t.cost, 0);
  const activeCount = toggles.filter(t => t.active).length;

  const latency      = Math.max(20, 200 - (cdn ? 60 : 0) - (cache ? 70 : 0) - (lb ? 10 : 0));
  const availability = Math.min(99.99, 95 + (lb ? 2 : 0) + (replica ? 2 : 0) + (cdn ? 0.5 : 0));
  const scalability  = Math.min(100, 20 + (lb ? 20 : 0) + (cache ? 20 : 0) + (sharding ? 25 : 0) + (replica ? 10 : 0) + (cdn ? 5 : 0));
  const complexity   = activeCount * 20;

  const metrics = [
    { label: "Latency",      value: `${latency}ms`,              bar: 1 - latency / 200,       good: latency < 80 },
    { label: "Availability", value: `${availability.toFixed(2)}%`, bar: (availability - 95) / 5, good: availability >= 99 },
    { label: "Scalability",  value: `${scalability}%`,           bar: scalability / 100,       good: scalability >= 60 },
    { label: "Complexity",   value: `${complexity}%`,            bar: complexity / 100,        good: false },
    { label: "Monthly Cost", value: fmtCost(totalCost),          bar: totalCost / 500,         good: false },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-5">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">Add infrastructure</p>
          <div className="space-y-2">
            {toggles.map(t => (
              <motion.button key={t.key} layout onClick={() => t.set(!t.active)}
                className={cn("w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                  t.active ? "bg-white border-slate-300 shadow-sm" : "bg-[#f9f9f6] border-slate-200 hover:bg-white"
                )}>
                <div className={cn("w-3 h-3 rounded-full shrink-0 mt-0.5", t.active ? "bg-emerald-500" : "bg-slate-300")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{t.label}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                      t.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>+${t.cost}/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{t.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-[#f9f9f6] p-4 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Tradeoff impact</p>
          {metrics.map(m => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">{m.label}</span>
                <motion.span key={m.value} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={cn("tabular-nums", m.good ? "text-emerald-600" : m.label === "Complexity" || m.label === "Monthly Cost" ? "text-amber-600" : "text-slate-700")}>
                  {m.value}
                </motion.span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <motion.div animate={{ width: `${clamp(m.bar, 0, 1) * 100}%` }} transition={{ duration: 0.4 }}
                  className={cn("h-full rounded-full",
                    m.label === "Complexity" || m.label === "Monthly Cost" ? "bg-amber-400" :
                    m.good ? "bg-emerald-400" : "bg-sky-400"
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
          {activeCount === 0 && "Start with a basic server setup. Add infrastructure to see how tradeoffs change."}
          {activeCount > 0 && !cache && !cdn && "Adding cache or CDN will dramatically reduce latency."}
          {(cache || cdn) && !lb && "High availability requires a load balancer for failover."}
          {lb && !replica && "Read replicas let you scale DB reads without overloading the primary."}
          {activeCount >= 4 && "Full stack — high cost and complexity, but excellent performance and reliability."}
        </div>
      </div>
    </div>
  );
}

// ─── Mini Challenges ───────────────────────────────────────────────────────────

const CHALLENGES = [
  {
    id: "c1", label: "Handle 10M DAU", icon: "🚀",
    description: "Build a system that can handle 10 million daily users.",
    hint: "Traffic tab → push DAU to 10M → watch server count scale. Peak QPS will determine how many servers you need.",
  },
  {
    id: "c2", label: "Latency under 80ms", icon: "⚡",
    description: "Reduce system latency below 80ms in the Scaling tab.",
    hint: "Scaling tab → enable CDN (−60ms) + Cache (−70ms). Together they push latency below 80ms.",
  },
  {
    id: "c3", label: "Survive a viral spike", icon: "📈",
    description: "Trigger a spike in the Bottleneck tab without the DB overloading.",
    hint: "Enable cache (absorbs 75% of DB reads) and add 2+ app servers before hitting Inject Spike.",
  },
  {
    id: "c4", label: "1 year of video storage", icon: "💾",
    description: "Estimate 1 year of storage for 100K daily video uploads.",
    hint: "Storage tab → 100K uploads/day, 50MB avg file, 12 months retention, ×3 replication.",
  },
];

function MiniChallenges() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());

  const toggleComplete = (id: string) => setCompleted(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleHint = (id: string) => setShownHints(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Mini Challenges</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CHALLENGES.map(ch => {
          const done      = completed.has(ch.id);
          const hintShown = shownHints.has(ch.id);
          return (
            <div key={ch.id}
              className={cn("p-4 rounded-xl border-2 transition-all space-y-2", done ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{ch.icon}</span>
                <p className={cn("text-xs font-bold", done ? "text-emerald-700" : "text-slate-700")}>{ch.label}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{ch.description}</p>

              <AnimatePresence>
                {hintShown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-sky-50 border border-sky-200">
                      <Lightbulb className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-sky-800 leading-relaxed">{ch.hint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-1.5">
                <button onClick={() => toggleHint(ch.id)}
                  className={cn("flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all flex-1",
                    hintShown ? "bg-sky-100 text-sky-700 border-sky-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}>
                  {hintShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {hintShown ? "Hide hint" : "Hint"}
                </button>
                <button onClick={() => toggleComplete(ch.id)}
                  className={cn("flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex-1",
                    done ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                         : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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

// ─── Main export ──────────────────────────────────────────────────────────────

type Tab = "traffic" | "qps" | "storage" | "bottleneck" | "scaling";

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: "traffic",    label: "Traffic Growth",    icon: "📈" },
  { key: "qps",        label: "QPS Calculator",    icon: "⚡" },
  { key: "storage",    label: "Storage",           icon: "💾" },
  { key: "bottleneck", label: "Bottlenecks",       icon: "🔴" },
  { key: "scaling",    label: "Scaling",           icon: "⚙️"  },
];

export function CapacityEstimationVisual() {
  const [tab, setTab] = useState<Tab>("traffic");

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">Choose a simulation</p>
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all",
                tab === t.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
              )}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "traffic"    && <Sim1Traffic />}
            {tab === "qps"        && <Sim2QPS />}
            {tab === "storage"    && <Sim3Storage />}
            {tab === "bottleneck" && <Sim4Bottleneck />}
            {tab === "scaling"    && <Sim5Scaling />}
          </motion.div>
        </AnimatePresence>
      </div>

      <MiniChallenges />
    </div>
  );
}
