"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight,
    ArrowLeft,
    RotateCcw,
    Trash2,
    Database,
    Zap,
    Info,
    AlertCircle,
    CheckCircle2,
    Layers,
    XCircle,
    HelpCircle,
    Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Simulation 1: Traversal Freedom ---
function TraversalFreedomSim() {
    const [mode, setMode] = useState<"singly" | "doubly">("singly");
    const [currentIndex, setCurrentIndex] = useState(0);
    const nodes = ["CP 1", "CP 2", "CP 3", "CP 4"];

    const handleForward = () => {
        if (currentIndex < nodes.length - 1) setCurrentIndex(currentIndex + 1);
    };

    const handleBackward = () => {
        if (mode === "doubly" && currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Question it answers</p>
                    <h3 className="text-sm font-bold">“Why can’t I go backwards in a singly linked list?”</h3>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => { setMode("singly"); setCurrentIndex(0); }}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", mode === "singly" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500")}
                    >Singly</button>
                    <button
                        onClick={() => { setMode("doubly"); setCurrentIndex(0); }}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", mode === "doubly" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500")}
                    >Doubly</button>
                </div>
            </div>

            <div className="relative h-48 bg-slate-950 rounded-3xl border-2 border-slate-900 flex items-center justify-around px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" />

                {nodes.map((_, i) => (
                    <div key={i} className="relative flex items-center">
                        <motion.div
                            animate={{
                                scale: currentIndex === i ? 1.15 : 1,
                                borderColor: currentIndex === i ? "#6366f1" : "#1e293b",
                                backgroundColor: currentIndex === i ? "rgba(99, 102, 241, 0.1)" : "rgba(15, 23, 42, 1)"
                            }}
                            className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-bold text-slate-400 relative z-10"
                        >
                            {i + 1}
                            {currentIndex === i && <div className="absolute -bottom-8 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                        </motion.div>

                        {i < nodes.length - 1 && (
                            <div className="w-16 h-0.5 bg-slate-800 relative mx-1">
                                <ArrowRight className={cn("absolute top-1/2 -translate-y-1/2 -right-1 w-4 h-4", currentIndex >= i ? "text-indigo-500" : "text-slate-800")} />
                                {mode === "doubly" && (
                                    <ArrowLeft className={cn("absolute top-1/2 -translate-y-1/2 -left-1 w-4 h-4", currentIndex > i ? "text-indigo-500" : "text-slate-800")} />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                    <Button
                        variant="outline"
                        onClick={handleBackward}
                        disabled={mode === "singly" || currentIndex === 0}
                        className="w-full h-14 text-lg font-bold gap-2 border-2"
                    >
                        <ArrowLeft className="w-5 h-5" /> Move Backward
                    </Button>
                    {mode === "singly" && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-rose-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap">
                            No backward link exists.
                        </div>
                    )}
                </div>
                <Button
                    onClick={handleForward}
                    disabled={currentIndex === nodes.length - 1}
                    className="h-14 text-lg font-bold gap-2 bg-indigo-600 hover:bg-indigo-500 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
                >
                    Move Forward <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}

// --- Simulation 2: Deletion Reality ---
function DeletionRealitySim() {
    const [mode, setMode] = useState<"singly" | "doubly" | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDeleted, setIsDeleted] = useState(false);
    const targetIndex = 2; // "C"
    const nodes = ["A", "B", "C", "D"];

    const handleRestart = () => {
        setCurrentIndex(0);
        setIsDeleted(false);
    };

    const handleDelete = () => {
        if (mode === "doubly") {
            setIsDeleted(true);
        }
        // Singly handles delete differently (via specific button at predecessor)
    };

    const handleBypass = () => {
        setIsDeleted(true);
    };

    if (!mode) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-6 py-12">
                <h3 className="text-xl font-bold">Pick a structure to test deletion</h3>
                <div className="flex gap-4">
                    <Button onClick={() => setMode("singly")} className="h-24 w-40 flex-col gap-2 font-bold text-lg rounded-2xl border-b-4 border-indigo-800">
                        <ArrowRight className="w-8 h-8" /> Singly
                    </Button>
                    <Button onClick={() => setMode("doubly")} className="h-24 w-40 flex-col gap-2 font-bold text-lg rounded-2xl border-b-4 border-emerald-800 bg-emerald-600 hover:bg-emerald-500 text-white">
                        <ArrowLeft className="w-8 h-8" /> Doubly
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Question it answers</p>
                    <h3 className="text-sm font-bold">“Why do I need the previous node to delete in a singly list?”</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="text-xs">Switch Mode</Button>
            </div>

            <div className="relative h-40 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-900 flex items-center justify-around px-8">
                {nodes.map((val, i) => (
                    <motion.div
                        key={val}
                        layout
                        className={cn(
                            "w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-lg relative",
                            isDeleted && i === targetIndex ? "hidden" : "flex",
                            currentIndex === i ? "border-indigo-500 bg-indigo-500/10 text-indigo-600" : "border-slate-200 dark:border-slate-800",
                            i === targetIndex && "ring-2 ring-rose-500/30 text-rose-500"
                        )}
                    >
                        {val}
                        {i === targetIndex && !isDeleted && <Badge className="absolute -top-6 bg-rose-500 text-[8px]">TARGET</Badge>}
                        {i < nodes.length - 1 && (
                            <ArrowRight className={cn(
                                "absolute -right-10 w-4 h-4",
                                isDeleted && i === targetIndex - 1 ? "hidden" : "block",
                                (i === targetIndex - 1 && isDeleted) ? "text-transparent" : "text-slate-300 dark:text-slate-800"
                            )} />
                        )}
                        {/* The Bypass Link Animation */}
                        {i === targetIndex - 1 && isDeleted && (
                            <motion.div
                                initial={{ opacity: 0, pathLength: 0 }}
                                animate={{ opacity: 1, pathLength: 1 }}
                                className="absolute left-1/2 top-1/2 w-[110px] h-12 border-t-2 border-r-2 border-emerald-500 rounded-tr-3xl pointer-events-none translate-x-2 -translate-y-6"
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={handleRestart}
                        className="flex-1 h-12 gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Restart from Head
                    </Button>
                    <Button
                        onClick={() => currentIndex < nodes.length - 1 && setCurrentIndex(currentIndex + 1)}
                        disabled={currentIndex === nodes.length - 1}
                        className="flex-1 h-12 gap-2"
                    >
                        Forward <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="relative h-16">
                    {mode === "singly" ? (
                        currentIndex === targetIndex ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 h-full">
                                <Button disabled className="flex-1 h-full bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <XCircle className="w-4 h-4 mr-2" /> Delete Current
                                </Button>
                                <div className="flex-[0.5] flex items-center justify-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold gap-2">
                                    <HelpCircle className="w-4 h-4" /> Who points to this node?
                                </div>
                            </motion.div>
                        ) : currentIndex === targetIndex - 1 && !isDeleted ? (
                            <Button onClick={handleBypass} className="w-full h-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg animate-pulse">
                                ✅ Bypass & Delete Next Node
                            </Button>
                        ) : (
                            <Button disabled className="w-full h-full opacity-50 grayscale">
                                Delete Current
                            </Button>
                        )
                    ) : (
                        <Button
                            variant="destructive"
                            disabled={currentIndex !== targetIndex || isDeleted}
                            onClick={handleDelete}
                            className="w-full h-full text-lg font-bold gap-2"
                        >
                            <Trash2 className="w-5 h-5" /> Delete Current
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Simulation 3: Cost Tradeoff ---
function CostTradeoffSim() {
    const [actionId, setActionId] = useState(0);
    const [isActing, setIsActing] = useState(false);

    // Metrics for "Delete middle node"
    const metrics = {
        singly: { steps: 2, updates: 1, memory: 8 },
        doubly: { steps: 0, updates: 2, memory: 16 }
    };

    const runAction = () => {
        setIsActing(true);
        setTimeout(() => setIsActing(false), 2000);
        setActionId(prev => prev + 1);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Question it answers</p>
                    <h3 className="text-sm font-bold">“Why don’t we always use doubly linked lists?”</h3>
                </div>
                <Button onClick={runAction} disabled={isActing} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
                    <Zap className="w-4 h-4" /> Run Delete Test
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Singly Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-indigo-500 border-indigo-500/20">Singly</Badge>
                        <span className="text-xs font-bold text-slate-400">Lightweight but Limited</span>
                    </div>
                    <Card className="p-4 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-900 overflow-hidden relative">
                        <div className="flex items-center justify-around h-24">
                            {[1, 2, 3, 4].map((n, i) => (
                                <motion.div
                                    key={`s-${n}`}
                                    animate={isActing && i === 2 ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                                    className={cn("w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-sm", i === 2 && "border-rose-500/20 text-rose-500")}
                                >{n}</motion.div>
                            ))}
                        </div>
                        <AnimatePresence>
                            {isActing && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    className="absolute bottom-0 left-0 h-1 bg-indigo-500"
                                />
                            )}
                        </AnimatePresence>
                    </Card>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Steps</p>
                            <p className="text-xl font-bold">{metrics.singly.steps}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Updates</p>
                            <p className="text-xl font-bold">{metrics.singly.updates}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mem/Ptr</p>
                            <p className="text-xl font-bold">{metrics.singly.memory}B</p>
                        </div>
                    </div>
                </div>

                {/* Doubly Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">Doubly</Badge>
                        <span className="text-xs font-bold text-slate-400">Powerful but Heavy</span>
                    </div>
                    <Card className="p-4 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-900 overflow-hidden relative">
                        <div className="flex items-center justify-around h-24">
                            {[1, 2, 3, 4].map((n, i) => (
                                <motion.div
                                    key={`d-${n}`}
                                    animate={isActing && i === 2 ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                                    className={cn("w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-sm", i === 2 && "border-rose-500/20 text-rose-500")}
                                >{n}</motion.div>
                            ))}
                        </div>
                        <AnimatePresence>
                            {isActing && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    className="absolute bottom-0 left-0 h-1 bg-emerald-500"
                                />
                            )}
                        </AnimatePresence>
                    </Card>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Steps</p>
                            <p className="text-xl font-bold text-emerald-500">{metrics.doubly.steps}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Updates</p>
                            <p className="text-xl font-bold text-rose-500">{metrics.doubly.updates}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mem/Ptr</p>
                            <p className="text-xl font-bold text-rose-500">{metrics.doubly.memory}B</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-500 space-y-2">
                <p className="font-bold text-indigo-600 flex items-center gap-2 tracking-widest uppercase text-[10px]">
                    <CheckCircle2 className="w-3 h-3" /> Learning Outcome
                </p>
                <p>
                    <strong>Singly:</strong> Fewer pointers mean less memory, but operations like deletion from a middle node are much more complex.
                    <strong> Doubly:</strong> More memory and more pointer updates per operation, but any node can be deleted instantly without a search.
                </p>
            </div>
        </div>
    );
}

// --- Main Container ---
export function LinkedListTripleVisual() {
    const [activeTab, setActiveTab] = useState<"traversal" | "deletion" | "tradeoffs">("traversal");

    const tabs = [
        { id: "traversal", label: "Traversal Freedom", Icon: Maximize2 },
        { id: "deletion", label: "Deletion Reality", Icon: Trash2 },
        { id: "tradeoffs", label: "Cost Tradeoff", Icon: Database },
    ] as const;

    return (
        <Card className="p-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-500" />

            <div className="w-full">
                <div className="px-4 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Interactive Concepts</h2>
                    </div>

                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
                        {tabs.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                    activeTab === id
                                        ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                <Icon className="w-3 h-3" /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {activeTab === "traversal" && <TraversalFreedomSim />}
                    {activeTab === "deletion" && <DeletionRealitySim />}
                    {activeTab === "tradeoffs" && <CostTradeoffSim />}
                </div>
            </div>
        </Card>
    );
}
