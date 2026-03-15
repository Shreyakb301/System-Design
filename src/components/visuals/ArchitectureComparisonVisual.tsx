"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Box,
    Layers,
    Zap,
    AlertCircle,
    RotateCcw,
    CheckCircle2,
    ShieldAlert,
    Rocket,
    Activity,
    Server,
    Database,
    Lock,
    Users,
    Network,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type ArchitectureMode = "monolith" | "microservices";
type SystemStatus = "healthy" | "failure" | "spike" | "deploying";

interface RequestDot {
    id: string;
    path: number; // For microservices: 0=Auth, 1=User, 2=Order, 3=Payment
}

const SERVICES = [
    { name: "Auth", icon: Lock, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-500/10" },
    { name: "User", icon: Users, color: "text-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-500/10" },
    { name: "Order", icon: Box, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-500/10" },
    { name: "Payment", icon: Zap, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-500/10" }
];

export function ArchitectureComparisonVisual() {
    const [mode, setMode] = useState<ArchitectureMode>("monolith");
    const [status, setStatus] = useState<SystemStatus>("healthy");
    const [failedServiceIdx, setFailedServiceIdx] = useState<number | null>(null);
    const [requests, setRequests] = useState<RequestDot[]>([]);

    // --- Traffic Logic ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (status === "deploying" && mode === "monolith") return;

            const newReqs: RequestDot[] = [];
            const count = status === "spike" ? 8 : 2;

            for (let i = 0; i < count; i++) {
                newReqs.push({
                    id: Math.random().toString(36).substr(2, 9),
                    path: Math.floor(Math.random() * 4)
                });
            }

            setRequests(prev => [...prev.slice(-20), ...newReqs]);
        }, 800);

        return () => clearInterval(interval);
    }, [status, mode]);

    const handleSpike = () => {
        setStatus("spike");
        setTimeout(() => setStatus("healthy"), 5000);
    };

    const handleFailure = () => {
        setStatus("failure");
        if (mode === "microservices") {
            setFailedServiceIdx(Math.floor(Math.random() * 4));
        }
    };

    const handleDeploy = () => {
        setStatus("deploying");
        setTimeout(() => setStatus("healthy"), 4000);
    };

    const reset = () => {
        setStatus("healthy");
        setFailedServiceIdx(null);
        setRequests([]);
    };

    // --- Components ---

    const ServiceBlock = ({ idx, name, icon: Icon, color, bgColor, isMonolith }: any) => {
        const isFailed = mode === "monolith" ? status === "failure" : failedServiceIdx === idx;
        const isDeploying = status === "deploying" && (mode === "monolith" || idx === 2); // Pretend we are updating 'Order' service

        return (
            <motion.div
                layout
                className={cn(
                    "relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all duration-500",
                    isFailed ? "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]" :
                        isDeploying ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-600 animate-pulse" :
                            "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm",
                    isMonolith ? "w-full border-none shadow-none bg-transparent" : "w-32 h-32"
                )}
            >
                <Icon className={cn("w-8 h-8", !isFailed && !isDeploying && color)} />
                <span className="text-xs font-black uppercase tracking-widest">{name}</span>

                {isFailed && (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg"
                    >
                        <AlertCircle className="w-3 h-3" />
                    </motion.div>
                )}
                {isDeploying && (
                    <motion.div
                        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg"
                    >
                        <RotateCcw className="w-3 h-3" />
                    </motion.div>
                )}
            </motion.div>
        );
    };

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl overflow-hidden flex flex-col gap-10">
            {/* Header & Mode Switch */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 font-semibold tracking-tight">Compare scalability, resilience, and delivery trade-offs.</p>
                </div>

                <div className="flex p-1.5 bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
                    <button
                        onClick={() => { setMode("monolith"); reset(); }}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-black transition-all",
                            mode === "monolith" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        MONOLITH
                    </button>
                    <button
                        onClick={() => { setMode("microservices"); reset(); }}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-black transition-all",
                            mode === "microservices" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        MICROSERVICES
                    </button>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-12 bg-white dark:bg-slate-900/50 p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl min-h-[500px] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:40px_40px]" />

                {/* Traffic Lane */}
                <div className="relative flex flex-col items-center justify-center gap-4">
                    <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl z-20">
                        <Users className="w-10 h-10 text-slate-600 dark:text-slate-300" />
                    </div>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Traffic</span>

                    {/* Floating Requests */}
                    <AnimatePresence>
                        {requests.map((req) => (
                            <motion.div
                                key={req.id}
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: mode === "monolith" ? 250 : 250, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: "linear" }}
                                onAnimationComplete={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
                                className="absolute left-[50%] w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10"
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Architecture View */}
                <div className="lg:col-span-3 flex items-center justify-center pr-10">
                    <AnimatePresence mode="wait">
                        {mode === "monolith" ? (
                            <motion.div
                                key="monolith"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={cn(
                                    "w-full max-w-2xl aspect-video rounded-[3rem] border-4 p-8 flex flex-col gap-6 transition-all duration-500",
                                    status === "failure" ? "bg-red-50 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]" :
                                        status === "deploying" ? "bg-indigo-50 border-indigo-500 animate-pulse" :
                                            "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl"
                                )}
                            >
                                <div className="flex justify-between items-center px-4">
                                    <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Server className="w-4 h-4" /> Comprehensive Binary
                                    </h3>
                                    <Badge variant="outline" className={cn(
                                        "px-4 py-1 font-black shadow-sm",
                                        status === "failure" ? "bg-red-600 text-white border-red-700" : "bg-emerald-600 text-white border-emerald-700"
                                    )}>
                                        {status === "failure" ? "SYSTEM DOWN" : "ONLINE"}
                                    </Badge>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    {SERVICES.map((s, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                            <s.icon className={cn("w-6 h-6", (status === "failure" || status === "deploying") ? "text-slate-400" : s.color)} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-2">{s.name} Module</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-600 italic">
                                    All modules share memory, CPU, and DB connections.
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="microservices"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-wrap items-center justify-center gap-8 w-full"
                            >
                                {SERVICES.map((s, i) => (
                                    <ServiceBlock key={i} idx={i} {...s} />
                                ))}
                                {/* Visualization of inter-service comms */}
                                <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                                    {status === "healthy" && (
                                        <svg className="w-full h-full">
                                            <path d="M 400 300 Q 500 100 600 300" stroke="currentColor" fill="none" className="text-indigo-500" strokeWidth="2" strokeDasharray="5,5" />
                                            <path d="M 600 300 Q 700 500 800 300" stroke="currentColor" fill="none" className="text-indigo-500" strokeWidth="2" strokeDasharray="5,5" />
                                        </svg>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Status Overlays */}
                <AnimatePresence>
                    {status === "spike" && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-amber-500/5 pointer-events-none z-50 flex items-center justify-center"
                        >
                            <motion.div
                                animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 1 }}
                                className="bg-amber-600 text-white px-8 py-4 rounded-full font-black text-2xl shadow-3xl border-4 border-amber-400 flex items-center gap-4"
                            >
                                <Zap className="w-10 h-10 fill-white" /> EXTREME TRAFFIC SPIKE
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Interaction Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Flash Sale", desc: "Test load spike", icon: Zap, action: handleSpike, color: "bg-amber-500", healthEffect: status === "spike" },
                    { label: "Inject Failure", desc: "Break a module", icon: ShieldAlert, action: handleFailure, color: "bg-red-500", healthEffect: status === "failure" },
                    { label: "Deploy Update", desc: "Rollout v2.0", icon: Rocket, action: handleDeploy, color: "bg-indigo-600", healthEffect: status === "deploying" },
                    { label: "Full Reset", desc: "Restore health", icon: RotateCcw, action: reset, color: "bg-slate-700", healthEffect: false },
                ].map((btn, i) => (
                    <button
                        key={i}
                        onClick={btn.action}
                        disabled={status !== "healthy" && btn.label !== "Full Reset"}
                        className={cn(
                            "group p-6 rounded-[2rem] border-2 transition-all duration-300 text-left relative overflow-hidden",
                            btn.healthEffect ? "border-transparent text-white ring-4 ring-offset-4 ring-offset-white dark:ring-offset-slate-950" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:shadow-xl",
                            btn.healthEffect && btn.color
                        )}
                    >
                        <div className={cn("p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform", btn.healthEffect ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800")}>
                            <btn.icon className={cn("w-6 h-6", btn.healthEffect ? "text-white" : "text-indigo-600")} />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest">{btn.label}</h4>
                        <p className={cn("text-[10px] mt-1 font-bold", btn.healthEffect ? "text-white/80" : "text-slate-400")}>{btn.desc}</p>

                        {btn.healthEffect && (
                            <motion.div
                                layoutId="glow"
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Educational Insights */}
            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row gap-8 items-center">
                <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/30">
                    <Activity className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-3 flex-1">
                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">Architectural Trade-offs</h4>
                    <div className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                        {mode === "monolith" ? (
                            <p>
                                <strong>The Monolith</strong> is powerful but risky. One module's memory leak or crash can bring down the entire binary.
                                Notice how <strong>deployments</strong> require restarting the whole system, causing downtime for all features.
                            </p>
                        ) : (
                            <p>
                                <strong>Microservices</strong> provide fault isolation. If the "Order" service fails, users can still "Authenticate" or browse "Profiles".
                                <strong>Deployments</strong> are targeted and cause no system-wide impact, though network complexity increases.
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-4">
                    <Badge variant="secondary" className="bg-white/50 dark:bg-slate-800 px-4 py-2 font-black text-[10px] border border-indigo-200 dark:border-indigo-900">
                        {mode === "monolith" ? "LOW COMPLEXITY" : "HIGH RESILIENCE"}
                    </Badge>
                </div>
            </div>
        </Card>
    );
}
