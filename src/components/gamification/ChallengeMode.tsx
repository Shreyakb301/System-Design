"use client";

import { useState, useEffect, useCallback } from "react";
import { SystemCanvas } from "./SystemCanvas";
import { LevelCompleteDialog } from "./LevelCompleteDialog";
import { ComponentPalette } from "./ComponentPalette";
import { ResourceMonitor } from "./ResourceMonitor";
import { SCENARIOS } from "@/lib/gamification/scenarios";
import { COMPONENT_CATALOG, ComponentType, GameState, SystemComponent, Connection } from "@/lib/gamification/types";
import { calculateSystemMetrics } from "@/lib/gamification/simulation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, RotateCcw } from "lucide-react";


export function ChallengeMode() {
    const [currentScenarioId, setCurrentScenarioId] = useState(SCENARIOS[0].id);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
    const [showWinDialog, setShowWinDialog] = useState(false);
    const [score, setScore] = useState(0);

    // Initialize Scenario
    const loadScenario = useCallback((id: string) => {
        const scenario = SCENARIOS.find(s => s.id === id);
        if (!scenario) return;

        // Initial metrics calculation
        const metrics = calculateSystemMetrics(
            scenario.initialComponents,
            scenario.initialConnections,
            scenario.initialTraffic
        );

        setGameState({
            budget: scenario.initialBudget,
            traffic: scenario.initialTraffic,
            components: [...scenario.initialComponents],
            connections: [...scenario.initialConnections],
            metrics
        });
        setShowWinDialog(false);
    }, []);

    useEffect(() => {
        loadScenario(currentScenarioId);
    }, [currentScenarioId, loadScenario]);

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
        if (!gameState || showWinDialog) return;

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

    const handleAddComponent = (x: number, y: number) => {
        if (!selectedType || !gameState) return;

        const config = COMPONENT_CATALOG[selectedType];
        if (gameState.budget < config.cost) {
            toast.error("Not enough budget!");
            return;
        }

        const newComponent: SystemComponent = {
            id: `${selectedType}-${Date.now()}`,
            type: selectedType,
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

            if (selectedType === 'server') {
                // Connect to LB if exists
                const lb = newComponents.find(c => c.type === 'load-balancer');
                if (lb) newConnections.push({ id: `conn-${Date.now()}`, sourceId: lb.id, targetId: newComponent.id });
                else {
                    // Connect to client
                    const client = newComponents.find(c => c.type === 'client');
                    if (client) newConnections.push({ id: `conn-${Date.now()}`, sourceId: client.id, targetId: newComponent.id });
                }
            } else if (selectedType === 'database') {
                // Connect all servers to this DB
                const servers = newComponents.filter(c => c.type === 'server');
                servers.forEach(s => {
                    newConnections.push({ id: `conn-${s.id}-${newComponent.id}`, sourceId: s.id, targetId: newComponent.id });
                });
            } else if (selectedType === 'load-balancer') {
                // Client -> LB
                const client = newComponents.find(c => c.type === 'client');
                if (client) {
                    // Remove existing Client -> Server connections
                    // simplified: just push new one
                    newConnections.push({ id: `conn-${client.id}-${newComponent.id}`, sourceId: client.id, targetId: newComponent.id });
                }
                // LB -> All Servers
                const servers = newComponents.filter(c => c.type === 'server');
                servers.forEach(s => {
                    newConnections.push({ id: `conn-${newComponent.id}-${s.id}`, sourceId: newComponent.id, targetId: s.id });
                });
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
            setCurrentScenarioId(SCENARIOS[currentIndex + 1].id);
        } else {
            toast.success("All levels completed! You are a System Architect Master!");
            setShowWinDialog(false);
        }
    };

    if (!gameState) return <div>Loading...</div>;

    const currentScenario = SCENARIOS.find(s => s.id === currentScenarioId);

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500">
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
                    <Select value={currentScenarioId} onValueChange={setCurrentScenarioId}>
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
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Simulation Live
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Palette */}
                <div className="w-64 flex-shrink-0">
                    <ComponentPalette
                        balance={gameState.budget}
                        onSelectComponent={setSelectedType}
                        selectedType={selectedType}
                    />
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 p-4 gap-4">
                    <ResourceMonitor metrics={gameState.metrics} budget={gameState.budget} />

                    <div
                        className="flex-1 rounded-xl shadow-sm overflow-hidden relative"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left - 32; // Center
                            const y = e.clientY - rect.top - 32;
                            if (selectedType) handleAddComponent(x, y);
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
