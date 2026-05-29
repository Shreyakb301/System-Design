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
    AlertCircle,
    RotateCcw,
    Play,
    Pause,
    ShieldCheck,
    ShieldAlert,
    Timer,
    Users,
    MousePointer2,
    Info,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Strategy = "round-robin" | "least-conn" | "random";

interface ServerState {
    id: string;
    connections: number;
    latency: number;
    status: "healthy" | "slow" | "failed";
    requestsHandled: number;
}

interface Request {
    id: string;
    targetId: string;
    outcome: "success" | "error";
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

    const getNextServer = useCallback(() => {
        const activeServers = healthChecksEnabled
            ? servers.filter(s => s.status !== "failed")
            : servers;
        if (activeServers.length === 0) return null;
        if (strategy === "random") return activeServers[Math.floor(Math.random() * activeServers.length)];
        if (strategy === "least-conn") return [...activeServers].sort((a, b) => a.connections - b.connections)[0];
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
                    const requestId = Math.random().toString(36).substring(7);
                    const requestFails = target.status === "failed";
                    newReqs.push({ id: requestId, targetId: target.id, outcome: requestFails ? "error" : "success" });
                    if (requestFails) {
                        setErrorCount(prev => prev + 1);
                    } else {
                        setServers(prev => prev.map(s =>
                            s.id === target.id ? { ...s, connections: s.connections + 1, requestsHandled: s.requestsHandled + 1 } : s
                        ));
                    }
                } else {
                    setErrorCount(prev => prev + 1);
                }
                setTotalProcessed(prev => prev + 1);
            }
            setRequests(prev => [...prev.slice(-20), ...newReqs]);
        }, 800 - (traffic * 5));
        return () => clearInterval(interval);
    }, [traffic, isPaused, getNextServer]);

    useEffect(() => {
        const interval = setInterval(() => {
            setServers(prev => prev.map(s => {
                const dec = s.connections > 0 ? Math.ceil(s.connections * 0.2) : 0;
                return { ...s, connections: Math.max(0, s.connections - dec) };
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleStatus = (id: string, nextStatus: ServerState["status"]) => {
        setServers(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === nextStatus ? "healthy" : nextStatus } : s
        ));
    };

    const handleReset = () => {
        setServers(prev => prev.map(s => ({ ...s, connections: 0, status: "healthy", requestsHandled: 0 })));
        setRequests([]);
        setErrorCount(0);
        setTotalProcessed(0);
        rrIndex.current = 0;
    };

    const metrics = useMemo(() => {
        const totalHandled = servers.reduce((acc, s) => acc + s.requestsHandled, 0);
        const fairness = totalHandled === 0 ? 100 : (() => {
            const avg = totalHandled / servers.length;
            const variance = servers.reduce((acc, s) => acc + Math.pow(s.requestsHandled - avg, 2), 0) / servers.length;
            return Math.max(0, 100 - (Math.sqrt(variance) / (avg || 1)) * 10).toFixed(1);
        })();
        const avgLatency = servers.reduce((acc, s) => acc + ((s.status === "slow" ? 250 : 20) + s.connections * 15), 0) / servers.length;
        const errorRate = totalProcessed === 0 ? 0 : (errorCount / totalProcessed) * 100;
        return { fairness, avgLatency, errorRate };
    }, [servers, errorCount, totalProcessed]);

    const strategyInsight = {
        "round-robin": "Round Robin ensures perfect fairness but ignores server load variations.",
        "least-conn": "Least Connections dynamically routes to the least busy server — best for variable request times.",
        "random": "Random is simple and stateless, but can create short-term hot spots.",
    }[strategy];

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden flex items-center justify-between px-6 md:px-16">
                        <div className="absolute top-3 left-4 flex items-center gap-2">
                            <Network className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Load Balancer Simulation</span>
                        </div>

                        {/* Internet */}
                        <div className="flex flex-col items-center gap-2 z-20 shrink-0">
                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl">
                                <Users className="w-6 h-6 text-slate-600" />
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black">INTERNET</Badge>
                        </div>

                        <div className="flex-1 h-0.5 max-w-[80px] border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-3 hidden md:block" />

                        {/* Load Balancer */}
                        <div className="flex flex-col items-center gap-3 z-30 shrink-0">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="p-5 bg-indigo-600 rounded-2xl shadow-2xl border-2 border-indigo-400"
                            >
                                <Network className="w-7 h-7 text-white" />
                            </motion.div>
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">NGINX LB</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", healthChecksEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Health {healthChecksEnabled ? "ON" : "OFF"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 h-0.5 border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-3 hidden md:block" />

                        {/* Server Pool */}
                        <div className="grid grid-cols-2 gap-3 z-20 shrink-0">
                            <AnimatePresence>
                                {servers.map((s) => (
                                    <motion.div
                                        key={s.id}
                                        layout
                                        className={cn(
                                            "relative w-28 md:w-36 p-3 md:p-4 rounded-2xl border-4 transition-all duration-300 flex flex-col gap-2",
                                            s.status === "healthy" ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-xl" :
                                                s.status === "slow" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500" :
                                                    "bg-red-50 dark:bg-red-950/20 border-red-500 opacity-60"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <Server className="w-4 h-4 text-slate-400" />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => toggleStatus(s.id, "slow")}
                                                    className={cn("p-0.5 rounded", s.status === "slow" ? "bg-amber-500 text-white" : "text-amber-500 bg-amber-50 dark:bg-amber-950/50")}
                                                >
                                                    <Timer className="w-2.5 h-2.5" />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(s.id, "failed")}
                                                    className={cn("p-0.5 rounded", s.status === "failed" ? "bg-red-500 text-white" : "text-red-500 bg-red-50 dark:bg-red-950/50")}
                                                >
                                                    <AlertCircle className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[8px] font-black uppercase text-slate-400">Conns</span>
                                                <span className="text-[10px] font-black tabular-nums">{s.connections}</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    animate={{ width: `${Math.min(s.connections * 5, 100)}%` }}
                                                    className={cn("h-full", s.connections > 15 ? "bg-red-500" : "bg-indigo-500")}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[7px] font-black uppercase text-slate-400">
                                            <span>{s.id}</span>
                                            <span className="text-indigo-500">{s.requestsHandled}</span>
                                        </div>
                                        {s.status !== "healthy" && (
                                            <div className="absolute -top-2 -right-2">
                                                <Badge className={cn("text-[7px] px-1", s.status === "slow" ? "bg-amber-500" : "bg-red-500")}>
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
                                const targetX = req.targetId === "S2" || req.targetId === "S4" ? 85 : 75;
                                const targetY = req.targetId === "S1" || req.targetId === "S2" ? 30 : 70;
                                return (
                                    <motion.div
                                        key={req.id}
                                        initial={{ left: "10%", top: "50%", opacity: 0, scale: 0 }}
                                        animate={{ left: ["10%", "30%", `${targetX}%`], top: ["50%", "50%", `${targetY}%`], opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0] }}
                                        transition={{ duration: 0.6, ease: "circOut" }}
                                        onAnimationComplete={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
                                        className={cn(
                                            "absolute z-40 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white",
                                            req.outcome === "error" ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" : "bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.5)]"
                                        )}
                                    >
                                        <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: Strategy */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Strategy</h4>
                            <div className="flex flex-col p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
                                {([
                                    { id: "round-robin", label: "Round Robin", icon: RotateCcw },
                                    { id: "least-conn", label: "Least Conn", icon: Timer },
                                    { id: "random", label: "Random", icon: MousePointer2 },
                                ] as const).map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setStrategy(s.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all",
                                            strategy === s.id ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
                                        )}
                                    >
                                        <s.icon className="w-3 h-3" /> {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Col 2: Controls */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Controls</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>Traffic</span>
                                    <Badge variant="outline" className="text-[9px]">{traffic * 4}k req/s</Badge>
                                </div>
                                <input
                                    type="range" min="0" max="100" value={traffic}
                                    onChange={(e) => setTraffic(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Button variant="outline" onClick={() => setIsPaused(!isPaused)} className="h-9 gap-2 text-xs">
                                        {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                                        {isPaused ? "Resume" : "Pause"}
                                    </Button>
                                    <Button variant="outline" onClick={handleReset} className="h-9 gap-2 text-xs">
                                        <RotateCcw className="w-3 h-3" /> Reset
                                    </Button>
                                </div>
                                <button
                                    onClick={() => setHealthChecksEnabled(!healthChecksEnabled)}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                        healthChecksEnabled ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    )}
                                >
                                    {healthChecksEnabled ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                    Health Checks {healthChecksEnabled ? "ON" : "OFF"}
                                </button>
                            </div>
                        </div>

                        {/* Col 3: Metrics */}
                        <div className="space-y-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-2">
                                <Zap className="w-4 h-4" /> Live Metrics
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Activity className="w-3 h-3" /> Fairness</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.fairness}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Avg Latency</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.avgLatency.toFixed(0)}ms</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error Rate</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.errorRate.toFixed(1)}%</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">{strategyInsight}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Explanations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        A load balancer sits in front of your server pool and distributes incoming requests based on the chosen strategy.
                        Animated dots show live traffic flowing from the internet through the balancer to individual servers.
                        Click the <span className="font-semibold">⚡</span> and <span className="font-semibold">⚠</span> icons on any server to simulate slowdowns or failures — watch how the balancer responds.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Load balancing is essential for high availability and horizontal scalability. Without it, a single server becomes a bottleneck.
                        Health checks automatically remove failed nodes from the pool. The right strategy depends on your workload:
                        Round Robin for uniform requests, Least Connections for variable processing times, Random for simplicity at scale.
                    </p>
                </div>
            </div>
        </>
    );
}
