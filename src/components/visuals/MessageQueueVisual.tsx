"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    Send,
    Inbox,
    Users,
    Clock,
    Activity,
    BarChart3,
    Zap,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Play,
    Pause,
    RefreshCw,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QueueType = "fifo" | "priority" | "delayed";

interface Message {
    id: string;
    content: string;
    priority?: number;
    delay?: number;
    timestamp: number;
    status: "queued" | "processing" | "completed";
    consumerId?: string;
}

interface Consumer {
    id: string;
    name: string;
    processingMessage?: string;
    processedCount: number;
    isActive: boolean;
}

export function MessageQueueVisual() {
    const [queueType, setQueueType] = useState<QueueType>("fifo");
    const [queue, setQueue] = useState<Message[]>([]);
    const [consumers, setConsumers] = useState<Consumer[]>([
        { id: "c1", name: "Consumer 1", processedCount: 0, isActive: true },
        { id: "c2", name: "Consumer 2", processedCount: 0, isActive: true },
    ]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);
    const [producerRate, setProducerRate] = useState(1000);

    const generateMessage = useCallback(() => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const content = `Task-${Math.random().toString(36).substr(2, 5)}`;
        
        let message: Message = {
            id,
            content,
            timestamp: Date.now(),
            status: "queued",
        };

        if (queueType === "priority") {
            message.priority = Math.floor(Math.random() * 5) + 1; // 1-5
        } else if (queueType === "delayed") {
            message.delay = Math.floor(Math.random() * 5) + 1; // 1-5 seconds
        }

        setQueue(prev => {
            if (queueType === "priority") {
                // Insert by priority (higher first)
                const sorted = [...prev, message].sort((a, b) => 
                    (b.priority || 0) - (a.priority || 0)
                );
                return sorted;
            }
            return [...prev, message];
        });
    }, [queueType]);

    // Auto-produce messages
    useEffect(() => {
        if (!isAutoRunning) return;
        const interval = setInterval(generateMessage, producerRate);
        return () => clearInterval(interval);
    }, [isAutoRunning, generateMessage, producerRate]);

    // Process messages
    useEffect(() => {
        if (queue.length === 0) return;

        const availableConsumers = consumers.filter(c => !c.processingMessage);
        if (availableConsumers.length === 0) return;

        const processableMessages = queue.filter(msg => {
            if (msg.status !== "queued") return false;
            if (queueType === "delayed" && msg.delay) {
                const elapsed = (Date.now() - msg.timestamp) / 1000;
                return elapsed >= msg.delay;
            }
            return true;
        });

        if (processableMessages.length === 0) return;

        const message = processableMessages[0];
        const consumer = availableConsumers[0];

        // Mark message as processing
        setQueue(prev => prev.map(m => 
            m.id === message.id ? { ...m, status: "processing", consumerId: consumer.id } : m
        ));

        // Update consumer
        setConsumers(prev => prev.map(c => 
            c.id === consumer.id 
                ? { ...c, processingMessage: message.id, processedCount: c.processedCount + 1 }
                : c
        ));

        // Complete after processing time
        const processingTime = 800 + Math.random() * 400;
        setTimeout(() => {
            setQueue(prev => prev.filter(m => m.id !== message.id));
            setConsumers(prev => prev.map(c => 
                c.id === consumer.id ? { ...c, processingMessage: undefined } : c
            ));
        }, processingTime);
    }, [queue, consumers, queueType]);

    const metrics = useMemo(() => {
        const totalProcessed = consumers.reduce((sum, c) => sum + c.processedCount, 0);
        const queueSize = queue.length;
        const processing = queue.filter(m => m.status === "processing").length;
        const throughput = totalProcessed > 0 ? (totalProcessed / (Date.now() / 1000)) * 60 : 0;
        return { totalProcessed, queueSize, processing, throughput };
    }, [queue, consumers]);

    const addConsumer = () => {
        const newId = `c${consumers.length + 1}`;
        setConsumers(prev => [...prev, {
            id: newId,
            name: `Consumer ${consumers.length + 1}`,
            processedCount: 0,
            isActive: true,
        }]);
    };

    const removeConsumer = () => {
        if (consumers.length > 1) {
            setConsumers(prev => prev.slice(0, -1));
        }
    };

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-xl shadow-lg shadow-green-500/20">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Message Queues
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 font-semibold italic">
                        Understand asynchronous message processing and decoupling
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsAutoRunning(!isAutoRunning)}
                        variant={isAutoRunning ? "default" : "outline"}
                        size="sm"
                    >
                        {isAutoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isAutoRunning ? "Pause" : "Resume"}
                    </Button>
                </div>
            </div>

            {/* Queue Type Selector */}
            <div className="grid grid-cols-3 gap-4">
                {(["fifo", "priority", "delayed"] as QueueType[]).map((type) => (
                    <Card
                        key={type}
                        className={cn(
                            "p-4 cursor-pointer transition-all border-2",
                            queueType === type
                                ? "bg-green-50 dark:bg-green-950 border-green-500 shadow-lg"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-green-300"
                        )}
                        onClick={() => {
                            setQueueType(type);
                            setQueue([]);
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold capitalize">{type}</h3>
                            {queueType === type && (
                                <Badge className="bg-green-500 text-white">Active</Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            {type === "fifo" && "First In, First Out ordering"}
                            {type === "priority" && "Higher priority messages first"}
                            {type === "delayed" && "Messages processed after delay"}
                        </p>
                    </Card>
                ))}
            </div>

            {/* Main Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Queue & Consumers */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Producer */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500 rounded-full">
                                    <Send className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Producer</h4>
                                    <p className="text-xs text-slate-500">Generating messages</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Rate:</span>
                                <input
                                    type="range"
                                    min="500"
                                    max="3000"
                                    step="100"
                                    value={producerRate}
                                    onChange={(e) => setProducerRate(parseInt(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-xs font-bold">{producerRate}ms</span>
                            </div>
                        </div>
                    </Card>

                    {/* Queue */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[200px]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Inbox className="w-3.5 h-3.5" /> Message Queue
                            </h4>
                            <Badge variant="outline">{queue.length} messages</Badge>
                        </div>
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                            <AnimatePresence>
                                {queue.map((message, idx) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                            message.status === "queued" && "bg-slate-50 dark:bg-slate-800 border-slate-300",
                                            message.status === "processing" && "bg-blue-50 dark:bg-blue-950 border-blue-500"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ArrowRight className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-mono font-bold">{message.content}</span>
                                            {queueType === "priority" && message.priority && (
                                                <Badge className="bg-purple-500 text-white">
                                                    P{message.priority}
                                                </Badge>
                                            )}
                                            {queueType === "delayed" && message.delay && (
                                                <Badge className="bg-orange-500 text-white">
                                                    +{message.delay}s
                                                </Badge>
                                            )}
                                        </div>
                                        {message.status === "processing" && (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <RefreshCw className="w-4 h-4 text-blue-500" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </Card>

                    {/* Consumers */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Consumers
                            </h4>
                            <div className="flex gap-2">
                                <Button
                                    onClick={addConsumer}
                                    size="sm"
                                    variant="outline"
                                    disabled={consumers.length >= 5}
                                >
                                    + Add
                                </Button>
                                <Button
                                    onClick={removeConsumer}
                                    size="sm"
                                    variant="outline"
                                    disabled={consumers.length <= 1}
                                >
                                    - Remove
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {consumers.map((consumer) => {
                                const processingMsg = queue.find(m => m.id === consumer.processingMessage);
                                return (
                                    <motion.div
                                        key={consumer.id}
                                        className={cn(
                                            "p-4 rounded-lg border-2 transition-all",
                                            consumer.processingMessage
                                                ? "bg-green-50 dark:bg-green-950 border-green-500"
                                                : "bg-slate-50 dark:bg-slate-800 border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                <span className="font-bold">{consumer.name}</span>
                                            </div>
                                            {consumer.processingMessage && (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <RefreshCw className="w-4 h-4 text-green-500" />
                                                </motion.div>
                                            )}
                                        </div>
                                        {processingMsg && (
                                            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-2">
                                                Processing: {processingMsg.content}
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-500">
                                            Processed: <span className="font-bold">{consumer.processedCount}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Metrics */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-3.5 h-3.5" /> Metrics
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Queue Size</span>
                                    <span className="text-2xl font-black">{metrics.queueSize}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Processing</span>
                                    <Badge className="bg-blue-500">{metrics.processing}</Badge>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Total Processed</span>
                                    <span className="text-2xl font-black">{metrics.totalProcessed}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Throughput</span>
                                    <Badge variant="outline">{metrics.throughput.toFixed(1)} msg/min</Badge>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" /> Queue Properties
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Asynchronous processing</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Decouples producers & consumers</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Handles traffic spikes</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span>Requires message durability</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Educational Insight */}
            <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-green-500 rounded-3xl shrink-0 shadow-xl shadow-green-500/20">
                    <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2 flex-1 relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">System Design Insight</h4>
                    <div className="text-sm font-medium leading-relaxed opacity-90 tracking-tight">
                        Message queues enable <strong>asynchronous communication</strong> between services, decoupling producers
                        from consumers. This allows systems to handle traffic spikes, scale independently, and improve reliability.
                        <strong>FIFO queues</strong> preserve order, <strong>priority queues</strong> handle urgent messages first,
                        and <strong>delayed queues</strong> schedule future processing. Use queues for background jobs, event
                        processing, and microservices communication.
                    </div>
                </div>
            </div>
        </Card>
    );
}


