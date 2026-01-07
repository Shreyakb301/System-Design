"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ArrowLeft,
    ArrowRight,
    Play,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    Info,
    Timer,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
    pointers: { left: number; right: number } | { slow: number; fast: number };
    highlights: number[];
    message: string;
    found?: boolean;
    array?: number[]; // Used for same-direction to show state changes
};

type Pattern = "opposite" | "same";

export function TwoPointersVisual() {
    const [pattern, setPattern] = useState<Pattern>("opposite");
    const [currentStep, setCurrentStep] = useState(0);

    // Initial states
    const oppositeData = {
        array: [1, 2, 4, 6, 8, 10],
        target: 10,
    };

    const sameData = {
        array: [1, 1, 2, 2, 3, 4],
    };

    const oppositeSteps: Step[] = [
        { pointers: { left: 0, right: 5 }, highlights: [0, 5], message: "Initialize pointers at both ends. Sum: 1 + 10 = 11" },
        { pointers: { left: 0, right: 5 }, highlights: [0, 5], message: "11 > 10. We need a smaller sum, so move right pointer inward." },
        { pointers: { left: 0, right: 4 }, highlights: [0, 4], message: "Pointers: 0 and 4. Sum: 1 + 8 = 9" },
        { pointers: { left: 0, right: 4 }, highlights: [0, 4], message: "9 < 10. We need a larger sum, so move left pointer inward." },
        { pointers: { left: 1, right: 4 }, highlights: [1, 4], message: "Pointers: 1 and 4. Sum: 2 + 8 = 10" },
        { pointers: { left: 1, right: 4 }, highlights: [1, 4], found: true, message: "Target Found! 2 + 8 = 10" },
    ];

    const sameSteps: Step[] = [
        { pointers: { slow: 0, fast: 1 }, highlights: [0, 1], array: [1, 1, 2, 2, 3, 4], message: "Start slow at 0, fast at 1. Compare values." },
        { pointers: { slow: 0, fast: 1 }, highlights: [0, 1], array: [1, 1, 2, 2, 3, 4], message: "Values equal (1 == 1). Move fast to find next unique." },
        { pointers: { slow: 0, fast: 2 }, highlights: [0, 2], array: [1, 1, 2, 2, 3, 4], message: "Values different (2 != 1). Move slow, update value." },
        { pointers: { slow: 1, fast: 2 }, highlights: [1, 2], array: [1, 2, 2, 2, 3, 4], message: "Updated index 1 with value 2." },
        { pointers: { slow: 1, fast: 3 }, highlights: [1, 3], array: [1, 2, 2, 2, 3, 4], message: "Scanning..." },
        { pointers: { slow: 1, fast: 4 }, highlights: [1, 4], array: [1, 2, 2, 2, 3, 4], message: "New unique value 3 found. Move slow, update." },
        { pointers: { slow: 2, fast: 4 }, highlights: [2, 4], array: [1, 2, 3, 2, 3, 4], message: "Updated index 2 with value 3." },
        { pointers: { slow: 2, fast: 5 }, highlights: [2, 5], array: [1, 2, 3, 2, 3, 4], message: "Final scanning..." },
        { pointers: { slow: 3, fast: 5 }, highlights: [3, 5], array: [1, 2, 3, 4, 3, 4], found: true, message: "Done! Unique prefix: [1, 2, 3, 4]" },
    ];

    const steps = pattern === "opposite" ? oppositeSteps : sameSteps;
    const data = pattern === "opposite" ? oppositeData : sameData;
    const step = steps[currentStep] || steps[0];

    const reset = () => setCurrentStep(0);

    const nextStep = () => {
        if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    useEffect(() => {
        reset();
    }, [pattern]);

    return (
        <Card className="p-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
            {/* Header / Mode Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Timer className="w-5 h-5 text-indigo-500" />
                        Two Pointers Simulation
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Visualize pointer collaboration logic step-by-step.
                    </p>
                </div>
                <div className="flex flex-wrap p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <button
                        onClick={() => setPattern("opposite")}
                        className={cn(
                            "flex-1 px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                            pattern === "opposite" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >Opposite Direction</button>
                    <button
                        onClick={() => setPattern("same")}
                        className={cn(
                            "flex-1 px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                            pattern === "same" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >Same Direction</button>
                </div>
            </div>

            {/* Pattern Description */}
            <div className="grid md:grid-cols-2 gap-8 items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-4">
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                        {pattern === "opposite" ? "Pattern: Two Sum (Sorted)" : "Pattern: Remove Duplicates"}
                    </Badge>
                    <h4 className="text-lg font-semibold italic">
                        {pattern === "opposite"
                            ? '"Start at both ends and meet in the middle."'
                            : '"One pointer tracks progress, the other builds the result."'}
                    </h4>
                    <pre className="text-[11px] font-mono bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-800 shadow-inner">
                        {pattern === "opposite" ? `// Opposite Direction
while (left < right) {
  const sum = arr[left] + arr[right];
  if (sum === target) return [left, right];
  if (sum < target) left++;
  else right--;
}` : `// Same Direction (Slow & Fast)
let slow = 0;
for (let fast = 1; fast < n; fast++) {
  if (arr[fast] !== arr[slow]) {
    slow++;
    arr[slow] = arr[fast];
  }
}
return slow + 1;`}
                    </pre>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Zap className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold">Time Complexity: O(n)</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Significantly faster than nested loops (Brute Force O(n²)). We only pass through the array once.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Info className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold">Space Complexity: O(1)</p>
                            <p className="text-[10px] text-muted-foreground">
                                No additional storage used. Modifies in-place.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulation Canvas */}
            <div className="relative pt-12 pb-20">
                <div className="flex justify-center gap-3">
                    <AnimatePresence mode="popLayout">
                        {(step.array || data.array).map((val, idx) => {
                            const isL = "left" in step.pointers ? step.pointers.left === idx : step.pointers.slow === idx;
                            const isR = "right" in step.pointers ? step.pointers.right === idx : step.pointers.fast === idx;
                            const isHighlight = step.highlights.includes(idx);

                            return (
                                <motion.div
                                    key={`${idx}-${val}`}
                                    layout
                                    className={cn(
                                        "relative w-14 h-14 flex items-center justify-center rounded-xl border-2 font-bold text-lg transition-all duration-300",
                                        isHighlight ? "border-indigo-500 bg-indigo-500/10" : "border-slate-200 dark:border-slate-800 opacity-60",
                                        step.found && isHighlight && "border-green-500 bg-green-500/20 text-green-600"
                                    )}
                                >
                                    {val}
                                    <span className="absolute -top-7 text-[10px] font-mono opacity-40">[{idx}]</span>

                                    {/* Pointer Indicators */}
                                    <AnimatePresence>
                                        {isL && (
                                            <motion.div
                                                layoutId="ptr-left"
                                                initial={{ y: 0, opacity: 0 }}
                                                animate={{ y: 60, opacity: 1 }}
                                                className="absolute flex flex-col items-center gap-1"
                                            >
                                                <div className="w-0.5 h-6 bg-blue-500" />
                                                <Badge className="bg-blue-600 text-[10px] py-0">{"left" in step.pointers ? "Left" : "Slow"}</Badge>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <AnimatePresence>
                                        {isR && (
                                            <motion.div
                                                layoutId="ptr-right"
                                                initial={{ y: 0, opacity: 0 }}
                                                animate={{ y: 60, opacity: 1 }}
                                                className="absolute flex flex-col items-center gap-1"
                                            >
                                                <div className="w-0.5 h-6 bg-rose-500" />
                                                <Badge className="bg-rose-600 text-[10px] py-0">{"right" in step.pointers ? "Right" : "Fast"}</Badge>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Step Description Callout */}
                <div className="mt-28 flex justify-center">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "p-4 rounded-xl border max-w-lg text-center shadow-lg",
                            step.found ? "border-green-500 bg-green-500/5" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        )}
                    >
                        <p className="text-sm font-medium">{step.message}</p>
                    </motion.div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap justify-center items-center gap-4">
                <Button variant="outline" size="sm" onClick={reset} className="gap-2 font-bold min-w-[100px]">
                    <RotateCcw className="w-4 h-4" /> Reset
                </Button>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-full px-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="rounded-full"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-mono w-12 text-center font-bold">
                        {currentStep + 1} / {steps.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextStep}
                        disabled={currentStep === steps.length - 1}
                        className="rounded-full"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1}
                    className="gap-2 font-bold min-w-[100px]"
                >
                    <Play className="w-3 h-3" /> Step
                </Button>
            </div>
        </Card>
    );
}

function Badge({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: "outline" | "secondary" | "default" }) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight inline-block",
            variant === "secondary" ? "" : "bg-primary text-primary-foreground",
            className
        )}>
            {children}
        </span>
    );
}
