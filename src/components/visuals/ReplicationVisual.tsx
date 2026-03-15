"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Database,
    Copy,
    Server,
    ArrowRight,
    ArrowDown,
    ArrowUp,
    RefreshCw,
    Zap,
    Activity,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    Clock,
    Network,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReplicationMode = "master-slave" | "master-master" | "sharding";

interface Node {
    id: string;
    type: "master" | "slave" | "shard";
    shardKey?: string;
    data: string[];
    isActive: boolean;
    lastSync: number;
}

interface WriteOperation {
    id: string;
    nodeId: string;
    data: string;
    timestamp: number;
    status: "pending" | "replicating" | "completed";
}

export function ReplicationVisual() {
    const [mode, setMode] = useState<ReplicationMode>("master-slave");
    const [nodes, setNodes] = useState<Node[]>([]);
    const [operations, setOperations] = useState<WriteOperation[]>([]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);
    const [writeLatency, setWriteLatency] = useState(0);
    const [readLatency, setReadLatency] = useState(0);
    const [consistency, setConsistency] = useState("Strong");

    // Initialize nodes based on mode
    useEffect(() => {
        if (mode === "master-slave") {
            setNodes([
                { id: "master", type: "master", data: [], isActive: true, lastSync: Date.now() },
                { id: "slave1", type: "slave", data: [], isActive: true, lastSync: Date.now() },
                { id: "slave2", type: "slave", data: [], isActive: true, lastSync: Date.now() },
            ]);
            setConsistency("Strong (Read from master) / Eventual (Read from slave)");
        } else if (mode === "master-master") {
            setNodes([
                { id: "master1", type: "master", data: [], isActive: true, lastSync: Date.now() },
                { id: "master2", type: "master", data: [], isActive: true, lastSync: Date.now() },
            ]);
            setConsistency("Eventual (Conflict resolution needed)");
        } else {
            // Sharding
            setNodes([
                { id: "shard1", type: "shard", shardKey: "A-M", data: [], isActive: true, lastSync: Date.now() },
                { id: "shard2", type: "shard", shardKey: "N-Z", data: [], isActive: true, lastSync: Date.now() },
                { id: "shard3", type: "shard", shardKey: "0-9", data: [], isActive: true, lastSync: Date.now() },
            ]);
            setConsistency("Strong (Per shard)");
        }
    }, [mode]);

    const handleWrite = useCallback((nodeId: string, data: string) => {
        const opId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const operation: WriteOperation = {
            id: opId,
            nodeId,
            data,
            timestamp: Date.now(),
            status: "pending",
        };

        setOperations(prev => [...prev, operation]);

        // Update node data
        setNodes(prev => prev.map(n => 
            n.id === nodeId ? { ...n, data: [...n.data, data] } : n
        ));

        // Simulate replication
        setTimeout(() => {
            setOperations(prev => prev.map(op => 
                op.id === opId ? { ...op, status: "replicating" } : op
            ));

            if (mode === "master-slave") {
                // Replicate to all slaves
                const masterNode = nodes.find(n => n.id === nodeId);
                if (masterNode && masterNode.type === "master") {
                    setTimeout(() => {
                        setNodes(prev => prev.map(n => 
                            n.type === "slave" ? { ...n, data: [...n.data, data], lastSync: Date.now() } : n
                        ));
                        setOperations(prev => prev.map(op => 
                            op.id === opId ? { ...op, status: "completed" } : op
                        ));
                    }, 200);
                }
            } else if (mode === "master-master") {
                // Replicate to other master
                setTimeout(() => {
                    setNodes(prev => prev.map(n => 
                        n.id !== nodeId && n.type === "master" 
                            ? { ...n, data: [...n.data, data], lastSync: Date.now() } 
                            : n
                    ));
                    setOperations(prev => prev.map(op => 
                        op.id === opId ? { ...op, status: "completed" } : op
                    ));
                }, 300);
            } else {
                // Sharding - no replication needed
                setOperations(prev => prev.map(op => 
                    op.id === opId ? { ...op, status: "completed" } : op
                ));
            }
        }, 100);

        // Clean up
        setTimeout(() => {
            setOperations(prev => prev.filter(op => op.id !== opId));
        }, 3000);
    }, [mode, nodes]);

    // Auto-generate writes
    useEffect(() => {
        if (!isAutoRunning) return;
        const interval = setInterval(() => {
            if (mode === "sharding") {
                const shardKeys = ["A-M", "N-Z", "0-9"];
                const randomKey = shardKeys[Math.floor(Math.random() * shardKeys.length)];
                const shard = nodes.find(n => n.shardKey === randomKey);
                if (shard) {
                    const data = `Data-${Math.random().toString(36).substr(2, 5)}`;
                    handleWrite(shard.id, data);
                }
            } else {
                const master = nodes.find(n => n.type === "master");
                if (master) {
                    const data = `Data-${Math.random().toString(36).substr(2, 5)}`;
                    handleWrite(master.id, data);
                }
            }
        }, 2500);
        return () => clearInterval(interval);
    }, [isAutoRunning, mode, nodes, handleWrite]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const totalData = nodes.reduce((sum, n) => sum + n.data.length, 0);
        const avgLatency = mode === "sharding" ? 50 : mode === "master-master" ? 120 : 80;
        const throughput = operations.filter(op => op.status === "completed").length * 2;
        return { totalData, avgLatency, throughput };
    }, [nodes, operations, mode]);

    const getShardForData = (data: string): string => {
        const firstChar = data[5]?.toUpperCase() || "A";
        if (firstChar >= "A" && firstChar <= "M") return "shard1";
        if (firstChar >= "N" && firstChar <= "Z") return "shard2";
        return "shard3";
    };

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Copy className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 font-semibold italic">
                        Understand data replication strategies and horizontal partitioning
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsAutoRunning(!isAutoRunning)}
                        variant={isAutoRunning ? "default" : "outline"}
                        size="sm"
                    >
                        {isAutoRunning ? "Pause" : "Resume"}
                    </Button>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-4">
                {(["master-slave", "master-master", "sharding"] as ReplicationMode[]).map((m) => (
                    <Card
                        key={m}
                        className={cn(
                            "p-4 cursor-pointer transition-all border-2",
                            mode === m
                                ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500 shadow-lg"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                        )}
                        onClick={() => setMode(m)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold capitalize">
                                {m.replace("-", " ")}
                            </h3>
                            {mode === m && (
                                <Badge className="bg-indigo-500 text-white">Active</Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            {m === "master-slave" && "One master, multiple read replicas"}
                            {m === "master-master" && "Multiple masters, bidirectional sync"}
                            {m === "sharding" && "Horizontal partitioning by key range"}
                        </p>
                    </Card>
                ))}
            </div>

            {/* Main Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Node Visualization */}
                <div className="lg:col-span-8">
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[500px]">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Network className="w-3.5 h-3.5" /> Cluster Topology
                        </h4>
                        <div className={cn(
                            "grid gap-6",
                            mode === "sharding" ? "grid-cols-3" : mode === "master-master" ? "grid-cols-2" : "grid-cols-1"
                        )}>
                            {nodes.map((node, idx) => {
                                const activeOps = operations.filter(op => 
                                    op.nodeId === node.id && op.status !== "completed"
                                );
                                const isReplicating = activeOps.some(op => op.status === "replicating");

                                return (
                                    <motion.div
                                        key={node.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center"
                                    >
                                        <motion.div
                                            className={cn(
                                                "p-6 rounded-2xl border-4 shadow-xl transition-all relative",
                                                node.type === "master" && "bg-blue-50 dark:bg-blue-950 border-blue-500",
                                                node.type === "slave" && "bg-green-50 dark:bg-green-950 border-green-500",
                                                node.type === "shard" && "bg-purple-50 dark:bg-purple-950 border-purple-500",
                                                isReplicating && "scale-105 ring-4 ring-yellow-400"
                                            )}
                                            animate={{
                                                scale: isReplicating ? [1, 1.05, 1] : 1,
                                            }}
                                            transition={{ duration: 0.5, repeat: isReplicating ? Infinity : 0 }}
                                        >
                                            <Database className={cn(
                                                "w-10 h-10",
                                                node.type === "master" && "text-blue-600 dark:text-blue-400",
                                                node.type === "slave" && "text-green-600 dark:text-green-400",
                                                node.type === "shard" && "text-purple-600 dark:text-purple-400"
                                            )} />
                                            {isReplicating && (
                                                <motion.div
                                                    className="absolute -top-2 -right-2"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <RefreshCw className="w-5 h-5 text-yellow-500" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                        <div className="mt-3 text-center">
                                            <div className="text-sm font-bold capitalize mb-1">
                                                {node.type} {node.shardKey && `(${node.shardKey})`}
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {node.data.length} items
                                            </Badge>
                                        </div>

                                        {/* Data Items */}
                                        <div className="mt-4 w-full space-y-1 max-h-32 overflow-y-auto">
                                            <AnimatePresence>
                                                {node.data.slice(-5).map((item, i) => (
                                                    <motion.div
                                                        key={`${node.id}-${item}-${i}`}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="text-xs p-2 bg-slate-100 dark:bg-slate-800 rounded text-center font-mono"
                                                    >
                                                        {item}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Replication Arrows */}
                        {mode !== "sharding" && (
                            <div className="mt-8 flex justify-center items-center gap-4">
                                {nodes.filter(n => n.type === "master").map(master => (
                                    <div key={master.id} className="flex flex-col items-center gap-2">
                                        {nodes.filter(n => 
                                            (mode === "master-slave" && n.type === "slave") ||
                                            (mode === "master-master" && n.type === "master" && n.id !== master.id)
                                        ).map(slave => {
                                            const activeOp = operations.find(op => 
                                                op.nodeId === master.id && op.status === "replicating"
                                            );
                                            return (
                                                <motion.div
                                                    key={slave.id}
                                                    className="flex items-center gap-2"
                                                    animate={activeOp ? {
                                                        opacity: [0.5, 1, 0.5],
                                                    } : {}}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    <ArrowRight className="w-6 h-6 text-indigo-500" />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Metrics & Info */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-3.5 h-3.5" /> Metrics
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Total Data Items</span>
                                    <span className="text-2xl font-black">{metrics.totalData}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Avg Write Latency</span>
                                    <span className="text-2xl font-black">{metrics.avgLatency}ms</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Throughput</span>
                                    <Badge variant="outline">{metrics.throughput} ops/s</Badge>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" /> Consistency Model
                        </h4>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <div className="text-xs font-bold text-slate-400 mb-1">Consistency</div>
                                <div className="text-sm font-medium">{consistency}</div>
                            </div>
                            <div className="space-y-2">
                                {mode === "master-slave" && (
                                    <>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span>Read scaling via replicas</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            <span>Single point of failure (master)</span>
                                        </div>
                                    </>
                                )}
                                {mode === "master-master" && (
                                    <>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span>No single point of failure</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            <span>Conflict resolution required</span>
                                        </div>
                                    </>
                                )}
                                {mode === "sharding" && (
                                    <>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span>Horizontal scalability</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            <span>Cross-shard queries complex</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Educational Insight */}
            <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-indigo-500 rounded-3xl shrink-0 shadow-xl shadow-indigo-500/20">
                    <Copy className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2 flex-1 relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">System Design Insight</h4>
                    <div className="text-sm font-medium leading-relaxed opacity-90 tracking-tight">
                        <strong>Master-Slave replication</strong> provides read scaling and backup, but the master is a single point of failure.
                        <strong>Master-Master replication</strong> eliminates single points of failure but requires conflict resolution.
                        <strong>Sharding</strong> partitions data across multiple nodes for horizontal scaling, but cross-shard queries become complex.
                        Choose based on your read/write ratio, consistency requirements, and scalability needs.
                    </div>
                </div>
            </div>
        </Card>
    );
}

