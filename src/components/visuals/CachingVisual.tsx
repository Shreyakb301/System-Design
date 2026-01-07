"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Database,
    Zap,
    ZapOff,
    Clock,
    Trash2,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    Timer,
    Flame,
    Users,
    ChevronRight,
    Search,
    History,
    FileText,
    HardDrive,
    AlertCircle,
    CheckCircle2,
    Settings2,
    BarChart3
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

export function CachingVisual() {
    const [cacheSize, setCacheSize] = useState(4);
    const [ttl, setTtl] = useState(30); // seconds
    const [invalidateOnWrite, setInvalidateOnWrite] = useState(true);
    const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
    const [db, setDb] = useState<Map<string, string>>(new Map([
        ["A", "Apple"], ["B", "Banana"], ["C", "Cherry"], ["D", "Dragonfruit"],
        ["E", "Elderberry"], ["F", "Fig"], ["G", "Grape"], ["H", "Honeydew"]
    ]));

    const [requests, setRequests] = useState<Request[]>([]);
    const [activeRequest, setActiveRequest] = useState<{ id: string; key: string; step: "CLIENT" | "CACHE" | "DB" | "DONE" } | null>(null);
    const [stats, setStats] = useState({ hits: 0, misses: 0, staleReads: 0 });

    // --- Cache Logic ---

    const addToCache = useCallback((key: string, value: string) => {
        setCache(prev => {
            const next = new Map(prev);

            // Invalidate if key already exists (update)
            next.set(key, { key, value, lastAccessed: Date.now(), createdAt: Date.now() });

            // Eviction logic if oversized
            if (next.size > cacheSize) {
                const entries = Array.from(next.values());
                const oldest = entries.sort((a, b) => a.lastAccessed - b.lastAccessed)[0];
                next.delete(oldest.key);
            }

            return next;
        });
    }, [cacheSize]);

    const handleRead = async (key: string) => {
        if (activeRequest) return;
        const reqId = Math.random().toString(36).substring(7);
        setActiveRequest({ id: reqId, key, step: "CLIENT" });

        // Step 1: Move to Cache
        await new Promise(r => setTimeout(r, 400));
        setActiveRequest(prev => prev ? { ...prev, step: "CACHE" } : null);

        await new Promise(r => setTimeout(r, 600));
        const entry = cache.get(key);
        const isHit = entry !== undefined;
        let isStale = false;

        if (isHit) {
            // Check for stale data (consistency check for demo)
            if (entry.value !== db.get(key)) {
                isStale = true;
            }

            setStats(s => ({ ...s, hits: s.hits + 1, staleReads: isStale ? s.staleReads + 1 : s.staleReads }));
            setRequests(prev => [{ id: reqId, key, type: isStale ? "STALE" : "HIT", timestamp: Date.now() }, ...prev.slice(0, 15)]);

            // Update last accessed
            setCache(prev => {
                const next = new Map(prev);
                const e = next.get(key);
                if (e) next.set(key, { ...e, lastAccessed: Date.now() });
                return next;
            });

            setActiveRequest(prev => prev ? { ...prev, step: "DONE" } : null);
        } else {
            // MISS Path
            setStats(s => ({ ...s, misses: s.misses + 1 }));
            setActiveRequest(prev => prev ? { ...prev, step: "DB" } : null);
            await new Promise(r => setTimeout(r, 800));

            const dbValue = db.get(key) || "Unknown";
            addToCache(key, dbValue);
            setRequests(prev => [{ id: reqId, key, type: "MISS", timestamp: Date.now() }, ...prev.slice(0, 15)]);
            setActiveRequest(prev => prev ? { ...prev, step: "DONE" } : null);
        }

        await new Promise(r => setTimeout(r, 400));
        setActiveRequest(null);
    };

    const handleWrite = (key: string) => {
        const newValue = `Updated ${key} ${Math.floor(Math.random() * 100)}`;
        setDb(prev => new Map(prev).set(key, newValue));

        if (invalidateOnWrite) {
            setCache(prev => {
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
        }
    };

    // TTL Expiration
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCache(prev => {
                const next = new Map(prev);
                let changed = false;
                next.forEach((entry, key) => {
                    if (now - entry.createdAt > ttl * 1000) {
                        next.delete(key);
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [ttl]);

    // --- Helper for metrics ---
    const totalReqs = stats.hits + stats.misses;
    const hitRate = totalReqs === 0 ? 0 : (stats.hits / totalReqs) * 100;
    const avgLatency = totalReqs === 0 ? 0 : (stats.hits * 10 + stats.misses * 150) / totalReqs;

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Cache Architect
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 font-semibold italic">Can you achieve a 99% hit rate?</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="flex p-1 bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
                        <button
                            onClick={() => setInvalidateOnWrite(true)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all",
                                invalidateOnWrite ? "bg-white dark:bg-slate-800 text-orange-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" /> WRITE-THROUGH
                        </button>
                        <button
                            onClick={() => setInvalidateOnWrite(false)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all",
                                !invalidateOnWrite ? "bg-white dark:bg-slate-800 text-orange-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ShieldAlert className="w-3.5 h-3.5" /> ASYNC WRITE
                        </button>
                    </div>
                </div>
            </div>

            {/* Simulation Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Visual Canvas */}
                <div className="lg:col-span-8 relative bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl min-h-[500px] flex flex-col items-center justify-between overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:40px_40px]" />

                    {/* CLIENT */}
                    <div className="w-full flex justify-center z-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className={cn(
                                "p-5 rounded-full bg-slate-100 dark:bg-slate-800 border-4 shadow-xl transition-all",
                                activeRequest?.step === "CLIENT" ? "border-orange-500 scale-110" : "border-white dark:border-slate-700"
                            )}>
                                <Users className="w-8 h-8 text-slate-600" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">CLIENTS</span>
                        </div>
                    </div>

                    {/* CACHE LAYER */}
                    <div className="w-full flex flex-col items-center gap-6 z-20 relative">
                        <div className="absolute left-0 right-0 h-px bg-slate-100 dark:bg-slate-800 top-[50%] -translate-y-[50%]" />
                        <div className={cn(
                            "flex gap-4 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-4 transition-all duration-300 relative",
                            activeRequest?.step === "CACHE" ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : "border-slate-200 dark:border-slate-800"
                        )}>
                            <div className="absolute -top-3 left-6 px-3 bg-indigo-600 rounded-lg text-white font-black text-[9px] py-1 shadow-lg flex items-center gap-2">
                                <Zap className="w-3 h-3" /> REDIS CACHE
                            </div>

                            {Array.from({ length: cacheSize }).map((_, i) => {
                                const entry = Array.from(cache.values())[i];
                                return (
                                    <motion.div
                                        key={i}
                                        layout
                                        className={cn(
                                            "w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                                            entry ? "bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-900/50 shadow-md" : "border-dashed border-slate-300 dark:border-slate-800"
                                        )}
                                    >
                                        {entry ? (
                                            <>
                                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] border-orange-200">{entry.key}</Badge>
                                                <div className="text-[8px] font-bold text-slate-400 truncate w-20 text-center">{entry.value}</div>
                                                <div className="flex items-center gap-1 mt-1 opacity-50">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    <span className="text-[7px] font-black">{Math.max(0, ttl - Math.floor((Date.now() - entry.createdAt) / 1000))}s</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-[8px] font-black text-slate-300">EMPTY SLOT</span>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* DATABASE LAYER */}
                    <div className="w-full flex justify-center z-20">
                        <div className={cn(
                            "flex flex-col items-center gap-3 p-8 bg-white dark:bg-slate-900 rounded-[2rem] border-4 transition-all",
                            activeRequest?.step === "DB" ? "border-orange-500 scale-105 shadow-2xl" : "border-slate-100 dark:border-slate-800"
                        )}>
                            <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl">
                                <Database className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PostgreSQL</span>
                                <div className="flex gap-2 mt-2">
                                    {["A", "B", "C", "D"].map(k => (
                                        <button
                                            key={k}
                                            onClick={() => handleWrite(k)}
                                            className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black hover:bg-orange-500 hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Request Animation Particle */}
                    <AnimatePresence>
                        {activeRequest && (
                            <motion.div
                                key={activeRequest.id}
                                layoutId={activeRequest.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    top: activeRequest.step === "CLIENT" ? "10%" : activeRequest.step === "CACHE" ? "40%" : activeRequest.step === "DB" ? "75%" : "10%",
                                    opacity: activeRequest.step === "DONE" ? 0 : 1,
                                    scale: 1
                                }}
                                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                className="absolute left-[50%] -translate-x-[50%] w-10 h-10 flex items-center justify-center z-50 pointer-events-none"
                            >
                                <div className="p-2 bg-orange-500 rounded-lg shadow-2xl border-2 border-white text-white font-black text-xs">
                                    {activeRequest.key}
                                </div>
                                <div className="absolute inset-0 bg-orange-500 rounded-lg animate-ping opacity-20" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Floating Result Badges */}
                    <AnimatePresence>
                        {requests.slice(0, 3).map((req, i) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, x: -20, y: 50 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={cn(
                                    "absolute left-10 p-3 rounded-xl border-2 font-black text-[9px] flex items-center gap-2 shadow-sm z-30",
                                    req.type === "HIT" ? "bg-emerald-50 border-emerald-500 text-emerald-700" :
                                        req.type === "MISS" ? "bg-orange-50 border-orange-500 text-orange-700" :
                                            "bg-red-50 border-red-500 text-red-700"

                                )}
                                style={{ top: `${150 + i * 50}px` }}
                            >
                                {req.type === "HIT" ? <CheckCircle2 className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                                {req.type}: KEY {req.key}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Dashboard & Metrics */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Key Search Panel */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Search className="w-3.5 h-3.5" /> Data Explorer
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                            {["A", "B", "C", "D", "E", "F", "G", "H"].map(k => (
                                <button
                                    key={k}
                                    onClick={() => handleRead(k)}
                                    disabled={activeRequest !== null}
                                    className={cn(
                                        "h-12 rounded-xl font-black text-sm transition-all border-2",
                                        activeRequest?.key === k ? "bg-orange-500 text-white border-orange-600 scale-95" : "bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300"
                                    )}
                                >
                                    {k}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">Click a key to simulate a client read request.</p>
                    </div>

                    {/* Configuration Panel */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Settings2 className="w-3.5 h-3.5" /> Cache Config
                        </h4>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400">CACHE SIZE (SLOTS)</span>
                                <Badge variant="outline">{cacheSize}</Badge>
                            </div>
                            <input
                                type="range" min="1" max="8" value={cacheSize}
                                onChange={(e) => setCacheSize(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400">DATA TTL (SECONDS)</span>
                                <Badge variant="outline">{ttl}s</Badge>
                            </div>
                            <input
                                type="range" min="5" max="120" value={ttl}
                                onChange={(e) => setTtl(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>

                        {!invalidateOnWrite && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed italic">
                                    DANGER: "Async Write" mode. Cache is NOT invalidated when DB updates. Try Updating 'A' and then Reading 'A'.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Live Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
                            <div className="flex items-center gap-2 opacity-50">
                                <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">HIT RATIO</span>
                            </div>
                            <div className="text-3xl font-black tabular-nums">{hitRate.toFixed(1)}%</div>
                        </div>
                        <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
                            <div className="flex items-center gap-2 opacity-50">
                                <Timer className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">AVG LATENCY</span>
                            </div>
                            <div className="text-3xl font-black tabular-nums">{avgLatency.toFixed(0)}ms</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Educational Insight */}
            <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-orange-500 rounded-3xl shrink-0 shadow-xl shadow-orange-500/20">
                    <Flame className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2 flex-1 relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">System Design Insight</h4>
                    <div className="text-sm font-medium leading-relaxed opacity-90 tracking-tight">
                        Caching leverages the <strong>temporal locality</strong> principle: data accessed once is likely to be accessed again soon.
                        By storing "hot" data in RAM, we bypass slow Disk I/O, reducing DB load by up to 90%. However,
                        caching introduces the <strong>Consistency Challenge</strong>: ensuring the cache doesn't serve "stale" (old) values after a DB update.
                    </div>
                </div>
            </div>
        </Card>
    );
}
