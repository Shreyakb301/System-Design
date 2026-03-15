"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    Layers,
    Database,
    Zap,
    Split,
    MousePointer2,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface Node {
    id: string;
    x: number;
    y: number;
}

interface Edge {
    from: string;
    to: string;
}

type NodeStatus = "unvisited" | "discovered" | "visited";

interface TraversalState {
    discovered: Set<string>;
    visited: Set<string>;
    dataStructure: string[]; // Stack or Queue
    visitOrder: string[];
    parentPointers: Record<string, string | null>;
    distances?: Record<string, number>;
    currentProcessingNode: string | null;
    message: string;
}

// --- Graph Data (A bit more complex than a tree) ---
const NODES: Node[] = [
    { id: "A", x: 350, y: 50 },
    { id: "B", x: 200, y: 120 },
    { id: "C", x: 500, y: 120 },
    { id: "D", x: 120, y: 220 },
    { id: "E", x: 280, y: 220 },
    { id: "F", x: 420, y: 220 },
    { id: "G", x: 580, y: 220 },
    { id: "H", x: 350, y: 290 },
];

const EDGES: Edge[] = [
    { from: "A", to: "B" }, { from: "A", to: "C" },
    { from: "B", to: "D" }, { from: "B", to: "E" },
    { from: "C", to: "F" }, { from: "C", to: "G" },
    { from: "E", to: "H" }, { from: "F", to: "H" },
    { from: "D", to: "E" }, // Cycle/Alternative path
    { from: "G", to: "F" }  // Another cross-edge
];

const ADJ: Record<string, string[]> = {};
NODES.forEach(n => ADJ[n.id] = []);
EDGES.forEach(e => {
    ADJ[e.from].push(e.to);
    ADJ[e.to].push(e.from); // Undirected for simulation
});

function GraphCanvas({
    state,
    title,
    type,
    startNode,
    onStart,
    stepIdx,
}: {
    state: TraversalState | null;
    title: string;
    type: "bfs" | "dfs";
    startNode: string | null;
    onStart: (nodeId: string) => void;
    stepIdx: number;
}) {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-inner dark:border-slate-800 dark:bg-slate-950 min-h-[310px]">
            <div className="z-10 mb-3 flex items-center justify-between">
                <Badge
                    variant="outline"
                    className={cn(
                        "px-3 py-1 font-bold",
                        type === "bfs"
                            ? "border-amber-500 bg-amber-50 text-amber-600"
                            : "border-indigo-500 bg-indigo-50 text-indigo-600"
                    )}
                >
                    {title}
                </Badge>
                {state ? (
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                        {state.visited.size} / {NODES.length} Visited
                    </span>
                ) : null}
            </div>

            <div className="relative flex-1">
                <svg className="h-full w-full" viewBox="0 0 700 400">
                    <g>
                        {EDGES.map((edge, index) => {
                            const from = NODES.find((node) => node.id === edge.from)!;
                            const to = NODES.find((node) => node.id === edge.to)!;
                            const isTraversalEdge =
                                state?.parentPointers[edge.to] === edge.from ||
                                state?.parentPointers[edge.from] === edge.to;

                            return (
                                <motion.line
                                    key={`edge-${index}`}
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    initial={{ opacity: 0.2 }}
                                    animate={{
                                        opacity: isTraversalEdge ? 1 : 0.1,
                                        stroke: isTraversalEdge
                                            ? type === "bfs"
                                                ? "#f59e0b"
                                                : "#6366f1"
                                            : "#94a3b8",
                                        strokeWidth: isTraversalEdge ? 3 : 1,
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            );
                        })}
                    </g>

                    <g>
                        {NODES.map((node) => {
                            const status: NodeStatus = state?.visited.has(node.id)
                                ? "visited"
                                : state?.discovered.has(node.id)
                                  ? "discovered"
                                  : "unvisited";
                            const isCurrent = state?.currentProcessingNode === node.id;

                            return (
                                <g
                                    key={`node-${node.id}`}
                                    onClick={() => !startNode && onStart(node.id)}
                                    className={cn(!startNode && "cursor-pointer")}
                                >
                                    <motion.circle
                                        cx={node.x}
                                        cy={node.y}
                                        r="22"
                                        initial={{ scale: 1 }}
                                        animate={{
                                            scale: isCurrent ? 1.2 : 1,
                                            fill:
                                                status === "visited"
                                                    ? type === "bfs"
                                                        ? "#fef3c7"
                                                        : "#e0e7ff"
                                                    : status === "discovered"
                                                      ? "#f1f5f9"
                                                      : "#ffffff",
                                            stroke:
                                                status === "visited"
                                                    ? type === "bfs"
                                                        ? "#f59e0b"
                                                        : "#6366f1"
                                                    : status === "discovered"
                                                      ? "#94a3b8"
                                                      : "#e2e8f0",
                                            strokeWidth: isCurrent ? 4 : status !== "unvisited" ? 3 : 1.5,
                                        }}
                                        className="dark:fill-slate-900"
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y}
                                        textAnchor="middle"
                                        dy=".3em"
                                        className={cn(
                                            "text-sm font-bold",
                                            status === "visited"
                                                ? type === "bfs"
                                                    ? "fill-amber-700"
                                                    : "fill-indigo-700"
                                                : "fill-slate-500"
                                        )}
                                    >
                                        {node.id}
                                    </text>

                                    {type === "bfs" && state?.distances?.[node.id] !== undefined ? (
                                        <motion.text
                                            x={node.x + 25}
                                            y={node.y - 15}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="fill-amber-500 text-[10px] font-mono font-bold"
                                        >
                                            d={state.distances[node.id]}
                                        </motion.text>
                                    ) : null}

                                    <AnimatePresence>
                                        {isCurrent ? (
                                            <motion.circle
                                                cx={node.x}
                                                cy={node.y}
                                                r="30"
                                                initial={{ scale: 0.8, opacity: 0.5 }}
                                                animate={{ scale: 1.4, opacity: 0 }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                stroke={type === "bfs" ? "#f59e0b" : "#6366f1"}
                                                strokeWidth="2"
                                                fill="none"
                                            />
                                        ) : null}
                                    </AnimatePresence>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            <AnimatePresence mode="wait">
                {state ? (
                    <motion.div
                        key={`${type}-${stepIdx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex min-h-[40px] items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                        <Zap className={cn("mt-0.5 h-3.5 w-3.5", type === "bfs" ? "text-amber-500" : "text-indigo-500")} />
                        {state.message}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function DataStructureView({
    state,
    type,
}: {
    state: TraversalState | null;
    type: "bfs" | "dfs";
}) {
    const orderedValues = state
        ? type === "bfs"
            ? state.dataStructure
            : [...state.dataStructure].reverse()
        : [];
    const leadValue = orderedValues[0] ?? null;
    const previewValues = orderedValues.slice(1, 3);
    const hiddenCount = Math.max(orderedValues.length - 1 - previewValues.length, 0);

    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {type === "bfs" ? <Database className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                {type === "bfs" ? "Queue (FIFO)" : "Stack (LIFO)"}
            </h4>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                {type === "bfs"
                    ? "Nodes waiting to be visited next."
                    : "Nodes waiting while DFS explores deeper."}
            </p>
            <div className="mt-2 flex h-[52px] flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                {leadValue ? (
                    <>
                        <div className="flex items-center justify-between text-[11px] leading-none">
                            <span className="font-semibold uppercase tracking-[0.14em] text-slate-500">
                                {type === "bfs" ? "Front" : "Top"}
                            </span>
                            <span className={cn("font-semibold", type === "bfs" ? "text-amber-600 dark:text-amber-300" : "text-indigo-600 dark:text-indigo-300")}>
                                {leadValue}
                            </span>
                        </div>
                        <div className="flex min-h-[20px] flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-300">
                            {previewValues.map((value) => (
                                <span
                                    key={`${type}-${value}`}
                                    className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 leading-none dark:border-slate-800 dark:bg-slate-950"
                                >
                                    {value}
                                </span>
                            ))}
                            {hiddenCount > 0 ? <span className="leading-none">+{hiddenCount} more</span> : null}
                        </div>
                    </>
                ) : (
                    <p className="text-center text-[10px] italic text-slate-300">Empty</p>
                )}
            </div>
        </div>
    );
}

function VisitOrderView({
    state,
    type,
}: {
    state: TraversalState | null;
    type: "bfs" | "dfs";
}) {
    const visitOrderText = state?.visitOrder.length ? state.visitOrder.join(" → ") : "—";

    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Info className={cn("h-3.5 w-3.5", type === "bfs" ? "text-amber-500" : "text-indigo-500")} />
                Visit Order
            </h4>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                {type === "bfs" ? "Breadth-first visit sequence." : "Depth-first visit sequence."}
            </p>
            <div className="mt-2 h-[52px] rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                <p
                    className="text-[11px] leading-4 text-slate-600 dark:text-slate-300"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {visitOrderText}
                </p>
            </div>
        </div>
    );
}

export function GraphTraversalVisual() {
    const [startNode, setStartNode] = useState<string | null>(null);
    const [speed] = useState([800]);
    const [isPlaying, setIsPlaying] = useState(false);

    // Independent states for BFS and DFS
    const [bfsState, setBfsState] = useState<TraversalState | null>(null);
    const [dfsState, setDfsState] = useState<TraversalState | null>(null);

    const bfsHistory = useRef<TraversalState[]>([]);
    const dfsHistory = useRef<TraversalState[]>([]);
    const [stepIdx, setStepIdx] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Algorithm Generators ---

    const generateBFS = useCallback((start: string) => {
        const history: TraversalState[] = [];
        const visited = new Set<string>();
        const discovered = new Set<string>();
        const queue: string[] = [start];
        const parentPointers: Record<string, string | null> = { [start]: null };
        const distances: Record<string, number> = { [start]: 0 };

        discovered.add(start);
        history.push({
            discovered: new Set(discovered),
            visited: new Set(visited),
            dataStructure: [...queue],
            visitOrder: [],
            parentPointers: { ...parentPointers },
            distances: { ...distances },
            currentProcessingNode: null,
            message: `BFS: Initialized Queue with start node ${start}.`
        });

        const visitOrder: string[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;

            history.push({
                discovered: new Set(discovered),
                visited: new Set(visited),
                dataStructure: [...queue],
                visitOrder: [...visitOrder],
                parentPointers: { ...parentPointers },
                distances: { ...distances },
                currentProcessingNode: current,
                message: `BFS: Dequeued ${current}. Preparing to visit neighbors.`
            });

            visited.add(current);
            visitOrder.push(current);

            history.push({
                discovered: new Set(discovered),
                visited: new Set(visited),
                dataStructure: [...queue],
                visitOrder: [...visitOrder],
                parentPointers: { ...parentPointers },
                distances: { ...distances },
                currentProcessingNode: current,
                message: `BFS: Visited ${current}. Checking all unvisited neighbors.`
            });

            for (const neighbor of ADJ[current]) {
                if (!discovered.has(neighbor)) {
                    discovered.add(neighbor);
                    queue.push(neighbor);
                    parentPointers[neighbor] = current;
                    distances[neighbor] = distances[current] + 1;

                    history.push({
                        discovered: new Set(discovered),
                        visited: new Set(visited),
                        dataStructure: [...queue],
                        visitOrder: [...visitOrder],
                        parentPointers: { ...parentPointers },
                        distances: { ...distances },
                        currentProcessingNode: current,
                        message: `BFS: Found new neighbor ${neighbor}. Adding to Queue (Level ${distances[neighbor]}).`
                    });
                }
            }
        }

        history.push({
            discovered: new Set(discovered),
            visited: new Set(visited),
            dataStructure: [],
            visitOrder: [...visitOrder],
            parentPointers: { ...parentPointers },
            distances: { ...distances },
            currentProcessingNode: null,
            message: "BFS: Traversal complete. All reachable nodes visited."
        });

        return history;
    }, []);

    const generateDFS = useCallback((start: string) => {
        const history: TraversalState[] = [];
        const visited = new Set<string>();
        const discovered = new Set<string>();
        const stack: string[] = [start];
        const parentPointers: Record<string, string | null> = { [start]: null };

        discovered.add(start);
        history.push({
            discovered: new Set(discovered),
            visited: new Set(visited),
            dataStructure: [...stack],
            visitOrder: [],
            parentPointers: { ...parentPointers },
            currentProcessingNode: null,
            message: `DFS: Initialized Stack with start node ${start}.`
        });

        const visitOrder: string[] = [];

        while (stack.length > 0) {
            const current = stack.pop()!;

            // In DFS, a node might be added to stacks multiple times in some implementations, 
            // but here we mark discovered immediately to prevent duplicates in stack view.

            if (visited.has(current)) continue;

            history.push({
                discovered: new Set(discovered),
                visited: new Set(visited),
                dataStructure: [...stack],
                visitOrder: [...visitOrder],
                parentPointers: { ...parentPointers },
                currentProcessingNode: current,
                message: `DFS: Popped ${current} from stack. Visiting now.`
            });

            visited.add(current);
            visitOrder.push(current);

            history.push({
                discovered: new Set(discovered),
                visited: new Set(visited),
                dataStructure: [...stack],
                visitOrder: [...visitOrder],
                parentPointers: { ...parentPointers },
                currentProcessingNode: current,
                message: `DFS: Visited ${current}. Exploring its neighbors to dive deeper.`
            });

            // Iterate neighbors (reverse to match natural stack behavior if needed, but here we just go)
            for (const neighbor of [...ADJ[current]].reverse()) {
                if (!visited.has(neighbor)) {
                    if (!discovered.has(neighbor)) {
                        parentPointers[neighbor] = current;
                    }
                    discovered.add(neighbor);
                    stack.push(neighbor);

                    history.push({
                        discovered: new Set(discovered),
                        visited: new Set(visited),
                        dataStructure: [...stack],
                        visitOrder: [...visitOrder],
                        parentPointers: { ...parentPointers },
                        currentProcessingNode: current,
                        message: `DFS: Found neighbor ${neighbor}. Pushing onto Stack.`
                    });
                }
            }
        }

        history.push({
            discovered: new Set(discovered),
            visited: new Set(visited),
            dataStructure: [],
            visitOrder: [...visitOrder],
            parentPointers: { ...parentPointers },
            currentProcessingNode: null,
            message: "DFS: Traversal complete. Explored as deep as possible."
        });

        return history;
    }, []);

    // --- Interaction ---

    const handleStart = (nodeId: string) => {
        setStartNode(nodeId);
        bfsHistory.current = generateBFS(nodeId);
        dfsHistory.current = generateDFS(nodeId);
        setStepIdx(0);
        setBfsState(bfsHistory.current[0]);
        setDfsState(dfsHistory.current[0]);
        setIsPlaying(false);
    };

    const handleNext = useCallback(() => {
        const nextIdx = stepIdx + 1;
        const maxIdx = Math.max(bfsHistory.current.length, dfsHistory.current.length) - 1;

        if (nextIdx <= maxIdx) {
            setStepIdx(nextIdx);
            setBfsState(bfsHistory.current[Math.min(nextIdx, bfsHistory.current.length - 1)]);
            setDfsState(dfsHistory.current[Math.min(nextIdx, dfsHistory.current.length - 1)]);
        } else {
            setIsPlaying(false);
        }
    }, [stepIdx]);

    const handleReset = () => {
        setStartNode(null);
        setBfsState(null);
        setDfsState(null);
        setStepIdx(0);
        setIsPlaying(false);
        bfsHistory.current = [];
        dfsHistory.current = [];
    };

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(handleNext, speed[0]);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, handleNext, speed]);

    return (
        <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:px-6 sm:py-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Split className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Compare Graph Traversal strategies on the same topology.</p>
                </div>

                {!startNode ? (
                    <div className="flex items-center gap-3 animate-pulse bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <MousePointer2 className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Select a start node on any graph to begin</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <Button
                            size="sm"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={cn("h-8 font-bold gap-2 min-w-[90px]", isPlaying ? "bg-amber-500" : "bg-emerald-600")}
                        >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            {isPlaying ? "Pause" : "Play"}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleNext} disabled={isPlaying} className="h-8 w-8 hover:bg-slate-100">
                            <SkipForward className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleReset} className="h-8 w-8 hover:text-red-500">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* BFS Section */}
                <div className="space-y-3">
                    <GraphCanvas
                        state={bfsState}
                        title="Breadth-First Search"
                        type="bfs"
                        startNode={startNode}
                        onStart={handleStart}
                        stepIdx={stepIdx}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <DataStructureView state={bfsState} type="bfs" />
                        <VisitOrderView state={bfsState} type="bfs" />
                    </div>
                </div>

                {/* DFS Section */}
                <div className="space-y-3">
                    <GraphCanvas
                        state={dfsState}
                        title="Depth-First Search"
                        type="dfs"
                        startNode={startNode}
                        onStart={handleStart}
                        stepIdx={stepIdx}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <DataStructureView state={dfsState} type="dfs" />
                        <VisitOrderView state={dfsState} type="dfs" />
                    </div>
                </div>
            </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">BFS Intuition</h4>
                <p className="mt-2 text-[11px] leading-6 text-slate-600 dark:text-slate-400">
                    BFS explores level-by-level using a <strong>Queue</strong>. It is guaranteed to find the <strong>shortest path</strong> in unweighted graphs.
                </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">DFS Intuition</h4>
                <p className="mt-2 text-[11px] leading-6 text-slate-600 dark:text-slate-400">
                    DFS dives deep into a branch using a <strong>Stack</strong> before backtracking. It explores one path until a dead end before returning.
                </p>
            </div>
        </div>
        </section>
    );
}
