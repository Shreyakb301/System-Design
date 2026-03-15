"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = {
  pointers: { left: number; right: number } | { slow: number; fast: number };
  highlights: number[];
  message: string;
  found?: boolean;
  array?: number[];
};

type Pattern = "opposite" | "same";

const oppositeData = {
  array: [1, 2, 4, 6, 8, 10],
  target: 10,
};

const sameData = {
  array: [1, 1, 2, 2, 3, 4],
};

const oppositeSteps: Step[] = [
  {
    pointers: { left: 0, right: 5 },
    highlights: [0, 5],
    message: "Initialize pointers at both ends. Sum: 1 + 10 = 11",
  },
  {
    pointers: { left: 0, right: 5 },
    highlights: [0, 5],
    message: "11 > 10. We need a smaller sum, so move right pointer inward.",
  },
  {
    pointers: { left: 0, right: 4 },
    highlights: [0, 4],
    message: "Pointers: 0 and 4. Sum: 1 + 8 = 9",
  },
  {
    pointers: { left: 0, right: 4 },
    highlights: [0, 4],
    message: "9 < 10. We need a larger sum, so move left pointer inward.",
  },
  {
    pointers: { left: 1, right: 4 },
    highlights: [1, 4],
    message: "Pointers: 1 and 4. Sum: 2 + 8 = 10",
  },
  {
    pointers: { left: 1, right: 4 },
    highlights: [1, 4],
    found: true,
    message: "Target Found! 2 + 8 = 10",
  },
];

const sameSteps: Step[] = [
  {
    pointers: { slow: 0, fast: 1 },
    highlights: [0, 1],
    array: [1, 1, 2, 2, 3, 4],
    message: "Start slow at 0, fast at 1. Compare values.",
  },
  {
    pointers: { slow: 0, fast: 1 },
    highlights: [0, 1],
    array: [1, 1, 2, 2, 3, 4],
    message: "Values equal (1 == 1). Move fast to find next unique.",
  },
  {
    pointers: { slow: 0, fast: 2 },
    highlights: [0, 2],
    array: [1, 1, 2, 2, 3, 4],
    message: "Values different (2 != 1). Move slow, update value.",
  },
  {
    pointers: { slow: 1, fast: 2 },
    highlights: [1, 2],
    array: [1, 2, 2, 2, 3, 4],
    message: "Updated index 1 with value 2.",
  },
  {
    pointers: { slow: 1, fast: 3 },
    highlights: [1, 3],
    array: [1, 2, 2, 2, 3, 4],
    message: "Scanning...",
  },
  {
    pointers: { slow: 1, fast: 4 },
    highlights: [1, 4],
    array: [1, 2, 2, 2, 3, 4],
    message: "New unique value 3 found. Move slow, update.",
  },
  {
    pointers: { slow: 2, fast: 4 },
    highlights: [2, 4],
    array: [1, 2, 3, 2, 3, 4],
    message: "Updated index 2 with value 3.",
  },
  {
    pointers: { slow: 2, fast: 5 },
    highlights: [2, 5],
    array: [1, 2, 3, 2, 3, 4],
    message: "Final scanning...",
  },
  {
    pointers: { slow: 3, fast: 5 },
    highlights: [3, 5],
    array: [1, 2, 3, 4, 3, 4],
    found: true,
    message: "Done! Unique prefix: [1, 2, 3, 4]",
  },
];

const patternCode = {
  opposite: `// Opposite Direction
while (left < right) {
  const sum = arr[left] + arr[right];
  if (sum === target) return [left, right];
  if (sum < target) left++;
  else right--;
}`,
  same: `// Same Direction (Slow & Fast)
let slow = 0;
for (let fast = 1; fast < n; fast++) {
  if (arr[fast] !== arr[slow]) {
    slow++;
    arr[slow] = arr[fast];
  }
}
return slow + 1;`,
} as const;

export function TwoPointersVisual() {
  const [pattern, setPattern] = useState<Pattern>("opposite");
  const [currentStep, setCurrentStep] = useState(0);

  const steps = pattern === "opposite" ? oppositeSteps : sameSteps;
  const data = pattern === "opposite" ? oppositeData : sameData;
  const step = steps[currentStep] ?? steps[0];
  const values = step.array ?? data.array;

  const leftLabel = "left" in step.pointers ? "Left" : "Slow";
  const rightLabel = "right" in step.pointers ? "Right" : "Fast";
  const patternLabel =
    pattern === "opposite" ? "Pattern: Two Sum (Sorted)" : "Pattern: Remove Duplicates";

  function reset() {
    setCurrentStep(0);
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((previousStep) => previousStep + 1);
    }
  }

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
              <Timer className="h-4.5 w-4.5 text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="max-w-3xl text-sm leading-6 text-slate-400">
                Watch two positions in the array move according to a simple rule, one step
                at a time.
              </p>

              <div className="mt-3 max-w-4xl rounded-xl border border-slate-800 bg-slate-900/40 p-0.5">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPattern("opposite");
                      setCurrentStep(0);
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-colors",
                      pattern === "opposite"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    Opposite Direction
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPattern("same");
                      setCurrentStep(0);
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-colors",
                      pattern === "same"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    Same Direction
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex max-w-4xl flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                <span>{patternLabel}</span>
                <span>Time Complexity: O(n)</span>
                <span>Space Complexity: O(1)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="mx-auto inline-flex w-max min-w-full justify-center rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-3.5">
              <div className="box-border w-full max-w-full">
                <div className="flex w-full justify-center">
                  <div className="flex w-max items-center justify-center gap-2.5 px-0.5">
                    <AnimatePresence initial={false} mode="popLayout">
                      {values.map((value, index) => {
                        const isLeft =
                          ("left" in step.pointers && step.pointers.left === index) ||
                          ("slow" in step.pointers && step.pointers.slow === index);
                        const isRight =
                          ("right" in step.pointers && step.pointers.right === index) ||
                          ("fast" in step.pointers && step.pointers.fast === index);
                        const isCompared = step.highlights.includes(index);
                        const pointerLabel = [isLeft ? leftLabel : null, isRight ? rightLabel : null]
                          .filter(Boolean)
                          .join(" / ");

                        return (
                          <motion.div
                            layout
                            key={`${pattern}-${index}-${value}`}
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 24 }}
                            className={cn(
                              "relative h-[4.7rem] w-[4.7rem] rounded-[0.95rem] border px-1.5 py-1.5",
                              isCompared ? "border-blue-400 bg-blue-500/8" : "border-slate-800 bg-slate-900",
                              step.found && isCompared && "border-blue-300 bg-blue-500/14"
                            )}
                          >
                            <div className="absolute inset-x-1.5 top-1.5 flex items-start justify-between gap-1">
                              <span className="rounded-full bg-slate-950 px-1.5 py-0.5 text-[8px] font-medium text-slate-300">
                                {`idx ${index}`}
                              </span>
                              {pointerLabel ? (
                                <span
                                  className={cn(
                                    "pt-0.5 text-[8px] font-medium leading-none",
                                    isLeft ? "text-blue-300" : "text-slate-300"
                                  )}
                                >
                                  {pointerLabel}
                                </span>
                              ) : null}
                            </div>

                            <div className="absolute inset-x-0 bottom-1.5 top-7 flex items-center justify-center">
                              <motion.span
                                key={`${pattern}-${currentStep}-${index}-${value}`}
                                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="text-[1.5rem] font-semibold tracking-tight text-white"
                              >
                                {value}
                              </motion.span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <div className="w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${pattern}-${currentStep}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[15px] text-slate-200"
                >
                  {step.message}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="mx-auto mt-4 max-w-4xl border-t border-slate-800 pt-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                className="h-9 rounded-xl border-slate-700 bg-transparent px-4 text-base text-slate-200 hover:bg-slate-900 hover:text-white"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                className="h-9 rounded-xl bg-blue-600 px-5 text-base text-white hover:bg-blue-500"
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
              >
                <Play className="h-4 w-4" />
                Step
              </Button>
              <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-base text-slate-400">
                {currentStep + 1} / {steps.length}
              </span>
            </div>
          </div>

          <details className="mx-auto mt-3 max-w-4xl">
            <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-slate-800 bg-slate-900/35 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Code Example
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/35 px-3 py-2 text-[10px] leading-5 text-slate-300">
              {patternCode[pattern]}
            </pre>
          </details>
        </div>
    </section>
  );
}
