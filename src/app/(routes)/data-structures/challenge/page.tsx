"use client";

import { AlgorithmVisualizer } from "@/components/gamification/AlgorithmVisualizer";
import { LevelCompleteDialog } from "@/components/gamification/LevelCompleteDialog";
import { DS_LEVELS, DSNode } from "@/lib/gamification/ds-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { RefreshCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DataStructureChallengePage() {
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [nodes, setNodes] = useState<DSNode[]>([]);
    const [showWinDialog, setShowWinDialog] = useState(false);
    const [score, setScore] = useState(0);

    const currentLevel = DS_LEVELS[currentLevelIndex];

    useEffect(() => {
        // Reset level when index changes
        setNodes(JSON.parse(JSON.stringify(currentLevel.initialNodes)));
        setShowWinDialog(false);
    }, [currentLevelIndex]);

    const checkWinCondition = (currentNodes: DSNode[]) => {
        if (currentLevel.target.type === "list_connect") {
            // Win if 4 nodes are connected: 1->2->3->4
            const head = currentNodes.find(n => n.value === 1);
            if (!head) return;

            // Traverse
            let count = 1;
            let curr = head;
            let visited = new Set();
            while (curr && curr.nextId && !visited.has(curr.id)) {
                visited.add(curr.id);
                const next = currentNodes.find(n => n.id === curr.nextId);
                if (next && Number(next.value) === Number(curr.value) + 1) {
                    count++;
                    curr = next;
                } else {
                    break;
                }
            }

            if (count === 4) {
                setScore(1000);
                setShowWinDialog(true);
            }
        }
    };

    const handleNodesChange = (newNodes: DSNode[]) => {
        setNodes(newNodes);
        checkWinCondition(newNodes);
    };

    const handleNextLevel = () => {
        if (currentLevelIndex < DS_LEVELS.length - 1) {
            setCurrentLevelIndex(prev => prev + 1);
        } else {
            toast.success("All challenges completed!");
            setShowWinDialog(false);
        }
    };

    const handleReplay = () => {
        setNodes(JSON.parse(JSON.stringify(currentLevel.initialNodes)));
        setShowWinDialog(false);
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/data-structures">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Algorithm Arena</h1>
                        <p className="text-muted-foreground">Level {currentLevelIndex + 1}: {currentLevel.title}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReplay}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="col-span-1 p-6 space-y-4">
                    <div>
                        <h2 className="font-semibold text-lg mb-2">Objective</h2>
                        <p className="text-sm text-muted-foreground">{currentLevel.description}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Goal</h3>
                        <p className="text-sm font-medium">{currentLevel.target.description}</p>
                    </div>
                </Card>

                <div className="col-span-3 h-[600px] lg:h-auto">
                    <AlgorithmVisualizer
                        nodes={nodes}
                        onNodesChange={handleNodesChange}
                    />
                </div>
            </div>

            <LevelCompleteDialog
                open={showWinDialog}
                onOpenChange={setShowWinDialog}
                onNextLevel={currentLevelIndex < DS_LEVELS.length - 1 ? handleNextLevel : () => { }}
                onReplay={handleReplay}
                metrics={{ latency: 0, reliability: 1, monthlyCost: 0 }}
                score={score}
            />
        </div>
    );
}
