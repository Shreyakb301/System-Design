"use client";

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Eye, EyeOff, Lightbulb, CheckCircle2, AlertTriangle, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestId = "login" | "profile" | "upload" | "notifs";
type SimTab = "flow" | "payload" | "streaming" | "services";
type LanePhase = "idle" | "to_server" | "at_server" | "to_client" | "done";
type StreamScenario = "chat" | "stocks" | "iot" | "game";

interface RequestDef {
  id: RequestId;
  label: string;
  emoji: string;
  rest: { bytes: number; latencyMs: number; serialMs: number; json: string };
  grpc: { bytes: number; latencyMs: number; serialMs: number; proto: string };
}

interface SolutionStep {
  question: string;
  answer: string;
  icon: string;
  side: "rest" | "grpc";
}

interface Challenge {
  id: string;
  icon: string;
  label: string;
  description: string;
  answer: "rest" | "grpc";
  answerLabel: string;
  explanation: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const REQUESTS: RequestDef[] = [
  {
    id: "login", label: "Login", emoji: "🔐",
    rest: { bytes: 1200, latencyMs: 180, serialMs: 45, json: '{"user":"alex","pass":"••••","device":"ios"}' },
    grpc: { bytes: 285,  latencyMs: 90,  serialMs: 12, proto: "user: alex · device: ios" },
  },
  {
    id: "profile", label: "Fetch Profile", emoji: "👤",
    rest: { bytes: 3400, latencyMs: 220, serialMs: 82, json: '{"id":123,"name":"Alex","email":"alex@co","prefs":{...}}' },
    grpc: { bytes: 620,  latencyMs: 95,  serialMs: 18, proto: "id: 123 · name: Alex" },
  },
  {
    id: "upload", label: "Upload Metadata", emoji: "🖼️",
    rest: { bytes: 8200, latencyMs: 340, serialMs: 120, json: '{"file":"photo.jpg","size":2048576,"tags":["beach"]}' },
    grpc: { bytes: 1100, latencyMs: 140, serialMs: 28, proto: "file: photo.jpg · size: 2048576" },
  },
  {
    id: "notifs", label: "Get Updates", emoji: "🔔",
    rest: { bytes: 950,  latencyMs: 150, serialMs: 35, json: '{"items":[{"id":1,"msg":"Order ready!"}]}' },
    grpc: { bytes: 210,  latencyMs: 45,  serialMs: 8,  proto: "id: 1 · msg: Order ready" },
  },
];

const STREAM_DEFS: Record<StreamScenario, { label: string; emoji: string; intervalMs: number; desc: string }> = {
  chat:   { label: "Live Chat",    emoji: "💬", intervalMs: 800,  desc: "Messages arrive as users type" },
  stocks: { label: "Stock Prices", emoji: "📈", intervalMs: 500,  desc: "Price ticks every 500ms" },
  iot:    { label: "IoT Sensors",  emoji: "🌡️", intervalMs: 200,  desc: "Sensor readings every 200ms" },
  game:   { label: "Game Events",  emoji: "🎮", intervalMs: 100,  desc: "Game state updates at ~10 fps" },
};

const SOLUTION_STEPS: SolutionStep[] = [
  { icon: "🌐", side: "rest",  question: "Is this a public API?",               answer: "REST — developers can call it from any browser or curl with zero setup." },
  { icon: "⚡", side: "grpc",  question: "Internal microservice communication?", answer: "gRPC — compact Protobuf + HTTP/2 multiplexing reduces latency and bandwidth." },
  { icon: "🖥️", side: "rest",  question: "Need browser compatibility?",          answer: "REST works natively. gRPC requires a gRPC-Web proxy or transcoding layer." },
  { icon: "📡", side: "grpc",  question: "Need real-time streaming?",            answer: "gRPC server/bidirectional streaming is far more efficient than REST polling." },
  { icon: "🔍", side: "rest",  question: "Need human-readable debugging?",       answer: "REST JSON is readable with curl/Postman. gRPC binary requires tooling like grpcurl." },
  { icon: "📈", side: "grpc",  question: "Need extremely high throughput?",      answer: "gRPC handles more requests with less bandwidth due to binary encoding + multiplexing." },
];

const CHALLENGES: Challenge[] = [
  { id: "c1", icon: "🌍", label: "Public Developer API",
    description: "Building a public API for third-party developers. Which protocol?",
    answer: "rest", answerLabel: "REST",
    explanation: "Developers can call REST from any language or browser without generated client code. Lower barrier to adoption." },
  { id: "c2", icon: "🔁", label: "50 Internal Microservices",
    description: "50 microservices need to communicate efficiently at high volume.",
    answer: "grpc", answerLabel: "gRPC",
    explanation: "gRPC's compact Protobuf + HTTP/2 multiplexing reduces latency and bandwidth when services call each other constantly." },
  { id: "c3", icon: "🎮", label: "Real-Time Multiplayer",
    description: "A game needs to push state updates to players at ~30 fps.",
    answer: "grpc", answerLabel: "gRPC Streaming",
    explanation: "A persistent bidirectional gRPC stream avoids the connection overhead of repeated HTTP requests." },
  { id: "c4", icon: "📖", label: "Beginner-Friendly API",
    description: "An API that developers should be able to explore in a browser without any tooling.",
    answer: "rest", answerLabel: "REST",
    explanation: "REST + JSON is readable and explorable. No generated client code, no binary encoding, no schema required to get started." },
  { id: "c5", icon: "📱", label: "Reduce Mobile Bandwidth",
    description: "Your mobile app sends thousands of small messages and bandwidth is expensive.",
    answer: "grpc", answerLabel: "gRPC",
    explanation: "Protobuf is typically 3–5× smaller than JSON. On mobile this directly reduces data usage and battery drain." },
];

// ─── Shared helpers ────────────────────────────────────────────────────────────

function bytesLabel(b: number) {
  if (b < 1000) return `${b}B`;
  return `${(b / 1000).toFixed(1)}KB`;
}

function MetricPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("px-2 py-1 rounded-lg text-center", highlight ? "bg-emerald-100 border border-emerald-300" : "bg-slate-100")}>
      <p className="text-[8px] text-slate-400 font-medium uppercase">{label}</p>
      <p className={cn("text-[11px] font-bold", highlight ? "text-emerald-700" : "text-slate-700")}>{value}</p>
    </div>
  );
}

function MiniBar({ label, value, max, blue }: { label: string; value: number; max: number; blue: boolean }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <span className={cn("font-bold", blue ? "text-blue-600" : "text-violet-600")}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div className={cn("h-full rounded-full", blue ? "bg-blue-400" : "bg-violet-400")}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
    </div>
  );
}

// ─── Section 1: Concept Snapshot ─────────────────────────────────────────────

function ConceptSnapshot() {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Concept Snapshot</p>
        <p className="text-xs text-slate-500 mt-1">
          REST prioritizes simplicity and compatibility. gRPC prioritizes performance and efficient service-to-service communication.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* REST */}
        <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-3 space-y-2">
          <p className="text-sm font-bold text-blue-700">🌐 REST</p>
          <div className="space-y-1.5">
            {[["📄","HTTP + JSON"],["👁️","Human-readable"],["🖥️","Browser-friendly"],["🔓","Public APIs"]].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-1.5">
                <span className="text-sm">{icon}</span>
                <span className="text-[11px] text-blue-800">{text}</span>
              </div>
            ))}
          </div>
          <pre className="mt-2 p-2 rounded-lg bg-white border border-blue-200 text-[8px] font-mono text-slate-600 whitespace-pre leading-relaxed overflow-hidden">
{`{
  "user": "alex",
  "email": "alex@co.com"
}`}
          </pre>
        </div>

        {/* gRPC */}
        <div className="rounded-xl border-2 border-violet-100 bg-violet-50 p-3 space-y-2">
          <p className="text-sm font-bold text-violet-700">⚡ gRPC</p>
          <div className="space-y-1.5">
            {[["⚡","HTTP/2 + Protobuf"],["📦","Binary format"],["🚀","Faster & smaller"],["🔧","Internal services"]].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-1.5">
                <span className="text-sm">{icon}</span>
                <span className="text-[11px] text-violet-800">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 p-2 rounded-lg bg-violet-900 border border-violet-700 space-y-1">
            <p className="text-[8px] text-violet-400 font-mono">protobuf binary</p>
            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: 18 }, (_, i) => (
                <div key={i} className={cn("w-2.5 h-2.5 rounded-sm",
                  i % 3 === 0 ? "bg-violet-400" : i % 5 === 0 ? "bg-violet-300" : "bg-violet-700")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simulation 1: Communication Flow ─────────────────────────────────────────

function animateLane(
  def: { latencyMs: number },
  setPhase: Dispatch<SetStateAction<LanePhase>>,
  timers: ReturnType<typeof setTimeout>[]
) {
  const travelMs = def.latencyMs * 6;
  const processMs = def.latencyMs * 2;
  const returnMs = def.latencyMs * 4;

  setPhase("to_server");
  timers.push(setTimeout(() => {
    setPhase("at_server");
    timers.push(setTimeout(() => {
      setPhase("to_client");
      timers.push(setTimeout(() => setPhase("done"), returnMs));
    }, processMs));
  }, travelMs));
}

interface CommLaneProps {
  isRest: boolean;
  req: RequestDef;
  phase: LanePhase;
}

function CommLane({ isRest, req, phase }: CommLaneProps) {
  const restDef = req.rest;
  const grpcDef = req.grpc;
  const def = isRest ? restDef : grpcDef;
  const travelS = (def.latencyMs * 6) / 1000;
  const returnS = (def.latencyMs * 4) / 1000;

  const atRight = phase === "to_server" || phase === "at_server";
  const atLeft  = phase === "to_client" || phase === "done" || phase === "idle";
  const isVisible = phase !== "idle";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={cn("text-[10px] font-bold uppercase tracking-widest", isRest ? "text-blue-600" : "text-violet-600")}>
          {isRest ? "🌐 REST" : "⚡ gRPC"}
        </p>
        <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
          isRest ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700")}>
          {isRest ? "JSON · HTTP/1.1" : "Protobuf · HTTP/2"}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center overflow-hidden">
        <div className={cn("relative z-10 mx-2 w-14 h-10 shrink-0 rounded-lg border-2 flex items-center justify-center text-[9px] font-bold",
          isRest ? "border-blue-200 bg-blue-50 text-blue-700" : "border-violet-200 bg-violet-50 text-violet-700")}> 
          CLIENT
        </div>

        {isVisible && (
          <motion.div
            className={cn("absolute top-1/2 -translate-y-1/2",
              isRest
                ? "bg-blue-100 border border-blue-300 rounded-lg px-2 py-1 text-[7px] font-mono text-blue-800 max-w-[96px] truncate"
                : "w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0"
            )}
            animate={{ left: atRight ? "66%" : "18%" }}
            transition={{ duration: atRight ? travelS : returnS, ease: "linear" }}
          >
            {isRest ? (restDef.json.slice(0, 16) + "…") : "pb"}
          </motion.div>
        )}

        <div className={cn("relative z-10 ml-auto mx-2 w-14 h-10 shrink-0 rounded-lg border-2 flex items-center justify-center text-[9px] font-bold transition-colors",
          phase === "at_server"
            ? (isRest ? "border-blue-400 bg-blue-100 text-blue-700" : "border-violet-400 bg-violet-100 text-violet-700")
            : "border-slate-200 bg-white text-slate-500")}>
          SERVER
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-1.5">
        <MetricPill label="Payload"  value={bytesLabel(def.bytes)} />
        <MetricPill label="Latency"  value={`${def.latencyMs}ms`} highlight={!isRest} />
        <MetricPill label="Serial"   value={`${def.serialMs}ms`}  highlight={!isRest} />
      </div>

      {/* Payload preview */}
      <div className={cn("rounded-lg p-2 text-[8px] leading-relaxed overflow-hidden",
        isRest ? "bg-blue-50 border border-blue-200" : "bg-violet-950 border border-violet-800")}>
        {isRest ? (
          <pre className="font-mono text-blue-800 whitespace-pre-wrap">{restDef.json}</pre>
        ) : (
          <div className="space-y-1">
            <p className="text-violet-400">Binary Protobuf · {bytesLabel(def.bytes)}</p>
            <div className="flex flex-wrap gap-0.5">
              {grpcDef.proto.split(" · ").map((f, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-violet-800 text-violet-200">{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FlowSim() {
  const [reqId, setReqId]     = useState<RequestId>("login");
  const [restPhase, setRest]  = useState<LanePhase>("idle");
  const [grpcPhase, setGrpc]  = useState<LanePhase>("idle");
  const [isSending, setSending] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const req = REQUESTS.find(r => r.id === reqId)!;

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    clearAll();
    setRest("idle");
    setGrpc("idle");
    setSending(false);
  }, [clearAll]);

  const send = useCallback(() => {
    if (isSending) return;
    reset();
    setSending(true);
    setTimeout(() => {
      animateLane(req.rest, setRest, timers.current);
      animateLane(req.grpc, setGrpc, timers.current);
      const totalMs = req.rest.latencyMs * 6 + req.rest.latencyMs * 2 + req.rest.latencyMs * 4 + 200;
      timers.current.push(setTimeout(() => setSending(false), totalMs));
    }, 80);
  }, [isSending, reset, req]);

  useEffect(() => () => clearAll(), [clearAll]);

  const ratio = (req.rest.bytes / req.grpc.bytes).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {REQUESTS.map(r => (
          <button key={r.id} onClick={() => { reset(); setReqId(r.id); }}
            className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
              reqId === r.id ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400")}>
            <span>{r.emoji}</span> {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CommLane isRest req={req} phase={restPhase} />
        <CommLane isRest={false} req={req} phase={grpcPhase} />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <span className="text-lg">📦</span>
        <p className="text-xs text-slate-600">
          gRPC payload is <strong>{ratio}× smaller</strong> for this request.{" "}
          <span className="text-slate-400">Multiply that by millions of calls per day.</span>
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={send} disabled={isSending}
          className={cn("flex-1 py-2 rounded-xl text-[12px] font-bold border-2 transition-all",
            isSending ? "border-slate-200 bg-slate-100 text-slate-400" : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800")}>
          {isSending ? "Sending…" : `Send ${req.emoji} ${req.label}`}
        </button>
        <button onClick={reset}
          className="px-3 py-2 rounded-xl text-[11px] font-semibold border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Simulation 2: Payload & Performance ─────────────────────────────────────

function PayloadSim() {
  const [rps, setRps]        = useState(10);
  const [size, setSize]      = useState<"small" | "medium" | "large">("medium");
  const [mobile, setMobile]  = useState(false);

  const baseRest = size === "small" ? 800 : size === "medium" ? 2400 : 8200;
  const baseGrpc = size === "small" ? 200 : size === "medium" ? 650  : 1400;

  const restBw  = Math.round((baseRest * rps) / 1024);
  const grpcBw  = Math.round((baseGrpc * rps) / 1024);
  const maxBw   = Math.max(restBw * 1.15, 1);

  const restLat = Math.round(80 + rps * 1.8 + (mobile ? 45 : 0));
  const grpcLat = Math.round(40 + rps * 0.6 + (mobile ? 15 : 0));
  const maxLat  = Math.max(restLat * 1.15, 1);

  const saving = Math.round(((baseRest - baseGrpc) / baseRest) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Requests / sec</p>
            <span className="text-xs font-bold text-slate-700">{rps}</span>
          </div>
          <input type="range" min={1} max={100} value={rps} onChange={e => setRps(+e.target.value)}
            className="w-full accent-slate-900" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Payload Size</p>
          <div className="flex gap-1">
            {(["small","medium","large"] as const).map(s => (
              <button key={s} onClick={() => setSize(s)}
                className={cn("flex-1 py-1 rounded-lg text-[10px] font-semibold capitalize border transition-all",
                  size === s ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600")}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={() => setMobile(m => !m)}
        className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold border-2 transition-all",
          mobile ? "bg-amber-500 text-white border-amber-500" : "bg-white border-slate-200 text-slate-600")}>
        📱 {mobile ? "Mobile Network (on)" : "Simulate Mobile Network"}
      </button>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Bandwidth (KB/s)</p>
        <MiniBar label="REST (JSON)"      value={restBw} max={maxBw} blue />
        <MiniBar label="gRPC (Protobuf)"  value={grpcBw} max={maxBw} blue={false} />
        <p className="text-[10px] text-emerald-700">
          gRPC uses <strong>{saving}%</strong> less bandwidth for the same {rps} req/s.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Average Latency (ms)</p>
        <MiniBar label="REST"  value={restLat} max={maxLat} blue />
        <MiniBar label="gRPC"  value={grpcLat} max={maxLat} blue={false} />
        {mobile && <p className="text-[10px] text-amber-600">📱 Mobile: compact Protobuf saves more here.</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricPill label="REST/req"  value={bytesLabel(baseRest)} />
        <MetricPill label="gRPC/req"  value={bytesLabel(baseGrpc)} />
        <MetricPill label="Saving"    value={`${saving}%`} highlight />
      </div>
    </div>
  );
}

// ─── Simulation 3: Streaming ──────────────────────────────────────────────────

function StreamingSim() {
  const [scenario, setScenario] = useState<StreamScenario>("chat");
  const [running, setRunning]   = useState(false);
  const [restDots, setRestDots] = useState<string[]>([]);
  const [grpcDots, setGrpcDots] = useState<string[]>([]);
  const [restCount, setRestCount] = useState(0);
  const [grpcCount, setGrpcCount] = useState(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const grpcRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const def = STREAM_DEFS[scenario];

  const stopAll = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    if (grpcRef.current) clearInterval(grpcRef.current);
    if (stopRef.current) clearTimeout(stopRef.current);
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    setRestDots([]); setGrpcDots([]);
    setRestCount(0); setGrpcCount(0);
    setRunning(true);

    grpcRef.current = setInterval(() => {
      const id = Math.random().toString(36).slice(2);
      setGrpcDots(p => [...p.slice(-20), id]);
      setGrpcCount(c => c + 1);
    }, def.intervalMs);

    restRef.current = setInterval(() => {
      const id = Math.random().toString(36).slice(2);
      setRestDots(p => [...p.slice(-6), id]);
      setRestCount(c => c + 1);
    }, def.intervalMs * 3);

    stopRef.current = setTimeout(stopAll, 10000);
  }, [def.intervalMs, stopAll]);

  const toggle = useCallback(() => { if (running) stopAll(); else start(); }, [running, stopAll, start]);

  // Tear down any running animation timers when the scenario changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (running) { stopAll(); } }, [scenario]);
  useEffect(() => () => stopAll(), [stopAll]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(STREAM_DEFS) as [StreamScenario, typeof def][]).map(([id, s]) => (
          <button key={id} onClick={() => setScenario(id)}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
              scenario === id ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400")}>
            <span>{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">{def.desc} — every {def.intervalMs}ms.</p>

      <div className="grid grid-cols-2 gap-3">
        {/* REST polling */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">🌐 REST (Polling)</p>
          <div className="h-28 rounded-xl border border-blue-200 bg-blue-50 p-2 overflow-hidden flex flex-col gap-1">
            <p className="text-[8px] text-blue-400 font-mono shrink-0">GET /updates?since=…</p>
            <div className="space-y-1 overflow-hidden">
              <AnimatePresence>
                {restDots.slice(-5).map(id => (
                  <motion.div key={id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 border border-blue-200">
                    <div className="w-10 h-1.5 rounded bg-blue-300" />
                    <span className="text-[7px] text-blue-500 font-mono">new request</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <MetricPill label="Requests" value={String(restCount)} />
            <MetricPill label="Overhead" value={`${restCount * 450}B`} />
          </div>
        </div>

        {/* gRPC stream */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">⚡ gRPC (Stream)</p>
          <div className="h-28 rounded-xl border border-violet-200 bg-violet-50 p-2 overflow-hidden flex flex-col gap-1">
            <p className="text-[8px] text-violet-400 font-mono shrink-0">— open stream —</p>
            <div className="flex flex-wrap gap-0.5 content-start overflow-hidden">
              <AnimatePresence>
                {grpcDots.slice(-24).map(id => (
                  <motion.div key={id}
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                    className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <MetricPill label="Chunks" value={String(grpcCount)} />
            <MetricPill label="Overhead" value="40B" highlight />
          </div>
        </div>
      </div>

      <button onClick={toggle}
        className={cn("w-full py-2 rounded-xl text-[12px] font-bold border-2 transition-all",
          running ? "border-red-300 bg-red-50 text-red-600" : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800")}>
        {running ? "⏹ Stop" : `▶ Start ${def.emoji} Stream`}
      </button>

      {grpcCount > 0 && !running && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs text-emerald-800">
            gRPC sent <strong>{grpcCount}</strong> chunks vs REST&apos;s <strong>{restCount}</strong> separate requests —
            using <strong>1 persistent connection</strong> instead of {restCount}.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Simulation 4: Services & Browser ─────────────────────────────────────────

const SVC_NODES = [
  { id: "auth",  label: "Auth",     icon: "🔑" },
  { id: "order", label: "Orders",   icon: "📦" },
  { id: "pay",   label: "Payments", icon: "💳" },
  { id: "notif", label: "Notifs",   icon: "🔔" },
];
const SVC_CONNS = [
  { from: "auth", to: "order" },
  { from: "order", to: "pay" },
  { from: "order", to: "notif" },
  { from: "auth", to: "pay" },
];

function ServicesSim() {
  const [mode, setMode]           = useState<"rest" | "grpc">("rest");
  const [active, setActive]       = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAnimating(false);
    setActive(null);
  }, []);

  const toggle = useCallback(() => {
    if (animating) { stop(); return; }
    setAnimating(true);
    let i = 0;
    intervalRef.current = setInterval(() => {
      const c = SVC_CONNS[i % SVC_CONNS.length];
      setActive(`${c.from}-${c.to}`);
      i++;
    }, mode === "grpc" ? 450 : 700);
  }, [animating, stop, mode]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {(["rest", "grpc"] as const).map(m => (
          <button key={m} onClick={() => { stop(); setMode(m); }}
            className={cn("px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all uppercase",
              mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
            {m === "rest" ? "🌐 REST" : "⚡ gRPC"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SVC_NODES.map(s => {
          const isActive = SVC_CONNS.some(c =>
            (c.from === s.id || c.to === s.id) && active === `${c.from}-${c.to}`
          );
          return (
            <motion.div key={s.id}
              animate={isActive ? { scale: 1.03 } : { scale: 1 }}
              className={cn("rounded-xl border-2 p-3 transition-colors",
                isActive
                  ? (mode === "grpc" ? "border-violet-400 bg-violet-50" : "border-blue-400 bg-blue-50")
                  : "border-slate-200 bg-white")}>
              <div className="flex items-center gap-2">
                <span className="text-base">{s.icon}</span>
                <span className="text-[11px] font-bold text-slate-700">{s.label}</span>
                {isActive && (
                  <span className={cn("ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    mode === "grpc" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700")}>
                    {mode === "grpc" ? "pb ⚡" : "JSON"}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-slate-400 mt-1">{mode === "rest" ? "HTTP/1.1 · JSON" : "HTTP/2 · Protobuf"}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricPill label="Avg Latency"  value={mode === "rest" ? "~180ms" : "~60ms"}  highlight={mode === "grpc"} />
        <MetricPill label="Payload/call" value={mode === "rest" ? "~2.4KB" : "~0.6KB"} highlight={mode === "grpc"} />
        <MetricPill label="Protocol"     value={mode === "rest" ? "HTTP/1.1" : "HTTP/2"} />
      </div>

      <button onClick={toggle}
        className={cn("w-full py-2 rounded-xl text-[12px] font-bold border-2 transition-all",
          animating ? "border-slate-300 bg-slate-100 text-slate-500" : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800")}>
        {animating ? "⏹ Stop Traffic" : "▶ Simulate Traffic"}
      </button>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">🖥️ Browser Compatibility</p>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div>
            <p className="font-semibold text-blue-700 mb-0.5">REST</p>
            <p className="text-slate-600 leading-relaxed">Works natively. curl, Postman, and fetch() all work with no setup.</p>
          </div>
          <div>
            <p className="font-semibold text-violet-700 mb-0.5">gRPC</p>
            <p className="text-slate-600 leading-relaxed">Requires gRPC-Web proxy or transcoding. Can&apos;t call gRPC directly from browser JS.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simulation Panel ─────────────────────────────────────────────────────────

function SimulationPanel() {
  const [tab, setTab] = useState<SimTab>("flow");
  const tabs: { id: SimTab; label: string }[] = [
    { id: "flow",      label: "Communication" },
    { id: "payload",   label: "Payload & Speed" },
    { id: "streaming", label: "Streaming" },
    { id: "services",  label: "Services" },
  ];
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Interactive Simulations</p>
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}>
          {tab === "flow"      && <FlowSim />}
          {tab === "payload"   && <PayloadSim />}
          {tab === "streaming" && <StreamingSim />}
          {tab === "services"  && <ServicesSim />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Solution Walkthrough ─────────────────────────────────────────────────────

function SolutionWalkthrough() {
  const [open, setOpen]     = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const step = SOLUTION_STEPS[stepIdx];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Solution Walkthrough</p>
          <p className="text-xs text-slate-500 mt-0.5">Which one should I use?</p>
        </div>
        <button onClick={() => { setOpen(o => !o); setStepIdx(0); }}
          className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border-2 transition-all",
            open ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-900")}>
          {open ? "Hide" : "Show Answer"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={stepIdx === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex gap-1">
                  {SOLUTION_STEPS.map((_, i) => (
                    <button key={i} onClick={() => setStepIdx(i)}
                      className={cn("h-1.5 rounded-full transition-all", i === stepIdx ? "w-6 bg-slate-900" : "w-1.5 bg-slate-300")} />
                  ))}
                </div>
                <button onClick={() => setStepIdx(i => Math.min(SOLUTION_STEPS.length - 1, i + 1))} disabled={stepIdx === SOLUTION_STEPS.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400">{stepIdx + 1} / {SOLUTION_STEPS.length}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={stepIdx}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className={cn("rounded-xl border-2 p-4 space-y-3",
                    step.side === "rest" ? "border-blue-100" : "border-violet-100")}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{step.question}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{step.answer}</p>
                    </div>
                  </div>
                  <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold",
                    step.side === "rest" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-violet-50 text-violet-700 border border-violet-200")}>
                    {step.side === "rest" ? "🌐 Lean toward REST" : "⚡ Lean toward gRPC"}
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

// ─── Mini Challenges ──────────────────────────────────────────────────────────

function MiniChallenges() {
  const [answers, setAnswers]   = useState<Record<string, "rest" | "grpc">>({});
  const [hints, setHints]       = useState<Set<string>>(new Set());

  const toggleHint = useCallback((id: string) =>
    setHints(p => { const s = new Set(p); if (s.has(id)) s.delete(id); else s.add(id); return s; }), []);

  const pick = useCallback((id: string, val: "rest" | "grpc") =>
    setAnswers(p => ({ ...p, [id]: val })), []);

  const correct = Object.entries(answers).filter(([id, v]) => CHALLENGES.find(c => c.id === id)?.answer === v).length;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Mini Challenges</p>
          <p className="text-xs text-slate-500 mt-0.5">Choose REST or gRPC for each scenario.</p>
        </div>
        {correct > 0 && (
          <span className="text-[11px] font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
            {correct} / {CHALLENGES.length} correct
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGES.map(ch => {
          const chosen = answers[ch.id];
          const isCorrect = chosen === ch.answer;
          const hintOn = hints.has(ch.id);
          return (
            <div key={ch.id} className={cn("p-4 rounded-xl border-2 space-y-2 transition-all",
              !chosen ? "border-slate-200 bg-slate-50" :
              isCorrect ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50")}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{ch.icon}</span>
                <p className={cn("text-xs font-bold",
                  chosen ? (isCorrect ? "text-emerald-700" : "text-red-700") : "text-slate-700")}>{ch.label}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{ch.description}</p>

              {!chosen ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => pick(ch.id, "rest")}
                    className="py-1.5 rounded-lg text-[11px] font-bold border-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                    🌐 REST
                  </button>
                  <button onClick={() => pick(ch.id, "grpc")}
                    className="py-1.5 rounded-lg text-[11px] font-bold border-2 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all">
                    ⚡ gRPC
                  </button>
                </div>
              ) : (
                <div className={cn("flex items-center gap-1.5 text-[11px] font-bold",
                  isCorrect ? "text-emerald-700" : "text-red-600")}>
                  {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {isCorrect ? `✓ ${ch.answerLabel}` : `Best: ${ch.answerLabel}`}
                </div>
              )}

              <AnimatePresence>
                {hintOn && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-sky-50 border border-sky-200">
                      <Lightbulb className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-sky-800 leading-relaxed">{ch.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => toggleHint(ch.id)}
                className={cn("flex items-center gap-1 text-[10px] font-semibold transition-colors",
                  hintOn ? "text-sky-600" : "text-slate-400 hover:text-slate-600")}>
                {hintOn ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {hintOn ? "Hide" : "Explain"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ApiComparisonVisual() {
  return (
    <div className="space-y-4">
      <ConceptSnapshot />
      <SimulationPanel />
      <SolutionWalkthrough />
      <MiniChallenges />
    </div>
  );
}
