"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Trash2,
    RotateCcw,
    Zap,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface BSTNode {
    id: number;
    value: number;
    left: number | null; // id of left child
    right: number | null; // id of right child
    x: number;
    y: number;
    level: number;
}

interface Step {
    type: "compare" | "move" | "found" | "insert" | "delete" | "successor" | "replace";
    nodeId: number | null;
    message: string;
    targetValue?: number;
}

export function BSTVisual() {
    const [nodes, setNodes] = useState<Record<number, BSTNode>>({
        10: { id: 10, value: 10, left: 5, right: 15, x: 350, y: 50, level: 0 },
        5: { id: 5, value: 5, left: null, right: null, x: 200, y: 120, level: 1 },
        15: { id: 15, value: 15, left: null, right: null, x: 500, y: 120, level: 1 },
    });
    const [rootId, setRootId] = useState<number | null>(10);
    const [inputValue, setInputValue] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
    const [logs, setLogs] = useState<Step[]>([]);
    const [metrics, setMetrics] = useState({ height: 2, comparisons: 0 });
    const [worstCaseMode, setWorstCaseMode] = useState(false);
    const [foundNodeId, setFoundNodeId] = useState<number | null>(null);

    // --- Tree Logic Helpers ---

    const calculateHeight = useCallback((id: number | null, tree: Record<number, BSTNode>): number => {
        if (id === null || !tree[id]) return 0;
        return 1 + Math.max(calculateHeight(tree[id].left, tree), calculateHeight(tree[id].right, tree));
    }, []);

    const updateMetrics = useCallback((tree: Record<number, BSTNode>, root: number | null) => {
        setMetrics(prev => ({
            ...prev,
            height: calculateHeight(root, tree)
        }));
    }, [calculateHeight]);

    const getPositions = (id: number | null, level: number, xStart: number, xEnd: number, yStart: number, tree: Record<number, BSTNode>): Record<number, BSTNode> => {
        if (id === null || !tree[id]) return tree;
        const x = (xStart + xEnd) / 2;
        const y = yStart + level * 70;
        const updatedNode = { ...tree[id], x, y, level };
        let newTree = { ...tree, [id]: updatedNode };
        newTree = getPositions(updatedNode.left, level + 1, xStart, x, yStart, newTree);
        newTree = getPositions(updatedNode.right, level + 1, x, xEnd, yStart, newTree);
        return newTree;
    };

    const reformatTree = (tree: Record<number, BSTNode>, root: number | null) => {
        if (worstCaseMode) {
            // In worst case (skewed), we just stack them diagonally
            let current = root;
            let depth = 0;
            const newTree = { ...tree };
            while (current !== null) {
                newTree[current] = { ...newTree[current], x: 100 + depth * 60, y: 50 + depth * 60, level: depth };
                // Simplified skew: always follow one side for positions
                current = newTree[current].right || newTree[current].left;
                depth++;
            }
            return newTree;
        }
        return getPositions(root, 0, 0, 700, 50, tree);
    };

    // --- Actions ---

    const addLog = (step: Step) => setLogs(prev => [...prev.slice(-4), step]);

    const handleSearch = async () => {
        if (!inputValue || isAnimating) return;
        const val = parseInt(inputValue);
        setIsAnimating(true);
        setLogs([]);
        setFoundNodeId(null);
        let comps = 0;

        let currentId: number | null = rootId;
        while (currentId !== null) {
            comps++;
            setActiveNodeId(currentId);
            if (!nodes[currentId]) break;

            if (val === nodes[currentId]!.value) {
                addLog({ type: "found", nodeId: currentId, message: `Found ${val}! Operation complete.` });
                setFoundNodeId(currentId);
                break;
            } else if (val < nodes[currentId]!.value) {
                addLog({ type: "compare", nodeId: currentId, message: `${val} < ${nodes[currentId]!.value}, going Left.` });
                await new Promise(r => setTimeout(r, 600));
                currentId = nodes[currentId]!.left;
            } else {
                addLog({ type: "compare", nodeId: currentId, message: `${val} > ${nodes[currentId]!.value}, going Right.` });
                await new Promise(r => setTimeout(r, 600));
                currentId = nodes[currentId]!.right;
            }
        }

        if (currentId === null) {
            addLog({ type: "move", nodeId: null, message: `${val} not found in tree.` });
        }

        setMetrics(m => ({ ...m, comparisons: comps }));
        setTimeout(() => {
            setActiveNodeId(null);
            setIsAnimating(false);
        }, 1000);
    };

    const handleInsert = async () => {
        if (!inputValue || isAnimating || nodes[parseInt(inputValue)]) return;
        const val = parseInt(inputValue);
        setIsAnimating(true);
        setLogs([]);
        setFoundNodeId(null);
        let comps = 0;

        if (rootId === null) {
            const newNode: BSTNode = { id: val, value: val, left: null, right: null, x: 350, y: 50, level: 0 };
            setNodes({ [val]: newNode });
            setRootId(val);
            addLog({ type: "insert", nodeId: val, message: `Tree was empty. Inserted ${val} as root.` });
        } else {
            let currentId: number | null = rootId;
            let parentId: number | null = null;
            let side: "left" | "right" | null = null;

            while (currentId !== null) {
                comps++;
                setActiveNodeId(currentId);
                if (!nodes[currentId]) break;
                parentId = currentId;

                if (val < nodes[currentId]!.value) {
                    addLog({ type: "compare", nodeId: currentId, message: `${val} < ${nodes[currentId]!.value}, moving Left.` });
                    await new Promise(r => setTimeout(r, 600));
                    currentId = nodes[currentId]!.left;
                    side = "left";
                } else {
                    addLog({ type: "compare", nodeId: currentId, message: `${val} > ${nodes[currentId]!.value}, moving Right.` });
                    await new Promise(r => setTimeout(r, 600));
                    currentId = nodes[currentId]!.right;
                    side = "right";
                }
            }

            const newNode: BSTNode = { id: val, value: val, left: null, right: null, x: 0, y: 0, level: 0 };
            const newNodes = { ...nodes, [val]: newNode };
            if (parentId !== null && side) {
                newNodes[parentId] = { ...newNodes[parentId], [side]: val };
            }

            const formatted = reformatTree(newNodes, rootId);
            setNodes(formatted);
            updateMetrics(formatted, rootId);
            addLog({ type: "insert", nodeId: val, message: `Inserted ${val} at the end of the path.` });
        }

        setMetrics(m => ({ ...m, comparisons: comps }));
        setTimeout(() => {
            setActiveNodeId(null);
            setIsAnimating(false);
            setInputValue("");
        }, 800);
    };

    const handleDelete = async () => {
        if (!inputValue || isAnimating || !nodes[parseInt(inputValue)]) return;
        const val = parseInt(inputValue);
        setIsAnimating(true);
        setLogs([]);

        addLog({ type: "delete", nodeId: val, message: `Starting deletion of ${val}...` });
        await new Promise(r => setTimeout(r, 800));

        const newTree = { ...nodes };

        const deleteNode = (id: number | null, target: number): number | null => {
            if (id === null) return null;
            if (target < newTree[id].value) {
                newTree[id].left = deleteNode(newTree[id].left, target);
                return id;
            } else if (target > newTree[id].value) {
                newTree[id].right = deleteNode(newTree[id].right, target);
                return id;
            } else {
                // Found node to delete
                if (newTree[id].left === null && newTree[id].right === null) {
                    addLog({ type: "delete", nodeId: id, message: "Case 1: Leaf node. Simply removing it." });
                    delete newTree[id];
                    return null;
                }
                if (newTree[id].left === null) {
                    addLog({ type: "delete", nodeId: id, message: "Case 2: One child (Right). Promoting child." });
                    const temp = newTree[id].right;
                    delete newTree[id];
                    return temp;
                }
                if (newTree[id].right === null) {
                    addLog({ type: "delete", nodeId: id, message: "Case 2: One child (Left). Promoting child." });
                    const temp = newTree[id].left;
                    delete newTree[id];
                    return temp;
                }

                // Case 3: Two children
                addLog({ type: "successor", nodeId: id, message: "Case 3: Two children. Finding Inorder Successor (min of right sub-tree)." });
                let successor: number | null = newTree[id].right;
                while (successor !== null && newTree[successor]?.left !== null) {
                    successor = newTree[successor]!.left;
                }

                if (successor !== null) {
                    const succVal = newTree[successor].value;
                    addLog({ type: "replace", nodeId: successor, message: `Found successor ${succVal}. Replacing ${target} with ${succVal}.` });
                    newTree[id].value = succVal;
                    newTree[id].right = deleteNode(newTree[id].right, succVal);
                }
                return id;
            }
        };

        const newRoot = deleteNode(rootId, val);
        setRootId(newRoot);
        const formatted = reformatTree(newTree, newRoot);
        setNodes(formatted);
        updateMetrics(formatted, newRoot);

        setTimeout(() => {
            setIsAnimating(false);
            setInputValue("");
        }, 1000);
    };

    const resetTree = () => {
        setNodes({
            10: { id: 10, value: 10, left: 5, right: 15, x: 350, y: 50, level: 0 },
            5: { id: 5, value: 5, left: null, right: null, x: 200, y: 120, level: 1 },
            15: { id: 15, value: 15, left: null, right: null, x: 500, y: 120, level: 1 },
        });
        setRootId(10);
        setLogs([]);
        setMetrics({ height: 2, comparisons: 0 });
        setInputValue("");
        setWorstCaseMode(false);
    };

    const latestLog = logs[logs.length - 1];

    return (
        <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

            <div>
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500 p-2 shadow-lg shadow-emerald-500/20">
                        <Activity className="h-4 w-4 text-white" />
                    </div>
                </div>
                <p className="mt-1 text-sm italic text-slate-400">
                    Visualize traversal, comparisons, and the 3 cases of deletion.
                </p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex-1 space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                            Controls
                        </div>
                        <Input
                            type="number"
                            placeholder="Value (e.g. 12)"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="h-11 border-slate-800 bg-slate-950 font-bold text-white placeholder:text-slate-500"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={handleInsert}
                                disabled={isAnimating || !inputValue}
                                className="h-10 min-w-[96px] gap-2 bg-emerald-600 font-bold hover:bg-emerald-500"
                            >
                                <Plus className="h-4 w-4" /> Insert
                            </Button>
                            <Button
                                onClick={handleSearch}
                                disabled={isAnimating || !inputValue}
                                variant="outline"
                                className="h-10 min-w-[96px] gap-2 border-slate-700 bg-slate-950 font-bold text-slate-200 hover:bg-slate-900 hover:text-white"
                            >
                                <Search className="h-4 w-4" /> Search
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={isAnimating || !inputValue}
                                variant="destructive"
                                className="h-10 min-w-[96px] gap-2 bg-rose-500 font-bold hover:bg-rose-400"
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                        <Button
                            variant={worstCaseMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setWorstCaseMode(!worstCaseMode); resetTree(); }}
                            className={cn(
                                "h-10 gap-2 font-bold",
                                worstCaseMode
                                    ? "bg-rose-500 text-white hover:bg-rose-400"
                                    : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900 hover:text-white"
                            )}
                        >
                            <Zap className="h-3.5 w-3.5" /> Worst Case
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetTree}
                            className="h-10 gap-2 border-slate-700 bg-slate-950 font-bold text-slate-200 hover:bg-slate-900 hover:text-white"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Tree Visualization
                    </div>
                    <div className="text-[11px] text-slate-400">
                        BST rule: left &lt; node &lt; right
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1120]">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" />

                    <svg className="h-[290px] w-full" viewBox="0 0 700 450">
                        <g>
                            {Object.values(nodes).map((node) => (
                                <g key={`edges-${node.id}`}>
                                    {node.left !== null && nodes[node.left] && (
                                        <motion.line
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            x1={node.x}
                                            y1={node.y}
                                            x2={nodes[node.left].x}
                                            y2={nodes[node.left].y}
                                            stroke="#334155"
                                            strokeWidth="2"
                                        />
                                    )}
                                    {node.right !== null && nodes[node.right] && (
                                        <motion.line
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            x1={node.x}
                                            y1={node.y}
                                            x2={nodes[node.right].x}
                                            y2={nodes[node.right].y}
                                            stroke="#334155"
                                            strokeWidth="2"
                                        />
                                    )}
                                </g>
                            ))}
                        </g>

                        <g>
                            {Object.values(nodes).map((node) => (
                                <motion.g
                                    key={`node-${node.id}`}
                                    layout
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    <motion.circle
                                        cx={node.x}
                                        cy={node.y}
                                        r="24"
                                        animate={{
                                            fill:
                                                activeNodeId === node.id || foundNodeId === node.id
                                                    ? "rgba(16, 185, 129, 0.18)"
                                                    : "#0f172a",
                                            stroke:
                                                activeNodeId === node.id || foundNodeId === node.id
                                                    ? "#10b981"
                                                    : "#334155",
                                            strokeWidth:
                                                activeNodeId === node.id || foundNodeId === node.id ? 3 : 2
                                        }}
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y}
                                        textAnchor="middle"
                                        dy=".35em"
                                        className="fill-slate-100 text-sm font-bold"
                                    >
                                        {node.value}
                                    </text>

                                    {logs.some((l) => l.type === "successor" && l.nodeId === node.id) && (
                                        <motion.text
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            x={node.x}
                                            y={node.y - 38}
                                            textAnchor="middle"
                                            className="fill-amber-400 text-[8px] font-bold uppercase"
                                        >
                                            Successor
                                        </motion.text>
                                    )}
                                </motion.g>
                            ))}
                        </g>
                    </svg>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Current Decision
                    </div>
                    <p className={cn(
                        "mt-2 text-sm leading-6",
                        latestLog?.type === "found" ? "text-emerald-300" :
                            latestLog?.type === "delete" ? "text-rose-300" :
                                latestLog?.type === "successor" ? "text-amber-300" :
                                    "text-slate-200"
                    )}>
                        {latestLog?.message || "Enter a value and choose an action to follow one BST decision path from the root."}
                    </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
                    <span>
                        Tree Height: <span className="font-semibold text-indigo-300">{metrics.height}</span>
                    </span>
                    <span className="text-slate-700">|</span>
                    <span>
                        Comparisons: <span className="font-semibold text-emerald-300">{metrics.comparisons}</span>
                    </span>
                    <span className="text-slate-700">|</span>
                    <span>
                        Mode: <span className="font-semibold text-slate-200">{worstCaseMode ? "Worst Case" : "Balanced Example"}</span>
                    </span>
                </div>

            </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-6 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Why BSTs Matter
            </div>
            In an ideal (balanced) BST, operations are <strong className="text-slate-900 dark:text-slate-200">O(log N)</strong> because each
            comparison eliminates half the remaining nodes. If you insert sorted values
            in <strong className="text-slate-900 dark:text-slate-200">Worst Case</strong> mode, the tree becomes skewed like a linked list,
            degrading toward <strong className="text-slate-900 dark:text-slate-200">O(N)</strong>.
        </div>
        </section>
    );
}
