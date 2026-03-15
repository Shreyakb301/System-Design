"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    ListOrdered,
    Info,
    Activity,
    ArrowRight
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
    edge?: [number, number];
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

const TRAVERSAL_META = {
    preorder: {
        label: "Preorder",
        rule: "Visit -> Left -> Right",
        ruleParts: ["Visit", "Left", "Right"],
        structureTitle: "Call Stack (DFS)",
        structureHelp: "Nodes waiting to return after exploring deeper.",
        insight: "DFS visits the node before exploring its children.",
    },
    inorder: {
        label: "Inorder",
        rule: "Left -> Visit -> Right",
        ruleParts: ["Left", "Visit", "Right"],
        structureTitle: "Call Stack (DFS)",
        structureHelp: "Nodes waiting to return after exploring deeper.",
        insight: "Inorder visits the left subtree before the node. In a BST this produces sorted values.",
    },
    postorder: {
        label: "Postorder",
        rule: "Left -> Right -> Visit",
        ruleParts: ["Left", "Right", "Visit"],
        structureTitle: "Call Stack (DFS)",
        structureHelp: "Nodes waiting to return after exploring deeper.",
        insight: "Postorder processes children before their parent, which is useful for deletion.",
    },
    levelorder: {
        label: "Level Order",
        rule: "Visit nodes level by level",
        ruleParts: ["Visit", "Each Level", "Then Next Level"],
        structureTitle: "Queue (BFS)",
        structureHelp: "Nodes waiting to be visited next level.",
        insight: "Level order uses a queue to explore nodes one level at a time.",
    },
} as const;

export function TreeTraversalVisual() {
    const [traversal, setTraversal] = useState<TraversalType>("preorder");
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
                result.push({ nodeId: TREE_DATA[nodeId].left, action: "highlight", stack: [...stack], visited: [...visited], message: `Move Left to child ${TREE_DATA[nodeId].left}.`, edge: [nodeId, TREE_DATA[nodeId].left] });
                traverse(TREE_DATA[nodeId].left);
            }

            if (TREE_DATA[nodeId].right) {
                result.push({ nodeId: TREE_DATA[nodeId].right, action: "highlight", stack: [...stack], visited: [...visited], message: `Move Right to child ${TREE_DATA[nodeId].right}.`, edge: [nodeId, TREE_DATA[nodeId].right] });
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
                result.push({ nodeId: TREE_DATA[nodeId].left, action: "highlight", stack: [...stack], visited: [...visited], message: `Exploring Left subtree of ${nodeId}...`, edge: [nodeId, TREE_DATA[nodeId].left] });
                traverse(TREE_DATA[nodeId].left);
            }

            // Visit
            visited.push(nodeId);
            result.push({ nodeId, action: "visit", stack: [...stack], visited: [...visited], message: `IN-ORDER: All left children processed. Visit ${nodeId} now.` });

            if (TREE_DATA[nodeId].right) {
                result.push({ nodeId: TREE_DATA[nodeId].right, action: "highlight", stack: [...stack], visited: [...visited], message: `Exploring Right subtree of ${nodeId}...`, edge: [nodeId, TREE_DATA[nodeId].right] });
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
                result.push({ nodeId: TREE_DATA[nodeId].left, action: "highlight", stack: [...stack], visited: [...visited], message: `Go Left child ${TREE_DATA[nodeId].left}.`, edge: [nodeId, TREE_DATA[nodeId].left] });
                traverse(TREE_DATA[nodeId].left);
            }

            if (TREE_DATA[nodeId].right) {
                result.push({ nodeId: TREE_DATA[nodeId].right, action: "highlight", stack: [...stack], visited: [...visited], message: `Go Right child ${TREE_DATA[nodeId].right}.`, edge: [nodeId, TREE_DATA[nodeId].right] });
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
                result.push({ nodeId: node.left, action: "enqueue", queue: [...queue], visited: [...visited], message: `Enqueue Left child ${node.left}.`, edge: [nodeId, node.left] });
            }
            if (node.right) {
                queue.push(node.right);
                result.push({ nodeId: node.right, action: "enqueue", queue: [...queue], visited: [...visited], message: `Enqueue Right child ${node.right}.`, edge: [nodeId, node.right] });
            }
        }
        return result;
    }, []);

    // --- State Management ---
    const steps = useMemo(() => {
        if (traversal === "preorder") return generatePreorder();
        if (traversal === "inorder") return generateInorder();
        if (traversal === "postorder") return generatePostorder();
        return generateLevelOrder();
    }, [generateInorder, generateLevelOrder, generatePostorder, generatePreorder, traversal]);

    const handleNext = useCallback(() => {
        if (currentStepIdx < steps.length - 1) {
            setCurrentStepIdx(prev => prev + 1);
        } else {
            setIsPlaying(false);
        }
    }, [currentStepIdx, steps.length]);

    const handleReset = () => {
        setCurrentStepIdx(-1);
        setIsPlaying(false);
    };

    const handleTraversalChange = (type: TraversalType) => {
        setTraversal(type);
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
    }, [handleNext, isPlaying, speed]);

    const currentStep = currentStepIdx >= 0 ? steps[currentStepIdx] : null;
    const traversalMeta = useMemo(() => TRAVERSAL_META[traversal], [traversal]);
    const structureItems = useMemo(
        () => (traversal === "levelorder" ? currentStep?.queue ?? [] : currentStep?.stack ?? []),
        [currentStep?.queue, currentStep?.stack, traversal]
    );
    const visitedItems = currentStep?.visited ?? [];
    const visitOrderText = visitedItems.length > 0 ? visitedItems.join(" → ") : "-";
    const structurePreview = useMemo(() => {
        const isQueue = traversal === "levelorder";
        const orderedItems = isQueue ? structureItems : [...structureItems].reverse();
        const leadLabel = isQueue ? "Front" : "Top";
        return {
            leadLabel,
            leadValue: orderedItems[0] ?? null,
            previewValues: orderedItems.slice(1, 3),
            hiddenCount: Math.max(0, orderedItems.length - 3),
        };
    }, [structureItems, traversal]);

    const isActiveEdge = useCallback((from: number, to: number) => {
        if (!currentStep?.edge) return false;
        return currentStep.edge[0] === from && currentStep.edge[1] === to;
    }, [currentStep]);

    return (
        <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
                        <Activity className="h-4.5 w-4.5 text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <p className="max-w-3xl text-sm leading-5 text-slate-400">
                            Compare preorder, inorder, postorder, and level order by stepping through the same tree.
                        </p>

                        <div className="max-w-4xl rounded-xl border border-slate-800 bg-slate-900/40 p-0.5">
                            <div className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
                                {(["preorder", "inorder", "postorder", "levelorder"] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleTraversalChange(type)}
                                        className={cn(
                                            "rounded-lg px-3 py-1.5 font-medium transition-colors",
                                            traversal === type ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        {TRAVERSAL_META[type].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-0.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Traversal Rule
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                                {traversalMeta.ruleParts.map((part, index) => (
                                    <div key={part} className="flex items-center gap-2">
                                        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-0.5 text-sm text-slate-200">
                                            {part}
                                        </span>
                                        {index < traversalMeta.ruleParts.length - 1 ? (
                                            <ArrowRight className="h-4 w-4 text-slate-600" />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2.5 rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-2.5">
                    <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1.85fr)_minmax(270px,0.68fr)]">
                        <div className="min-w-0">
                            <div className="overflow-hidden rounded-[1rem] border border-slate-800 bg-slate-950/70">
                                <div className="flex h-[210px] items-center justify-center p-2">
                                    <svg className="h-[194px] w-full" viewBox="0 0 700 330">
                                        <g>
                                            {Object.values(TREE_DATA).map((node) => (
                                                <g key={`edges-${node.id}`}>
                                                    {node.left !== null && TREE_DATA[node.left] && (
                                                        <motion.line
                                                            x1={node.x}
                                                            y1={node.y}
                                                            x2={TREE_DATA[node.left].x}
                                                            y2={TREE_DATA[node.left].y}
                                                            strokeWidth={isActiveEdge(node.id, node.left) ? 5 : 3}
                                                            animate={{
                                                                stroke: isActiveEdge(node.id, node.left)
                                                                    ? "#60a5fa"
                                                                    : "#1e293b",
                                                                opacity: isActiveEdge(node.id, node.left) ? 1 : 0.9,
                                                            }}
                                                        />
                                                    )}
                                                    {node.right !== null && TREE_DATA[node.right] && (
                                                        <motion.line
                                                            x1={node.x}
                                                            y1={node.y}
                                                            x2={TREE_DATA[node.right].x}
                                                            y2={TREE_DATA[node.right].y}
                                                            strokeWidth={isActiveEdge(node.id, node.right) ? 5 : 3}
                                                            animate={{
                                                                stroke: isActiveEdge(node.id, node.right)
                                                                    ? "#60a5fa"
                                                                    : "#1e293b",
                                                                opacity: isActiveEdge(node.id, node.right) ? 1 : 0.9,
                                                            }}
                                                        />
                                                    )}
                                                </g>
                                            ))}
                                        </g>

                                        <g>
                                            {Object.values(TREE_DATA).map((node) => {
                                                const isVisited = currentStep?.visited?.includes(node.id);
                                                const isHighlighted = currentStep?.nodeId === node.id;
                                                const inStructure = structureItems.includes(node.id);

                                                return (
                                                    <motion.g key={`node-${node.id}`} layout>
                                                        <motion.circle
                                                            cx={node.x}
                                                            cy={node.y}
                                                            initial={false}
                                                            animate={{
                                                            r: isHighlighted ? 28 : 26,
                                                                fill: isVisited ? "rgba(16, 185, 129, 0.12)" : "rgba(15, 23, 42, 1)",
                                                                stroke: isVisited
                                                                    ? "#34d399"
                                                                    : isHighlighted
                                                                        ? "#60a5fa"
                                                                        : inStructure
                                                                            ? "#475569"
                                                                            : "#1e293b",
                                                            strokeWidth: isHighlighted ? 4.5 : isVisited || inStructure ? 3.5 : 3,
                                                            }}
                                                        />
                                                        <text
                                                            x={node.x}
                                                            y={node.y}
                                                            textAnchor="middle"
                                                            dy=".35em"
                                                            className={cn(
                                                                "text-[18px] font-bold transition-colors",
                                                                isVisited
                                                                    ? "fill-emerald-300"
                                                                    : isHighlighted
                                                                        ? "fill-blue-200"
                                                                        : "fill-slate-200"
                                                            )}
                                                        >
                                                            {node.value}
                                                        </text>

                                                        <AnimatePresence>
                                                            {isHighlighted && (
                                                                <motion.circle
                                                                    cx={node.x}
                                                                    cy={node.y}
                                                                    r="35"
                                                                    initial={{ scale: 0.85, opacity: 0 }}
                                                                    animate={{ scale: 1.15, opacity: 0.25 }}
                                                                    exit={{ scale: 0.9, opacity: 0 }}
                                                                    transition={{ repeat: Infinity, duration: 1.2 }}
                                                                    stroke={currentStep?.action === "visit" ? "#34d399" : "#60a5fa"}
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
                                </div>
                            </div>

                            <div className="mt-2 h-[48px] rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
                                <p className="text-xs text-slate-200">
                                    {currentStep?.message ?? "Choose a traversal and step through the tree."}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <div className="h-[98px] rounded-[1.1rem] border border-slate-800 bg-slate-900/40 p-2.5">
                                <div className="space-y-0.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        {traversalMeta.structureTitle}
                                    </p>
                                    <p className="text-[10px] leading-4 text-slate-400">{traversalMeta.structureHelp}</p>
                                </div>

                                <div className="mt-1.5 flex h-[52px] flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
                                    {structurePreview.leadValue !== null ? (
                                        <>
                                            <div className="flex items-center justify-between text-[11px] leading-none">
                                                <span className="font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                    {structurePreview.leadLabel}
                                                </span>
                                                <span className="font-semibold text-blue-200">{structurePreview.leadValue}</span>
                                            </div>
                                            <div className="flex min-h-[20px] flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                                                {structurePreview.previewValues.map((value) => (
                                                    <span
                                                        key={value}
                                                        className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 leading-none"
                                                    >
                                                        {value}
                                                    </span>
                                                ))}
                                                {structurePreview.hiddenCount > 0 ? (
                                                    <span className="leading-none text-slate-500">+{structurePreview.hiddenCount} more</span>
                                                ) : null}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-xs italic text-slate-500">Empty</p>
                                    )}
                                </div>
                            </div>

                            <div className="h-[88px] rounded-[1.1rem] border border-slate-800 bg-slate-900/40 p-2.5">
                                <div className="flex items-center gap-2">
                                    <ListOrdered className="h-4 w-4 text-blue-300" />
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Visit Order
                                    </p>
                                </div>

                                <div className="mt-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
                                    <motion.p
                                        key={`${traversal}-${currentStepIdx}`}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="overflow-hidden whitespace-normal text-[11px] leading-4 text-slate-200"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {visitOrderText}
                                    </motion.p>
                                </div>
                            </div>

                            <div className="h-[84px] rounded-[1.1rem] border border-slate-800 bg-slate-900/40 p-2.5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-500/10">
                                        <Info className="h-3 w-3 text-blue-300" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                            Simulation Insight
                                        </p>
                                        <p
                                            className="text-[10px] leading-4 text-slate-300"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {traversalMeta.insight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2.5 border-t border-slate-800 pt-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                className={cn(
                                    "h-9 rounded-xl px-4 text-white",
                                    isPlaying ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"
                                )}
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                {isPlaying ? "Pause" : "Play"}
                            </Button>
                            <Button
                                variant="outline"
                                className="h-9 rounded-xl border-slate-700 bg-transparent px-3.5 text-slate-200 hover:bg-slate-900 hover:text-white"
                                onClick={handleNext}
                                disabled={isPlaying || currentStepIdx === steps.length - 1}
                            >
                                <SkipForward className="h-4 w-4" />
                                Step
                            </Button>
                            <Button
                                variant="outline"
                                className="h-9 rounded-xl border-slate-700 bg-transparent px-3.5 text-slate-200 hover:bg-slate-900 hover:text-white"
                                onClick={handleReset}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </Button>
                            <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
                                {currentStepIdx + 1} / {steps.length}
                            </span>
                        </div>

                        <div className="ml-auto flex w-full max-w-[220px] items-center gap-2 lg:w-[220px]">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Slow</span>
                            <input
                                type="range"
                                value={speed[0]}
                                onChange={(e) => setSpeed([parseInt(e.target.value)])}
                                max={1500}
                                min={200}
                                step={100}
                                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
                            />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fast</span>
                        </div>
                    </div>
                </div>
        </section>
    );
}
