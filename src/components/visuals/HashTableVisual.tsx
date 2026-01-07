"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Trash2,
    RefreshCw,
    Database,
    Zap,
    Info,
    AlertCircle,
    CheckCircle2,
    Network,
    ArrowRight,
    ArrowDown,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface HashItem {
    key: string;
    hash: number;
    index: number;
    id: string;
}

type Bucket = HashItem[];

const BUCKET_SIZE = 8;

export function HashTableVisual() {
    const [strategy, setStrategy] = useState<"chaining" | "probing">("chaining");
    const [buckets, setBuckets] = useState<Bucket[]>(Array(BUCKET_SIZE).fill([]).map(() => []));
    const [inputKey, setInputKey] = useState("");
    const [status, setStatus] = useState("Ready for operations");
    const [isAnimating, setIsAnimating] = useState(false);
    const [activePath, setActivePath] = useState<number[]>([]);
    const [foundId, setFoundId] = useState<string | null>(null);
    const [hashProcess, setHashProcess] = useState<{ char: string, sum: number } | null>(null);

    // Simple Hash Function: Sum of ASCII % BUCKET_SIZE
    const getHashInfo = (key: string) => {
        let sum = 0;
        for (let i = 0; i < key.length; i++) {
            sum += key.charCodeAt(i);
        }
        return { hash: sum, index: sum % BUCKET_SIZE };
    };

    const reset = () => {
        setBuckets(Array(BUCKET_SIZE).fill([]).map(() => []));
        setStatus("Ready for operations");
        setActivePath([]);
        setFoundId(null);
        setHashProcess(null);
    };

    const animateHash = async (key: string) => {
        let currentSum = 0;
        for (let i = 0; i < key.length; i++) {
            currentSum += key.charCodeAt(i);
            setHashProcess({ char: key[i], sum: currentSum });
            await new Promise(r => setTimeout(r, 200));
        }
        await new Promise(r => setTimeout(r, 400));
        setHashProcess(null);
        return currentSum % BUCKET_SIZE;
    };

    const handleInsert = async () => {
        if (!inputKey || isAnimating) return;
        setIsAnimating(true);
        setStatus(`Hashing "${inputKey}"...`);

        const index = await animateHash(inputKey);
        const { hash } = getHashInfo(inputKey);
        const newItem: HashItem = { key: inputKey, hash, index, id: Math.random().toString(36).substr(2, 9) };

        const newBuckets = [...buckets];
        const path: number[] = [index];

        if (strategy === "chaining") {
            if (newBuckets[index].length > 0) {
                setStatus(`Collision at index ${index}! Adding to chain.`);
            } else {
                setStatus(`Inserted at index ${index}.`);
            }
            newBuckets[index] = [...newBuckets[index], newItem];
        } else {
            // Linear Probing
            let current = index;
            let probes = 0;
            while (newBuckets[current].length > 0 && probes < BUCKET_SIZE) {
                current = (current + 1) % BUCKET_SIZE;
                path.push(current);
                probes++;
                setActivePath([...path]);
                setStatus(`Collision at ${path[path.length - 2]}. Probing index ${current}...`);
                await new Promise(r => setTimeout(r, 600));
            }

            if (probes < BUCKET_SIZE) {
                newBuckets[current] = [newItem];
                setStatus(`Inserted at index ${current} after ${probes} probes.`);
            } else {
                setStatus("Table Full! Linear probing failed.");
            }
        }

        setBuckets(newBuckets);
        setInputKey("");
        setTimeout(() => {
            setIsAnimating(false);
            setActivePath([]);
        }, 1000);
    };

    const handleSearch = async () => {
        if (!inputKey || isAnimating) return;
        setIsAnimating(true);
        setFoundId(null);

        const index = await animateHash(inputKey);
        const path: number[] = [index];
        setActivePath([index]);

        if (strategy === "chaining") {
            const bucket = buckets[index];
            const item = bucket.find(i => i.key === inputKey);
            if (item) {
                setFoundId(item.id);
                setStatus(`Found "${inputKey}" in chain at index ${index}!`);
            } else {
                setStatus(`Key "${inputKey}" not found.`);
            }
        } else {
            let current = index;
            let probes = 0;
            let found = false;

            while (probes < BUCKET_SIZE) {
                const item = buckets[current][0];
                if (item && item.key === inputKey) {
                    setFoundId(item.id);
                    setStatus(`Found "${inputKey}" at index ${current}!`);
                    found = true;
                    break;
                }
                if (!item) break; // Optimization: stop if we hit an empty slot

                current = (current + 1) % BUCKET_SIZE;
                path.push(current);
                setActivePath([...path]);
                probes++;
                await new Promise(r => setTimeout(r, 600));
            }

            if (!found) setStatus(`Key "${inputKey}" not found.`);
        }

        setTimeout(() => {
            setIsAnimating(false);
            setActivePath([]);
        }, 2000);
    };

    const handleDelete = async () => {
        if (!inputKey || isAnimating) return;
        setIsAnimating(true);

        const index = await animateHash(inputKey);
        const newBuckets = [...buckets];

        if (strategy === "chaining") {
            const originalLen = newBuckets[index].length;
            newBuckets[index] = newBuckets[index].filter(i => i.key !== inputKey);
            if (newBuckets[index].length < originalLen) {
                setStatus(`Deleted "${inputKey}" from index ${index}.`);
            } else {
                setStatus(`Key "${inputKey}" not found.`);
            }
        } else {
            // Simple deletion for linear probing (in reality needs tombstones)
            let current = index;
            let probes = 0;
            let deleted = false;
            while (probes < BUCKET_SIZE) {
                if (newBuckets[current][0]?.key === inputKey) {
                    newBuckets[current] = [];
                    setStatus(`Deleted "${inputKey}" from index ${current}.`);
                    deleted = true;
                    break;
                }
                current = (current + 1) % BUCKET_SIZE;
                probes++;
            }
            if (!deleted) setStatus(`Key "${inputKey}" not found.`);
        }

        setBuckets(newBuckets);
        setInputKey("");
        setTimeout(() => setIsAnimating(false), 1000);
    };

    const loadFactor = useMemo(() => {
        const occupied = buckets.filter(b => b.length > 0).length;
        return (occupied / BUCKET_SIZE).toFixed(2);
    }, [buckets]);

    return (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />

            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Hash Table Explorer</h2>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Visualizing key allocation & collision strategies.</p>
                </div>

                <div className="flex bg-white dark:bg-slate-950 p-1.5 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => { setStrategy("chaining"); reset(); }}
                        className={cn(
                            "px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2",
                            strategy === "chaining" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Network className="w-3 h-3" /> Chaining
                    </button>
                    <button
                        onClick={() => { setStrategy("probing"); reset(); }}
                        className={cn(
                            "px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2",
                            strategy === "probing" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <ArrowRight className="w-3 h-3" /> Linear Probing
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Input & Hash Machine */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Input
                            placeholder="Enter key (e.g. Apple)"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            className="bg-slate-50 border-slate-200 dark:bg-slate-900 font-bold"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleInsert} disabled={isAnimating || !inputKey} className="flex-1 min-w-[100px] bg-emerald-600 hover:bg-emerald-500 h-10 gap-2 font-bold">
                                <Plus className="w-4 h-4" /> Insert
                            </Button>
                            <Button onClick={handleSearch} disabled={isAnimating || !inputKey} variant="outline" className="flex-1 min-w-[100px] h-10 gap-2 font-bold border-2">
                                <Search className="w-4 h-4" /> Search
                            </Button>
                            <Button onClick={handleDelete} disabled={isAnimating || !inputKey} variant="destructive" className="flex-1 min-w-[100px] h-10 gap-2 font-bold bg-rose-500 hover:bg-rose-400">
                                <Trash2 className="w-4 h-4" /> Del
                            </Button>
                        </div>
                    </div>

                    {/* Hash Machine View */}
                    <div className="relative h-48 rounded-3xl bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]" />

                        <AnimatePresence mode="wait">
                            {hashProcess ? (
                                <motion.div
                                    key="process"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.2, opacity: 0 }}
                                    className="text-center space-y-3"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xl font-black shadow-2xl shadow-orange-500/40">
                                        {hashProcess.char}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ASCII Sum</div>
                                    <div className="text-3xl font-black text-white">{hashProcess.sum}</div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    className="text-center space-y-2 opacity-40"
                                >
                                    <RefreshCw className="w-10 h-10 text-slate-500 mx-auto animate-spin-slow" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hash Machine Idle</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Table Capacity: {BUCKET_SIZE}</span>
                            <span>Load Factor: {loadFactor}</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${parseFloat(loadFactor) * 100}%` }}
                                className="h-full bg-orange-500 shadow-lg shadow-orange-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Bucket Grid */}
                <div className="lg:col-span-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {buckets.map((bucket, i) => (
                            <div key={i} className="space-y-3">
                                <div className={cn(
                                    "p-3 rounded-2xl border-2 transition-all relative overflow-hidden",
                                    activePath.includes(i) ? "border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
                                )}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-400">INDEX {i}</span>
                                        {bucket.length > 0 && <Badge className="text-[8px] h-4 bg-slate-100 dark:bg-slate-800 text-slate-500 border-none">{bucket.length}</Badge>}
                                    </div>

                                    <div className="min-h-[4rem] space-y-2 relative">
                                        {bucket.length === 0 ? (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                                <Database className="w-8 h-8" />
                                            </div>
                                        ) : (
                                            <AnimatePresence>
                                                {strategy === "chaining" ? (
                                                    bucket.map((item, idx) => (
                                                        <motion.div
                                                            key={item.id}
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className={cn(
                                                                "p-2 rounded-lg text-xs font-bold border flex items-center justify-between",
                                                                foundId === item.id ? "bg-emerald-500 border-emerald-400 text-white" : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                                                            )}
                                                        >
                                                            <span className="truncate">{item.key}</span>
                                                            <span className="text-[8px] opacity-40 font-mono">#{item.hash}</span>
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className={cn(
                                                            "p-2 rounded-lg text-xs font-bold border h-full flex flex-col justify-center text-center",
                                                            foundId === bucket[0]?.id ? "bg-emerald-500 border-emerald-400 text-white shadow-lg" : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                                                        )}
                                                    >
                                                        <div className="truncate mb-1">{bucket[0].key}</div>
                                                        <div className="text-[8px] opacity-40 font-mono">Hash: {bucket[0].hash}</div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                </div>
                                {strategy === "chaining" && bucket.length > 1 && (
                                    <div className="px-3 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/10 flex items-center justify-between">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                                        </div>
                                        <span className="text-[8px] font-bold text-orange-600 uppercase tracking-tighter">Chain Collision</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-5 rounded-3xl bg-slate-950 border-2 border-slate-900 text-slate-400 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Info className="w-24 h-24 rotate-12" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-orange-500" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">System Monitor</h3>
                        </div>
                        <p className="text-xs leading-relaxed mb-4">
                            Status: <span className="text-orange-400 font-mono">{status}</span>
                        </p>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono leading-relaxed italic">
                            {strategy === "chaining"
                                ? "Insight: Separate chaining maintains an array of linked lists. It handles collisions gracefully but can lead to a 'thick' table where search becomes O(N) if one bucket gets too many items."
                                : "Insight: Linear probing finds the first available empty slot. This is memory-efficient but causes 'clustering'—packets of filled slots that significantly slow down both inserts and searches."}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
