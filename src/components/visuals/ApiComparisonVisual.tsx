"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    ArrowRight,
    Zap,
    Cpu,
    Network,
    FileJson,
    Binary,
    Clock,
    BarChart3,
    ArrowDownUp,
    Play,
    RotateCcw,
    MessageSquare,
    Radio,
    Globe,
    Server,
    Database,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scenario = "fetch" | "feed" | "streaming";

interface ProtocolMetrics {
    payloadSize: number; // KB
    latency: number; // ms
    calls: number;
    overhead: number; // bytes for headers
}

export function ApiComparisonVisual() {
    const [scenario, setScenario] = useState<Scenario>("fetch");
    const [isSimulating, setIsSimulating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [packets, setPackets] = useState<{ id: string; type: "json" | "binary"; side: "rest" | "grpc" }[]>([]);

    // --- Metrics logic ---
    const metrics = useMemo(() => {
        const base = {
            fetch: {
                rest: { payloadSize: 2.4, latency: 120, calls: 1, overhead: 450 },
                grpc: { payloadSize: 0.8, latency: 85, calls: 1, overhead: 40 }
            },
            feed: {
                rest: { payloadSize: 45.2, latency: 450, calls: 1, overhead: 820 },
                grpc: { payloadSize: 12.8, latency: 210, calls: 1, overhead: 65 }
            },
            streaming: {
                rest: { payloadSize: 1.2, latency: 200, calls: 15, overhead: 6000 }, // Polling
                grpc: { payloadSize: 0.4, latency: 20, calls: 1, overhead: 120 } // Bi-di stream
            }
        };
        return base[scenario];
    }, [scenario]);

    // --- Simulation engine ---
    useEffect(() => {
        if (!isSimulating) return;

        let timer: any;
        const startSim = () => {
            const id = Math.random().toString(36).substr(2, 9);
            const side = Math.random() > 0.5 ? "rest" : "grpc";

            setPackets(prev => [...prev.slice(-15), {
                id,
                type: side === "rest" ? "json" : "binary",
                side
            }]);

            if (progress < 100) {
                setProgress(p => p + 5);
                timer = setTimeout(startSim, 150);
            } else {
                setIsSimulating(false);
            }
        };

        startSim();
        return () => clearTimeout(timer);
    }, [isSimulating, progress]);

    const handleRun = () => {
        setProgress(0);
        setPackets([]);
        setIsSimulating(true);
    };

    const ProtocolPanel = ({ title, type, m, icon: Icon, colorClass, packetColor }: any) => (
        <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", colorClass)}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black tracking-tight">{title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {type === "rest" ? "HTTP/1.1 + JSON" : "HTTP/2 + Protobuf"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Stream Area */}
            <div className="relative h-48 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

                <div className="flex items-center gap-12 z-10 w-full px-8">
                    <Globe className="w-6 h-6 text-slate-300" />
                    <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 relative">
                        <AnimatePresence>
                            {packets.filter(p => p.side === type).map((p) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 180, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1, ease: "linear" }}
                                    className={cn(
                                        "absolute top-[-8px] flex items-center justify-center shadow-lg",
                                        p.type === "json" ? "w-4 h-4 rounded-sm bg-indigo-500" : "w-3 h-3 rounded-full bg-emerald-500"
                                    )}
                                >
                                    {p.type === "json" ? <FileJson className="w-2.5 h-2.5 text-white" /> : <Binary className="w-2 h-2 text-white" />}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <Server className="w-6 h-6 text-slate-300" />
                </div>

                {/* Overhead Visualizer */}
                <div className="absolute bottom-4 left-4 right-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(m.overhead / (m.payloadSize * 1024 + m.overhead)) * 100}%` }}
                        className={cn("h-full", type === "rest" ? "bg-red-400" : "bg-emerald-400")}
                    />
                </div>
                <span className="absolute bottom-6 left-4 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    Header Overhead
                </span>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Payload Size", value: m.payloadSize + " KB", icon: ArrowDownUp, color: "text-blue-500" },
                    { label: "Est. Latency", value: m.latency + " ms", icon: Clock, color: "text-amber-500" },
                    { label: "Request Overhead", value: m.overhead + " B", icon: Cpu, color: "text-indigo-500" },
                    { label: "Calls Count", value: m.calls, icon: Network, color: "text-emerald-500" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 opacity-60">
                            <stat.icon className={cn("w-3 h-3", stat.color)} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{stat.label}</span>
                        </div>
                        <span className="text-sm font-black tabular-nums">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Card className="p-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl overflow-hidden flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                            <ArrowDownUp className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-600 dark:from-white dark:to-slate-400">
                            API Protocol Simulator
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 font-medium tracking-tight italic">Compare payload efficiency and transport optimizations.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { id: "fetch", label: "Simple Get", icon: MessageSquare },
                        { id: "feed", label: "Large Feed", icon: Database },
                        { id: "streaming", label: "Streaming", icon: Radio },
                    ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => { setScenario(s.id as Scenario); setProgress(0); setPackets([]); }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border-2",
                                scenario === s.id ? "bg-indigo-600 border-indigo-700 text-white shadow-lg" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300"
                            )}
                        >
                            <s.icon className="w-3.5 h-3.5" />
                            {s.label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comparison Dashboard */}
            <div className="flex flex-col lg:flex-row gap-12 p-8 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative">
                <ProtocolPanel
                    title="REST"
                    type="rest"
                    m={metrics.rest}
                    icon={FileJson}
                    colorClass="bg-indigo-500"
                />

                {/* VS Divider */}
                <div className="flex items-center justify-center lg:flex-col gap-4">
                    <div className="hidden lg:block w-px h-full bg-slate-200 dark:bg-slate-800" />
                    <div className="p-3 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-xl font-black text-xs text-slate-400 italic">
                        VS
                    </div>
                    <div className="hidden lg:block w-px h-full bg-slate-200 dark:bg-slate-800" />
                </div>

                <ProtocolPanel
                    title="gRPC"
                    type="grpc"
                    m={metrics.grpc}
                    icon={Binary}
                    colorClass="bg-emerald-500"
                />

                {/* Efficiency Overlay */}
                <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-1.5 rounded-full border-2 border-emerald-400 animate-bounce">
                        {(100 - (metrics.grpc.payloadSize / metrics.rest.payloadSize * 100)).toFixed(0)}% SMALLER
                    </Badge>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <Button
                    onClick={handleRun}
                    disabled={isSimulating}
                    className="h-16 px-10 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg gap-3 shadow-2xl shadow-indigo-500/30 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all flex-1 sm:flex-none"
                >
                    {isSimulating ? <Activity className="w-6 h-6 animate-pulse" /> : <Play className="w-6 h-6 fill-white" />}
                    {isSimulating ? "SIMULATING..." : "RUN COMPARISON"}
                </Button>

                <div className="flex-1 space-y-2 w-full">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Benchmarking</span>
                        <span className="text-xs font-black text-indigo-600 tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Insights Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-5">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl">
                    <Info className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Why gRPC is faster here</h4>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                        {scenario === "fetch" && "For simple calls, gRPC's binary Protobuf serialization is significantly more compact than JSON. Proto-to-native conversion is also much faster for CPU-bound services."}
                        {scenario === "feed" && "With large data arrays, JSON repeat keys ('id', 'name', etc.) create massive bloat. Protobuf encodes these into integer IDs, reducing payload size by up to 70%."}
                        {scenario === "streaming" && "REST polling forces a full HTTP handshake for every update. gRPC uses a single long-lived TCP connection (HTTP/2), pushing updates with near-zero latency overhead."}
                    </p>
                </div>
            </div>
        </Card>
    );
}
