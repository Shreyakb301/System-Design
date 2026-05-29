"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Database,
    Zap,
    ZapOff,
    Clock,
    ShieldCheck,
    ShieldAlert,
    Timer,
    Flame,
    Users,
    Search,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CacheEntry {
    key: string;
    value: string;
    lastAccessed: number;
    createdAt: number;
}

interface Request {
    id: string;
    key: string;
    type: "HIT" | "MISS" | "STALE";
    timestamp: number;
}

const DB_SEED: [string, string][] = [
    ["A", "Apple"], ["B", "Banana"], ["C", "Cherry"], ["D", "Dragonfruit"],
    ["E", "Elderberry"], ["F", "Fig"], ["G", "Grape"], ["H", "Honeydew"]
];

export function CachingVisual() {
    const [cacheSize, setCacheSize] = useState(4);
    const [ttl, setTtl] = useState(30);
    const [invalidateOnWrite, setInvalidateOnWrite] = useState(true);
    const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
    const [db, setDb] = useState<Map<string, string>>(() => new Map(DB_SEED));
    const [now, setNow] = useState(() => Date.now());
    const [requests, setRequests] = useState<Request[]>([]);
    const [activeRequest, setActiveRequest] = useState<{ id: string; key: string; step: "CLIENT" | "CACHE" | "DB" | "DONE" } | null>(null);
    const [stats, setStats] = useState({ hits: 0, misses: 0 });
    const requestVersionRef = useRef(0);
    const requestIdRef = useRef(0);
    const writeVersionRef = useRef(0);

    const addToCache = useCallback((key: string, value: string) => {
        setCache(prev => {
            const next = new Map(prev);
            next.set(key, { key, value, lastAccessed: Date.now(), createdAt: Date.now() });
            if (next.size > cacheSize) {
                const oldest = Array.from(next.values()).sort((a, b) => a.lastAccessed - b.lastAccessed)[0];
                next.delete(oldest.key);
            }
            return next;
        });
    }, [cacheSize]);

    const handleRead = async (key: string) => {
        if (activeRequest) return;
        const requestVersion = requestVersionRef.current;
        const reqId = `req-${requestIdRef.current++}`;
        setActiveRequest({ id: reqId, key, step: "CLIENT" });
        await new Promise(r => setTimeout(r, 400));
        if (requestVersionRef.current !== requestVersion) return;
        setActiveRequest(prev => prev ? { ...prev, step: "CACHE" } : null);
        await new Promise(r => setTimeout(r, 600));
        if (requestVersionRef.current !== requestVersion) return;
        const entry = cache.get(key);
        if (entry !== undefined) {
            const isStale = entry.value !== db.get(key);
            setStats(s => ({ ...s, hits: s.hits + 1 }));
            setRequests(prev => [{ id: reqId, key, type: isStale ? "STALE" : "HIT", timestamp: Date.now() }, ...prev.slice(0, 8)]);
            setCache(prev => { const next = new Map(prev); const e = next.get(key); if (e) next.set(key, { ...e, lastAccessed: Date.now() }); return next; });
            setActiveRequest(prev => prev ? { ...prev, step: "DONE" } : null);
        } else {
            setStats(s => ({ ...s, misses: s.misses + 1 }));
            setActiveRequest(prev => prev ? { ...prev, step: "DB" } : null);
            await new Promise(r => setTimeout(r, 800));
            if (requestVersionRef.current !== requestVersion) return;
            addToCache(key, db.get(key) || "Unknown");
            setRequests(prev => [{ id: reqId, key, type: "MISS", timestamp: Date.now() }, ...prev.slice(0, 8)]);
            setActiveRequest(prev => prev ? { ...prev, step: "DONE" } : null);
        }
        await new Promise(r => setTimeout(r, 400));
        if (requestVersionRef.current !== requestVersion) return;
        setActiveRequest(null);
    };

    const handleWrite = (key: string) => {
        writeVersionRef.current++;
        setDb(prev => new Map(prev).set(key, `Updated ${key} v${writeVersionRef.current}`));
        if (invalidateOnWrite) {
            setCache(prev => { const next = new Map(prev); next.delete(key); return next; });
        }
    };

    const handleCacheSizeChange = (nextSize: number) => {
        setCacheSize(nextSize);
        setCache(prev => {
            if (prev.size <= nextSize) return prev;
            const trimmed = [...prev.values()].sort((a, b) => b.lastAccessed - a.lastAccessed).slice(0, nextSize).map(e => [e.key, e] as const);
            return new Map(trimmed);
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const currentTime = Date.now();
            setNow(currentTime);
            setCache(prev => {
                const next = new Map(prev);
                let changed = false;
                next.forEach((entry, key) => { if (currentTime - entry.createdAt > ttl * 1000) { next.delete(key); changed = true; } });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [ttl]);

    const handleReset = () => {
        requestVersionRef.current++;
        setCacheSize(4); setTtl(30); setInvalidateOnWrite(true);
        setCache(new Map()); setDb(new Map(DB_SEED));
        setRequests([]); setActiveRequest(null); setStats({ hits: 0, misses: 0 }); setNow(Date.now());
    };

    const totalReqs = stats.hits + stats.misses;
    const hitRate = totalReqs === 0 ? 0 : (stats.hits / totalReqs) * 100;
    const lastResult = requests[0];

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden">
                        <div className="absolute top-3 left-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cache Simulation</span>
                        </div>

                        {/* Last result badge */}
                        <AnimatePresence>
                            {lastResult && (
                                <motion.div
                                    key={lastResult.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={cn(
                                        "absolute top-3 right-4 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black",
                                        lastResult.type === "HIT" ? "bg-emerald-100 text-emerald-700" :
                                            lastResult.type === "MISS" ? "bg-orange-100 text-orange-700" :
                                                "bg-red-100 text-red-700"
                                    )}
                                >
                                    {lastResult.type === "HIT" ? <CheckCircle2 className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                                    {lastResult.type}: KEY {lastResult.key}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Vertical flow layout */}
                        <div className="h-full flex flex-col items-center justify-between py-8 px-8 relative">
                            {/* CLIENT */}
                            <div className="flex flex-col items-center gap-2 z-20">
                                <div className={cn(
                                    "p-3 rounded-full bg-slate-100 dark:bg-slate-800 border-4 shadow-xl transition-all duration-300",
                                    activeRequest?.step === "CLIENT" ? "border-orange-500 scale-110" : "border-white dark:border-slate-700"
                                )}>
                                    <Users className="w-6 h-6 text-slate-600" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">CLIENT</span>
                            </div>

                            {/* Arrow down */}
                            <div className="w-0.5 h-8 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />

                            {/* CACHE LAYER */}
                            <div className={cn(
                                "flex gap-2 p-4 rounded-2xl border-4 transition-all duration-300 relative z-20",
                                activeRequest?.step === "CACHE" ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 scale-105" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                            )}>
                                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-orange-500 rounded-md text-white font-black text-[8px] shadow flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5" /> REDIS CACHE
                                </div>
                                {Array.from({ length: cacheSize }).map((_, i) => {
                                    const entry = Array.from(cache.values())[i];
                                    return (
                                        <motion.div key={i} layout className={cn(
                                            "w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all",
                                            entry ? "bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-900/50 shadow-sm" : "border-dashed border-slate-300 dark:border-slate-700"
                                        )}>
                                            {entry ? (
                                                <>
                                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[9px] px-1.5 py-0">{entry.key}</Badge>
                                                    <div className="flex items-center gap-0.5 opacity-60">
                                                        <Clock className="w-2 h-2" />
                                                        <span className="text-[7px] font-black">{Math.max(0, ttl - Math.floor((now - entry.createdAt) / 1000))}s</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-[7px] font-black text-slate-300">EMPTY</span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Arrow down */}
                            <div className="w-0.5 h-8 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />

                            {/* DB LAYER */}
                            <div className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border-4 transition-all duration-300 relative z-20",
                                activeRequest?.step === "DB" ? "border-orange-500 scale-105 shadow-xl bg-orange-50/50 dark:bg-orange-950/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            )}>
                                <div className="p-3 rounded-xl bg-slate-900 text-white shadow">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">PostgreSQL — Update keys:</span>
                                    <div className="flex gap-1.5">
                                        {["A", "B", "C", "D"].map(k => (
                                            <button key={k} onClick={() => handleWrite(k)}
                                                className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black hover:bg-orange-500 hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
                                            >{k}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Animated request particle */}
                            <AnimatePresence>
                                {activeRequest && (
                                    <motion.div
                                        key={activeRequest.id}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            top: activeRequest.step === "CLIENT" ? "8%" : activeRequest.step === "CACHE" ? "38%" : activeRequest.step === "DB" ? "68%" : "8%",
                                            opacity: activeRequest.step === "DONE" ? 0 : 1,
                                            scale: 1
                                        }}
                                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                        className="absolute left-[50%] -translate-x-[50%] z-50 pointer-events-none"
                                    >
                                        <div className="w-9 h-9 flex items-center justify-center bg-orange-500 rounded-lg shadow-xl border-2 border-white text-white font-black text-sm">
                                            {activeRequest.key}
                                        </div>
                                        <div className="absolute inset-0 bg-orange-500 rounded-lg animate-ping opacity-20" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: Config */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Cache Config</h4>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>Cache Size</span>
                                        <Badge variant="outline" className="text-[9px]">{cacheSize} slots</Badge>
                                    </div>
                                    <input type="range" min="1" max="8" value={cacheSize}
                                        onChange={(e) => handleCacheSizeChange(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>TTL</span>
                                        <Badge variant="outline" className="text-[9px]">{ttl}s</Badge>
                                    </div>
                                    <input type="range" min="5" max="120" value={ttl}
                                        onChange={(e) => setTtl(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500"
                                    />
                                </div>
                                <Button variant="outline" onClick={handleReset} className="w-full h-9 gap-2 text-xs">
                                    <RotateCcw className="w-3 h-3" /> Reset
                                </Button>
                            </div>
                        </div>

                        {/* Col 2: Read keys */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                <Search className="w-3 h-3 inline mr-1" />Read Key
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                                {["A", "B", "C", "D", "E", "F", "G", "H"].map(k => (
                                    <button key={k} onClick={() => handleRead(k)} disabled={activeRequest !== null}
                                        className={cn(
                                            "h-10 rounded-xl font-black text-sm transition-all border-2",
                                            activeRequest?.key === k ? "bg-orange-500 text-white border-orange-600 scale-95" :
                                                "bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 border-slate-200 dark:border-slate-700"
                                        )}
                                    >{k}</button>
                                ))}
                            </div>
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <button onClick={() => setInvalidateOnWrite(true)}
                                    className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-bold rounded-md transition-all",
                                        invalidateOnWrite ? "bg-white dark:bg-slate-700 shadow-sm text-orange-600" : "text-slate-500")}
                                >
                                    <ShieldCheck className="w-3 h-3" /> Invalidate
                                </button>
                                <button onClick={() => setInvalidateOnWrite(false)}
                                    className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-bold rounded-md transition-all",
                                        !invalidateOnWrite ? "bg-white dark:bg-slate-700 shadow-sm text-orange-600" : "text-slate-500")}
                                >
                                    <ShieldAlert className="w-3 h-3" /> Allow Stale
                                </button>
                            </div>
                        </div>

                        {/* Col 3: Stats */}
                        <div className="space-y-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-2">
                                <Zap className="w-4 h-4" /> Live Stats
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Cache Hits</span>
                                    <span className="text-xs font-bold tabular-nums text-emerald-600">{stats.hits}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><ZapOff className="w-3 h-3 text-orange-500" /> Cache Misses</span>
                                    <span className="text-xs font-bold tabular-nums text-orange-600">{stats.misses}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Hit Rate</span>
                                    <span className="text-xs font-bold tabular-nums">{hitRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Avg Latency</span>
                                    <span className="text-xs font-bold tabular-nums">
                                        {totalReqs === 0 ? "—" : `${((stats.hits * 10 + stats.misses * 150) / totalReqs).toFixed(0)}ms`}
                                    </span>
                                </div>
                            </div>
                            {!invalidateOnWrite && (
                                <div className="flex items-start gap-1.5 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50 mt-2">
                                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-amber-600 font-bold">Stale reads enabled — update A-D then re-read to see stale data.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Explanations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-orange-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        When you click a key (A–H), a read request flows from the client down to the cache layer.
                        A <span className="font-semibold text-emerald-600">HIT</span> returns instantly from Redis in ~10ms.
                        A <span className="font-semibold text-orange-600">MISS</span> falls through to PostgreSQL (~150ms) and populates the cache.
                        TTL evicts entries automatically; the LRU policy evicts the least-recently used slot when the cache is full.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Caching leverages <span className="font-semibold">temporal locality</span> — data accessed once is likely needed again.
                        A 90%+ hit rate can cut database load by 10×. The tradeoff is <span className="font-semibold">consistency</span>:
                        stale reads serve outdated data after DB writes. Cache invalidation (write-through or TTL expiry) is famously one of the hardest problems in distributed systems.
                    </p>
                </div>
            </div>
        </>
    );
}
