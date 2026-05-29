"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Globe,
    Server,
    Zap,
    ZapOff,
    TrendingUp,
    RotateCcw,
    Trash2,
    Users,
    Cloud,
    CheckCircle2,
    AlertCircle,
    Info,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Region {
    id: string;
    name: string;
    x: number;
    y: number;
    edgeServer: { cache: Map<string, { key: string; cachedAt: number; ttl: number }>; hitCount: number; missCount: number };
    colorClasses: { bg: string; border: string; bgLight: string; borderLight: string; text: string };
}

interface Request {
    id: string;
    regionId: string;
    path: { from: { x: number; y: number }; to: { x: number; y: number } };
    latency: number;
    type: "HIT" | "MISS" | "DYNAMIC";
    completed: boolean;
}

interface Metrics {
    totalRequests: number;
    edgeHits: number;
    edgeMisses: number;
    dynamicRequests: number;
    avgLatency: number;
}

const ORIGIN = { x: 50, y: 50 };

const REGION_DEFS = [
    { id: "us-east", name: "US East", x: 15, y: 25, colorClasses: { bg: "bg-blue-500", border: "border-blue-600", bgLight: "bg-blue-100 dark:bg-blue-900/40", borderLight: "border-blue-300 dark:border-blue-700", text: "text-blue-600 dark:text-blue-400" } },
    { id: "eu-west", name: "Europe", x: 48, y: 18, colorClasses: { bg: "bg-green-500", border: "border-green-600", bgLight: "bg-green-100 dark:bg-green-900/40", borderLight: "border-green-300 dark:border-green-700", text: "text-green-600 dark:text-green-400" } },
    { id: "asia-pacific", name: "Asia", x: 78, y: 35, colorClasses: { bg: "bg-orange-500", border: "border-orange-600", bgLight: "bg-orange-100 dark:bg-orange-900/40", borderLight: "border-orange-300 dark:border-orange-700", text: "text-orange-600 dark:text-orange-400" } },
    { id: "south-america", name: "S. America", x: 22, y: 70, colorClasses: { bg: "bg-purple-500", border: "border-purple-600", bgLight: "bg-purple-100 dark:bg-purple-900/40", borderLight: "border-purple-300 dark:border-purple-700", text: "text-purple-600 dark:text-purple-400" } },
    { id: "us-west", name: "US West", x: 6, y: 48, colorClasses: { bg: "bg-indigo-500", border: "border-indigo-600", bgLight: "bg-indigo-100 dark:bg-indigo-900/40", borderLight: "border-indigo-300 dark:border-indigo-700", text: "text-indigo-600 dark:text-indigo-400" } },
];

export function CDNVisual() {
    const [cdnEnabled, setCdnEnabled] = useState(true);
    const [contentType, setContentType] = useState<"static" | "dynamic">("static");
    const [trafficSpike, setTrafficSpike] = useState(false);
    const [ttl, setTtl] = useState(60);
    const [regions, setRegions] = useState<Region[]>(() =>
        REGION_DEFS.map(r => ({ ...r, edgeServer: { cache: new Map(), hitCount: 0, missCount: 0 } }))
    );
    const [requests, setRequests] = useState<Request[]>([]);
    const [metrics, setMetrics] = useState<Metrics>({ totalRequests: 0, edgeHits: 0, edgeMisses: 0, dynamicRequests: 0, avgLatency: 0 });
    const [isPurging, setIsPurging] = useState(false);
    const regionsRef = useRef(regions);
    useEffect(() => { regionsRef.current = regions; }, [regions]);
    const requestsLengthRef = useRef(0);
    useEffect(() => { requestsLengthRef.current = requests.length; }, [requests.length]);

    const calcLatency = useCallback((a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.max(20, Math.round(Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)) * 8)), []);

    const generateRequest = useCallback(() => {
        if (requestsLengthRef.current > 15) return;
        const currentRegions = regionsRef.current;
        const regionIndex = Math.floor(Math.random() * currentRegions.length);
        const region = currentRegions[regionIndex];
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const contentKey = `c-${Math.floor(Math.random() * 4)}`;
        const edgePos = { x: region.x + 4, y: region.y + 4 };

        let requestType: "HIT" | "MISS" | "DYNAMIC";
        let latency: number;
        let pathTo: { x: number; y: number };

        if (!cdnEnabled || contentType === "dynamic") {
            requestType = "DYNAMIC";
            latency = calcLatency({ x: region.x, y: region.y }, ORIGIN);
            pathTo = ORIGIN;
        } else {
            const cacheEntry = region.edgeServer.cache.get(contentKey);
            const isHit = cacheEntry && (Date.now() - cacheEntry.cachedAt) < cacheEntry.ttl * 1000;
            if (isHit) {
                requestType = "HIT";
                latency = calcLatency({ x: region.x, y: region.y }, edgePos);
                pathTo = edgePos;
                setRegions(prev => { const next = [...prev]; next[regionIndex].edgeServer.hitCount++; return next; });
            } else {
                requestType = "MISS";
                latency = calcLatency({ x: region.x, y: region.y }, edgePos) + calcLatency(edgePos, ORIGIN);
                pathTo = ORIGIN;
                setRegions(prev => {
                    const next = [...prev];
                    next[regionIndex].edgeServer.missCount++;
                    next[regionIndex].edgeServer.cache.set(contentKey, { key: contentKey, cachedAt: Date.now(), ttl });
                    return next;
                });
            }
        }

        const newRequest: Request = { id: requestId, regionId: region.id, path: { from: { x: region.x, y: region.y }, to: pathTo }, latency, type: requestType, completed: false };
        setRequests(prev => [...prev, newRequest]);
        setMetrics(prev => {
            const total = prev.totalRequests + 1;
            return {
                totalRequests: total,
                edgeHits: requestType === "HIT" ? prev.edgeHits + 1 : prev.edgeHits,
                edgeMisses: requestType === "MISS" ? prev.edgeMisses + 1 : prev.edgeMisses,
                dynamicRequests: requestType === "DYNAMIC" ? prev.dynamicRequests + 1 : prev.dynamicRequests,
                avgLatency: total === 1 ? latency : Math.round((prev.avgLatency * prev.totalRequests + latency) / total),
            };
        });
        setTimeout(() => {
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, completed: true } : r));
            setTimeout(() => setRequests(prev => prev.filter(r => r.id !== requestId)), 800);
        }, latency);
    }, [cdnEnabled, contentType, calcLatency, ttl]);

    useEffect(() => {
        const interval = setInterval(generateRequest, trafficSpike ? 300 : 1800);
        return () => clearInterval(interval);
    }, [generateRequest, trafficSpike]);

    const handlePurge = useCallback(() => {
        setIsPurging(true);
        setRegions(prev => prev.map(r => ({ ...r, edgeServer: { ...r.edgeServer, cache: new Map() } })));
        setTimeout(() => setIsPurging(false), 800);
    }, []);

    const handleReset = () => {
        setRegions(REGION_DEFS.map(r => ({ ...r, edgeServer: { cache: new Map(), hitCount: 0, missCount: 0 } })));
        setRequests([]);
        setMetrics({ totalRequests: 0, edgeHits: 0, edgeMisses: 0, dynamicRequests: 0, avgLatency: 0 });
    };

    const hitRate = useMemo(() => {
        const total = metrics.edgeHits + metrics.edgeMisses;
        return total === 0 ? 0 : (metrics.edgeHits / total) * 100;
    }, [metrics.edgeHits, metrics.edgeMisses]);

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:30px_30px]" />
                        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CDN Simulation</span>
                        </div>

                        {/* Legend */}
                        <div className="absolute top-3 right-4 flex items-center gap-3 z-10">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[8px] text-slate-500 font-bold">HIT</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[8px] text-slate-500 font-bold">MISS</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[8px] text-slate-500 font-bold">DYNAMIC</span></div>
                        </div>

                        {/* Origin Server */}
                        <motion.div
                            className="absolute z-20 flex flex-col items-center gap-1.5"
                            style={{ left: `${ORIGIN.x}%`, top: `${ORIGIN.y}%`, transform: "translate(-50%, -50%)" }}
                        >
                            <motion.div
                                className={cn("p-4 rounded-full border-4 shadow-xl transition-all",
                                    requests.some(r => !r.completed && r.type !== "HIT")
                                        ? "bg-red-500 border-red-600" : "bg-slate-800 border-slate-700")}
                                animate={{ scale: requests.some(r => !r.completed && r.type !== "HIT") ? [1, 1.08, 1] : 1 }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                <Server className="w-6 h-6 text-white" />
                            </motion.div>
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black">ORIGIN</span>
                        </motion.div>

                        {/* Regions & Edge Servers */}
                        {regions.map((region) => {
                            const edgeX = region.x + 4;
                            const edgeY = region.y + 4;
                            const cacheSize = region.edgeServer.cache.size;
                            const isActive = requests.some(r => r.regionId === region.id && !r.completed);

                            return (
                                <div key={region.id} className="absolute z-20">
                                    <motion.div
                                        className="flex flex-col items-center gap-1"
                                        style={{ left: `${region.x}%`, top: `${region.y}%`, transform: "translate(-50%, -50%)" }}
                                    >
                                        <motion.div
                                            className={cn("p-3 rounded-full border-4 shadow-lg transition-all",
                                                isActive ? cn(region.colorClasses.bg, region.colorClasses.border) : cn(region.colorClasses.bgLight, region.colorClasses.borderLight))}
                                            animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
                                            transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                                        >
                                            <Users className={cn("w-4 h-4", isActive ? "text-white" : region.colorClasses.text)} />
                                        </motion.div>
                                        <span className={cn("text-[8px] font-bold", region.colorClasses.text)}>{region.name}</span>
                                    </motion.div>

                                    {cdnEnabled && (
                                        <motion.div
                                            className="flex flex-col items-center gap-0.5"
                                            style={{ left: `${edgeX}%`, top: `${edgeY}%`, position: "absolute", transform: "translate(-50%, -50%)" }}
                                        >
                                            <div className={cn("p-2 rounded-lg border-2 shadow transition-all",
                                                cacheSize > 0 ? "bg-blue-100 dark:bg-blue-900/40 border-blue-400" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                            )}>
                                                <Cloud className={cn("w-3.5 h-3.5", cacheSize > 0 ? "text-blue-600" : "text-slate-400")} />
                                            </div>
                                            {cacheSize > 0 && <span className="text-[7px] font-black text-blue-500">{cacheSize}</span>}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Request Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <AnimatePresence>
                                {requests.filter(r => !r.completed).map((req) => {
                                    const region = regions.find(r => r.id === req.regionId)!;
                                    const color = req.type === "HIT" ? "rgb(34,197,94)" : req.type === "MISS" ? "rgb(249,115,22)" : "rgb(239,68,68)";
                                    return (
                                        <motion.line key={req.id}
                                            x1={region.x} y1={region.y} x2={req.path.to.x} y2={req.path.to.y}
                                            stroke={color} strokeWidth="0.4" strokeDasharray={req.type === "MISS" ? "0.8 0.4" : undefined}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 0.7 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: req.latency / 1000 }}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </svg>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: CDN & Content Type */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">CDN Settings</h4>
                            <button
                                onClick={() => setCdnEnabled(!cdnEnabled)}
                                className={cn("w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                                    cdnEnabled ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}
                            >
                                {cdnEnabled ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                                CDN {cdnEnabled ? "ON" : "OFF"}
                            </button>
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <button onClick={() => setContentType("static")}
                                    className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all",
                                        contentType === "static" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500")}
                                >Static</button>
                                <button onClick={() => setContentType("dynamic")}
                                    className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all",
                                        contentType === "dynamic" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500")}
                                >Dynamic</button>
                            </div>
                        </div>

                        {/* Col 2: Traffic & Cache */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Traffic & Cache</h4>
                            <button
                                onClick={() => setTrafficSpike(!trafficSpike)}
                                className={cn("w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                                    trafficSpike ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}
                            >
                                <TrendingUp className="w-3 h-3" /> {trafficSpike ? "Spike Active" : "Normal Traffic"}
                            </button>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>TTL</span><Badge variant="outline" className="text-[9px]">{ttl}s</Badge>
                                </div>
                                <input type="range" min="5" max="300" value={ttl} onChange={(e) => setTtl(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={handlePurge} disabled={isPurging} className="h-9 gap-1 text-xs">
                                    <Trash2 className="w-3 h-3" /> {isPurging ? "Purging..." : "Purge"}
                                </Button>
                                <Button variant="outline" onClick={handleReset} className="h-9 gap-1 text-xs">
                                    <RotateCcw className="w-3 h-3" /> Reset
                                </Button>
                            </div>
                        </div>

                        {/* Col 3: Metrics */}
                        <div className="space-y-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-2">
                                <Activity className="w-4 h-4" /> Live Metrics
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Hit Rate</span>
                                    <span className="text-xs font-bold text-emerald-600">{hitRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Avg Latency</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.avgLatency}ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Edge Hits</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.edgeHits}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-500" /> Misses</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.edgeMisses}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Server className="w-3 h-3 text-red-500" /> Dynamic</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.dynamicRequests}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Explanations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Five global regions generate requests to a central origin server. When CDN is ON, edge servers (cloud icons) intercept static requests.
                        A <span className="font-semibold text-green-600">green line</span> is a cache hit (served from the edge).
                        An <span className="font-semibold text-orange-500">orange dashed line</span> is a cache miss (edge fetches from origin and caches the result).
                        A <span className="font-semibold text-red-500">red line</span> is dynamic content — always bypasses cache.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        CDNs reduce latency by <span className="font-semibold">bringing content geographically closer</span> to users.
                        A user in Asia fetching from a US origin adds 200–300ms of round-trip time; an edge server in the same region cuts that to ~20ms.
                        CDNs also absorb traffic spikes and reduce origin bandwidth costs. Dynamic content (personalized, real-time) can&apos;t be cached and must still reach the origin.
                    </p>
                </div>
            </div>
        </>
    );
}
