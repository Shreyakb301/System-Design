"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { DSNode, DSNodeType } from "@/lib/gamification/ds-types";
import { cn } from "@/lib/utils";
import { X, ArrowRight } from "lucide-react";

interface AlgorithmVisualizerProps {
    nodes: DSNode[];
    onNodesChange?: (nodes: DSNode[]) => void;
    readOnly?: boolean;
}

export function AlgorithmVisualizer({ nodes, onNodesChange, readOnly = false }: AlgorithmVisualizerProps) {
    const [internalNodes, setInternalNodes] = useState<DSNode[]>(nodes);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

    useEffect(() => {
        setInternalNodes(nodes);
    }, [nodes]);

    const handleUpdate = (newNodes: DSNode[]) => {
        setInternalNodes(newNodes);
        onNodesChange?.(newNodes);
    };

    const handleNodeDrag = (id: string, info: any) => {
        if (readOnly) return;
        const newNodes = internalNodes.map((n) => {
            if (n.id === id) {
                return { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y };
            }
            return n;
        });
        setInternalNodes(newNodes);
    };

    const handleNodeDragEnd = (id: string) => {
        onNodesChange?.(internalNodes);
    };

    const handleConnectStart = (e: React.MouseEvent, id: string) => {
        if (readOnly) return;
        e.stopPropagation();
        setConnectingSourceId(id);
    };

    const handleConnectEnd = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        if (connectingSourceId && connectingSourceId !== targetId) {
            const newNodes = internalNodes.map(n => {
                if (n.id === connectingSourceId) {
                    // Basic list logic: update nextId
                    return { ...n, nextId: targetId };
                }
                return n;
            });
            handleUpdate(newNodes);
        }
        setConnectingSourceId(null);
    };

    const handleBackgroundClick = () => {
        setConnectingSourceId(null);
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border overflow-hidden cursor-crosshair"
            onClick={handleBackgroundClick}
        >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />

            {/* Connections (SVG Layer) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                </defs>
                {internalNodes.map(node => {
                    if (!node.nextId) return null;
                    const target = internalNodes.find(n => n.id === node.nextId);
                    if (!target) return null;

                    return (
                        <line
                            key={`${node.id}-${target.id}`}
                            x1={node.x + 30} y1={node.y + 30} // Center of 60px node
                            x2={target.x + 30} y2={target.y + 30}
                            stroke="#94a3b8"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                    );
                })}

                {/* Draft Connection Line */}
                {connectingSourceId && (
                    // In a real app we'd track mouse position for the other end, 
                    // but for MVP let's just highlight the node or show a partial state.
                    // Skipping dynamic mouse tracking for simplicity in this artifact, 
                    // relying on visual 'selection' state of source node.
                    <></>
                )}
            </svg>

            <AnimatePresence>
                {internalNodes.map((node) => (
                    <motion.div
                        key={node.id}
                        drag={!readOnly}
                        dragMomentum={false}
                        onDrag={(_, info) => handleNodeDrag(node.id, info)}
                        onDragEnd={() => handleNodeDragEnd(node.id)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            x: node.x,
                            y: node.y,
                            scale: 1,
                            opacity: 1,
                            borderColor: connectingSourceId === node.id ? "#3b82f6" : "transparent"
                        }}
                        className={cn(
                            "absolute w-[60px] h-[60px] flex items-center justify-center rounded-lg shadow-sm border-2 font-bold text-lg select-none z-10",
                            node.type === "array-node" ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800 rounded-none transform-none" : "", // Arrays are square blocks
                            node.type === "list-node" ? "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800 rounded-full" : "", // Lists are circles
                            connectingSourceId === node.id && "ring-2 ring-blue-500 ring-offset-2"
                        )}
                        onClick={(e) => handleConnectEnd(e, node.id)}
                    >
                        {node.value}

                        {/* Connection Handle (Only for lists) */}
                        {!readOnly && node.type === "list-node" && (
                            <div
                                className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-400 rounded-full cursor-pointer hover:bg-slate-600 hover:scale-125 transition-all"
                                onClick={(e) => handleConnectStart(e, node.id)}
                                title="Drag to connect"
                            />
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {readOnly && (
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/50 dark:bg-black/50 px-2 py-1 rounded pointer-events-none">
                    Interactive Demo
                </div>
            )}
        </div>
    );
}
