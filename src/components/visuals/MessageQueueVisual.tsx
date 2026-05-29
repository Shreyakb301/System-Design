"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Send,
    Inbox,
    Users,
    ArrowRight,
    Play,
    Pause,
    RefreshCw,
    RotateCcw,
    Info,
    Plus,
    Minus,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QueueType = "fifo" | "priority" | "delayed";

interface Message {
    id: string;
    content: string;
    priority?: number;
    delay?: number;
    timestamp: number;
    status: "queued" | "processing";
    consumerId?: string;
}

interface Consumer {
    id: string;
    name: string;
    processingMessage?: string;
    processedCount: number;
}

export function MessageQueueVisual() {
    const [queueType, setQueueType] = useState<QueueType>("fifo");
    const [queue, setQueue] = useState<Message[]>([]);
    const [consumers, setConsumers] = useState<Consumer[]>([
        { id: "c1", name: "C1", processedCount: 0 },
        { id: "c2", name: "C2", processedCount: 0 },
    ]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);
    const [producerRate, setProducerRate] = useState(1000);
    const [startedAt] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());
    const sessionRef = useRef(0);

    const generateMessage = useCallback(() => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const content = `T-${Math.random().toString(36).substr(2, 4)}`;
        const message: Message = { id, content, timestamp: Date.now(), status: "queued" };
        if (queueType === "priority") message.priority = Math.floor(Math.random() * 5) + 1;
        else if (queueType === "delayed") message.delay = Math.floor(Math.random() * 4) + 1;
        setQueue(prev => {
            const next = [...prev, message];
            if (queueType === "priority") return next.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            return next;
        });
    }, [queueType]);

    useEffect(() => {
        if (!isAutoRunning) return;
        const interval = setInterval(generateMessage, producerRate);
        return () => clearInterval(interval);
    }, [isAutoRunning, generateMessage, producerRate]);

    useEffect(() => {
        if (queue.length === 0) return;
        const availableConsumers = consumers.filter(c => !c.processingMessage);
        if (availableConsumers.length === 0) return;
        const processable = queue.filter(msg => {
            if (msg.status !== "queued") return false;
            if (queueType === "delayed" && msg.delay) return (Date.now() - msg.timestamp) / 1000 >= msg.delay;
            return true;
        });
        if (processable.length === 0) return;
        const message = processable[0];
        const consumer = availableConsumers[0];
        const activeSession = sessionRef.current;
        const processingTime = 800 + Math.random() * 400;
        const t = setTimeout(() => {
            if (sessionRef.current !== activeSession) return;
            setQueue(prev => prev.map(m => m.id === message.id ? { ...m, status: "processing", consumerId: consumer.id } : m));
            setConsumers(prev => prev.map(c => c.id === consumer.id ? { ...c, processingMessage: message.id, processedCount: c.processedCount + 1 } : c));
            const t2 = setTimeout(() => {
                if (sessionRef.current !== activeSession) return;
                setQueue(prev => prev.filter(m => m.id !== message.id));
                setConsumers(prev => prev.map(c => c.id === consumer.id ? { ...c, processingMessage: undefined } : c));
            }, processingTime);
            return () => clearTimeout(t2);
        }, 0);
        return () => clearTimeout(t);
    }, [queue, consumers, queueType, now]);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(interval);
    }, []);

    const resetRunState = useCallback(() => {
        sessionRef.current++;
        setQueue([]);
        setConsumers(prev => prev.map(c => ({ ...c, processedCount: 0, processingMessage: undefined })));
    }, []);

    const metrics = useMemo(() => {
        const totalProcessed = consumers.reduce((sum, c) => sum + c.processedCount, 0);
        const elapsedMin = Math.max((now - startedAt) / 60000, 1 / 60);
        return {
            queueSize: queue.length,
            processing: queue.filter(m => m.status === "processing").length,
            totalProcessed,
            throughput: totalProcessed / elapsedMin,
        };
    }, [queue, consumers, startedAt, now]);

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden flex gap-4 p-4">
                        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                            <MessageSquare className="w-4 h-4 text-green-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message Queue</span>
                        </div>

                        {/* Producer Column */}
                        <div className="flex flex-col items-center justify-center gap-3 shrink-0 w-24 mt-6">
                            <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
                                <Send className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Producer</span>
                            <motion.div
                                animate={isAutoRunning ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: producerRate / 1000 }}
                                className={cn("w-2 h-2 rounded-full", isAutoRunning ? "bg-green-500" : "bg-slate-300")}
                            />
                            <span className="text-[8px] text-slate-400 font-bold">{producerRate}ms</span>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center shrink-0 mt-6">
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>

                        {/* Queue Column */}
                        <div className="flex-1 flex flex-col gap-2 mt-6 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <Inbox className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Queue</span>
                                </div>
                                <Badge variant="outline" className="text-[8px]">{queue.length}</Badge>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 max-h-[340px] pr-1">
                                <AnimatePresence>
                                    {queue.slice(0, 12).map((msg) => (
                                        <motion.div key={msg.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className={cn(
                                                "flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all text-[10px]",
                                                msg.status === "processing"
                                                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400"
                                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-mono font-bold truncate">{msg.content}</span>
                                                {queueType === "priority" && msg.priority && (
                                                    <Badge className="bg-purple-500 text-white text-[7px] px-1 py-0">P{msg.priority}</Badge>
                                                )}
                                                {queueType === "delayed" && msg.delay && (
                                                    <Badge className="bg-orange-500 text-white text-[7px] px-1 py-0">+{msg.delay}s</Badge>
                                                )}
                                            </div>
                                            {msg.status === "processing" && (
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                                    <RefreshCw className="w-3 h-3 text-blue-500 shrink-0" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {queue.length === 0 && (
                                    <div className="flex items-center justify-center h-20 text-[10px] text-slate-300 font-bold">Empty</div>
                                )}
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center shrink-0 mt-6">
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>

                        {/* Consumers Column */}
                        <div className="flex flex-col gap-2 shrink-0 w-28 mt-6">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Users className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Workers</span>
                            </div>
                            <div className="space-y-2">
                                {consumers.map(c => {
                                    const msg = queue.find(m => m.id === c.processingMessage);
                                    return (
                                        <div key={c.id} className={cn(
                                            "p-2 rounded-xl border-2 transition-all text-[9px]",
                                            c.processingMessage ? "bg-green-50 dark:bg-green-950/40 border-green-500" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        )}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-black text-slate-600 dark:text-slate-300">{c.name}</span>
                                                {c.processingMessage && (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                                        <RefreshCw className="w-2.5 h-2.5 text-green-500" />
                                                    </motion.div>
                                                )}
                                            </div>
                                            {msg && <div className="font-mono text-slate-500 truncate">{msg.content}</div>}
                                            <div className="text-slate-400 mt-0.5">done: {c.processedCount}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: Queue Type */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Queue Type</h4>
                            <div className="flex flex-col p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
                                {(["fifo", "priority", "delayed"] as QueueType[]).map(t => (
                                    <button key={t} onClick={() => { setQueueType(t); resetRunState(); }}
                                        className={cn("px-3 py-2 rounded-md text-xs font-bold transition-all text-left",
                                            queueType === t ? "bg-white dark:bg-slate-700 shadow-sm text-green-600" : "text-slate-500")}
                                    >
                                        {t === "fifo" ? "FIFO — First In, First Out" : t === "priority" ? "Priority — Urgent first" : "Delayed — Schedule later"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Col 2: Controls */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Controls</h4>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Produce rate</span>
                                    <Badge variant="outline" className="text-[9px]">{producerRate}ms</Badge>
                                </div>
                                <input type="range" min="300" max="3000" step="100" value={producerRate}
                                    onChange={(e) => setProducerRate(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-green-500"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" onClick={() => setIsAutoRunning(!isAutoRunning)} className="h-9 gap-1 text-xs">
                                    {isAutoRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    {isAutoRunning ? "Pause" : "Play"}
                                </Button>
                                <Button variant="outline" onClick={generateMessage} className="h-9 gap-1 text-xs">
                                    <Send className="w-3 h-3" /> Send
                                </Button>
                                <Button variant="outline" onClick={() => { resetRunState(); setProducerRate(1000); setIsAutoRunning(true); }} className="h-9 gap-1 text-xs">
                                    <RotateCcw className="w-3 h-3" /> Reset
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500">Workers:</span>
                                <button onClick={() => consumers.length > 1 && setConsumers(prev => prev.slice(0, -1))}
                                    className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200">
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold">{consumers.length}</span>
                                <button onClick={() => consumers.length < 5 && setConsumers(prev => [...prev, { id: `c${prev.length + 1}`, name: `C${prev.length + 1}`, processedCount: 0 }])}
                                    className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Col 3: Metrics */}
                        <div className="space-y-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-green-600 mb-2">
                                <Zap className="w-4 h-4" /> Live Stats
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Queue Size</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.queueSize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Processing</span>
                                    <span className="text-xs font-bold tabular-nums text-blue-500">{metrics.processing}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Total Processed</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.totalProcessed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Throughput</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.throughput.toFixed(1)} msg/min</span>
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
                        <Info className="w-4 h-4 text-green-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        A producer generates tasks at a configurable rate and pushes them into the queue. Worker consumers pull from the queue and process one message at a time.
                        Try changing the queue type to see how <span className="font-semibold text-purple-500">Priority</span> reorders messages by urgency,
                        or how <span className="font-semibold text-orange-500">Delayed</span> holds messages until their scheduled time.
                        Add more workers to increase throughput.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Message queues <span className="font-semibold">decouple producers from consumers</span>, enabling each to scale independently.
                        The queue absorbs traffic spikes — if consumers fall behind, messages wait safely instead of dropping.
                        This is how systems like email delivery, video encoding, and payment processing handle async workloads at scale (e.g., RabbitMQ, SQS, Kafka).
                    </p>
                </div>
            </div>
        </>
    );
}
