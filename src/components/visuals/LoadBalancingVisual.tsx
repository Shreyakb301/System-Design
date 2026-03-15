"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Network,
    Server,
    Zap,
    AlertCircle,
    RotateCcw,
    Play,
    Pause,
    ChevronRight,
    ArrowRight,
    Settings,
    ShieldCheck,
    ShieldAlert,
    Timer,
    Flame,
    Users,
    MousePointer2,
    Info,
    CloudLightning,
    ZapOff
} from "lucide-react";
import { cn } from "@/lib/utils";

type Strategy = "round-robin" | "least-conn" | "random";

interface ServerState {
    id: string;
    connections: number;
    latency: number; // base latency in ms
    status: "healthy" | "slow" | "failed";
    requestsHandled: number;
}

interface Request {
    id: string;
    targetId: string;
    startTime: number;
}

export function LoadBalancingVisual() {
    const [strategy, setStrategy] = useState<Strategy>("round-robin");
    const [traffic, setTraffic] = useState(30);
    const [isPaused, setIsPaused] = useState(false);
    const [healthChecksEnabled, setHealthChecksEnabled] = useState(true);
    const [servers, setServers] = useState<ServerState[]>([
        { id: "S1", connections: 0, latency: 10, status: "healthy", requestsHandled: 0 },
        { id: "S2", connections: 0, latency: 10, status: "healthy", requestsHandled: 0 },
        { id: "S3", connections: 0, latency: 10, status: "healthy", requestsHandled: 0 },
        { id: "S4", connections: 0, latency: 10, status: "healthy", requestsHandled: 0 },
    ]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [errorCount, setErrorCount] = useState(0);
    const [totalProcessed, setTotalProcessed] = useState(0);

    const rrIndex = useRef(0);

    // --- Core Logic ---

    const getNextServer = useCallback(() => {
        const activeServers = healthChecksEnabled
            ? servers.filter(s => s.status !== "failed")
            : servers;

        if (activeServers.length === 0) return null;

        if (strategy === "random") {
            return activeServers[Math.floor(Math.random() * activeServers.length)];
        }

        if (strategy === "least-conn") {
            return [...activeServers].sort((a, b) => a.connections - b.connections)[0];
        }

        // Round Robin
        const target = activeServers[rrIndex.current % activeServers.length];
        rrIndex.current = (rrIndex.current + 1) % activeServers.length;
        return target;
    }, [strategy, servers, healthChecksEnabled]);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            const spawnCount = Math.ceil(traffic / 15);
            const newReqs: Request[] = [];

            for (let i = 0; i < spawnCount; i++) {
                const target = getNextServer();
                if (target) {
                    newReqs.push({
                        id: Math.random().toString(36).substring(7),
                        targetId: target.id,
                        startTime: Date.now()
                    });

                    // Update local server state connections
                    setServers(prev => prev.map(s =>
                        s.id === target.id
                            ? { ...s, connections: s.connections + 1, requestsHandled: s.requestsHandled + 1 }
                            : s
                    ));
                } else {
                    setErrorCount(prev => prev + 1);
                }
                setTotalProcessed(prev => prev + 1);
            }

            setRequests(prev => [...prev.slice(-20), ...newReqs]);
        }, 800 - (traffic * 5));

        return () => clearInterval(interval);
    }, [traffic, isPaused, getNextServer]);

    // Cleanup finished requests (connection closing)
    useEffect(() => {
        const interval = setInterval(() => {
            setServers(prev => prev.map(s => {
                const dec = s.connections > 0 ? Math.ceil(s.connections * 0.2) : 0;
                return { ...s, connections: Math.max(0, s.connections - dec) };
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- Interactions ---

    const toggleStatus = (id: string, nextStatus: ServerState["status"]) => {
        setServers(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === nextStatus ? "healthy" : nextStatus } : s
        ));
    };

    const handleReset = () => {
        setServers(servers.map(s => ({ ...s, connections: 0, status: "healthy", requestsHandled: 0 })));
        setRequests([]);
        setErrorCount(0);
        setTotalProcessed(0);
        rrIndex.current = 0;
    };

    // --- Metrics ---
    const metrics = useMemo(() => {
        const totalHandled = servers.reduce((acc, s) => acc + s.requestsHandled, 0);
        const fairness = totalHandled === 0 ? 100 : (() => {
            const avg = totalHandled / servers.length;
            const variance = servers.reduce((acc, s) => acc + Math.pow(s.requestsHandled - avg, 2), 0) / servers.length;
            return Math.max(0, 100 - (Math.sqrt(variance) / (avg || 1)) * 10).toFixed(1);
        })();

        const avgLatency = servers.reduce((acc, s) => {
            const base = s.status === "slow" ? 250 : 20;
            return acc + (base + s.connections * 15);
        }, 0) / servers.length;

        const errorRate = totalProcessed === 0 ? 0 : (errorCount / totalProcessed) * 100;

        return { fairness, avgLatency, errorRate };
    }, [servers, errorCount, totalProcessed]);

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl overflow-hidden flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                            <Network className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 font-semibold italic">Optimize traffic distribution across your server pool.</p>
                </div>

                <div className="flex flex-wrap gap-2 p-1 bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
                    {[
                        { id: "round-robin", label: "ROUND ROBIN", icon: RotateCcw },
                        { id: "least-conn", label: "LEAST CONN", icon: Timer },
                        { id: "random", label: "RANDOM", icon: MousePointer2 },
                    ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setStrategy(s.id as Strategy)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black transition-all",
                                strategy === s.id ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <s.icon className="w-3.5 h-3.5" /> {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Architecture Canvas */}
            <div className="relative h-[450px] bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl flex items-center justify-between px-6 md:px-20 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:40px_40px]" />

                {/* User Source */}
                <div className="flex flex-col items-center gap-2 z-20 shrink-0">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl">
                        <Users className="w-6 h-6 text-slate-600" />
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black">INTERNET</Badge>
                </div>

                {/* Connection Lineinternet -> lb */}
                <div className="flex-1 h-0.5 max-w-[100px] border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-4 hidden md:block" />

                {/* Load Balancer */}
                <div className="flex flex-col items-center gap-3 z-30 shrink-0">
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="p-6 bg-indigo-600 rounded-2xl shadow-2xl border-2 border-indigo-400"
                    >
                        <Network className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">NGINX LB</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={cn("w-2 h-2 rounded-full", healthChecksEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                            <span className="text-[8px] font-black text-slate-400 uppercase">Health Checks {healthChecksEnabled ? "ON" : "OFF"}</span>
                        </div>
                    </div>
                </div>

                {/* Connection Line lb -> pool */}
                <div className="flex-1 h-0.5 border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-4 hidden md:block" />

                {/* Server Pool */}
                <div className="grid grid-cols-2 gap-4 md:gap-8 z-20 shrink-0">
                    <AnimatePresence>
                        {servers.map((s) => (
                            <motion.div
                                key={s.id}
                                layout
                                className={cn(
                                    "relative w-32 md:w-44 p-4 md:p-5 rounded-2xl md:rounded-3xl border-4 transition-all duration-300 flex flex-col gap-2 md:gap-3",
                                    s.status === "healthy" ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-xl" :
                                        s.status === "slow" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]" :
                                            "bg-red-50 dark:bg-red-950/20 border-red-500 opacity-60"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <Server className={cn("w-4 md:w-5 h-4 md:h-5", s.status === "healthy" ? "text-slate-400" : "text-current")} />
                                    <div className="flex gap-1">
                                        <button onClick={() => toggleStatus(s.id, "slow")} className={cn("p-1 rounded-md", s.status === "slow" ? "bg-amber-500 text-white" : "text-amber-500 bg-amber-50 dark:bg-amber-950/50")}>
                                            <Timer className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => toggleStatus(s.id, "failed")} className={cn("p-1 rounded-md", s.status === "failed" ? "bg-red-500 text-white" : "text-red-500 bg-red-50 dark:bg-red-950/50")}>
                                            <AlertCircle className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 md:space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">Connections</span>
                                        <span className="text-[10px] md:text-xs font-black tabular-nums">{s.connections}</span>
                                    </div>
                                    <div className="h-1 md:h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div animate={{ width: `${Math.min(s.connections * 5, 100)}%` }} className={cn("h-full", s.connections > 15 ? "bg-red-500" : "bg-indigo-500")} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[7px] md:text-[8px] font-black uppercase tracking-widest pt-0.5 md:pt-1">
                                    <span className="text-slate-400">{s.id}</span>
                                    <span className="text-indigo-500">{s.requestsHandled}</span>
                                </div>

                                {s.status !== "healthy" && (
                                    <div className="absolute -top-2 -right-2">
                                        <Badge className={cn("text-[7px] md:text-[8px] px-1 md:px-2", s.status === "slow" ? "bg-amber-500" : "bg-red-500")}>
                                            {s.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Animated Requests */}
                <AnimatePresence>
                    {requests.map(req => {
                        // Coordinates are now based on percentages of the parent relative container
                        const targetX = req.targetId === "S2" || req.targetId === "S4" ? 85 : 75;
                        const targetY = req.targetId === "S1" || req.targetId === "S2" ? 30 : 70;

                        return (
                            <motion.div
                                key={req.id}
                                initial={{ left: "10%", top: "50%", opacity: 0, scale: 0 }}
                                animate={{
                                    left: ["10%", "30%", `${targetX}%`],
                                    top: ["50%", "50%", `${targetY}%`],
                                    opacity: [0, 1, 1, 0],
                                    scale: [0, 1.2, 1, 0]
                                }}
                                transition={{ duration: 0.6, ease: "circOut" }}
                                onAnimationComplete={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
                                className="absolute w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] z-40 border-2 border-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                            >
                                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Dashboard and Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Global Traffic</h4>
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black">
                                {traffic * 4}k REQ/SEC
                            </Badge>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={traffic}
                            onChange={(e) => setTraffic(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex gap-4 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsPaused(!isPaused)}
                                className="flex-1 rounded-2xl font-black text-xs gap-2 py-6 border-2"
                            >
                                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                                {isPaused ? "RESUME" : "PAUSE"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="flex-1 rounded-2xl font-black text-xs gap-2 py-6 border-2"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> RESET
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Health Checks</h4>
                            <p className="text-[10px] text-slate-400 font-medium tracking-tight italic">Automatically route around failures</p>
                        </div>
                        <button
                            onClick={() => setHealthChecksEnabled(!healthChecksEnabled)}
                            className={cn(
                                "p-3 rounded-2xl transition-all border-2",
                                healthChecksEnabled ? "bg-emerald-500 border-emerald-600 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400"
                            )}
                        >
                            {healthChecksEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { label: "Distribution Fairness", value: `${metrics.fairness}%`, desc: "How evenly load is spread", icon: Activity, color: "text-indigo-500" },
                        { label: "Avg System Latency", value: `${metrics.avgLatency.toFixed(0)}ms`, desc: "End-to-end response time", icon: Timer, color: "text-amber-500" },
                        { label: "System Error Rate", value: `${metrics.errorRate.toFixed(1)}%`, desc: "Failed request percentage", icon: AlertCircle, color: "text-red-500" },
                    ].map((m, i) => (
                        <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center gap-2 opacity-50">
                                <m.icon className={cn("w-3.5 h-3.5", m.color)} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                            </div>
                            <div className="text-3xl font-black tabular-nums">{m.value}</div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{m.desc}</p>
                        </div>
                    ))}

                    <div className="sm:col-span-3 p-8 bg-slate-900 dark:bg-white rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex items-start gap-6 shadow-2xl">
                        <div className="p-4 bg-indigo-500 rounded-3xl shrink-0 shadow-lg shadow-indigo-500/20">
                            <Info className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Algorithm Insight</h4>
                            <div className="text-sm font-medium leading-relaxed opacity-90 italic tracking-tight">
                                {strategy === "round-robin" && "Round Robin is best when all servers have similar specs. It ensures perfect fairness but ignores server load or health variations."}
                                {strategy === "least-conn" && "Least Connections is dynamic. It's the 'smartest' choice for requests with varying processing times, as it routes to idle resources."}
                                {strategy === "random" && "Random is simple and stateless. While it averages out over time, it can cause short-term imbalances leading to 'hot spotting'."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
