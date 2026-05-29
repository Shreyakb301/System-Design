"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { DSNode, DSNodeType } from "@/lib/gamification/ds-types";
import { cn } from "@/lib/utils";

interface AlgorithmVisualizerProps {
    nodes: DSNode[];
    onNodesChange?: (nodes: DSNode[]) => void;
    readOnly?: boolean;
}

export function AlgorithmVisualizer({ nodes, onNodesChange, readOnly = false }: AlgorithmVisualizerProps) {
    const [internalNodes, setInternalNodes] = useState<DSNode[]>(nodes);
    const containerRef = useRef<HTMLDivElement>(null);

    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const dragPos = useRef({ startX: 0, startY: 0, nodeX: 0, nodeY: 0 });

    useEffect(() => {
        setInternalNodes(nodes);
    }, [nodes]);

    const handleUpdate = (newNodes: DSNode[]) => {
        setInternalNodes(newNodes);
        onNodesChange?.(newNodes);
    };

    const handlePointerDownNode = (e: React.PointerEvent, id: string) => {
        if (readOnly || connectingSourceId) return;
        if ((e.target as HTMLElement).closest('.connect-handle')) return;
        
        e.stopPropagation();
        const node = internalNodes.find(n => n.id === id);
        if (!node) return;
        
        setDraggingNodeId(id);
        dragPos.current = {
            startX: e.clientX,
            startY: e.clientY,
            nodeX: node.x,
            nodeY: node.y
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerDownHandle = (e: React.PointerEvent, id: string) => {
        if (readOnly) return;
        e.stopPropagation();
        setConnectingSourceId(id);
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (readOnly) return;
        
        if (draggingNodeId) {
            const dx = e.clientX - dragPos.current.startX;
            const dy = e.clientY - dragPos.current.startY;
            const newNodes = internalNodes.map((n) => {
                if (n.id === draggingNodeId) {
                    return { ...n, x: dragPos.current.nodeX + dx, y: dragPos.current.nodeY + dy };
                }
                return n;
            });
            setInternalNodes(newNodes);
        } else if (connectingSourceId) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (draggingNodeId) {
            handleUpdate(internalNodes);
            setDraggingNodeId(null);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
        
        if (connectingSourceId) {
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const targetNodeEl = elements.find(el => el.hasAttribute('data-node-id'));
            
            if (targetNodeEl) {
                const targetId = targetNodeEl.getAttribute('data-node-id');
                if (targetId && targetId !== connectingSourceId) {
                     const newNodes = internalNodes.map(n => {
                        if (n.id === connectingSourceId) {
                            return { ...n, nextId: targetId };
                        }
                        return n;
                    });
                    handleUpdate(newNodes);
                }
            }
            
            setConnectingSourceId(null);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border overflow-hidden cursor-crosshair touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
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
                    <marker id="arrowhead-draft" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
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
                {connectingSourceId && (() => {
                    const sourceNode = internalNodes.find(n => n.id === connectingSourceId);
                    if (!sourceNode) return null;
                    return (
                        <line
                            x1={sourceNode.x + 30} y1={sourceNode.y + 30}
                            x2={mousePos.x} y2={mousePos.y}
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            markerEnd="url(#arrowhead-draft)"
                        />
                    );
                })()}
            </svg>

            <AnimatePresence>
                {internalNodes.map((node) => (
                    <motion.div
                        key={node.id}
                        data-node-id={node.id}
                        onPointerDown={(e) => handlePointerDownNode(e, node.id)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            x: node.x,
                            y: node.y,
                            scale: 1,
                            opacity: 1,
                            borderColor: connectingSourceId === node.id ? "#3b82f6" : "transparent"
                        }}
                        transition={draggingNodeId === node.id ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 30 }}
                        className={cn(
                            "absolute w-[60px] h-[60px] flex items-center justify-center rounded-lg shadow-sm border-2 font-bold text-lg select-none z-10 touch-none",
                            node.type === "array-node" ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800 rounded-none transform-none" : "",
                            node.type === "list-node" ? "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800 rounded-full" : "",
                            connectingSourceId === node.id && "ring-2 ring-blue-500 ring-offset-2"
                        )}
                    >
                        {node.value}

                        {/* Connection Handle (Only for lists) */}
                        {!readOnly && node.type === "list-node" && (
                            <div
                                className="connect-handle absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-400 rounded-full cursor-pointer hover:bg-slate-600 hover:scale-125 transition-all touch-none"
                                onPointerDown={(e) => handlePointerDownHandle(e, node.id)}
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
