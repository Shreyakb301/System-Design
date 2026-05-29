"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Database,
    Copy,
    ArrowRight,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Play,
    Pause,
    Zap,
    Info,
    ArrowLeftRight,
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
    status: "pending" | "replicating" | "completed";
}

function buildNodes(mode: ReplicationMode): Node[] {
    const ts = Date.now();
    if (mode === "master-slave") return [
        { id: "master", type: "master", data: [], isActive: true, lastSync: ts },
        { id: "slave1", type: "slave", data: [], isActive: true, lastSync: ts },
        { id: "slave2", type: "slave", data: [], isActive: true, lastSync: ts },
    ];
    if (mode === "master-master") return [
        { id: "master1", type: "master", data: [], isActive: true, lastSync: ts },
        { id: "master2", type: "master", data: [], isActive: true, lastSync: ts },
    ];
    return [
        { id: "shard1", type: "shard", shardKey: "A–M", data: [], isActive: true, lastSync: ts },
        { id: "shard2", type: "shard", shardKey: "N–Z", data: [], isActive: true, lastSync: ts },
        { id: "shard3", type: "shard", shardKey: "0–9", data: [], isActive: true, lastSync: ts },
    ];
}

const modeInfo = {
    "master-slave": { consistency: "Strong (master) / Eventual (slaves)", pros: ["Read scaling via replicas", "Simple failover"], cons: ["Single write bottleneck", "Replication lag"] },
    "master-master": { consistency: "Eventual (conflict-resolution needed)", pros: ["No single point of failure", "Write anywhere"], cons: ["Conflict resolution required", "Higher complexity"] },
    "sharding": { consistency: "Strong per shard", pros: ["Horizontal write scaling", "Data partitioning"], cons: ["Cross-shard queries complex", "Rebalancing hard"] },
};

export function ReplicationVisual() {
    const [mode, setMode] = useState<ReplicationMode>("master-slave");
    const [nodes, setNodes] = useState<Node[]>(() => buildNodes("master-slave"));
    const [operations, setOperations] = useState<WriteOperation[]>([]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);
    const nodesRef = useRef(nodes);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);

    const handleWrite = useCallback((nodeId: string, data: string) => {
        const opId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        setOperations(prev => [...prev, { id: opId, nodeId, data, status: "pending" }]);
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: [...n.data.slice(-4), data] } : n));

        setTimeout(() => {
            setOperations(prev => prev.map(op => op.id === opId ? { ...op, status: "replicating" } : op));
            const delay = mode === "master-master" ? 350 : 200;
            setTimeout(() => {
                if (mode === "master-slave") {
                    setNodes(prev => prev.map(n => n.type === "slave" ? { ...n, data: [...n.data.slice(-4), data], lastSync: Date.now() } : n));
                } else if (mode === "master-master") {
                    setNodes(prev => prev.map(n => n.id !== nodeId && n.type === "master" ? { ...n, data: [...n.data.slice(-4), data], lastSync: Date.now() } : n));
                }
                setOperations(prev => prev.map(op => op.id === opId ? { ...op, status: "completed" } : op));
            }, delay);
        }, 100);

        setTimeout(() => setOperations(prev => prev.filter(op => op.id !== opId)), 3000);
    }, [mode]);

    useEffect(() => {
        if (!isAutoRunning) return;
        const interval = setInterval(() => {
            const currentNodes = nodesRef.current;
            if (mode === "sharding") {
                const shard = currentNodes[Math.floor(Math.random() * currentNodes.length)];
                if (shard) handleWrite(shard.id, `D-${Math.random().toString(36).substr(2, 4)}`);
            } else {
                const master = currentNodes.find(n => n.type === "master");
                if (master) handleWrite(master.id, `D-${Math.random().toString(36).substr(2, 4)}`);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [isAutoRunning, mode, handleWrite]);

    const changeMode = (m: ReplicationMode) => { setMode(m); setNodes(buildNodes(m)); setOperations([]); };

    const metrics = useMemo(() => ({
        totalData: nodes.reduce((sum, n) => sum + n.data.length, 0),
        avgLatency: mode === "sharding" ? 50 : mode === "master-master" ? 120 : 80,
        active: operations.filter(op => op.status !== "completed").length,
    }), [nodes, operations, mode]);

    const info = modeInfo[mode];

    const nodeColors: Record<string, string> = {
        master: "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400",
        slave: "bg-green-50 dark:bg-green-950/40 border-green-500 text-green-600 dark:text-green-400",
        shard: "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-600 dark:text-purple-400",
    };

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden p-5">
                        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                            <Copy className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Replication — {mode}</span>
                        </div>
                        <div className="absolute top-3 right-4 flex items-center gap-2 z-10">
                            {metrics.active > 0 && (
                                <Badge className="bg-amber-500 text-white text-[8px] animate-pulse">{metrics.active} replicating</Badge>
                            )}
                        </div>

                        {/* Node grid */}
                        <div className={cn(
                            "h-full flex items-center justify-center gap-6 md:gap-10 mt-4",
                            mode === "sharding" ? "flex-row" : mode === "master-master" ? "flex-row" : "flex-col"
                        )}>
                            <AnimatePresence mode="wait">
                                <motion.div key={mode}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={cn(
                                        "flex items-center gap-6 md:gap-10",
                                        mode === "master-slave" ? "flex-col w-full max-w-sm" : "flex-row"
                                    )}
                                >
                                    {mode === "master-slave" && (
                                        <>
                                            {/* Master */}
                                            <NodeCard node={nodes[0]} ops={operations} colors={nodeColors} />
                                            <div className="flex items-center gap-4 w-full justify-center">
                                                <ArrowRight className="w-4 h-4 text-indigo-400" />
                                                <div className="flex gap-6">
                                                    {nodes.slice(1).map(n => <NodeCard key={n.id} node={n} ops={operations} colors={nodeColors} />)}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {mode === "master-master" && (
                                        <>
                                            <NodeCard node={nodes[0]} ops={operations} colors={nodeColors} />
                                            <div className="flex flex-col items-center gap-1">
                                                <ArrowRight className="w-4 h-4 text-indigo-400" />
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">sync</span>
                                                <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <NodeCard node={nodes[1]} ops={operations} colors={nodeColors} />
                                        </>
                                    )}

                                    {mode === "sharding" && nodes.map(n => <NodeCard key={n.id} node={n} ops={operations} colors={nodeColors} />)}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: Mode */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Strategy</h4>
                            <div className="flex flex-col p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
                                {(["master-slave", "master-master", "sharding"] as ReplicationMode[]).map(m => (
                                    <button key={m} onClick={() => changeMode(m)}
                                        className={cn("px-3 py-2 rounded-md text-xs font-bold transition-all text-left",
                                            mode === m ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500")}
                                    >
                                        {m === "master-slave" ? "Master-Slave" : m === "master-master" ? "Master-Master" : "Sharding"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Col 2: Controls */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Controls</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={() => setIsAutoRunning(!isAutoRunning)} className="h-9 gap-1.5 text-xs">
                                    {isAutoRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    {isAutoRunning ? "Pause" : "Play"}
                                </Button>
                                <Button variant="outline" onClick={() => { setNodes(buildNodes(mode)); setOperations([]); }} className="h-9 gap-1.5 text-xs">
                                    <RefreshCw className="w-3 h-3" /> Reset
                                </Button>
                            </div>
                            <Button
                                onClick={() => {
                                    const masterNode = nodesRef.current.find(n => n.type === "master") || nodesRef.current[0];
                                    if (masterNode) handleWrite(masterNode.id, `D-${Math.random().toString(36).substr(2, 4)}`);
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 gap-1.5 text-xs"
                            >
                                <Zap className="w-3 h-3" /> Trigger Write
                            </Button>
                        </div>

                        {/* Col 3: Insight */}
                        <div className="space-y-2 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
                                <Layers className="w-4 h-4" /> Consistency: <span className="font-normal text-slate-500 text-[10px]">{info.consistency}</span>
                            </div>
                            <div className="space-y-1">
                                {info.pros.map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> {p}
                                    </div>
                                ))}
                                {info.cons.map((c, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <AlertCircle className="w-3 h-3 text-orange-500 shrink-0" /> {c}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                                <span className="text-[9px] text-slate-400">Total items</span>
                                <span className="text-xs font-bold">{metrics.totalData}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Explanations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Writes flow into the master node and replicate outward. Watch the nodes pulse when a replication event is in-flight.
                        In <span className="font-semibold">Master-Slave</span>, only one node accepts writes and pushes to read replicas.
                        In <span className="font-semibold">Master-Master</span>, both nodes accept writes and sync bidirectionally.
                        In <span className="font-semibold">Sharding</span>, data is partitioned by key range — each shard is independent.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Copy className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Replication is how databases achieve <span className="font-semibold">high availability and durability</span>.
                        Master-Slave scales reads cheaply but the master is a single point of failure.
                        Master-Master removes that bottleneck but requires conflict resolution for concurrent writes.
                        Sharding is the only strategy that scales writes — it&apos;s how Google Spanner and Cassandra handle planetary-scale data.
                    </p>
                </div>
            </div>
        </>
    );
}

function NodeCard({ node, ops, colors }: { node: Node; ops: WriteOperation[]; colors: Record<string, string> }) {
    const isReplicating = ops.some(op => (op.nodeId === node.id || node.type !== "master") && op.status === "replicating");
    return (
        <motion.div
            animate={{ scale: isReplicating ? [1, 1.04, 1] : 1 }}
            transition={{ duration: 0.5, repeat: isReplicating ? Infinity : 0 }}
            className={cn("relative flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all min-w-[110px]", colors[node.type])}
        >
            <div className="relative">
                <Database className="w-7 h-7" />
                {isReplicating && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 -right-2 p-0.5 bg-amber-500 rounded-full text-white shadow">
                        <RefreshCw className="w-2.5 h-2.5" />
                    </motion.div>
                )}
            </div>
            <div className="text-center">
                <div className="text-[9px] font-black uppercase tracking-widest">{node.type}{node.shardKey ? ` (${node.shardKey})` : ""}</div>
                <Badge variant="outline" className="text-[8px] mt-0.5">{node.data.length} items</Badge>
            </div>
            <div className="w-full space-y-0.5 max-h-24 overflow-hidden">
                <AnimatePresence>
                    {node.data.slice(-3).map((item, i) => (
                        <motion.div key={`${node.id}-${item}-${i}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[8px] font-mono text-center bg-white dark:bg-slate-800 rounded px-1 py-0.5 text-slate-500"
                        >{item}</motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
