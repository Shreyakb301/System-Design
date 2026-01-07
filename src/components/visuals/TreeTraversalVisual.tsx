"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    Layers,
    ListOrdered,
    Info,
    ChevronRight,
    Activity,
    Database,
    Clock,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface TreeNode {
    id: number;
    value: number;
    left: number | null;
    right: number | null;
    x: number;
    y: number;
}

type TraversalType = "preorder" | "inorder" | "postorder" | "levelorder";

interface AnimationStep {
    nodeId: number | null;
    action: "highlight" | "visit" | "push" | "pop" | "enqueue" | "dequeue" | "backtrack";
    stack?: number[];
    queue?: number[];
    visited?: number[];
    message: string;
}

// --- BST Data ---
const TREE_DATA: Record<number, TreeNode> = {
    10: { id: 10, value: 10, left: 5, right: 15, x: 350, y: 50 },
    5: { id: 5, value: 5, left: 2, right: 8, x: 200, y: 130 },
    15: { id: 15, value: 15, left: 12, right: 20, x: 500, y: 130 },
    2: { id: 2, value: 2, left: null, right: null, x: 125, y: 210 },
    8: { id: 8, value: 8, left: null, right: null, x: 275, y: 210 },
    12: { id: 12, value: 12, left: null, right: null, x: 425, y: 210 },
    20: { id: 20, value: 20, left: null, right: null, x: 575, y: 210 },
};

export function TreeTraversalVisual() {
    const [traversal, setTraversal] = useState<TraversalType>("preorder");
    const [steps, setSteps] = useState<AnimationStep[]>([]);
    const [currentStepIdx, setCurrentStepIdx] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState([800]); // ms delay
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Traversal Algorithms ---

    const generatePreorder = useCallback(() => {
        const result: AnimationStep[] = [];
        const stack: number[] = [];
        const visited: number[] = [];

        const traverse = (nodeId: number | null) => {
            if (nodeId === null) return;

            stack.push(nodeId);
            result.push({ nodeId, action: "push", stack: [...stack], visited: [...visited], message: `Call stack: Entering node ${nodeId}` });

            // Visit
            visited.push(nodeId);
            result.push({ nodeId, action: "visit", stack: [...stack], visited: [...visited], message: `PRE-ORDER: Visit ${nodeId} (Parent) first.` });

            if (TREE_DATA[nodeId].left) {
                result.push({ nodeId: TREE_DATA[nodeId].left, action: "highlight", stack: [...stack], visited: [...visited], message: `Move Left to child ${TREE_DATA[nodeId].left}.` });
                traverse(TREE_DATA[nodeId].left);
            }

            if (TREE_DATA[nodeId].right) {
                result.push({ nodeId: TREE_DATA[nodeId].right, action: "highlight", stack: [...stack], visited: [...visited], message: `Move Right to child ${TREE_DATA[nodeId].right}.` });
                traverse(TREE_DATA[nodeId].right);
            }

            stack.pop();
            result.push({ nodeId, action: "pop", stack: [...stack], visited: [...visited], message: `Backtracking from ${nodeId}.` });
        };

        traverse(10);
        return result;
    }, []);

    const generateInorder = useCallback(() => {
        const result: AnimationStep[] = [];
        const stack: number[] = [];
        const visited: number[] = [];

        const traverse = (nodeId: number | null) => {
            if (nodeId === null) return;

            stack.push(nodeId);
            result.push({ nodeId, action: "push", stack: [...stack], visited: [...visited], message: `Call stack: Entering node ${nodeId}. We need to go Left as far as possible.` });

            if (TREE_DATA[nodeId].left) {
                result.push({ nodeId: TREE_DATA[nodeId].left, action: "highlight", stack: [...stack], visited: [...visited], message: `Exploring Left subtree of ${nodeId}...` });
                traverse(TREE_DATA[nodeId].left);
            }

            // Visit
            visited.push(nodeId);
            result.push({ nodeId, action: "visit", stack: [...stack], visited: [...visited], message: `IN-ORDER: All left children processed. Visit ${nodeId} now.` });

            if (TREE_DATA[nodeId].right) {
                result.push({ nodeId: TREE_DATA[nodeId].right, action: "highlight", stack: [...stack], visited: [...visited], message: `Exploring Right subtree of ${nodeId}...` });
                traverse(TREE_DATA[nodeId].right);
            }

            stack.pop();
            result.push({ nodeId, action: "pop", stack: [...stack], visited: [...visited], message: `Backtracking from ${nodeId}.` });
        };

        traverse(10);
        return result;
    }, []);

    const generatePostorder = useCallback(() => {
        const result: AnimationStep[] = [];
        const stack: number[] = [];
        const visited: number[] = [];

        const traverse = (nodeId: number | null) => {
            if (nodeId === null) return;

            stack.push(nodeId);
            result.push({ nodeId, action: "push", stack: [...stack], visited: [...visited], message: `Call stack: Entering node ${nodeId}. Processing children before visiting.` });

            if (TREE_DATA[nodeId].left) {
                result.push({ nodeId: TREE_DATA[nodeId].left, action: "highlight", stack: [...stack], visited: [...visited], message: `Go Left child ${TREE_DATA[nodeId].left}.` });
                traverse(TREE_DATA[nodeId].left);
            }

            if (TREE_DATA[nodeId].right) {
                result.push({ nodeId: TREE_DATA[nodeId].right, action: "highlight", stack: [...stack], visited: [...visited], message: `Go Right child ${TREE_DATA[nodeId].right}.` });
                traverse(TREE_DATA[nodeId].right);
            }

            // Visit
            visited.push(nodeId);
            result.push({ nodeId, action: "visit", stack: [...stack], visited: [...visited], message: `POST-ORDER: Children done. Finally visit ${nodeId}.` });

            stack.pop();
            result.push({ nodeId, action: "pop", stack: [...stack], visited: [...visited], message: `Finished node ${nodeId}. Backtracking.` });
        };

        traverse(10);
        return result;
    }, []);

    const generateLevelOrder = useCallback(() => {
        const result: AnimationStep[] = [];
        const queue: number[] = [10];
        const visited: number[] = [];

        result.push({ nodeId: 10, action: "enqueue", queue: [...queue], visited: [...visited], message: "LEVEL-ORDER: Start by adding Root to the Queue." });

        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            result.push({ nodeId, action: "dequeue", queue: [...queue], visited: [...visited], message: `Dequeue ${nodeId} and visit it.` });

            visited.push(nodeId);
            result.push({ nodeId, action: "visit", queue: [...queue], visited: [...visited], message: `Visited ${nodeId}. Now checking its children.` });

            const node = TREE_DATA[nodeId];
            if (node.left) {
                queue.push(node.left);
                result.push({ nodeId: node.left, action: "enqueue", queue: [...queue], visited: [...visited], message: `Enqueue Left child ${node.left}.` });
            }
            if (node.right) {
                queue.push(node.right);
                result.push({ nodeId: node.right, action: "enqueue", queue: [...queue], visited: [...visited], message: `Enqueue Right child ${node.right}.` });
            }
        }
        return result;
    }, []);

    // --- State Management ---

    useEffect(() => {
        let newSteps: AnimationStep[] = [];
        if (traversal === "preorder") newSteps = generatePreorder();
        else if (traversal === "inorder") newSteps = generateInorder();
        else if (traversal === "postorder") newSteps = generatePostorder();
        else newSteps = generateLevelOrder();

        setSteps(newSteps);
        setCurrentStepIdx(-1);
        setIsPlaying(false);
    }, [traversal, generatePreorder, generateInorder, generatePostorder, generateLevelOrder]);

    const handleNext = () => {
        if (currentStepIdx < steps.length - 1) {
            setCurrentStepIdx(prev => prev + 1);
        } else {
            setIsPlaying(false);
        }
    };

    const handleReset = () => {
        setCurrentStepIdx(-1);
        setIsPlaying(false);
    };

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(handleNext, speed[0]);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, currentStepIdx, speed]);

    const currentStep = currentStepIdx >= 0 ? steps[currentStepIdx] : null;

    return (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Tree Traversals</h2>
                    </div>
                    <p className="text-sm text-slate-500 italic">Preorder, Inorder, Postorder (DFS) vs. Level Order (BFS).</p>
                </div>

                <div className="flex bg-white dark:bg-slate-950 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 gap-1">
                    {(["preorder", "inorder", "postorder", "levelorder"] as const).map((type) => (
                        <Button
                            key={type}
                            variant={traversal === type ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setTraversal(type)}
                            className={cn(
                                "text-[10px] font-bold h-8 px-3 uppercase tracking-wider transition-all",
                                traversal === type ? "bg-indigo-600 shadow-md" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            {type.replace("order", "")}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Animation Controls & DS View */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Controls
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-indigo-500">
                                {currentStepIdx + 1} / {steps.length}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={cn(
                                    "flex-1 min-w-[110px] h-10 font-bold gap-2",
                                    isPlaying ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-600 hover:bg-emerald-500"
                                )}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isPlaying ? "Pause" : "Play"}
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handleNext}
                                    disabled={isPlaying || currentStepIdx === steps.length - 1}
                                    className="h-10 w-10 border-2 shrink-0"
                                >
                                    <SkipForward className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handleReset}
                                    className="h-10 w-10 border-2 shrink-0"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                <span>Slow</span>
                                <span>Speed</span>
                                <span>Fast</span>
                            </div>
                            <input
                                type="range"
                                value={speed[0]}
                                onChange={(e) => setSpeed([parseInt(e.target.value)])}
                                max={1500}
                                min={200}
                                step={100}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>

                    {/* Stack / Queue Visualization */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[160px] flex flex-col">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                            {traversal === "levelorder" ? <Database className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                            {traversal === "levelorder" ? "Queue (BFS)" : "Call Stack (DFS)"}
                        </h3>

                        <div className={cn(
                            "flex gap-2 flex-grow",
                            traversal === "levelorder" ? "flex-row items-center overflow-x-auto" : "flex-col-reverse items-center justify-start overflow-y-auto pt-2"
                        )}>
                            <AnimatePresence mode="popLayout">
                                {(traversal === "levelorder" ? currentStep?.queue : currentStep?.stack)?.map((val, idx) => (
                                    <motion.div
                                        key={`${traversal}-${val}-${idx}`}
                                        layout
                                        initial={{ scale: 0, opacity: 0, [traversal === "levelorder" ? "x" : "y"]: -20 }}
                                        animate={{ scale: 1, opacity: 1, [traversal === "levelorder" ? "x" : "y"]: 0 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 border-2",
                                            idx === 0 && traversal === "levelorder" ? "bg-amber-500 text-white border-amber-600" :
                                                idx === (currentStep?.stack?.length || 0) - 1 && traversal !== "levelorder" ? "bg-indigo-500 text-white border-indigo-600" :
                                                    "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                                        )}
                                    >
                                        {val}
                                    </motion.div>
                                ))}
                                {(!(traversal === "levelorder" ? currentStep?.queue : currentStep?.stack)?.length) && (
                                    <p className="text-[10px] text-slate-300 italic text-center w-full">Empty</p>
                                )}
                            </AnimatePresence>
                        </div>
                        {traversal === "levelorder" && (
                            <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase mt-2">
                                <span>Front</span>
                                <span>Rear</span>
                            </div>
                        )}
                    </div>

                    {/* Visit Order */}
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                        <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                            <ListOrdered className="w-3.5 h-3.5" /> Visit Order
                        </h4>
                        <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                            <AnimatePresence>
                                {currentStep?.visited?.map((val, i) => (
                                    <motion.div
                                        key={`visit-${val}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-7 h-7 rounded-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm"
                                    >
                                        {val}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Tree Visualization Area */}
                <div className="lg:col-span-3 relative bg-white dark:bg-slate-950 rounded-3xl border-2 border-slate-100 dark:border-slate-900 overflow-hidden shadow-inner group flex flex-col">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" />

                    {/* Intuition Box */}
                    <AnimatePresence mode="wait">
                        {currentStep && (
                            <motion.div
                                key={currentStepIdx}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-4 left-4 right-4 z-10 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-slate-800 shadow-lg flex items-center gap-3"
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg",
                                    currentStep.action === "visit" ? "bg-emerald-500" : "bg-indigo-500"
                                )}>
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                    {currentStep.message}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <svg className="w-full h-full min-h-[400px]" viewBox="0 0 700 350">
                        {/* Edges */}
                        <g>
                            {Object.values(TREE_DATA).map(node => (
                                <g key={`edges-${node.id}`}>
                                    {node.left !== null && TREE_DATA[node.left] && (
                                        <line
                                            x1={node.x} y1={node.y}
                                            x2={TREE_DATA[node.left].x} y2={TREE_DATA[node.left].y}
                                            stroke="currentColor" strokeWidth="2"
                                            className="text-slate-100 dark:text-slate-800"
                                        />
                                    )}
                                    {node.right !== null && TREE_DATA[node.right] && (
                                        <line
                                            x1={node.x} y1={node.y}
                                            x2={TREE_DATA[node.right].x} y2={TREE_DATA[node.right].y}
                                            stroke="currentColor" strokeWidth="2"
                                            className="text-slate-100 dark:text-slate-800"
                                        />
                                    )}
                                </g>
                            ))}
                        </g>

                        {/* Nodes */}
                        <g>
                            {Object.values(TREE_DATA).map(node => {
                                const isVisited = currentStep?.visited?.includes(node.id);
                                const isHighlighted = currentStep?.nodeId === node.id;
                                const inStackOrQueue = (traversal === "levelorder" ? currentStep?.queue : currentStep?.stack)?.includes(node.id);

                                return (
                                    <motion.g key={`node-${node.id}`} layout>
                                        <motion.circle
                                            cx={node.x}
                                            cy={node.y}
                                            r="22"
                                            animate={{
                                                fill: isVisited ? "rgba(16, 185, 129, 0.1)" : (isHighlighted ? "rgba(79, 70, 229, 0.1)" : "rgba(255, 255, 255, 1)"),
                                                stroke: isVisited ? "#10b981" : (isHighlighted ? "#4f46e5" : (inStackOrQueue ? "#94a3b8" : "#e2e8f0")),
                                                strokeWidth: isHighlighted ? 4 : (isVisited || inStackOrQueue ? 3 : 2)
                                            }}
                                            className="dark:fill-slate-950 dark:stroke-slate-900"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            textAnchor="middle"
                                            dy=".3em"
                                            className={cn(
                                                "text-sm font-bold transition-colors",
                                                isVisited ? "fill-emerald-600" : (isHighlighted ? "fill-indigo-600" : "fill-slate-400 dark:fill-slate-600")
                                            )}
                                        >
                                            {node.value}
                                        </text>

                                        {/* Status Indicators */}
                                        <AnimatePresence>
                                            {isHighlighted && (
                                                <motion.circle
                                                    cx={node.x}
                                                    cy={node.y}
                                                    r="28"
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1.2, opacity: 0.3 }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                    stroke={currentStep.action === "visit" ? "#10b981" : "#4f46e5"}
                                                    strokeWidth="2"
                                                    fill="none"
                                                />
                                            )}
                                        </AnimatePresence>
                                    </motion.g>
                                );
                            })}
                        </g>
                    </svg>

                    {/* Footer Fact */}
                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                        <div className="p-2 bg-amber-500/10 rounded-xl mt-0.5">
                            <Info className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulation Insight</p>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                                {traversal === "inorder" ? (
                                    <span><strong>Pro-Tip:</strong> In-order traversal of a <strong>Binary Search Tree</strong> always visits nodes in ascending (sorted) order.</span>
                                ) : traversal === "levelorder" ? (
                                    <span><strong>BFS Logic:</strong> Level-order uses a <strong>Queue</strong> to visit all siblings before moving to the next depth level. Great for finding shortest paths!</span>
                                ) : (
                                    <span><strong>DFS Logic:</strong> Depth-First patterns use a <strong>Stack</strong> (or recursion) to dive as deep as possible before backtracking.</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
