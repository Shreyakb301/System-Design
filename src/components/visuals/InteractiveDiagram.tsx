"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionConfig } from "framer-motion";

interface InteractiveDiagramProps {
    children: React.ReactNode | ((props: { isPlaying: boolean; reset: () => void }) => React.ReactNode);
    className?: string;
}

export function InteractiveDiagram({ children, className }: InteractiveDiagramProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const reset = () => {
        setIsPlaying(false);
    };

    return (
        <div className={cn("rounded-xl border bg-background p-4 shadow-sm", className)}>
            <div className="mb-4 flex items-center justify-between border-b pb-2">
                <div className="text-sm font-medium text-muted-foreground">Interactive Simulation</div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsPlaying(!isPlaying)}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={reset} title="Reset">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="relative min-h-[300px] w-full overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 p-4">
                <MotionConfig reducedMotion="user">
                    {typeof children === "function" ? children({ isPlaying, reset }) : children}
                </MotionConfig>
            </div>
        </div>
    );
}
