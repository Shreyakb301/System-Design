"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    ArrowUp,
    Plus,
    Server,
    Database,
    Zap,
    Cpu,
    Network,
    AlertCircle,
    RotateCcw,
    Layers,
    Users,
    ChevronRight,
    Search,
    HardDrive,
    Trash2
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
    const [traffic, setTraffic] = useState(20); // 0 to 100
    const [servers, setServers] = useState<ServerState[]>([
        { id: "s1", cpu: 0, ram: 0, maxCpu: 4, maxRam: 8, status: "healthy" }
    ]);
    const [requests, setRequests] = useState<{ id: string; targetId: string }[]>([]);

    // --- Scaling Actions ---

    const handleUpgrade = () => {
        if (strategy !== "vertical") return;
        setServers(prev => prev.map(s => ({
            ...s,
            maxCpu: Math.min(s.maxCpu * 2, 64), // Hard limit at 64 cores
            maxRam: Math.min(s.maxRam * 2, 128) // Hard limit at 128GB
        })));
    };

    const handleAddServer = () => {
        if (strategy !== "horizontal") return;
        if (servers.length >= 8) return;
        setServers(prev => [
            ...prev,
            { id: `s${prev.length + 1}`, cpu: 0, ram: 0, maxCpu: 4, maxRam: 8, status: "healthy" }
        ]);
    };

    const handleReset = () => {
        setTraffic(20);
        setServers([{ id: "s1", cpu: 0, ram: 0, maxCpu: 4, maxRam: 8, status: "healthy" }]);
        setRequests([]);
    };

    const toggleStrategy = (s: ScalingStrategy) => {
        setStrategy(s);
        handleReset();
    };

    // --- Simulation Logic ---

    useEffect(() => {
        const interval = setInterval(() => {
            // Calculate load distribution
            const totalTraffic = traffic * 2; // Arbitrary multiplier
            const loadPerServer = totalTraffic / servers.length;

            setServers(prev => prev.map(s => {
                const cpuLoad = (loadPerServer / s.maxCpu) * 10;
                const ramLoad = (loadPerServer / s.maxRam) * 8;

                let status: ServerState["status"] = "healthy";
                if (cpuLoad > 90 || ramLoad > 90) status = "failed";
                else if (cpuLoad > 70 || ramLoad > 70) status = "stressed";

                return {
                    ...s,
                    cpu: Math.min(cpuLoad, 100),
                    ram: Math.min(ramLoad, 100),
                    status
                };
            }));

            // Generate visuals for requests
            const newRequests = Array.from({ length: Math.ceil(traffic / 10) }).map(() => ({
                id: Math.random().toString(36).substring(7),
                targetId: servers[Math.floor(Math.random() * servers.length)].id
            }));
            setRequests(prev => [...prev.slice(-15), ...newRequests]);

        }, 500);

        return () => clearInterval(interval);
    }, [traffic, servers.length, servers]);

    // --- Derived Metrics ---
    const systemMetrics = useMemo(() => {
        const avgCpu = servers.reduce((acc, s) => acc + s.cpu, 0) / servers.length;
        const avgLatency = 10 + (avgCpu > 70 ? (avgCpu - 70) * 5 : 0);
        const errorRate = avgCpu > 95 ? (avgCpu - 95) * 5 : 0;
        return { avgCpu, avgLatency, errorRate };
    }, [servers]);

    const isAtVerticalLimit = strategy === "vertical" && servers[0].maxCpu >= 64;

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl overflow-hidden flex flex-col gap-10">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 font-semibold italic">Can your system handle the 10x surge?</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="flex p-1 bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
                        <button
                            onClick={() => toggleStrategy("vertical")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all",
                                strategy === "vertical" ? "bg-white dark:bg-slate-800 text-amber-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ArrowUp className="w-3.5 h-3.5" /> VERTICAL
                        </button>
                        <button
                            onClick={() => toggleStrategy("horizontal")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all",
                                strategy === "horizontal" ? "bg-white dark:bg-slate-800 text-amber-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" /> HORIZONTAL
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Simulation Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Visual Canvas */}
                <div className="lg:col-span-8 relative bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl min-h-[500px] flex flex-col items-center justify-start overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:40px_40px]" />

                    {/* Traffic Source */}
                    <div className="flex flex-col items-center gap-2 z-20 mt-4">
                        <div className="p-3 md:p-5 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl">
                            <Users className="w-6 md:w-8 h-6 md:h-8 text-slate-600" />
                        </div>
                        <Badge variant="outline" className="font-black text-[10px]">USER TRAFFIC</Badge>
                    </div>

                    {/* Load Balancer (Horizontal Only) */}
                    {strategy === "horizontal" && servers.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="z-20 flex flex-col items-center gap-1 my-6"
                        >
                            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg border-2 border-indigo-400">
                                <Network className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Load Balancer</span>
                        </motion.div>
                    )}

                    {/* Servers Grid */}
                    <div className={cn(
                        "w-full flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8",
                        strategy === "vertical" ? "flex-col" : "flex-row"
                    )}>
                        <AnimatePresence mode="popLayout">
                            {servers.map((s, i) => (
                                <motion.div
                                    key={s.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className={cn(
                                        "relative flex flex-col gap-2 md:gap-3 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-4 transition-all duration-500",
                                        s.status === "healthy" ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl" :
                                            s.status === "stressed" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]" :
                                                "bg-red-50 dark:bg-red-950/20 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                                    )}
                                    style={{
                                        width: strategy === "vertical" ? `${140 + (s.maxCpu / 64) * 80}px` : "160px",
                                        height: strategy === "vertical" ? `${140 + (s.maxCpu / 64) * 80}px` : "160px"
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={cn("p-1.5 md:p-2 rounded-lg", s.status === "healthy" ? "bg-slate-100 dark:bg-slate-900" : "bg-white/20")}>
                                            <Server className={cn("w-4 md:w-5 h-4 md:h-5", s.status === "healthy" ? "text-slate-500" : "text-current")} />
                                        </div>
                                        <Badge variant="outline" className="text-[8px] md:text-[9px] font-black">NODE-{i + 1}</Badge>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center gap-1.5 md:gap-2">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black">
                                                <span>CPU</span>
                                                <span>{s.cpu.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1 md:h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div animate={{ width: `${s.cpu}%` }} className={cn("h-full", s.cpu > 80 ? "bg-red-500" : "bg-indigo-500")} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black">
                                                <span>RAM</span>
                                                <span>{s.ram.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1 md:h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div animate={{ width: `${s.ram}%` }} className={cn("h-full", s.ram > 80 ? "bg-red-500" : "bg-emerald-500")} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center text-[8px] md:text-[9px] font-black text-slate-400">
                                        {s.maxCpu} vCPU / {s.maxRam}GB
                                    </div>

                                    {s.status === "failed" && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-3 p-1 bg-red-600 rounded-full text-white shadow-lg">
                                            <AlertCircle className="w-3 md:w-4 h-3 md:h-4" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Animated Requests */}
                    <AnimatePresence>
                        {requests.map(req => (
                            <motion.div
                                key={req.id}
                                initial={{ top: "10%", left: "50%", opacity: 0 }}
                                animate={{
                                    top: ["10%", "90%"],
                                    opacity: [0, 1, 1, 0]
                                }}
                                transition={{ duration: 0.8, ease: "linear" }}
                                onAnimationComplete={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
                                className="absolute left-[50%] w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10 -translate-x-1/2"
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Dashboard & Metrics */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Traffic Slider */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Incoming Traffic</h4>
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                {traffic * 10}k REQ/S
                            </Badge>
                        </div>
                        <div className="relative pt-4 pb-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={traffic}
                                onChange={(e) => setTraffic(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">Slide to simulate a traffic peak.</p>
                    </div>

                    {/* Live Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Avg Latency", value: `${systemMetrics.avgLatency.toFixed(0)}ms`, icon: Activity, color: "text-blue-500" },
                            { label: "Error Rate", value: `${systemMetrics.errorRate.toFixed(1)}%`, icon: AlertCircle, color: "text-red-500" },
                        ].map((metric, i) => (
                            <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                                <div className="flex items-center gap-2 opacity-50">
                                    <metric.icon className={cn("w-3 h-3", metric.color)} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{metric.label}</span>
                                </div>
                                <div className="text-xl font-black tabular-nums">{metric.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Action Panel */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col gap-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5" /> Scaling Operations
                        </h4>

                        {strategy === "vertical" ? (
                            <div className="space-y-4 flex-1">
                                <Button
                                    onClick={handleUpgrade}
                                    disabled={isAtVerticalLimit}
                                    className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm gap-3 shadow-lg shadow-amber-500/20 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    <ArrowUp className="w-4 h-4" /> UPGRADE SERVER
                                </Button>
                                {isAtVerticalLimit && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold leading-relaxed">
                                            MAX CAPACITY REACHED. You cannot upgrade this machine further. This is the "Hard Limit" of vertical scaling.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1">
                                <Button
                                    onClick={handleAddServer}
                                    disabled={servers.length >= 8}
                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-3 shadow-lg shadow-indigo-500/20 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> ADD SERVICE NODE
                                </Button>
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className={cn(
                                            "h-2 rounded-full",
                                            i < servers.length ? "bg-indigo-500" : "bg-slate-100 dark:bg-slate-800"
                                        )} />
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 text-center font-black uppercase tracking-widest">
                                    {servers.length} / 8 Nodes Active
                                </p>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="w-full rounded-2xl font-black text-xs gap-2 py-6 border-2"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> RESET SYSTEM
                        </Button>
                    </div>
                </div>
            </div>

            {/* Educational Insights */}
            <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex flex-col md:flex-row gap-8 items-center shadow-2xl">
                <div className="p-4 bg-amber-500 rounded-3xl shrink-0">
                    <Activity className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2 flex-1">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] opacity-60">System Design Insight</h4>
                    <div className="text-sm font-medium leading-relaxed opacity-90">
                        {strategy === "vertical" ? (
                            <p>
                                <strong>Vertical Scaling</strong> is simple but finite. You increase the CPU/RAM of a single machine.
                                However, you eventually hit a <strong>hardware ceiling</strong>. If that machine fails, your entire app goes down.
                            </p>
                        ) : (
                            <p>
                                <strong>Horizontal Scaling</strong> adds more machines. It requires a <strong>Load Balancer</strong> to distribute traffic.
                                This provides <strong>high availability</strong>: if one node fails, the others keep the system online.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
