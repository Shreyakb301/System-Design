"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Trash2,
    Database,
    Zap,
    Network,
    ArrowRight,
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

type HashOperation = "insert" | "search" | "delete";

interface HashComputation {
    operation: HashOperation;
    key: string;
    sum: number;
    index: number | null;
    phase: "hashing" | "modulo" | "done";
    currentChar: string | null;
}

const BUCKET_SIZE = 8;

export function HashTableVisual() {
    const [strategy, setStrategy] = useState<"chaining" | "probing">("chaining");
    const [buckets, setBuckets] = useState<Bucket[]>(Array(BUCKET_SIZE).fill([]).map(() => []));
    const [inputKey, setInputKey] = useState("");
    const [status, setStatus] = useState("Ready for operations");
    const [isAnimating, setIsAnimating] = useState(false);
    const [activePath, setActivePath] = useState<number[]>([]);
    const [foundId, setFoundId] = useState<string | null>(null);
    const [hashComputation, setHashComputation] = useState<HashComputation | null>(null);

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
        setHashComputation(null);
    };

    const animateHash = async (key: string, operation: HashOperation) => {
        let currentSum = 0;
        for (let i = 0; i < key.length; i++) {
            currentSum += key.charCodeAt(i);
            setHashComputation({
                operation,
                key,
                sum: currentSum,
                index: null,
                phase: "hashing",
                currentChar: key[i]
            });
            await new Promise(r => setTimeout(r, 180));
        }
        const index = currentSum % BUCKET_SIZE;
        setHashComputation({
            operation,
            key,
            sum: currentSum,
            index,
            phase: "modulo",
            currentChar: null
        });
        setActivePath([index]);
        await new Promise(r => setTimeout(r, 500));
        setHashComputation({
            operation,
            key,
            sum: currentSum,
            index,
            phase: "done",
            currentChar: null
        });
        return index;
    };

    const handleInsert = async () => {
        if (!inputKey || isAnimating) return;
        setIsAnimating(true);
        setFoundId(null);
        setStatus(`Hashing "${inputKey}"...`);

        const index = await animateHash(inputKey, "insert");
        const { hash } = getHashInfo(inputKey);
        const newItem: HashItem = { key: inputKey, hash, index, id: Math.random().toString(36).substr(2, 9) };

        const newBuckets = [...buckets];
        const path: number[] = [index];

        if (strategy === "chaining") {
            setActivePath([index]);
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

        const index = await animateHash(inputKey, "search");
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
        setFoundId(null);

        const index = await animateHash(inputKey, "delete");
        const newBuckets = [...buckets];
        setActivePath([index]);

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
                    setActivePath([current]);
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
        <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:px-6 sm:py-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />

            {/* Header */}
            <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <p className="mt-1 text-xs italic text-muted-foreground">Visualizing key allocation & collision strategies.</p>
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="space-y-3">
                        <Input
                            placeholder="Enter key (e.g. Apple)"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            className="bg-slate-50 border-slate-200 dark:bg-slate-900 font-bold"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleInsert} disabled={isAnimating || !inputKey} className="h-10 min-w-[100px] flex-1 gap-2 bg-emerald-600 font-bold hover:bg-emerald-500">
                                <Plus className="w-4 h-4" /> Insert
                            </Button>
                            <Button onClick={handleSearch} disabled={isAnimating || !inputKey} variant="outline" className="h-10 min-w-[100px] flex-1 gap-2 border-2 font-bold">
                                <Search className="w-4 h-4" /> Search
                            </Button>
                            <Button onClick={handleDelete} disabled={isAnimating || !inputKey} variant="destructive" className="h-10 min-w-[100px] flex-1 gap-2 bg-rose-500 font-bold hover:bg-rose-400">
                                <Trash2 className="w-4 h-4" /> Del
                            </Button>
                        </div>
                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <span>Table Capacity: {BUCKET_SIZE}</span>
                                <span>Load Factor: {loadFactor}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-950">
                                <motion.div
                                    animate={{ width: `${parseFloat(loadFactor) * 100}%` }}
                                    className="h-full bg-orange-500 shadow-lg shadow-orange-500/40"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border-2 border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Hash Computation</div>
                            <p className="mt-1 text-[11px] text-slate-400">Key -&gt; hash() -&gt; % {BUCKET_SIZE} -&gt; bucket index</p>
                        </div>
                        {hashComputation ? (
                            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">
                                {hashComputation.operation}
                            </div>
                        ) : null}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={
                                hashComputation
                                    ? `${hashComputation.operation}-${hashComputation.phase}-${hashComputation.sum}-${hashComputation.index ?? "pending"}`
                                    : "idle"
                            }
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mt-3 space-y-3"
                        >
                            <div className="flex flex-wrap items-stretch gap-2">
                                <div className="min-w-[120px] flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Input Key</div>
                                    <div className="mt-1.5 text-base font-black text-white">
                                        {hashComputation?.key || inputKey || "Apple"}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center text-orange-400">
                                    <ArrowRight className="h-4 w-4" />
                                </div>

                                <div className="min-w-[140px] flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Hash</div>
                                    <div className="mt-1.5 truncate text-[13px] font-semibold text-slate-200">
                                        {`hash("${hashComputation?.key || inputKey || "Apple"}")`}
                                    </div>
                                    <div className="mt-1.5 text-xl font-black text-white">{hashComputation?.sum ?? "?"}</div>
                                </div>

                                <div className="flex items-center justify-center text-orange-400">
                                    <ArrowRight className="h-4 w-4" />
                                </div>

                                <div className="min-w-[130px] flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Bucket</div>
                                    <div className="mt-1.5 text-[13px] font-semibold text-slate-200">
                                        {hashComputation?.sum ?? "hash"} % {BUCKET_SIZE}
                                    </div>
                                    <div className="mt-1.5 text-xl font-black text-orange-300">{hashComputation?.index ?? "?"}</div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono text-[12px] leading-6 text-slate-200">
                                {`hash("${hashComputation?.key || inputKey || "Apple"}") = ${hashComputation?.sum ?? "?"}  ->  ${hashComputation?.sum ?? "hash"} % ${BUCKET_SIZE} = ${hashComputation?.index ?? "?"}`}
                            </div>

                            {hashComputation?.currentChar ? (
                                <div className="text-[10px] text-orange-300">
                                    Reading: <span className="font-mono">{`"${hashComputation.currentChar}"`}</span>
                                </div>
                            ) : null}

                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <ArrowRight className="h-3.5 w-3.5 text-orange-400" />
                                <span>
                                    {hashComputation
                                        ? `Bucket ${hashComputation.index ?? "?"} is highlighted in the table.`
                                        : "Insert, search, or delete a key to see how hashing maps it to a bucket."}
                                </span>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-4">
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-8">
                        {buckets.map((bucket, i) => (
                            <div key={i}>
                                <div className={cn(
                                    "relative overflow-hidden rounded-2xl border-2 p-2 transition-all",
                                    activePath.includes(i) ? "border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
                                )}>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400">INDEX {i}</span>
                                        {bucket.length > 0 && (
                                            <Badge
                                                className={cn(
                                                    "h-4 border-none px-1.5 text-[8px]",
                                                    strategy === "chaining" && bucket.length > 1
                                                        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                                )}
                                            >
                                                {bucket.length}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="relative min-h-[2.35rem] space-y-1">
                                        {bucket.length === 0 ? (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                                <Database className="h-5 w-5" />
                                            </div>
                                        ) : (
                                            <AnimatePresence>
                                                {strategy === "chaining" ? (
                                                    bucket.map((item) => (
                                                        <motion.div
                                                            key={item.id}
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className={cn(
                                                                "flex items-center justify-between rounded-lg border p-1.5 text-[10px] font-bold",
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
                                                            "flex h-full flex-col justify-center rounded-lg border p-1.5 text-center text-[10px] font-bold",
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
                            </div>
                        ))}
                </div>
            </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-900 dark:text-white">System Monitor</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed">
                    Status: <span className="font-mono text-orange-500 dark:text-orange-400">{status}</span>
                </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-6 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {strategy === "chaining"
                    ? "Separate chaining keeps collided keys in one bucket. It is easy to reason about, but one overloaded bucket can make lookup feel closer to a short list scan."
                    : "Linear probing keeps everything inside the array. It saves pointer overhead, but nearby occupied buckets create clusters that slow future searches."}
            </div>
        </div>
        </section>
    );
}
