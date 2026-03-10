"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    Activity,
    Server,
    Zap,
    Scale,
    Target,
    Filter,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReqCategory = "unassigned" | "functional" | "non-functional" | "out-of-scope";

interface Requirement {
    id: string;
    text: string;
    type: "functional" | "non-functional" | "out-of-scope"; // The correct answer
    currentStatus: ReqCategory;
}

const INITIAL_REQS: Requirement[] = [
    { id: "r1", text: "Users can upload photos", type: "functional", currentStatus: "unassigned" },
    { id: "r2", text: "System must support 5M DAU", type: "non-functional", currentStatus: "unassigned" },
    { id: "r3", text: "Users can follow others", type: "functional", currentStatus: "unassigned" },
    { id: "r4", text: "Video streaming processing", type: "out-of-scope", currentStatus: "unassigned" },
    { id: "r5", text: "End-to-end latency < 200ms", type: "non-functional", currentStatus: "unassigned" },
    { id: "r6", text: "Highly available (99.99%)", type: "non-functional", currentStatus: "unassigned" },
    { id: "r7", text: "Push notifications for likes", type: "functional", currentStatus: "unassigned" },
    { id: "r8", text: "Live audio chat rooms", type: "out-of-scope", currentStatus: "unassigned" },
];

export function RequirementsVisual() {
    const [reqs, setReqs] = useState<Requirement[]>(INITIAL_REQS);
    const [readWriteRatio, setReadWriteRatio] = useState(80); // 80% reads, 20% writes

    const handleAssign = (id: string, newStatus: ReqCategory) => {
        setReqs(prev => prev.map(r => r.id === id ? { ...r, currentStatus: newStatus } : r));
    };

    const groupedReqs = {
        unassigned: reqs.filter(r => r.currentStatus === "unassigned"),
        functional: reqs.filter(r => r.currentStatus === "functional"),
        "non-functional": reqs.filter(r => r.currentStatus === "non-functional"),
        "out-of-scope": reqs.filter(r => r.currentStatus === "out-of-scope"),
    };

    const score = reqs.filter(r => r.currentStatus !== "unassigned" && r.currentStatus === r.type).length;
    const completed = reqs.filter(r => r.currentStatus !== "unassigned").length;

    const readPercentage = readWriteRatio;
    const writePercentage = 100 - readWriteRatio;

    return (
        <Card className="p-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                            Requirements Clarification
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Categorize requirements and define read/write ratios to shape your architecture.</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={cn(
                        "px-4 py-1.5 font-bold flex gap-2 items-center text-sm shadow-sm transition-colors duration-500",
                        score === INITIAL_REQS.length ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                        <Target className="w-4 h-4" />
                        ACCURACY: {completed === 0 ? "N/A" : Math.round((score / completed) * 100)}%
                    </Badge>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {completed}/{INITIAL_REQS.length} CATEGORIZED
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Requirements Inbox */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4" /> Unsorted Insights
                    </h3>
                    <div className="space-y-3 min-h-[300px] p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <AnimatePresence>
                            {groupedReqs.unassigned.length === 0 && (
                                <motion.p 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                                    className="text-center text-muted-foreground text-sm py-10"
                                >
                                    All requirements sorted!
                                </motion.p>
                            )}
                            {groupedReqs.unassigned.map(req => (
                                <motion.div
                                    key={req.id}
                                    layoutId={req.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors"
                                >
                                    <p className="text-sm font-medium mb-3">{req.text}</p>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAssign(req.id, "functional")} className="flex-1 text-[10px] py-1 bg-blue-50 text-blue-600 rounded-md font-bold hover:bg-blue-100">FUNC</button>
                                        <button onClick={() => handleAssign(req.id, "non-functional")} className="flex-1 text-[10px] py-1 bg-amber-50 text-amber-600 rounded-md font-bold hover:bg-amber-100">NON-FUNC</button>
                                        <button onClick={() => handleAssign(req.id, "out-of-scope")} className="flex-1 text-[10px] py-1 bg-red-50 text-red-600 rounded-md font-bold hover:bg-red-100">SKIP</button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Categorization Buckets */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: "functional" as ReqCategory, title: "Functional", bgClass: "bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900", titleClass: "text-blue-600 dark:text-blue-400", desc: "What the system does (Features)" },
                        { id: "non-functional" as ReqCategory, title: "Non-Functional", bgClass: "bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900", titleClass: "text-amber-600 dark:text-amber-400", desc: "How well it does it (Constraints)" },
                        { id: "out-of-scope" as ReqCategory, title: "Out of Scope", bgClass: "bg-slate-50/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900", titleClass: "text-slate-600 dark:text-slate-400", desc: "What we ignore to save time" },
                    ].map(bucket => (
                        <div key={bucket.id} className={cn("min-h-[300px] p-4 rounded-2xl border-2 shadow-inner flex flex-col", bucket.bgClass)}>
                            <h3 className={cn("text-base font-bold mb-1", bucket.titleClass)}>{bucket.title}</h3>
                            <p className="text-[10px] text-slate-500 mb-4">{bucket.desc}</p>
                            
                            <div className="flex-1 space-y-2">
                                <AnimatePresence>
                                    {groupedReqs[bucket.id].map(req => {
                                        const isCorrect = req.type === bucket.id;
                                        return (
                                            <motion.div
                                                key={req.id}
                                                layoutId={req.id}
                                                className={cn(
                                                    "p-3 rounded-xl border shadow-sm relative group cursor-pointer transition-all",
                                                    isCorrect ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                                )}
                                                onClick={() => handleAssign(req.id, "unassigned")}
                                            >
                                                <p className={cn("text-xs font-medium pr-6", !isCorrect && "text-red-700 dark:text-red-400")}>{req.text}</p>
                                                {isCorrect ? (
                                                    <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="absolute top-1 right-1 text-[8px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-sm">X</div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Read/Write Ratio Visualizer */}
            <div className="space-y-5 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner mt-4 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-indigo-500" />
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Read / Write Ratio</h3>
                            <p className="text-[11px] text-muted-foreground">Adjust ratio to see architectural implications.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center pt-4">
                    <div className="w-full md:w-1/2 space-y-6">
                        <input
                            type="range" min="10" max="90" step="10"
                            value={readWriteRatio} onChange={(e) => setReadWriteRatio(Number(e.target.value))}
                            className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between items-center text-sm font-black">
                            <span className="text-emerald-600 flex items-center gap-1"><ArrowRight className="w-4 h-4" /> {readPercentage}% Reads</span>
                            <span className="text-amber-600 flex items-center gap-1">{writePercentage}% Writes <ArrowRight className="w-4 h-4" /></span>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative">
                        <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-3 tracking-widest">Recommended Architecture</h4>
                        <div className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            {readWriteRatio >= 70 ? (
                                <p>System is <strong>Read-Heavy</strong>. Prioritize adding <strong>Distributed Caches</strong> (Redis/Memcached) and <strong>CDNs</strong>. Read replicas for databases will be essential to handle the query load.</p>
                            ) : readWriteRatio <= 40 ? (
                                <p>System is <strong>Write-Heavy</strong>. Focus on <strong>Message Queues</strong> (Kafka/RabbitMQ) for asynchronous processing, and consider <strong>Sharding</strong> your databases to distribute the write load.</p>
                            ) : (
                                <p>System has a <strong>Balanced Load</strong>. You'll need a healthy mix of caching for hot data and optimized database indices for moderate write volumes.</p>
                            )}
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                            {readWriteRatio >= 60 && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0"><Zap className="w-3 h-3 mr-1"/> High Caching</Badge>}
                            {readWriteRatio <= 50 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0"><Activity className="w-3 h-3 mr-1"/> Queues Required</Badge>}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
