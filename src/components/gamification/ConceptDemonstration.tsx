"use client";

import { useEffect, useState } from "react";
import { SystemCanvas } from "./SystemCanvas";
import { ResourceMonitor } from "./ResourceMonitor";
import { COMPONENT_CATALOG, GameState, SystemComponent, Connection } from "@/lib/gamification/types";
import { calculateSystemMetrics } from "@/lib/gamification/simulation";

interface ConceptDemonstrationProps {
    initialComponents: SystemComponent[];
    initialConnections: Connection[];
    initialTraffic?: number;
}

export function ConceptDemonstration({
    initialComponents,
    initialConnections,
    initialTraffic = 500,
}: ConceptDemonstrationProps) {
    const [gameState, setGameState] = useState<GameState>({
        budget: 99999, // Infinite for demos
        traffic: initialTraffic,
        components: initialComponents,
        connections: initialConnections,
        metrics: calculateSystemMetrics(initialComponents, initialConnections, initialTraffic),
    });

    // Game Loop (Simulate traffic)
    useEffect(() => {
        const interval = setInterval(() => {
            setGameState((prev) => {
                const newTraffic = Math.max(
                    100,
                    Math.min(2000, Math.round(prev.traffic * (0.95 + Math.random() * 0.1)))
                );
                const metrics = calculateSystemMetrics(
                    prev.components,
                    prev.connections,
                    newTraffic
                );
                return { ...prev, traffic: newTraffic, metrics };
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-4 p-4 bg-slate-100 dark:bg-slate-950 rounded-xl border">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Simulation</h3>
                <div className="text-xs flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-full text-slate-500 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    {gameState.traffic} RPS
                </div>
            </div>

            <ResourceMonitor metrics={gameState.metrics} budget={-1} />
            {/* Passing -1 budget might look weid, maybe ResourceMonitor handles it? 
          Actually ResourceMonitor displays budget. For a demo, maybe we don't care about budget?
          Let's verify ResourceMonitor prop usage. It just displays it. 
          I might want to hide budget in "Demo Mode" later, but for now passing 0/Infinity is fine.
      */}

            <div className="h-[400px] rounded-xl shadow-sm overflow-hidden relative bg-white dark:bg-slate-900">
                <SystemCanvas
                    components={gameState.components}
                    connections={gameState.connections}
                    onMoveComponent={() => { }} // Read-only
                    onRemoveComponent={() => { }} // Read-only
                    isDraggingType={null}
                />

                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/50 dark:bg-black/50 px-2 py-1 rounded pointer-events-none">
                    Interactive Demo
                </div>
            </div>
        </div>
    );
}
