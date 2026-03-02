"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Globe,
    Server,
    Zap,
    ZapOff,
    Clock,
    Activity,
    TrendingUp,
    RefreshCw,
    Trash2,
    Timer,
    Users,
    Network,
    Gauge,
    BarChart3,
    MapPin,
    Cloud,
    HardDrive,
    AlertCircle,
    CheckCircle2,
    Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Region {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    edgeServer?: EdgeServer;
}

interface EdgeServer {
    id: string;
    regionId: string;
    cache: Map<string, CacheEntry>;
    hitCount: number;
    missCount: number;
}

interface CacheEntry {
    key: string;
    cachedAt: number;
    ttl: number;
}

interface Request {
    id: string;
    regionId: string;
    timestamp: number;
    path: RequestPath;
    latency: number;
    type: "HIT" | "MISS" | "DYNAMIC";
    completed: boolean;
}

interface RequestPath {
    from: { x: number; y: number };
    to: { x: number; y: number };
    via?: { x: number; y: number }; // For edge → origin path
}

interface Metrics {
    totalRequests: number;
    edgeHits: number;
    edgeMisses: number;
    dynamicRequests: number;
    avgLatency: number;
    originQPS: number;
    originBandwidth: number; // in MB/s
}

const REGIONS: (Region & { colorClasses: { bg: string; border: string; bgLight: string; borderLight: string; text: string; bgBadge: string; textBadge: string } })[] = [
    { id: "us-east", name: "US East", x: 20, y: 30, color: "blue", colorClasses: { bg: "bg-blue-500", border: "border-blue-600", bgLight: "bg-blue-200 dark:bg-blue-900", borderLight: "border-blue-300 dark:border-blue-700", text: "text-blue-600 dark:text-blue-400", bgBadge: "bg-blue-100 dark:bg-blue-900", textBadge: "text-blue-700 dark:text-blue-300" } },
    { id: "us-west", name: "US West", x: 10, y: 30, color: "indigo", colorClasses: { bg: "bg-indigo-500", border: "border-indigo-600", bgLight: "bg-indigo-200 dark:bg-indigo-900", borderLight: "border-indigo-300 dark:border-indigo-700", text: "text-indigo-600 dark:text-indigo-400", bgBadge: "bg-indigo-100 dark:bg-indigo-900", textBadge: "text-indigo-700 dark:text-indigo-300" } },
    { id: "eu-west", name: "Europe", x: 50, y: 25, color: "green", colorClasses: { bg: "bg-green-500", border: "border-green-600", bgLight: "bg-green-200 dark:bg-green-900", borderLight: "border-green-300 dark:border-green-700", text: "text-green-600 dark:text-green-400", bgBadge: "bg-green-100 dark:bg-green-900", textBadge: "text-green-700 dark:text-green-300" } },
    { id: "asia-pacific", name: "Asia", x: 80, y: 40, color: "orange", colorClasses: { bg: "bg-orange-500", border: "border-orange-600", bgLight: "bg-orange-200 dark:bg-orange-900", borderLight: "border-orange-300 dark:border-orange-700", text: "text-orange-600 dark:text-orange-400", bgBadge: "bg-orange-100 dark:bg-orange-900", textBadge: "text-orange-700 dark:text-orange-300" } },
    { id: "south-america", name: "South America", x: 25, y: 60, color: "purple", colorClasses: { bg: "bg-purple-500", border: "border-purple-600", bgLight: "bg-purple-200 dark:bg-purple-900", borderLight: "border-purple-300 dark:border-purple-700", text: "text-purple-600 dark:text-purple-400", bgBadge: "bg-purple-100 dark:bg-purple-900", textBadge: "text-purple-700 dark:text-purple-300" } },
];

const ORIGIN_SERVER = { x: 50, y: 50 };

export function CDNVisual() {
    const [cdnEnabled, setCdnEnabled] = useState(true);
    const [contentType, setContentType] = useState<"static" | "dynamic">("static");
    const [trafficSpike, setTrafficSpike] = useState(false);
    const [ttl, setTtl] = useState(60); // seconds
    const [regions, setRegions] = useState<(Region & { colorClasses: { bg: string; border: string; bgLight: string; borderLight: string; text: string; bgBadge: string; textBadge: string } })[]>(() =>
        REGIONS.map(r => ({
            ...r,
            edgeServer: {
                id: `edge-${r.id}`,
                regionId: r.id,
                cache: new Map(),
                hitCount: 0,
                missCount: 0,
            },
        }))
    );
    const [requests, setRequests] = useState<Request[]>([]);
    const [metrics, setMetrics] = useState<Metrics>({
        totalRequests: 0,
        edgeHits: 0,
        edgeMisses: 0,
        dynamicRequests: 0,
        avgLatency: 0,
        originQPS: 0,
        originBandwidth: 0,
    });
    const [isPurging, setIsPurging] = useState(false);

    // Calculate distance-based latency (ms)
    const calculateLatency = useCallback((from: { x: number; y: number }, to: { x: number; y: number }): number => {
        const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
        // Base latency: 10ms per unit distance, minimum 20ms
        return Math.max(20, Math.round(distance * 10));
    }, []);

    // Generate a request from a random region
    const generateRequest = useCallback(() => {
        if (requests.length > 20) return; // Limit concurrent requests

        const regionIndex = Math.floor(Math.random() * regions.length);
        const region = regions[regionIndex];
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const contentKey = `content-${Math.floor(Math.random() * 5)}`; // 5 different content items

        const edgeServer = region.edgeServer!;
        const cacheEntry = edgeServer.cache.get(contentKey);
        const now = Date.now();

        let requestType: "HIT" | "MISS" | "DYNAMIC";
        let path: RequestPath;
        let latency: number;

        if (!cdnEnabled) {
            // Direct to origin
            requestType = "DYNAMIC";
            latency = calculateLatency(
                { x: region.x, y: region.y },
                ORIGIN_SERVER
            );
            path = {
                from: { x: region.x, y: region.y },
                to: ORIGIN_SERVER,
            };
        } else if (contentType === "dynamic") {
            // Dynamic content always goes to origin
            requestType = "DYNAMIC";
            latency = calculateLatency(
                { x: region.x, y: region.y },
                ORIGIN_SERVER
            );
            path = {
                from: { x: region.x, y: region.y },
                to: ORIGIN_SERVER,
            };
        } else {
            // Static content: check cache
            const isHit = cacheEntry && (now - cacheEntry.cachedAt) < cacheEntry.ttl * 1000;

            if (isHit) {
                requestType = "HIT";
                latency = calculateLatency(
                    { x: region.x, y: region.y },
                    { x: region.x + 5, y: region.y + 5 } // Edge server location
                );
                path = {
                    from: { x: region.x, y: region.y },
                    to: { x: region.x + 5, y: region.y + 5 },
                };
                setRegions(prev => {
                    const next = [...prev];
                    const edge = next[regionIndex].edgeServer!;
                    edge.hitCount++;
                    return next;
                });
            } else {
                requestType = "MISS";
                const edgeLatency = calculateLatency(
                    { x: region.x, y: region.y },
                    { x: region.x + 5, y: region.y + 5 }
                );
                const originLatency = calculateLatency(
                    { x: region.x + 5, y: region.y + 5 },
                    ORIGIN_SERVER
                );
                latency = edgeLatency + originLatency;
                path = {
                    from: { x: region.x, y: region.y },
                    to: ORIGIN_SERVER,
                    via: { x: region.x + 5, y: region.y + 5 },
                };
                setRegions(prev => {
                    const next = [...prev];
                    const edge = next[regionIndex].edgeServer!;
                    edge.missCount++;
                    edge.cache.set(contentKey, {
                        key: contentKey,
                        cachedAt: now,
                        ttl: ttl,
                    });
                    return next;
                });
            }
        }

        const newRequest: Request = {
            id: requestId,
            regionId: region.id,
            timestamp: now,
            path,
            latency,
            type: requestType,
            completed: false,
        };

        setRequests(prev => [...prev, newRequest]);

        // Update metrics
        setMetrics(prev => {
            const total = prev.totalRequests + 1;
            const hits = requestType === "HIT" ? prev.edgeHits + 1 : prev.edgeHits;
            const misses = requestType === "MISS" ? prev.edgeMisses + 1 : prev.edgeMisses;
            const dynamic = requestType === "DYNAMIC" ? prev.dynamicRequests + 1 : prev.dynamicRequests;
            const avgLat = total === 1 ? latency : (prev.avgLatency * prev.totalRequests + latency) / total;
            const originRequests = requestType === "MISS" || requestType === "DYNAMIC" ? 1 : 0;

            return {
                totalRequests: total,
                edgeHits: hits,
                edgeMisses: misses,
                dynamicRequests: dynamic,
                avgLatency: Math.round(avgLat),
                originQPS: prev.originQPS * 0.9 + (originRequests * 10), // Smoothing
                originBandwidth: prev.originBandwidth * 0.9 + (originRequests * 0.5), // MB/s
            };
        });

        // Mark request as completed after animation
        setTimeout(() => {
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, completed: true } : r));
            setTimeout(() => {
                setRequests(prev => prev.filter(r => r.id !== requestId));
            }, 1000);
        }, latency);
    }, [cdnEnabled, contentType, regions, calculateLatency, ttl, requests.length]);

    // Auto-generate requests
    useEffect(() => {
        const baseInterval = trafficSpike ? 200 : 1500;
        const interval = setInterval(() => {
            generateRequest();
        }, baseInterval);

        return () => clearInterval(interval);
    }, [generateRequest, trafficSpike]);

    // Purge cache
    const handlePurge = useCallback(() => {
        setIsPurging(true);
        setRegions(prev =>
            prev.map(r => ({
                ...r,
                edgeServer: {
                    ...r.edgeServer!,
                    cache: new Map(),
                },
            }))
        );
        setTimeout(() => setIsPurging(false), 1000);
    }, []);

    // Calculate hit rate
    const hitRate = useMemo(() => {
        const total = metrics.edgeHits + metrics.edgeMisses;
        return total === 0 ? 0 : (metrics.edgeHits / total) * 100;
    }, [metrics.edgeHits, metrics.edgeMisses]);

    // Get total cache entries across all edges
    const totalCacheEntries = useMemo(() => {
        return regions.reduce((sum, r) => sum + (r.edgeServer?.cache.size || 0), 0);
    }, [regions]);

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            CDN Simulator
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 font-semibold italic">
                        Visualize how CDNs reduce latency by serving content from edge locations
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Button
                        onClick={() => setCdnEnabled(!cdnEnabled)}
                        variant={cdnEnabled ? "default" : "outline"}
                        className={cn(
                            "flex items-center gap-2",
                            cdnEnabled && "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {cdnEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        CDN {cdnEnabled ? "ON" : "OFF"}
                    </Button>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Content Type</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setContentType("static")}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                contentType === "static"
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                        >
                            Static
                        </button>
                        <button
                            onClick={() => setContentType("dynamic")}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                contentType === "dynamic"
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                        >
                            Dynamic
                        </button>
                    </div>
                </Card>

                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Traffic</span>
                    </div>
                    <button
                        onClick={() => setTrafficSpike(!trafficSpike)}
                        className={cn(
                            "w-full px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                            trafficSpike
                                ? "bg-orange-500 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                    >
                        <TrendingUp className="w-3 h-3" />
                        {trafficSpike ? "Spike Active" : "Normal"}
                    </button>
                </Card>

                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">TTL</span>
                        <Badge variant="outline">{ttl}s</Badge>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="300"
                        value={ttl}
                        onChange={(e) => setTtl(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                </Card>

                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Cache</span>
                    </div>
                    <Button
                        onClick={handlePurge}
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={isPurging}
                    >
                        <Trash2 className="w-3 h-3" />
                        {isPurging ? "Purging..." : "Purge All"}
                    </Button>
                </Card>
            </div>

            {/* Main Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Map Canvas */}
                <div className="lg:col-span-8 relative bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl min-h-[600px] overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:40px_40px]" />

                    {/* Origin Server */}
                    <motion.div
                        className="absolute z-30 flex flex-col items-center gap-2"
                        style={{
                            left: `${ORIGIN_SERVER.x}%`,
                            top: `${ORIGIN_SERVER.y}%`,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <motion.div
                            className={cn(
                                "p-6 rounded-full border-4 shadow-2xl transition-all",
                                requests.some(r => !r.completed && (r.type === "MISS" || r.type === "DYNAMIC"))
                                    ? "bg-red-500 border-red-600 scale-110"
                                    : "bg-slate-800 border-slate-700"
                            )}
                            animate={{
                                scale: requests.some(r => !r.completed && (r.type === "MISS" || r.type === "DYNAMIC"))
                                    ? [1, 1.1, 1]
                                    : 1,
                            }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            <Server className="w-8 h-8 text-white" />
                        </motion.div>
                        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">
                            Origin Server
                        </div>
                    </motion.div>

                    {/* Edge Servers & Regions */}
                    {regions.map((region) => {
                        const edgeX = region.x + 5;
                        const edgeY = region.y + 5;
                        const regionRequests = requests.filter(r => r.regionId === region.id && !r.completed);
                        const cacheSize = region.edgeServer?.cache.size || 0;

                        return (
                            <div key={region.id} className="absolute z-20">
                                {/* User Region */}
                                <motion.div
                                    className="flex flex-col items-center gap-2"
                                    style={{
                                        left: `${region.x}%`,
                                        top: `${region.y}%`,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    <motion.div
                                        className={cn(
                                            "p-4 rounded-full border-4 shadow-xl transition-all",
                                            regionRequests.length > 0
                                                ? cn(region.colorClasses.bg, region.colorClasses.border, "scale-110")
                                                : cn(region.colorClasses.bgLight, region.colorClasses.borderLight)
                                        )}
                                        animate={{
                                            scale: regionRequests.length > 0 ? [1, 1.1, 1] : 1,
                                        }}
                                        transition={{ duration: 0.5, repeat: regionRequests.length > 0 ? Infinity : 0 }}
                                    >
                                        <Users className={cn(
                                            "w-6 h-6",
                                            regionRequests.length > 0 ? "text-white" : region.colorClasses.text
                                        )} />
                                    </motion.div>
                                    <div className={cn(
                                        "px-2 py-1 rounded text-[9px] font-bold uppercase",
                                        region.colorClasses.bgBadge,
                                        region.colorClasses.textBadge
                                    )}>
                                        {region.name}
                                    </div>
                                </motion.div>

                                {/* Edge Server */}
                                {cdnEnabled && (
                                    <motion.div
                                        className="flex flex-col items-center gap-1"
                                        style={{
                                            left: `${edgeX}%`,
                                            top: `${edgeY}%`,
                                            transform: "translate(-50%, -50%)",
                                        }}
                                    >
                                        <motion.div
                                            className={cn(
                                                "p-3 rounded-lg border-2 shadow-lg transition-all",
                                                cacheSize > 0
                                                    ? "bg-blue-100 dark:bg-blue-900 border-blue-400"
                                                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                            )}
                                        >
                                            <Cloud className={cn(
                                                "w-5 h-5",
                                                cacheSize > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                                            )} />
                                        </motion.div>
                                        {cacheSize > 0 && (
                                            <Badge className="text-[8px] bg-blue-500 text-white">
                                                {cacheSize} cached
                                            </Badge>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}

                    {/* Request Paths */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="10"
                                refX="9"
                                refY="3"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                            </marker>
                        </defs>
                        <AnimatePresence>
                            {requests
                                .filter(r => !r.completed)
                                .map((request) => {
                                    const region = regions.find(r => r.id === request.regionId)!;
                                    const fromX = region.x;
                                    const fromY = region.y;
                                    const toX = request.path.to.x;
                                    const toY = request.path.to.y;

                                    let color = "rgb(59, 130, 246)"; // blue
                                    if (request.type === "HIT") color = "rgb(34, 197, 94)"; // green
                                    if (request.type === "MISS") color = "rgb(249, 115, 22)"; // orange
                                    if (request.type === "DYNAMIC") color = "rgb(239, 68, 68)"; // red

                                    return (
                                        <g key={request.id}>
                                            {/* Main path */}
                                            <motion.line
                                                x1={fromX}
                                                y1={fromY}
                                                x2={toX}
                                                y2={toY}
                                                stroke={color}
                                                strokeWidth="0.3"
                                                markerEnd="url(#arrowhead)"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 0.8 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: request.latency / 1000 }}
                                            />
                                            {/* Via path (edge → origin) */}
                                            {request.path.via && (
                                                <motion.line
                                                    x1={request.path.via.x}
                                                    y1={request.path.via.y}
                                                    x2={toX}
                                                    y2={toY}
                                                    stroke={color}
                                                    strokeWidth="0.3"
                                                    strokeDasharray="0.4 0.4"
                                                    markerEnd="url(#arrowhead)"
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                                    transition={{ duration: (request.latency / 1000) * 0.6, delay: (request.latency / 1000) * 0.4 }}
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                        </AnimatePresence>
                    </svg>

                    {/* Request Indicators */}
                    <AnimatePresence>
                        {requests
                            .filter(r => !r.completed)
                            .map((request) => {
                                const region = regions.find(r => r.id === request.regionId)!;
                                return (
                                    <motion.div
                                        key={request.id}
                                        className="absolute z-40"
                                        style={{
                                            left: `${region.x}%`,
                                            top: `${region.y}%`,
                                            transform: "translate(-50%, -50%)",
                                        }}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                    >
                                        <Badge
                                            className={cn(
                                                "text-[9px] font-black",
                                                request.type === "HIT" && "bg-green-500 text-white",
                                                request.type === "MISS" && "bg-orange-500 text-white",
                                                request.type === "DYNAMIC" && "bg-red-500 text-white"
                                            )}
                                        >
                                            {request.type} {request.latency}ms
                                        </Badge>
                                    </motion.div>
                                );
                            })}
                    </AnimatePresence>
                </div>

                {/* Metrics Dashboard */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Key Metrics */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                            <BarChart3 className="w-3.5 h-3.5" /> Performance Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 opacity-50">
                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Latency</span>
                                </div>
                                <div className="text-2xl font-black tabular-nums">{metrics.avgLatency}ms</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 opacity-50">
                                    <Gauge className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Hit Rate</span>
                                </div>
                                <div className="text-2xl font-black tabular-nums">{hitRate.toFixed(1)}%</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 opacity-50">
                                    <Activity className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Origin QPS</span>
                                </div>
                                <div className="text-2xl font-black tabular-nums">{metrics.originQPS.toFixed(1)}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 opacity-50">
                                    <Network className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bandwidth</span>
                                </div>
                                <div className="text-2xl font-black tabular-nums">{metrics.originBandwidth.toFixed(1)} MB/s</div>
                            </div>
                        </div>
                    </Card>

                    {/* Request Stats */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                            <Activity className="w-3.5 h-3.5" /> Request Statistics
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400">Total Requests</span>
                                <Badge variant="outline">{metrics.totalRequests}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Edge Hits
                                </span>
                                <Badge className="bg-green-500 text-white">{metrics.edgeHits}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-orange-500" /> Edge Misses
                                </span>
                                <Badge className="bg-orange-500 text-white">{metrics.edgeMisses}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Server className="w-3 h-3 text-red-500" /> Dynamic (Origin)
                                </span>
                                <Badge className="bg-red-500 text-white">{metrics.dynamicRequests}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <HardDrive className="w-3 h-3 text-blue-500" /> Cached Items
                                </span>
                                <Badge variant="outline">{totalCacheEntries}</Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Legend */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                            <MapPin className="w-3.5 h-3.5" /> Legend
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-500" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Cache Hit (Fast)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-orange-500" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Cache Miss (Edge → Origin)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-red-500" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Dynamic (Direct to Origin)</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Educational Insight */}
            <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-blue-500 rounded-3xl shrink-0 shadow-xl shadow-blue-500/20">
                    <Globe className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2 flex-1 relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">System Design Insight</h4>
                    <div className="text-sm font-medium leading-relaxed opacity-90 tracking-tight">
                        CDNs reduce latency by <strong>bringing content closer to users</strong>. When a user requests static content,
                        the CDN edge server checks its cache. A <strong>cache hit</strong> serves content in ~20-50ms, while a
                        <strong>cache miss</strong> requires fetching from the origin server (~100-300ms). Dynamic content always
                        bypasses the cache and goes directly to the origin. TTL (Time-To-Live) controls how long content stays cached,
                        balancing freshness with performance.
                    </div>
                </div>
            </div>
        </Card>
    );
}

