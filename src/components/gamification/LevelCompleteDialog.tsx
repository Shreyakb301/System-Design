"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface LevelCompleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onNextLevel: () => void;
    onReplay: () => void;
    metrics: {
        latency: number;
        reliability: number;
        monthlyCost: number;
    };
    score: number;
}

export function LevelCompleteDialog({
    open,
    onOpenChange,
    onNextLevel,
    onReplay,
    metrics,
    score,
}: LevelCompleteDialogProps) {
    useEffect(() => {
        if (open) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-700 dark:text-amber-400">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl">Exercise complete</DialogTitle>
                    </div>
                    <DialogDescription>
                        The current setup satisfies the goal state. Replay it or continue to the next exercise.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold">Latency</div>
                            <div className="text-lg font-mono font-medium text-emerald-600">{metrics.latency}ms</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold">Reliability</div>
                            <div className="text-lg font-mono font-medium text-sky-600">{(metrics.reliability * 100).toFixed(1)}%</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold">Monthly Cost</div>
                            <div className="text-lg font-mono font-medium text-emerald-600">${metrics.monthlyCost}</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold">Score</div>
                            <div className="text-lg font-mono font-medium text-purple-600">{score}</div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="outline" onClick={onReplay} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Replay
                    </Button>
                    <Button onClick={onNextLevel} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        Next Level
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
