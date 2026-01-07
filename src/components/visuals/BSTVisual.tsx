"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Trash2,
    RotateCcw,
    Zap,
    Info,
    ChevronRight,
    Play,
    Timer,
    Activity,
    AlertCircle,
    Hash
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

    return (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Binary Search Tree</h2>
                    </div>
                    <p className="text-sm text-slate-500 italic">Visualize traversal, comparisons, and the 3 cases of deletion.</p>
                </div>

                <div className="flex bg-white dark:bg-slate-950 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 gap-2">
                    <Button
                        variant={worstCaseMode ? "default" : "ghost"}
                        size="sm"
                        onClick={() => { setWorstCaseMode(!worstCaseMode); resetTree(); }}
                        className={cn("text-xs font-bold gap-2", worstCaseMode && "bg-rose-500 hover:bg-rose-400")}
                    >
                        <Zap className="w-3.5 h-3.5" /> Worst-Case Only
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetTree} className="text-xs font-bold gap-2">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Search/Insert/Delete Controls */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Hash className="w-3 h-3" /> Input Action
                        </h3>
                        <Input
                            type="number"
                            placeholder="Value (e.g. 12)"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="bg-slate-50 border-slate-200 dark:bg-slate-900 font-bold h-12"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleInsert} disabled={isAnimating || !inputValue} className="flex-1 min-w-[80px] bg-emerald-600 hover:bg-emerald-500 h-10 gap-2 font-bold transition-all active:scale-95">
                                <Plus className="w-4 h-4" /> Insert
                            </Button>
                            <Button onClick={handleSearch} disabled={isAnimating || !inputValue} variant="outline" className="flex-1 min-w-[80px] h-10 gap-2 font-bold border-2 hover:bg-slate-50 transition-all active:scale-95">
                                <Search className="w-4 h-4" /> Search
                            </Button>
                            <Button onClick={handleDelete} disabled={isAnimating || !inputValue} variant="destructive" className="flex-1 min-w-[80px] h-10 gap-2 font-bold bg-rose-500 hover:bg-rose-400 transition-all active:scale-95">
                                <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                        <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                            <Timer className="w-3.5 h-3.5" /> Decision Log
                        </h4>
                        <div className="space-y-2 min-h-[100px]">
                            {logs.length === 0 && <p className="text-[10px] text-slate-400 italic">Ready for next command...</p>}
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-2 text-[11px]"
                                >
                                    <ChevronRight className="w-3 h-3 text-indigo-500 mt-0.5" />
                                    <span className={cn(
                                        log.type === "found" ? "text-emerald-500 font-bold" :
                                            log.type === "delete" ? "text-rose-500 font-bold" :
                                                log.type === "successor" ? "text-amber-500 font-bold" : "text-slate-600 dark:text-slate-400"
                                    )}>
                                        {log.message}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Tree Height</p>
                            <p className="text-lg font-bold text-indigo-600">{metrics.height}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Comparisons</p>
                            <p className="text-lg font-bold text-emerald-600">{metrics.comparisons}</p>
                        </div>
                    </div>
                </div>

                {/* Tree Visualization Area */}
                <div className="lg:col-span-3 relative bg-white dark:bg-slate-950 rounded-3xl border-2 border-slate-100 dark:border-slate-900 overflow-hidden shadow-inner group">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" />

                    <svg className="w-full h-full min-h-[400px]" viewBox="0 0 700 450">
                        {/* Edges first */}
                        <g>
                            {Object.values(nodes).map(node => (
                                <g key={`edges-${node.id}`}>
                                    {node.left !== null && nodes[node.left] && (
                                        <motion.line
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            x1={node.x} y1={node.y}
                                            x2={nodes[node.left].x} y2={nodes[node.left].y}
                                            stroke="currentColor" strokeWidth="2"
                                            className="text-slate-200 dark:text-slate-800"
                                        />
                                    )}
                                    {node.right !== null && nodes[node.right] && (
                                        <motion.line
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            x1={node.x} y1={node.y}
                                            x2={nodes[node.right].x} y2={nodes[node.right].y}
                                            stroke="currentColor" strokeWidth="2"
                                            className="text-slate-200 dark:text-slate-800"
                                        />
                                    )}
                                </g>
                            ))}
                        </g>

                        {/* Nodes */}
                        <g>
                            {Object.values(nodes).map(node => (
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
                                        r="22"
                                        animate={{
                                            fill: activeNodeId === node.id ? "rgba(16, 185, 129, 0.2)" : (foundNodeId === node.id ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 1)"),
                                            stroke: activeNodeId === node.id ? "#10b981" : (foundNodeId === node.id ? "#10b981" : "#e2e8f0"),
                                            strokeWidth: activeNodeId === node.id || foundNodeId === node.id ? 3 : 2
                                        }}
                                        className="dark:fill-slate-900 dark:stroke-slate-800"
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y}
                                        textAnchor="middle"
                                        dy=".3em"
                                        className={cn(
                                            "text-sm font-bold transition-colors",
                                            activeNodeId === node.id ? "fill-emerald-600" : (foundNodeId === node.id ? "fill-emerald-600" : "fill-slate-600 dark:fill-slate-400")
                                        )}
                                    >
                                        {node.value}
                                    </text>

                                    {/* Successor Indicator */}
                                    {logs.some(l => l.type === "successor" && l.nodeId === node.id) && (
                                        <motion.text
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            x={node.x} y={node.y - 35}
                                            textAnchor="middle"
                                            className="text-[8px] font-bold fill-amber-500 uppercase"
                                        >
                                            Successor Candidates
                                        </motion.text>
                                    )}
                                </motion.g>
                            ))}
                        </g>
                    </svg>

                    {/* Watermark/Hint */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-2 text-slate-300 dark:text-slate-700 pointer-events-none">
                        <Play className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">BST Simulation Engine</span>
                    </div>
                </div>
            </div>

            {/* Footer Insight */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                <div className="p-2 bg-indigo-500/10 rounded-xl mt-1">
                    <Info className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        Deep Dive: Why Binary Search Trees?
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                        In an ideal (balanced) BST, operations are <strong>O(log N)</strong> because each comparison eliminates half the remaining nodes.
                        However, if you insert sorted values (Worst-Case Mode), the tree becomes skewed like a linked list, degrading to <strong>O(N)</strong> performance.
                        This is why techniques like AVL or Red-Black trees are used to keep the height minimal.
                    </p>
                </div>
            </div>
        </Card>
    );
}
