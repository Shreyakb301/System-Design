"use client";

import { useState, useCallback } from "react";
import { InteractiveDiagram } from "./InteractiveDiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Search, ArrowRight, ArrowLeft, Plus, Play } from "lucide-react";

export function ArrayVisual() {
    const [array, setArray] = useState<number[]>([10, 20, 30, 40]);
    const [capacity, setCapacity] = useState(8);
    const [inputValue, setInputValue] = useState("");
    const [searchTarget, setSearchTarget] = useState("");
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const checkCapacity = (newSize: number) => {
        if (newSize > capacity) {
            setCapacity(capacity * 2);
        }
    };

    const push = () => {
        if (!inputValue) return;
        const val = parseInt(inputValue);
        checkCapacity(array.length + 1);
        setArray([...array, val]);
        setInputValue("");
    };

    const pop = () => {
        if (array.length === 0) return;
        setArray(array.slice(0, -1));
    };

    const unshift = () => {
        if (!inputValue) return;
        const val = parseInt(inputValue);
        checkCapacity(array.length + 1);
        setArray([val, ...array]);
        setInputValue("");
    };

    const shift = () => {
        if (array.length === 0) return;
        setArray(array.slice(1));
    };

    const removeAt = (index: number) => {
        setArray(array.filter((_, i) => i !== index));
    };

    const startSearch = async () => {
        if (!searchTarget) return;
        const target = parseInt(searchTarget);
        setIsSearching(true);

        for (let i = 0; i < array.length; i++) {
            setActiveSearchIndex(i);
            await new Promise((resolve) => setTimeout(resolve, 600));
            if (array[i] === target) break;
        }

        setIsSearching(false);
        setTimeout(() => setActiveSearchIndex(null), 1000);
    };

    return (
        <InteractiveDiagram>
            {() => (
                <div className="flex flex-col items-center gap-10 w-full p-4">
                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                        {/* Insertion/Deletion Controls */}
                        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Modifiers
                            </h3>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Value"
                                    className="flex-1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={unshift} className="gap-2">
                                    <ArrowLeft className="w-3 h-3" /> Unshift <span className="text-[10px] opacity-50 font-mono">O(n)</span>
                                </Button>
                                <Button size="sm" onClick={push} className="gap-2">
                                    Push <ArrowRight className="w-3 h-3" /> <span className="text-[10px] opacity-50 font-mono">O(1)</span>
                                </Button>
                                <Button variant="destructive" size="sm" onClick={shift} className="gap-2">
                                    <ArrowRight className="w-3 h-3 rotate-180" /> Shift <span className="text-[10px] opacity-50 font-mono">O(n)</span>
                                </Button>
                                <Button variant="destructive" size="sm" onClick={pop} className="gap-2">
                                    Pop <ArrowLeft className="w-3 h-3 rotate-180" /> <span className="text-[10px] opacity-50 font-mono">O(1)</span>
                                </Button>
                            </div>
                        </div>

                        {/* Search Controls */}
                        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Search className="w-4 h-4" /> Operations
                            </h3>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={searchTarget}
                                    onChange={(e) => setSearchTarget(e.target.value)}
                                    placeholder="Target"
                                    className="flex-1"
                                />
                                <Button variant="secondary" onClick={startSearch} disabled={isSearching}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                Linear Search: O(n) average/worst case.
                            </p>
                        </div>
                    </div>

                    {/* Array Visualization */}
                    <div className="relative w-full overflow-x-auto pb-12 pt-6 px-4">
                        <div className="flex gap-3 min-h-[100px] items-center justify-center min-w-max">
                            <AnimatePresence mode="popLayout">
                                {Array.from({ length: capacity }).map((_, index) => {
                                    const hasValue = index < array.length;
                                    const val = array[index];
                                    const isActive = activeSearchIndex === index;
                                    const isFound = isActive && !isSearching && val === parseInt(searchTarget);

                                    return (
                                        <motion.div
                                            key={index < array.length ? `val-${index}-${val}` : `empty-${index}`}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                borderColor: isFound ? "#22c55e" : (isActive ? "#3b82f6" : undefined),
                                                backgroundColor: isFound ? "rgba(34, 197, 94, 0.1)" : (isActive ? "rgba(59, 130, 246, 0.1)" : undefined)
                                            }}
                                            className={cn(
                                                "relative flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 transition-all duration-300",
                                                hasValue
                                                    ? "bg-white dark:bg-slate-950 border-primary/20 shadow-sm cursor-pointer hover:border-red-500/50 group"
                                                    : "bg-slate-100/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700 pointer-events-none"
                                            )}
                                            onClick={() => hasValue && removeAt(index)}
                                        >
                                            {hasValue && (
                                                <>
                                                    <span className={cn(
                                                        "text-xl font-bold transition-colors",
                                                        isFound ? "text-green-600" : (isActive ? "text-blue-600" : "")
                                                    )}>
                                                        {val}
                                                    </span>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500/10 rounded-xl transition-opacity">
                                                        <Trash2 className="w-5 h-5 text-red-500" />
                                                    </div>
                                                </>
                                            )}

                                            <span className="absolute -bottom-7 text-[10px] font-mono text-muted-foreground tabular-nums">
                                                [{index}]
                                            </span>

                                            {isActive && isSearching && (
                                                <motion.div
                                                    layoutId="search-pointer"
                                                    className="absolute -top-8 text-blue-500 anima-bounce"
                                                >
                                                    <ArrowRight className="w-5 h-5 rotate-90" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Capacity Info */}
                    <div className="w-full max-w-md space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Internal Capacity</span>
                            <span>{array.length} / {capacity}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${(array.length / capacity) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground italic">
                            Dynamic arrays often double capacity when full to maintain amortized O(1) insertions.
                        </p>
                    </div>
                </div>
            )}
        </InteractiveDiagram>
    );
}
