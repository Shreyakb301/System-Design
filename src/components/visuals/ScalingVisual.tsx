"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    ArrowUp,
    Plus,
    Server,
    Zap,
    Network,
    AlertCircle,
    RotateCcw,
    Layers,
    Users,
    Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ScalingStrategy = "vertical" | "horizontal";

interface ServerState {
    id: string;
    cpu: number;
    ram: number;
    maxCpu: number;
    maxRam: number;
    status: "healthy" | "stressed" | "failed";
}

export function ScalingVisual() {
    const [strategy, setStrategy] = useState<ScalingStrategy>("vertical");
    const [traffic, setTraffic] = useState(20);
    const [servers, setServers] = useState<ServerState[]>([
        { id: "s1", cpu: 0, ram: 0, maxCpu: 4, maxRam: 8, status: "healthy" }
    ]);
    const [requests, setRequests] = useState<{ id: string; targetId: string }[]>([]);
    const serversRef = useRef(servers);
    useEffect(() => { serversRef.current = servers; }, [servers]);

    const handleUpgrade = () => {
        if (strategy !== "vertical") return;
        setServers(prev => prev.map(s => ({ ...s, maxCpu: Math.min(s.maxCpu * 2, 64), maxRam: Math.min(s.maxRam * 2, 128) })));
    };

    const handleAddServer = () => {
        if (strategy !== "horizontal" || servers.length >= 8) return;
        setServers(prev => [...prev, { id: `s${prev.length + 1}`, cpu: 0, ram: 0, maxCpu: 4, maxRam: 8, status: "healthy" }]);
    };

    const handleReset = () => {
        setTraffic(20);
        setServers([{ id: "s1", cpu: 0, ram: 0, maxCpu: 4, maxRam: 8, status: "healthy" }]);
        setRequests([]);
    };

    const toggleStrategy = (s: ScalingStrategy) => { setStrategy(s); handleReset(); };

    useEffect(() => {
        const interval = setInterval(() => {
            const currentServers = serversRef.current;
            const loadPerServer = (traffic * 2) / currentServers.length;
            setServers(prev => prev.map(s => {
                const cpuLoad = (loadPerServer / s.maxCpu) * 10;
                const ramLoad = (loadPerServer / s.maxRam) * 8;
                let status: ServerState["status"] = "healthy";
                if (cpuLoad > 90 || ramLoad > 90) status = "failed";
                else if (cpuLoad > 70 || ramLoad > 70) status = "stressed";
                return { ...s, cpu: Math.min(cpuLoad, 100), ram: Math.min(ramLoad, 100), status };
            }));
            const newRequests = Array.from({ length: Math.ceil(traffic / 10) }, () => ({
                id: Math.random().toString(36).substring(7),
                targetId: currentServers[Math.floor(Math.random() * currentServers.length)].id
            }));
            setRequests(prev => [...prev.slice(-12), ...newRequests]);
        }, 500);
        return () => clearInterval(interval);
    }, [traffic]);

    const systemMetrics = useMemo(() => {
        const avgCpu = servers.reduce((acc, s) => acc + s.cpu, 0) / servers.length;
        return {
            avgCpu,
            avgLatency: 10 + (avgCpu > 70 ? (avgCpu - 70) * 5 : 0),
            errorRate: avgCpu > 95 ? (avgCpu - 95) * 5 : 0,
        };
    }, [servers]);

    const isAtVerticalLimit = strategy === "vertical" && servers[0].maxCpu >= 64;

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden flex flex-col items-center pt-10 pb-6 px-6 gap-4">
                        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scaling Simulation</span>
                        </div>

                        {/* Users */}
                        <div className="flex flex-col items-center gap-1 z-20 shrink-0">
                            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl">
                                <Users className="w-5 h-5 text-slate-600" />
                            </div>
                            <Badge variant="outline" className="text-[8px] font-black">{traffic * 10}k req/s</Badge>
                        </div>

                        {/* Load Balancer (Horizontal) */}
                        <AnimatePresence>
                            {strategy === "horizontal" && servers.length > 1 && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-1 z-20 shrink-0"
                                >
                                    <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg border-2 border-indigo-400">
                                        <Network className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[8px] font-black text-indigo-500 uppercase">Load Balancer</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Servers */}
                        <div className={cn("flex items-center justify-center gap-4 z-20 flex-1 w-full",
                            strategy === "vertical" ? "flex-col" : "flex-row flex-wrap"
                        )}>
                            <AnimatePresence mode="popLayout">
                                {servers.map((s, i) => {
                                    const size = strategy === "vertical" ? 100 + (s.maxCpu / 64) * 80 : 120;
                                    return (
                                        <motion.div key={s.id} layout
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className={cn(
                                                "relative flex flex-col gap-2 p-3 rounded-2xl border-4 transition-all duration-500",
                                                s.status === "healthy" ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl" :
                                                    s.status === "stressed" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500" :
                                                        "bg-red-50 dark:bg-red-950/20 border-red-500"
                                            )}
                                            style={{ width: `${size}px`, height: `${size}px` }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <Server className="w-4 h-4 text-slate-400" />
                                                <span className="text-[7px] font-black text-slate-400">N{i + 1}</span>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center gap-1.5">
                                                <div className="space-y-0.5">
                                                    <div className="flex justify-between text-[8px] font-black text-slate-400">
                                                        <span>CPU</span><span>{s.cpu.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <motion.div animate={{ width: `${s.cpu}%` }} className={cn("h-full", s.cpu > 80 ? "bg-red-500" : "bg-amber-500")} />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex justify-between text-[8px] font-black text-slate-400">
                                                        <span>RAM</span><span>{s.ram.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <motion.div animate={{ width: `${s.ram}%` }} className={cn("h-full", s.ram > 80 ? "bg-red-500" : "bg-emerald-500")} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center text-[7px] font-black text-slate-400">{s.maxCpu}vCPU/{s.maxRam}GB</div>
                                            {s.status === "failed" && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 p-0.5 bg-red-600 rounded-full text-white shadow">
                                                    <AlertCircle className="w-3 h-3" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Animated Requests */}
                        <AnimatePresence>
                            {requests.map(req => (
                                <motion.div key={req.id}
                                    initial={{ top: "15%", left: "50%", opacity: 0 }}
                                    animate={{ top: ["15%", "85%"], opacity: [0, 1, 1, 0] }}
                                    transition={{ duration: 0.7, ease: "linear" }}
                                    onAnimationComplete={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
                                    className="absolute left-[50%] w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] z-10 -translate-x-1/2"
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: Strategy */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Strategy</h4>
                            <div className="flex flex-col p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
                                <button onClick={() => toggleStrategy("vertical")}
                                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold transition-all",
                                        strategy === "vertical" ? "bg-white dark:bg-slate-700 shadow-sm text-amber-600" : "text-slate-500")}
                                >
                                    <ArrowUp className="w-3 h-3" /> Vertical (Scale Up)
                                </button>
                                <button onClick={() => toggleStrategy("horizontal")}
                                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold transition-all",
                                        strategy === "horizontal" ? "bg-white dark:bg-slate-700 shadow-sm text-amber-600" : "text-slate-500")}
                                >
                                    <Layers className="w-3 h-3" /> Horizontal (Scale Out)
                                </button>
                            </div>
                        </div>

                        {/* Col 2: Controls */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Controls</h4>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Traffic</span>
                                    <Badge variant="outline" className="text-[9px]">{traffic * 10}k req/s</Badge>
                                </div>
                                <input type="range" min="0" max="100" value={traffic}
                                    onChange={(e) => setTraffic(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {strategy === "vertical" ? (
                                    <Button onClick={handleUpgrade} disabled={isAtVerticalLimit}
                                        className="bg-amber-500 hover:bg-amber-600 text-white h-9 gap-1.5 text-xs col-span-1"
                                    >
                                        <ArrowUp className="w-3 h-3" /> Upgrade
                                    </Button>
                                ) : (
                                    <Button onClick={handleAddServer} disabled={servers.length >= 8}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 gap-1.5 text-xs col-span-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Node
                                    </Button>
                                )}
                                <Button variant="outline" onClick={handleReset} className="h-9 gap-1.5 text-xs col-span-1">
                                    <RotateCcw className="w-3 h-3" /> Reset
                                </Button>
                            </div>
                            {isAtVerticalLimit && (
                                <div className="flex items-start gap-1.5 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-red-600 font-bold">Hard limit reached — no larger machines exist.</p>
                                </div>
                            )}
                        </div>

                        {/* Col 3: Metrics */}
                        <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-2">
                                <Activity className="w-4 h-4" /> System Metrics
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Avg CPU</span>
                                    <span className={cn("text-xs font-bold tabular-nums", systemMetrics.avgCpu > 80 ? "text-red-500" : "text-emerald-600")}>{systemMetrics.avgCpu.toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Avg Latency</span>
                                    <span className="text-xs font-bold tabular-nums">{systemMetrics.avgLatency.toFixed(0)}ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Error Rate</span>
                                    <span className={cn("text-xs font-bold tabular-nums", systemMetrics.errorRate > 0 ? "text-red-500" : "text-emerald-600")}>{systemMetrics.errorRate.toFixed(1)}%</span>
                                </div>
                                {strategy === "horizontal" && (
                                    <div className="flex justify-between">
                                        <span className="text-[10px] text-slate-500">Active Nodes</span>
                                        <span className="text-xs font-bold tabular-nums">{servers.length}/8</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Explanations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Drag the traffic slider to increase load on your servers. In <span className="font-semibold">Vertical mode</span>, upgrading the single server gives it more CPU/RAM — watch the box grow.
                        In <span className="font-semibold">Horizontal mode</span>, clicking &quot;Add Node&quot; adds a new server and a load balancer distributes traffic across all nodes.
                        Watch CPU and RAM bars fill up and servers turn red when overwhelmed.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="font-semibold">Vertical scaling</span> is simpler but hits a hard hardware ceiling — and a single machine is a single point of failure.
                        <span className="font-semibold"> Horizontal scaling</span> is theoretically infinite and enables high availability: if one node fails, traffic reroutes to the others.
                        Most cloud-native systems scale horizontally using auto-scaling groups.
                    </p>
                </div>
            </div>
        </>
    );
}
