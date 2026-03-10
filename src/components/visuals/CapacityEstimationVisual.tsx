"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Zap,
    HardDrive,
    Activity,
    Database,
    ShieldCheck,
    AlertTriangle,
    TrendingUp,
    RefreshCw,
    Server,
    Layers,
    ArrowRight,
    Info,
    Cpu,
    Network,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Constants & Helpers ---
const SECONDS_IN_DAY = 86400;

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toFixed(0);
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function CapacityEstimationVisual() {
    // --- State: User Inputs ---
    const [totalUsers, setTotalUsers] = useState(1000000); // 1M
    const [reqsPerUser, setReqsPerUser] = useState(10);
    const [avgDataSize, setAvgDataSize] = useState(1024 * 500); // 500KB per request
    const [cacheHitRate, setCacheHitRate] = useState(0.8);
    const [replicationFactor, setReplicationFactor] = useState(3);
    const [isPeakTraffic, setIsPeakTraffic] = useState(false);
    const [isCachingEnabled, setIsCachingEnabled] = useState(true);

    // --- Derived Metrics ---
    const metrics = useMemo(() => {
        const peakMultiplier = isPeakTraffic ? 5 : 1;
        const effectiveHitRate = isCachingEnabled ? cacheHitRate : 0;

        const avgQps = (totalUsers * reqsPerUser) / SECONDS_IN_DAY;
        const peakQps = avgQps * peakMultiplier;

        const dbQps = peakQps * (1 - effectiveHitRate);
        const cacheQps = peakQps * effectiveHitRate;

        // Bandwidth is total bytes per second
        const bandwidth = peakQps * avgDataSize;

        // Storage: Requests/day * size * replication * 30 days
        const dailyWrites = (totalUsers * reqsPerUser * avgDataSize) / 10; // Assume 1/10 is write traffic
        const totalStorage = dailyWrites * replicationFactor * 30;

        // Health Logic
        let health: "optimal" | "warning" | "critical" = "optimal";
        if (dbQps > 5000 || peakQps > 50000 || bandwidth > 1024 * 1024 * 1024 * 2) { // 2GB/s bandwidth limit
            health = "critical";
        } else if (dbQps > 2000 || peakQps > 20000 || bandwidth > 1024 * 1024 * 500) {
            health = "warning";
        }

        return {
            avgQps,
            peakQps,
            dbQps,
            cacheQps,
            totalStorage,
            bandwidth,
            health
        };
    }, [totalUsers, reqsPerUser, avgDataSize, cacheHitRate, replicationFactor, isPeakTraffic, isCachingEnabled]);

    // --- Peak Traffic Simulation Timer ---
    useEffect(() => {
        if (isPeakTraffic) {
            const timer = setTimeout(() => setIsPeakTraffic(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isPeakTraffic]);

    return (
        <Card className="p-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col gap-10">
            {/* Top Health Indicator Line */}
            <motion.div
                initial={false}
                animate={{
                    backgroundColor: metrics.health === "critical" ? "#ef4444" : (metrics.health === "warning" ? "#f59e0b" : "#10b981"),
                    height: metrics.health === "critical" ? "6px" : "4px"
                }}
                className="absolute top-0 left-0 w-full transition-colors duration-500"
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                            Capacity Estimator
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Design for scale by visualizing traffic, storage, and architectural trade-offs.</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={cn(
                        "px-4 py-1.5 font-bold flex gap-2 items-center text-sm shadow-sm transition-colors duration-500",
                        metrics.health === "critical" ? "bg-red-50 text-red-600 border-red-200 animate-pulse" :
                            (metrics.health === "warning" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")
                    )}>
                        <Activity className="w-4 h-4" />
                        SYSTEM HEALTH: {metrics.health.toUpperCase()}
                    </Badge>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live System Status</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Inputs / Sliders */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Traffic
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-500 uppercase">Daily Users</span>
                                <span className="text-indigo-600 tabular-nums">{formatNumber(totalUsers)}</span>
                            </div>
                            <input
                                type="range" min="100000" max="10000000" step="100000"
                                value={totalUsers} onChange={(e) => setTotalUsers(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-500 uppercase">Reqs / User</span>
                                <span className="text-indigo-600 tabular-nums">{reqsPerUser}</span>
                            </div>
                            <input
                                type="range" min="1" max="100" step="1"
                                value={reqsPerUser} onChange={(e) => setReqsPerUser(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <HardDrive className="w-3.5 h-3.5" /> Storage
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-500 uppercase">Data / Request</span>
                                <span className="text-indigo-600 tabular-nums">{formatBytes(avgDataSize)}</span>
                            </div>
                            <input
                                type="range" min={1024 * 10} max={1024 * 1024 * 5} step={1024 * 10}
                                value={avgDataSize} onChange={(e) => setAvgDataSize(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-500 uppercase">Replication</span>
                                <span className="text-indigo-600 tabular-nums">x{replicationFactor}</span>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setReplicationFactor(val)}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-lg text-xs font-black border-2 transition-all",
                                            replicationFactor === val ? "bg-indigo-600 text-white border-indigo-700 shadow-md" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                        )}
                                    >
                                        x{val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" /> Optimize
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-500 uppercase">Cache Hit Rate</span>
                                <span className="text-indigo-600 tabular-nums">{(cacheHitRate * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range" min="0" max="0.99" step="0.01"
                                value={cacheHitRate} onChange={(e) => setCacheHitRate(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Offload DB traffic with a cache layer.</p>
                    </div>
                </div>

                {/* Main Visualizer */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Live Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Peak QPS", value: formatNumber(metrics.peakQps), icon: Zap, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-500/10" },
                            { label: "DB QPS", value: formatNumber(metrics.dbQps), icon: Database, color: "text-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-500/10" },
                            { label: "Bandwidth", value: formatBytes(metrics.bandwidth) + "/s", icon: Network, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-500/10" },
                            { label: "Storage (30d)", value: formatBytes(metrics.totalStorage), icon: HardDrive, color: "text-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-500/10" },
                        ].map((m, i) => (
                            <motion.div
                                key={i}
                                layout
                                className={cn("p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 text-center", m.bgColor)}
                            >
                                <m.icon className={cn("w-5 h-5", m.color)} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{m.label}</span>
                                <span className="text-xl font-black tracking-tight tabular-nums">{m.value}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Architecture Diagram Visualization */}
                    <div className="relative h-80 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:32px_32px]" />

                        <div className="flex items-center gap-4 md:gap-12 z-10 w-full px-6 md:px-16">
                            {/* Clients */}
                            <div className="flex flex-col items-center gap-3">
                                <motion.div
                                    animate={isPeakTraffic ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                    className="p-5 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
                                >
                                    <Users className="w-8 h-8 text-slate-600" />
                                </motion.div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clients</span>
                            </div>

                            {/* Connection Client -> App */}
                            <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                                <motion.div
                                    animate={{ left: ["-100%", "100%"], opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: isPeakTraffic ? 0.3 : 1.5, ease: "linear" }}
                                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                                />
                            </div>

                            {/* App Layer / Cache */}
                            <div className="flex flex-col items-center gap-6 relative">
                                <AnimatePresence>
                                    {isCachingEnabled && (
                                        <motion.div
                                            initial={{ y: 20, opacity: 0, scale: 0.8 }}
                                            animate={{ y: 0, opacity: 1, scale: 1 }}
                                            exit={{ y: 20, opacity: 0, scale: 0.8 }}
                                            className="p-5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/20 border-2 border-white/20 relative z-20 group"
                                        >
                                            <Layers className="w-10 h-10" />
                                            <div className="absolute -top-3 -right-3 bg-white text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-black border-2 border-amber-500 shadow-sm pointer-events-none">
                                                CACHE
                                            </div>
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className={cn(
                                    "p-5 rounded-2xl bg-indigo-600 text-white shadow-2xl border-2 border-indigo-500/50 relative transition-all duration-500",
                                    !isCachingEnabled && "scale-110 shadow-indigo-500/40"
                                )}>
                                    <Server className="w-10 h-10" />
                                    {isPeakTraffic && !isCachingEnabled && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                            className="absolute -top-4 -right-4 bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-black border-2 border-white shadow-lg"
                                        >
                                            STRESSED
                                        </motion.div>
                                    )}
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">App Servers</span>
                            </div>

                            {/* Connection App -> DB */}
                            <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                                <motion.div
                                    animate={{
                                        left: ["-100%", "100%"],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: metrics.dbQps > 3000 ? 0.4 : 2,
                                        ease: "linear"
                                    }}
                                    className={cn(
                                        "absolute inset-y-0 w-12",
                                        metrics.health === "critical" ? "bg-red-500" : "bg-indigo-400"
                                    )}
                                />
                            </div>

                            {/* Data Layer */}
                            <div className="flex flex-col items-center gap-3">
                                <div className={cn(
                                    "p-6 rounded-[1.5rem] border-2 transition-all duration-500 shadow-xl",
                                    metrics.health === "critical" ? "bg-red-50 dark:bg-red-500/10 border-red-500 text-red-600 scale-110" : "bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600"
                                )}>
                                    <Database className="w-10 h-10" />
                                    {replicationFactor > 1 && (
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black border-2 border-white">
                                            x{replicationFactor}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Database</span>
                            </div>
                        </div>

                        {/* Peak Traffic Overlay */}
                        <AnimatePresence>
                            {isPeakTraffic && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-red-600/10 pointer-events-none flex items-center justify-center overflow-hidden z-30"
                                >
                                    <div className="fixed inset-0 pointer-events-none">
                                        {Array.from({ length: 15 }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ y: -100, x: Math.random() * 100 + "%" }}
                                                animate={{ y: 1000 }}
                                                transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "linear" }}
                                                className="absolute w-px h-20 bg-red-500/30"
                                            />
                                        ))}
                                    </div>
                                    <motion.div
                                        initial={{ scale: 0.8, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="bg-red-600 text-white px-8 py-3 rounded-full font-black text-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] flex items-center gap-4 border-4 border-red-400"
                                    >
                                        <Zap className="w-8 h-8 fill-white animate-bounce" /> FLASH SALE: 5x TRAFFIC
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Simulation Controls */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => setIsPeakTraffic(true)}
                                disabled={isPeakTraffic}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black h-16 flex-1 gap-3 text-lg rounded-2xl border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                            >
                                <Zap className="w-6 h-6" /> Simulate Peak Traffic
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setIsCachingEnabled(!isCachingEnabled)}
                                className={cn(
                                    "h-16 flex-1 font-black gap-3 text-lg rounded-2xl border-2 transition-all shadow-md bg-white dark:bg-slate-800",
                                    isCachingEnabled ? "border-emerald-500 text-emerald-600 dark:emerald-400" : "border-slate-300 text-slate-500"
                                )}
                            >
                                {isCachingEnabled ? <ShieldCheck className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                                {isCachingEnabled ? "Caching Layer: ON" : "Add Caching Layer"}
                            </Button>
                        </div>

                        <div className="flex items-start gap-5 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl">
                                <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Architectural Insights</h4>
                                <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                                    {metrics.health === "critical" ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-red-600 font-black">⚠️ SYSTEM BOTTLENECK:</span>
                                            <span>
                                                The Database is overwhelmed at <strong>{formatNumber(metrics.dbQps)} queries/sec</strong>.
                                                Try enabling or increasing the <strong>Cache Hit Rate</strong> to protect your persistent layer.
                                            </span>
                                        </div>
                                    ) : (
                                        <p>
                                            Notice how <strong>replication</strong> (x{replicationFactor}) ensures high availability but triples storage costs.
                                            <strong>Caching</strong> is the most effective way to handle sudden traffic spikes without scaling your database vertically.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
