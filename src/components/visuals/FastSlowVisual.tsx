"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    Zap,
    CircleDot,
    Split,
    Info,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface Node {
    id: number;
    value: number;
    next: number | null; // index of next node
    x: number;
    y: number;
}

const INITIAL_NODES: Node[] = [
    { id: 0, value: 1, next: 1, x: 50, y: 100 },
    { id: 1, value: 2, next: 2, x: 150, y: 100 },
    { id: 2, value: 3, next: 3, x: 250, y: 100 },
    { id: 3, value: 4, next: 4, x: 350, y: 100 },
    { id: 4, value: 5, next: 5, x: 450, y: 100 },
    { id: 5, value: 6, next: 6, x: 550, y: 100 },
    { id: 6, value: 7, next: null, x: 650, y: 100 },
];

export function FastSlowVisual() {
    const [scenario, setScenario] = useState<"middle" | "cycle">("middle");
    const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
    const [slow, setSlow] = useState(0);
    const [fast, setFast] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(800);
    const [status, setStatus] = useState("Ready to start");
    const [cycleNodeIndex, setCycleNodeIndex] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [collision, setCollision] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Reset simulation
    const reset = useCallback(() => {
        setSlow(0);
        setFast(0);
        setIsPlaying(false);
        setIsFinished(false);
        setCollision(false);
        setStatus("Ready to start");
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    // Effect for handling cycle toggle
    useEffect(() => {
        const updated = INITIAL_NODES.map((n, i) => {
            if (scenario === "cycle" && i === INITIAL_NODES.length - 1 && cycleNodeIndex !== null) {
                return { ...n, next: cycleNodeIndex };
            }
            return { ...n, next: i < INITIAL_NODES.length - 1 ? i + 1 : null };
        });
        setNodes(updated);
        reset();
    }, [scenario, cycleNodeIndex, reset]);

    const step = useCallback(() => {
        if (isFinished) return;

        setSlow((prevSlow) => {
            const currentSlowNode = nodes[prevSlow];
            const nextSlow = currentSlowNode.next !== null ? currentSlowNode.next : prevSlow;

            setFast((prevFast) => {
                const currentFastNode = nodes[prevFast];
                let nextFast = prevFast;

                if (currentFastNode.next !== null) {
                    const firstStep = currentFastNode.next;
                    const secondStep = nodes[firstStep].next;
                    nextFast = secondStep !== null ? secondStep : firstStep;
                }

                // Logic for stopping/detection
                if (scenario === "middle") {
                    const currentFast = nodes[nextFast];
                    if (currentFast.next === null) {
                        setIsFinished(true);
                        setIsPlaying(false);
                        setStatus(`Middle Node: ${nodes[nextSlow].value}`);
                    } else if (nodes[currentFast.next].next === null) {
                        setIsFinished(true);
                        setIsPlaying(false);
                        setStatus(`Middle Node: ${nodes[nextSlow].value} (reached end)`);
                    } else {
                        setStatus(`Slow: ${nodes[nextSlow].value}, Fast: ${nodes[nextFast].value}`);
                    }
                } else {
                    if (nextSlow === nextFast && nextSlow !== 0) {
                        setCollision(true);
                        setIsFinished(true);
                        setIsPlaying(false);
                        setStatus("Cycle Detected! Pointers met at node " + nodes[nextSlow].value);
                    } else if (nodes[nextFast].next === null) {
                        setIsFinished(true);
                        setIsPlaying(false);
                        setStatus("End reached - No cycle found.");
                    } else {
                        setStatus(`Slow: ${nodes[nextSlow].value}, Fast: ${nodes[nextFast].value}`);
                    }
                }

                return nextFast;
            });

            return nextSlow;
        });
    }, [isFinished, nodes, scenario]);

    useEffect(() => {
        if (isPlaying && !isFinished) {
            timerRef.current = setInterval(step, speed);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, isFinished, step, speed]);

    const togglePlayback = () => setIsPlaying(!isPlaying);

    return (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-indigo-500 border-indigo-500/20">Tortoise & Hare</Badge>
                        <h2 className="text-2xl font-bold tracking-tight">Fast & Slow Pointers</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Visualize pointer speed differences in action.</p>
                </div>

                <div className="flex bg-white dark:bg-slate-950 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 gap-2">
                    <Button
                        variant={scenario === "middle" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setScenario("middle")}
                        className="text-xs font-bold"
                    >
                        <Split className="w-3 h-3 mr-2" /> Find Middle
                    </Button>
                    <Button
                        variant={scenario === "cycle" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setScenario("cycle")}
                        className="text-xs font-bold"
                    >
                        <RotateCcw className="w-3 h-3 mr-2" /> Detect Cycle
                    </Button>
                </div>
            </div>

            {/* Visualization Canvas */}
            <div className="relative h-64 bg-slate-950 rounded-3xl border-2 border-slate-900 mb-8 overflow-hidden group">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" />

                <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 700 200">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
                            <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-700" />
                        </marker>
                        <marker id="active-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
                            <polygon points="0 0, 10 3.5, 0 7" className="fill-indigo-500" />
                        </marker>
                    </defs>

                    {/* Links */}
                    {nodes.map((node, i) => {
                        if (node.next === null) return null;
                        const target = nodes[node.next];

                        // Regular straight link
                        if (node.next === i + 1) {
                            return (
                                <line
                                    key={`link-${i}`}
                                    x1={node.x + 20}
                                    y1={node.y}
                                    x2={target.x - 20}
                                    y2={target.y}
                                    strokeWidth="2"
                                    className="stroke-slate-800"
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        }

                        // Cycle link (curved path back)
                        if (scenario === "cycle" && node.next !== null && node.next < i) {
                            const dx = node.x - target.x;
                            const h = 60; // Curve height
                            const path = `M ${node.x + 10} ${node.y + 15} Q ${(node.x + target.x) / 2} ${node.y + h} ${target.x} ${target.y + 20}`;
                            return (
                                <path
                                    key="cycle-link"
                                    d={path}
                                    fill="none"
                                    strokeWidth="2"
                                    className="stroke-rose-500/50"
                                    strokeDasharray="4 2"
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        }
                        return null;
                    })}

                    {/* Nodes */}
                    {nodes.map((node, i) => (
                        <g key={`node-group-${i}`}>
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r="20"
                                className={cn(
                                    "transition-all duration-300",
                                    scenario === "cycle" ? "cursor-pointer hover:stroke-indigo-500" : "",
                                    node.id === slow || node.id === fast ? "stroke-indigo-500 fill-indigo-500/10" : "stroke-slate-800 fill-slate-900"
                                )}
                                strokeWidth="2"
                                onClick={() => scenario === "cycle" && setCycleNodeIndex(i)}
                            />
                            <text
                                x={node.x}
                                y={node.y}
                                textAnchor="middle"
                                dy=".3em"
                                className="text-xs font-bold fill-slate-400 select-none pointer-events-none"
                            >
                                {node.value}
                            </text>

                            {/* Avatars */}
                            <AnimatePresence>
                                {slow === i && (
                                    <motion.g
                                        layoutId="tortoise"
                                        initial={{ opacity: 0, y: -40 }}
                                        animate={{ opacity: 1, y: -30 }}
                                        className="pointer-events-none"
                                    >
                                        <text x={node.x} y={node.y} textAnchor="middle" className="text-lg">🐢</text>
                                        <text x={node.x} y={node.y - 12} textAnchor="middle" className="text-[8px] font-bold uppercase fill-indigo-400">Slow</text>
                                    </motion.g>
                                )}
                                {fast === i && (
                                    <motion.g
                                        layoutId="hare"
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 40 }}
                                        className="pointer-events-none"
                                    >
                                        <text x={node.x} y={node.y} textAnchor="middle" className="text-lg">🐇</text>
                                        <text x={node.x} y={node.y + 12} textAnchor="middle" className="text-[8px] font-bold uppercase fill-indigo-400">Fast</text>
                                    </motion.g>
                                )}
                            </AnimatePresence>

                            {collision && slow === i && (
                                <motion.circle
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{ scale: 3, opacity: 0 }}
                                    cx={node.x}
                                    cy={node.y}
                                    className="fill-rose-500 pointer-events-none"
                                />
                            )}
                        </g>
                    ))}
                </svg>

                {/* Status Overlay */}
                <div className="absolute bottom-4 left-6 px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-600")} />
                    {status}
                </div>
            </div>

            {/* Dash Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={togglePlayback}
                            disabled={isFinished}
                            className={cn("flex-1 min-w-[140px] h-12 gap-2 text-lg font-bold transition-all", isPlaying ? "bg-amber-600 hover:bg-amber-500" : "bg-indigo-600 hover:bg-indigo-500")}
                        >
                            {isPlaying ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Auto-Play</>}
                        </Button>
                        <div className="flex gap-2 grow sm:grow-0">
                            <Button
                                variant="outline"
                                onClick={step}
                                disabled={isPlaying || isFinished}
                                className="h-12 flex-1 sm:w-16 sm:flex-none border-2"
                            >
                                <SkipForward className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={reset}
                                className="h-12 flex-1 sm:w-16 sm:flex-none border-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 uppercase tracking-wider">
                            <span>Visualization Speed</span>
                            <span>{speed}ms</span>
                        </div>
                        <input
                            type="range"
                            min="200"
                            max="1500"
                            step="100"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>

                {/* Info / Pseudocode */}
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> Logic Tracker
                        </h4>
                        <Badge variant="outline" className="text-[10px] bg-indigo-500/5">O(n) Time / O(1) Space</Badge>
                    </div>

                    <pre className="text-[11px] font-mono leading-relaxed text-indigo-900/60 dark:text-indigo-400/60 space-y-1">
                        <div className={cn(fast !== slow ? "text-indigo-900 dark:text-indigo-400" : "")}>slow = slow.next</div>
                        <div className={cn(fast !== slow ? "text-indigo-900 dark:text-indigo-400" : "")}>fast = fast.next.next</div>
                        {scenario === "cycle" && (
                            <div className={cn(collision ? "text-rose-500 font-bold" : "")}>
                                if (slow == fast) return Cycle!
                            </div>
                        )}
                        {scenario === "middle" && (
                            <div className={cn(isFinished ? "text-emerald-500 font-bold" : "")}>
                                if (fast == null) return slow (Middle)
                            </div>
                        )}
                    </pre>

                    <div className="pt-2 border-t border-indigo-500/10">
                        <p className="text-[11px] leading-relaxed text-slate-500 italic">
                            {scenario === "middle"
                                ? "Insight: Since Fast moves twice as fast as Slow, it reaches the end in exactly the time it takes Slow to reach the midpoint."
                                : "Insight: Floyd’s algorithm. If a cycle exists, the 'Hare' (Fast) is guaranteed to eventually lap the 'Tortoise' (Slow)."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cycle Editor Hint */}
            {scenario === "cycle" && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs"
                >
                    <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-slate-500 font-medium">
                        Click on any node in the canvas above to create a loop from the tail to that node.
                    </span>
                </motion.div>
            )}
        </Card>
    );
}
