"use client";

import { motion } from "framer-motion";
import { SystemComponent, Connection, COMPONENT_CATALOG, ComponentType } from "@/lib/gamification/types";
import { X } from "lucide-react";

interface SystemCanvasProps {
    components: SystemComponent[];
    connections: Connection[];
    onMoveComponent: (id: string, x: number, y: number) => void;
    onRemoveComponent: (id: string) => void;
    isDraggingType: ComponentType | null;
}

export function SystemCanvas({
    components,
    connections,
    onMoveComponent,
    onRemoveComponent,
    isDraggingType
}: SystemCanvasProps) {
    return (
        <div className="relative w-full h-[600px] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="absolute inset-0 pointer-events-none grid grid-cols-[repeat(auto-fill,20px)] grid-rows-[repeat(auto-fill,20px)] opacity-10">
                {/* Simple grid lines could go here */}
            </div>

            {/* Connections (SVG Layer) */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
                {connections.map((conn) => {
                    const source = components.find((c) => c.id === conn.sourceId);
                    const target = components.find((c) => c.id === conn.targetId);
                    if (!source || !target) return null;

                    // Center points
                    const x1 = source.x + 32; // Half of w-16 (64px)
                    const y1 = source.y + 32;
                    const x2 = target.x + 32;
                    const y2 = target.y + 32;

                    return (
                        <g key={conn.id}>
                            <line
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                            {/* Animated Packet */}
                            <circle r="4" fill="#3b82f6">
                                <animateMotion
                                    dur="1s"
                                    repeatCount="indefinite"
                                    path={`M${x1},${y1} L${x2},${y2}`}
                                />
                            </circle>
                        </g>
                    );
                })}
            </svg>

            {/* Components */}
            {components.map((comp) => {
                const catalogItem = COMPONENT_CATALOG[comp.type];
                const Icon = catalogItem.icon;

                return (
                    <motion.div
                        key={comp.id}
                        drag
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            onMoveComponent(comp.id, comp.x + info.offset.x, comp.y + info.offset.y);
                        }}
                        initial={{ x: comp.x, y: comp.y, scale: 0 }}
                        animate={{ x: comp.x, y: comp.y, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="absolute flex flex-col items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing z-10 group"
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveComponent(comp.id);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>

                        <Icon className={`h-8 w-8 ${getConfigColor(comp.type)}`} />
                        <span className="text-[10px] font-medium mt-1 truncate max-w-full px-1">
                            {catalogItem.name}
                        </span>
                    </motion.div>
                );
            })}

            {isDraggingType && (
                <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm animate-pulse">
                    Click anywhere to place {COMPONENT_CATALOG[isDraggingType].name}
                </div>
            )}
        </div>
    );
}

function getConfigColor(type: ComponentType) {
    switch (type) {
        case "client": return "text-blue-500";
        case "server": return "text-green-500";
        case "database": return "text-amber-500";
        case "load-balancer": return "text-purple-500";
        case "cache": return "text-orange-500";
        default: return "text-slate-500";
    }
}
