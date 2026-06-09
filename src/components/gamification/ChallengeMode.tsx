"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SystemCanvas, SYSTEM_CANVAS_COMPONENT_SIZE } from "./SystemCanvas";
import { LevelCompleteDialog } from "./LevelCompleteDialog";
import { ComponentPalette } from "./ComponentPalette";
import { ResourceMonitor } from "./ResourceMonitor";
import { SCENARIOS } from "@/lib/gamification/scenarios";
import { COMPONENT_CATALOG, ComponentType, GameState, SystemComponent } from "@/lib/gamification/types";
import { calculateSystemMetrics } from "@/lib/gamification/simulation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function buildScenarioState(id: string): GameState | null {
    const scenario = SCENARIOS.find((entry) => entry.id === id);
    if (!scenario) return null;

    const metrics = calculateSystemMetrics(
        scenario.initialComponents,
        scenario.initialConnections,
        scenario.initialTraffic
    );

    return {
        budget: scenario.initialBudget,
        traffic: scenario.initialTraffic,
        components: [...scenario.initialComponents],
        connections: [...scenario.initialConnections],
        metrics
    };
}

function addConnection(
    connections: GameState["connections"],
    sourceId: string,
    targetId: string
) {
    const exists = connections.some(
        (connection) => connection.sourceId === sourceId && connection.targetId === targetId
    );
    if (exists) return connections;

    return [
        ...connections,
        {
            id: `conn-${sourceId}-${targetId}`,
            sourceId,
            targetId,
        },
    ];
}

export function ChallengeMode() {
    const [currentScenarioId, setCurrentScenarioId] = useState(SCENARIOS[0].id);
    const [gameState, setGameState] = useState<GameState | null>(() => buildScenarioState(SCENARIOS[0].id));
    const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
    const [showWinDialog, setShowWinDialog] = useState(false);
    const [score, setScore] = useState(0);
    const [isCanvasDropTarget, setIsCanvasDropTarget] = useState(false);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const loadScenario = useCallback((id: string) => {
        const nextState = buildScenarioState(id);
        if (!nextState) return;

        setCurrentScenarioId(id);
        setGameState(nextState);
        setSelectedType(null);
        setIsCanvasDropTarget(false);
        setShowWinDialog(false);
    }, []);

    // Check Win Condition
    const checkWinCondition = useCallback((metrics: GameState["metrics"], budget: number) => {
        const scenario = SCENARIOS.find(s => s.id === currentScenarioId);
        if (!scenario) return;

        const { goals } = scenario;

        // Check hard constraints
        const passedLatency = metrics.latency <= goals.maxLatency;
        const passedReliability = metrics.reliability >= goals.minReliability;
        const passedCost = goals.maxCost ? metrics.monthlyCost <= goals.maxCost : true;
        const passedBudget = budget >= 0;

        if (passedLatency && passedReliability && passedCost && passedBudget && !showWinDialog) {
            // Calculate Score (Simple formula)
            const baseScore = 1000;
            const budgetBonus = Math.floor(budget * 0.5);
            const latencyBonus = Math.max(0, (goals.maxLatency - metrics.latency) * 5);

            setScore(baseScore + budgetBonus + latencyBonus);
            setShowWinDialog(true);
        }
    }, [currentScenarioId, showWinDialog]);

    // Game Loop (Simulate traffic fluctuations)
    useEffect(() => {
        if (showWinDialog) return;

        const interval = setInterval(() => {
            setGameState(prev => {
                if (!prev) return null;
                // Simple fluctuation +/- 10%
                const newTraffic = Math.max(0, Math.round(prev.traffic * (0.9 + Math.random() * 0.2)));
                const metrics = calculateSystemMetrics(prev.components, prev.connections, newTraffic);

                // Check win on every tick
                checkWinCondition(metrics, prev.budget);

                return { ...prev, traffic: newTraffic, metrics };
            });
        }, 1000); // Faster ticks for responsiveness

        return () => clearInterval(interval);
    }, [gameState?.components, gameState?.connections, checkWinCondition, showWinDialog]); // Recalculate when topology changes

    const handleAddComponent = (x: number, y: number, typeOverride?: ComponentType) => {
        const componentType = typeOverride ?? selectedType;
        if (!componentType || !gameState) return;

        const config = COMPONENT_CATALOG[componentType];
        if (gameState.budget < config.cost) {
            toast.error("Not enough budget!");
            return;
        }

        const newComponent: SystemComponent = {
            id: `${componentType}-${Date.now()}`,
            type: componentType,
            x,
            y,
            config: { ...config }
        };

        setGameState(prev => {
            if (!prev) return null;
            const newComponents = [...prev.components, newComponent];

            // Auto-connect logic (Very basic for prototype)
            // 1. If it's a Server, connect to Load Balancer if exists, else Client
            // 2. If it's a DB, connect to Server
            // 3. For now, strict: Manual connections is better but hard to UI. 
            // Let's do heuristic auto-connect to nearest compatible.

            const newConnections = [...prev.connections];

            if (componentType === 'server') {
                // Connect to LB if exists
                const lb = newComponents.find(c => c.type === 'load-balancer');
                if (lb) {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, lb.id, newComponent.id));
                }
                else {
                    // Connect to client
                    const client = newComponents.find(c => c.type === 'client');
                    if (client) {
                        newConnections.splice(0, newConnections.length, ...addConnection(newConnections, client.id, newComponent.id));
                    }
                }
            } else if (componentType === 'database') {
                // Connect all servers to this DB
                const servers = newComponents.filter(c => c.type === 'server');
                servers.forEach(s => {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, s.id, newComponent.id));
                });
            } else if (componentType === 'load-balancer') {
                // Client -> LB
                const client = newComponents.find(c => c.type === 'client');
                if (client) {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, client.id, newComponent.id));
                }
                // LB -> All Servers
                const servers = newComponents.filter(c => c.type === 'server');
                servers.forEach(s => {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, newComponent.id, s.id));
                });
            } else if (componentType === 'cache') {
                const servers = newComponents.filter(c => c.type === 'server');
                servers.forEach(server => {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, server.id, newComponent.id));
                });

                const databases = newComponents.filter(c => c.type === 'database');
                databases.forEach(database => {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, newComponent.id, database.id));
                });
            } else if (componentType === 'cdn') {
                const client = newComponents.find(c => c.type === 'client');
                if (client) {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, client.id, newComponent.id));
                }

                const loadBalancer = newComponents.find(c => c.type === 'load-balancer');
                const fallbackServer = newComponents.find(c => c.type === 'server');
                const target = loadBalancer ?? fallbackServer;
                if (target) {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, newComponent.id, target.id));
                }
            } else if (componentType === 'queue') {
                const servers = newComponents.filter(c => c.type === 'server');
                servers.forEach(server => {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, server.id, newComponent.id));
                });

                const databases = newComponents.filter(c => c.type === 'database');
                databases.forEach(database => {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, newComponent.id, database.id));
                });
            } else if (componentType === 'firewall') {
                const client = newComponents.find(c => c.type === 'client');
                if (client) {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, client.id, newComponent.id));
                }

                const loadBalancer = newComponents.find(c => c.type === 'load-balancer');
                const fallbackServer = newComponents.find(c => c.type === 'server');
                const target = loadBalancer ?? fallbackServer;
                if (target) {
                    newConnections.splice(0, newConnections.length, ...addConnection(newConnections, newComponent.id, target.id));
                }
            }

            const metrics = calculateSystemMetrics(newComponents, newConnections, prev.traffic);
            checkWinCondition(metrics, prev.budget - config.cost);

            return {
                ...prev,
                budget: prev.budget - config.cost,
                components: newComponents,
                connections: newConnections,
                metrics
            };
        });
        setSelectedType(null);
    };

    const placeComponentAtPointer = (clientX: number, clientY: number, typeOverride?: ComponentType) => {
        const canvas = canvasContainerRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = clamp(
            clientX - rect.left - SYSTEM_CANVAS_COMPONENT_SIZE / 2,
            0,
            Math.max(rect.width - SYSTEM_CANVAS_COMPONENT_SIZE, 0)
        );
        const y = clamp(
            clientY - rect.top - SYSTEM_CANVAS_COMPONENT_SIZE / 2,
            0,
            Math.max(rect.height - SYSTEM_CANVAS_COMPONENT_SIZE, 0)
        );

        handleAddComponent(x, y, typeOverride);
    };

    const handleRemoveComponent = (id: string) => {
        setGameState(prev => {
            if (!prev) return null;
            const comp = prev.components.find(c => c.id === id);
            if (!comp) return prev;
            if (comp.type === 'client') return prev; // Cannot delete client

            const newComponents = prev.components.filter(c => c.id !== id);
            const newConnections = prev.connections.filter(c => c.sourceId !== id && c.targetId !== id);
            const metrics = calculateSystemMetrics(newComponents, newConnections, prev.traffic);

            checkWinCondition(metrics, prev.budget + (comp.config.cost * 0.5));

            return {
                ...prev,
                budget: prev.budget + (comp.config.cost * 0.5), // refund 50%
                components: newComponents,
                connections: newConnections,
                metrics
            };
        });
    };

    const handleMoveComponent = (id: string, x: number, y: number) => {
        setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                components: prev.components.map(c => c.id === id ? { ...c, x, y } : c)
            };
        });
    };

    const handleNextLevel = () => {
        const currentIndex = SCENARIOS.findIndex(s => s.id === currentScenarioId);
        if (currentIndex < SCENARIOS.length - 1) {
            loadScenario(SCENARIOS[currentIndex + 1].id);
        } else {
            toast.success("All levels completed! You are a System Architect Master!");
            setShowWinDialog(false);
        }
    };

    if (!gameState) return <div className="p-6 text-sm text-muted-foreground">Preparing scenario...</div>;

    const currentScenario = SCENARIOS.find(s => s.id === currentScenarioId);

    return (
        <div className="flex flex-col min-h-[calc(100vh-100px)] h-auto animate-in fade-in duration-500">
            <LevelCompleteDialog
                open={showWinDialog}
                onOpenChange={setShowWinDialog}
                onNextLevel={handleNextLevel}
                onReplay={() => {
                    loadScenario(currentScenarioId);
                    setShowWinDialog(false);
                }}
                metrics={gameState.metrics}
                score={score}
            />

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-slate-900">
                <div className="flex items-center gap-4">
                    <Select value={currentScenarioId} onValueChange={loadScenario}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select Scenario" />
                        </SelectTrigger>
                        <SelectContent>
                            {SCENARIOS.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.title} ({s.difficulty})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground hidden md:block border-l pl-4">
                        {currentScenario?.description}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadScenario(currentScenarioId)}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset Level
                    </Button>
                    {/* Simulation is auto-running now, but we can keep/remove this button later */}
                    <div className="text-xs flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-slate-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Auto-updating metrics
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Left Palette */}
                <div className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <ComponentPalette
                        balance={gameState.budget}
                        onSelectComponent={setSelectedType}
                        selectedType={selectedType}
                    />
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 p-4 gap-4">
                    <ResourceMonitor metrics={gameState.metrics} budget={gameState.budget} />
                    <div className={cn(
                        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors",
                        isCanvasDropTarget
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300"
                    )}>
                        {selectedType
                            ? <>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
                                    <span><strong>{COMPONENT_CATALOG[selectedType].name}</strong> selected. Click in the canvas or drag from the palette to place it.</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedType(null)}
                                    className="h-8 px-2 text-current hover:bg-white/50 dark:hover:bg-white/10"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                              </>
                            : <>
                                <div className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                                <span>Select a component to arm placement, or drag it from the palette into the canvas.</span>
                              </>}
                    </div>

                    <div
                        ref={canvasContainerRef}
                        className={cn(
                            "relative flex-1 overflow-hidden rounded-xl border-2 border-transparent shadow-sm transition-colors",
                            isCanvasDropTarget && "border-emerald-400"
                        )}
                        onClick={(e) => {
                            if (!selectedType) return;
                            placeComponentAtPointer(e.clientX, e.clientY);
                        }}
                        onDragEnter={(e) => {
                            const hasSystemComponent = Array.from(e.dataTransfer.types).includes("application/x-system-component");
                            if (hasSystemComponent) {
                                setIsCanvasDropTarget(true);
                            }
                        }}
                        onDragOver={(e) => {
                            const hasSystemComponent = Array.from(e.dataTransfer.types).includes("application/x-system-component");
                            if (!hasSystemComponent) return;

                            e.preventDefault();
                            e.dataTransfer.dropEffect = "copy";
                            setIsCanvasDropTarget(true);
                        }}
                        onDragLeave={() => {
                            setIsCanvasDropTarget(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsCanvasDropTarget(false);

                            const droppedType = e.dataTransfer.getData("application/x-system-component") as ComponentType | "";
                            if (!droppedType) return;

                            placeComponentAtPointer(e.clientX, e.clientY, droppedType);
                        }}
                    >
                        <SystemCanvas
                            components={gameState.components}
                            connections={gameState.connections}
                            onMoveComponent={handleMoveComponent}
                            onRemoveComponent={handleRemoveComponent}
                            isDraggingType={selectedType}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
