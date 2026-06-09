"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    GitCommit,
    ArrowRightLeft,
    Trash2,
    Plus,
    Play,
    RotateCcw,
    Database,
    Zap,
    Info,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LLNode {
    id: string;
    value: string | number;
    nextId: string | null;
    prevId?: string | null;
    x: number;
    y: number;
    address: string;
}

export function LinkedListVisual() {
    const [mode, setMode] = useState<"singly" | "doubly">("singly");
    const [nodes, setNodes] = useState<LLNode[]>([]);
    const [status, setStatus] = useState("System Ready");
    const [isAnimating, setIsAnimating] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

    // Initial sequence
    const initNodes = () => {
        const sequence = ["A", "B", "C", "D"];
        const baseAddr = 0x200;

        const initialNodes: LLNode[] = sequence.map((val, i) => {
            // Adjust spacing for responsiveness
            const gap = typeof window !== "undefined" && window.innerWidth < 768 ? 110 : 160;
            const xOffset = typeof window !== "undefined" && window.innerWidth < 768 ? 10 : 80;

            return {
                id: `node-${i}`,
                value: val,
                nextId: i < sequence.length - 1 ? `node-${i + 1}` : null,
                prevId: i > 0 ? `node-${i - 1}` : null,
                // Random-ish scattered positions to show "heap" feel
                x: xOffset + i * gap + (i % 2 === 0 ? 0 : 20),
                y: 120 + (i % 2 === 0 ? 30 : -30),
                address: `0x${(baseAddr + i * 24).toString(16).toUpperCase()}`
            };
        });
        setNodes(initialNodes);
    };

    // Populate after mount (reads window size; deferred to avoid SSR/hydration mismatch).
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        initNodes();
    }, []);

    const traverse = async () => {
        if (isAnimating || nodes.length === 0) return;
        setIsAnimating(true);
        setStatus("Traversing List...");

        for (const node of nodes) {
            setActiveNodeId(node.id);
            setStatus(`At Node ${node.value} (${node.address})`);
            await new Promise(r => setTimeout(r, 800));
        }

        setStatus("Traversal Complete.");
        setActiveNodeId(null);
        setIsAnimating(false);
    };

    const deleteNode = async (id: string) => {
        if (isAnimating) return;
        setIsAnimating(true);

        const nodeIndex = nodes.findIndex(n => n.id === id);
        if (nodeIndex === -1) return;

        setStatus(`Deleting node ${nodes[nodeIndex].value}...`);

        if (mode === "singly") {
            setStatus("Singly: Rewiring 'next' of previous node...");
        } else {
            setStatus("Doubly: Rewiring both 'next' and 'prev' pointers...");
        }

        await new Promise(r => setTimeout(r, 1000));

        const updatedNodes = nodes
            .filter(n => n.id !== id)
            .map(n => {
                const next = nodes[nodeIndex + 1];
                const prev = nodes[nodeIndex - 1];

                const updated = { ...n };
                if (updated.nextId === id) updated.nextId = next ? next.id : null;
                if (mode === "doubly" && updated.prevId === id) updated.prevId = prev ? prev.id : null;
                return updated;
            });

        setNodes(updatedNodes);
        setStatus("Node freed from memory.");
        setIsAnimating(false);
    };

    return (
        <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="flex flex-col gap-8">
                {/* Top: Memory Space (SVG Canvas) */}
                <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden">
                    <div className="h-full relative p-4">
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                            <Database className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Heap Memory Space</span>
                        </div>


                        <AnimatePresence>
                            {nodes.map((node, i) => (
                                <motion.div
                                    key={node.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: 1,
                                        scale: activeNodeId === node.id ? 1.05 : 1,
                                        x: node.x,
                                        y: node.y
                                    }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className={cn(
                                        "absolute w-24 h-20 rounded-xl border-2 flex flex-col p-2 transition-colors cursor-pointer group",
                                        activeNodeId === node.id
                                            ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                    )}
                                    onClick={() => deleteNode(node.id)}
                                >
                                    <span className="text-[8px] font-mono text-slate-400 mb-1">{node.address}</span>
                                    <div className="flex-1 flex items-center justify-center font-bold text-lg">
                                        {node.value}
                                    </div>
                                    <div className="flex gap-0.5 justify-center">
                                        {mode === "doubly" && <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800" title="Prev Pointer" />}
                                        <div className="w-4 h-2 rounded bg-slate-300 dark:bg-slate-700" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500/50" title="Next Pointer" />
                                    </div>

                                    <button className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                        <Trash2 className="w-3 h-3" />
                                    </button>

                                    {i === 0 && <Badge className="absolute -top-6 left-0 bg-indigo-500 text-[8px] py-0">HEAD</Badge>}
                                    {i === nodes.length - 1 && <Badge className="absolute -top-6 right-0 bg-rose-500 text-[8px] py-0">TAIL</Badge>}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-400 dark:fill-slate-600" />
                                </marker>
                                <marker id="active-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" className="fill-emerald-500" />
                                </marker>
                            </defs>

                            {/* Pointers (Edges) */}
                            {nodes.map(node => {
                                if (!node.nextId) return null;
                                const target = nodes.find(n => n.id === node.nextId);
                                if (!target) return null;

                                const isActive = activeNodeId === node.id;

                                // Node dimensions: w-24 (96px), h-20 (80px)
                                // We want to start from the right-ish middle and end at the left-ish middle
                                // but since they are scattered, we'll just use cleaner offsets
                                return (
                                    <line
                                        key={`link-${node.id}`}
                                        x1={node.x + 96} y1={node.y + 35}
                                        x2={target.x} y2={target.y + 35}
                                        stroke="currentColor"
                                        strokeWidth={isActive ? 3 : 2}
                                        markerEnd={`url(#${isActive ? "active-arrow" : "arrowhead"})`}
                                        className={cn(
                                            "transition-all duration-500",
                                            isActive ? "text-emerald-500" : "text-slate-400 dark:text-slate-600"
                                        )}
                                    />
                                );
                            })}

                            {/* Doubly Prev Pointers */}
                            {mode === "doubly" && nodes.map(node => {
                                if (!node.prevId) return null;
                                const target = nodes.find(n => n.id === node.prevId);
                                if (!target) return null;

                                return (
                                    <line
                                        key={`prev-link-${node.id}`}
                                        x1={node.x} y1={node.y + 55}
                                        x2={target.x + 96} y2={target.y + 55}
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        strokeDasharray="4 2"
                                        markerEnd="url(#arrowhead)"
                                        className="text-slate-300 dark:text-slate-700 transition-all duration-500"
                                    />
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Bottom: Info & Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Structure Mode</h4>
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <button
                                onClick={() => setMode("singly")}
                                className={cn(
                                    "flex-1 px-4 py-2 text-xs font-bold rounded-md transition-all",
                                    mode === "singly" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" : "text-slate-500"
                                )}
                            >Singly</button>
                            <button
                                onClick={() => setMode("doubly")}
                                className={cn(
                                    "flex-1 px-4 py-2 text-xs font-bold rounded-md transition-all",
                                    mode === "doubly" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" : "text-slate-500"
                                )}
                            >Doubly</button>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">
                                <Zap className="w-3 h-3" /> Status
                            </h4>
                            <p className="text-xs font-medium">{status}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Operations</h4>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-11"
                                onClick={traverse}
                                disabled={isAnimating || nodes.length === 0}
                            >
                                <Play className="w-4 h-4 fill-current" /> Traverse List
                            </Button>
                            <Button
                                variant="outline"
                                className="border-slate-200 dark:border-slate-800 h-10 gap-2"
                                onClick={initNodes}
                            >
                                <RotateCcw className="w-4 h-4" /> Reset Heap
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 self-start">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-2">
                            <Info className="w-4 h-4" /> Tradeoff Analysis
                        </div>
                        <ul className="space-y-2">
                            <li className="flex gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <span>{mode === "singly"
                                    ? "Singly: O(n) delete, minimal memory overhead."
                                    : "Doubly: O(1) delete (if node known), +8 bytes overhead/node."}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </Card>
    );
}
