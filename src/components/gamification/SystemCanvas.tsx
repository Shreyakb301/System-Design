"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import { SystemComponent, Connection, COMPONENT_CATALOG, ComponentType } from "@/lib/gamification/types";
import { GripVertical, X } from "lucide-react";

export const SYSTEM_CANVAS_COMPONENT_SIZE = 80;

const COMPONENT_CENTER_OFFSET = SYSTEM_CANVAS_COMPONENT_SIZE / 2;

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

interface SystemCanvasProps {
    components: SystemComponent[];
    connections: Connection[];
    onMoveComponent: (id: string, x: number, y: number) => void;
    onRemoveComponent: (id: string) => void;
    isDraggingType: ComponentType | null;
    canMoveComponents?: boolean;
    canRemoveComponents?: boolean;
}

interface CanvasComponentCardProps {
    component: SystemComponent;
    canMoveComponents: boolean;
    canRemoveComponents: boolean;
    onMoveComponent: (id: string, x: number, y: number) => void;
    onRemoveComponent: (id: string) => void;
    clampX: (value: number) => number;
    clampY: (value: number) => number;
}

function CanvasComponentCard({
    component,
    canMoveComponents,
    canRemoveComponents,
    onMoveComponent,
    onRemoveComponent,
    clampX,
    clampY,
}: CanvasComponentCardProps) {
    const catalogItem = COMPONENT_CATALOG[component.type];
    const Icon = catalogItem.icon;
    const dragControls = useDragControls();
    const dragOrigin = useRef({ x: component.x, y: component.y });

    const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!canMoveComponents) return;

        onMoveComponent(
            component.id,
            clampX(dragOrigin.current.x + info.offset.x),
            clampY(dragOrigin.current.y + info.offset.y)
        );
    }, [canMoveComponents, clampX, clampY, component.id, onMoveComponent]);

    const stopPropagation = (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
    };

    return (
        <motion.div
            drag={canMoveComponents}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            onDragStart={() => {
                dragOrigin.current = { x: component.x, y: component.y };
            }}
            onDrag={handleDrag}
            style={{ x: component.x, y: component.y }}
            whileHover={canMoveComponents ? { scale: 1.03 } : undefined}
            whileDrag={canMoveComponents ? { scale: 1.05, zIndex: 30 } : undefined}
            className="absolute left-0 top-0 z-10"
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
        >
            <div
                className={`group relative flex h-20 w-20 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-slate-200 bg-white px-1 pb-2 pt-2 text-center shadow-md transition-shadow dark:border-slate-700 dark:bg-slate-800 ${canMoveComponents ? "cursor-grab active:cursor-grabbing" : ""}`}
                onPointerDown={canMoveComponents ? (event) => {
                    event.stopPropagation();
                    dragControls.start(event);
                } : undefined}
            >
                {canMoveComponents && (
                    <GripVertical className="absolute top-1 left-1/2 h-3 w-3 -translate-x-1/2 text-slate-300 dark:text-slate-600" />
                )}

                {canRemoveComponents && component.type !== "client" ? (
                    <button
                        type="button"
                        onPointerDown={stopPropagation}
                        onClick={(event) => {
                            event.stopPropagation();
                            onRemoveComponent(component.id);
                        }}
                        className="absolute right-1 top-1 z-20 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Remove ${catalogItem.name}`}
                    >
                        <X size={12} />
                    </button>
                ) : null}

                <Icon className={`h-7 w-7 ${getConfigColor(component.type)}`} />
                <span className="text-[10px] font-medium leading-tight">
                    {catalogItem.name}
                </span>
            </div>
        </motion.div>
    );
}

export function SystemCanvas({
    components,
    connections,
    onMoveComponent,
    onRemoveComponent,
    isDraggingType,
    canMoveComponents = true,
    canRemoveComponents = true,
}: SystemCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 960, height: 600 });

    useEffect(() => {
        const element = canvasRef.current;
        if (!element) return;

        const updateSize = () => {
            setCanvasSize({
                width: element.clientWidth,
                height: element.clientHeight,
            });
        };

        updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const clampX = useCallback((value: number) => {
        return clamp(value, 0, Math.max(canvasSize.width - SYSTEM_CANVAS_COMPONENT_SIZE, 0));
    }, [canvasSize.width]);

    const clampY = useCallback((value: number) => {
        return clamp(value, 0, Math.max(canvasSize.height - SYSTEM_CANVAS_COMPONENT_SIZE, 0));
    }, [canvasSize.height]);

    const positionedComponents = useMemo(() => {
        return components.map((component) => ({
            ...component,
            x: clampX(component.x),
            y: clampY(component.y),
        }));
    }, [components, clampX, clampY]);

    return (
        <div
            ref={canvasRef}
            className="relative h-full min-h-[400px] w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 shadow-inner dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="absolute inset-0 pointer-events-none grid grid-cols-[repeat(auto-fill,20px)] grid-rows-[repeat(auto-fill,20px)] opacity-10">
                {/* Simple grid lines could go here */}
            </div>

            {/* Connections (SVG Layer) */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
                {connections.map((conn) => {
                    const source = positionedComponents.find((c) => c.id === conn.sourceId);
                    const target = positionedComponents.find((c) => c.id === conn.targetId);
                    if (!source || !target) return null;

                    // Center points
                    const x1 = source.x + COMPONENT_CENTER_OFFSET;
                    const y1 = source.y + COMPONENT_CENTER_OFFSET;
                    const x2 = target.x + COMPONENT_CENTER_OFFSET;
                    const y2 = target.y + COMPONENT_CENTER_OFFSET;

                    return (
                        <g key={conn.id}>
                            <line
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                            {/* Animated Packet */}
                            <circle r="4" fill="#0ea5e9">
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
            {positionedComponents.map((component) => (
                <CanvasComponentCard
                    key={component.id}
                    component={component}
                    canMoveComponents={canMoveComponents}
                    canRemoveComponents={canRemoveComponents}
                    onMoveComponent={onMoveComponent}
                    onRemoveComponent={onRemoveComponent}
                    clampX={clampX}
                    clampY={clampY}
                />
            ))}

            {isDraggingType && (
                <div className="absolute left-4 top-4 rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-800 animate-pulse">
                    Click or drop to place {COMPONENT_CATALOG[isDraggingType].name}
                </div>
            )}
        </div>
    );
}

function getConfigColor(type: ComponentType) {
    switch (type) {
        case "client": return "text-sky-500";
        case "server": return "text-emerald-500";
        case "database": return "text-amber-500";
        case "load-balancer": return "text-purple-500";
        case "cache": return "text-orange-500";
        default: return "text-slate-500";
    }
}
