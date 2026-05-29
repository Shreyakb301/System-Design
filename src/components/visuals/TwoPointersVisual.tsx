"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoTab = "opposite" | "same";

type DemoStep = {
  array: number[];
  pointers: {
    left?: number;
    right?: number;
    slow?: number;
    fast?: number;
  };
  compared: number[];
  what: string;
  why: string;
  sum?: number;
  target?: number;
  eliminated?: number[];
  dimmed?: number[];
  uniquePrefixEnd?: number;
  writeIndices?: number[];
  found?: boolean;
};

type DemoDefinition = {
  tab: DemoTab;
  tabLabel: string;
  arrayLabel: string;
  targetLabel?: string;
  code: string;
  steps: DemoStep[];
};

const OPPOSITE_CODE = `let left = 0;
let right = nums.length - 1;

while (left < right) {
  const sum = nums[left] + nums[right];

  if (sum === target) {
    return [left + 1, right + 1]; // LeetCode #167 is 1-indexed
  }

  if (sum < target) {
    left += 1; // Need a larger sum
  } else {
    right -= 1; // Need a smaller sum
  }
}`;

const SAME_CODE = `let slow = 0;

for (let fast = 1; fast < nums.length; fast += 1) {
  if (nums[fast] !== nums[slow]) {
    slow += 1; // Open the next write slot
    nums[slow] = nums[fast]; // Copy the new unique value forward
  }
}

return slow + 1; // Length of the unique prefix`;

const DEMOS: Record<DemoTab, DemoDefinition> = {
  opposite: {
    tab: "opposite",
    tabLabel: "Opposite Direction",
    arrayLabel: "[1, 2, 4, 6, 8, 10]",
    targetLabel: "Target = 9",
    code: OPPOSITE_CODE,
    steps: [
      {
        array: [1, 2, 4, 6, 8, 10],
        pointers: { left: 0, right: 5 },
        compared: [0, 5],
        target: 9,
        what: "Pointers placed at both ends.",
        why: "The array is sorted, so moving left grows the sum and moving right shrinks it. That gives us a decision rule for every step.",
      },
      {
        array: [1, 2, 4, 6, 8, 10],
        pointers: { left: 0, right: 5 },
        compared: [0, 5],
        sum: 11,
        target: 9,
        what: "Sum = 11, larger than target 9.",
        why: "Moving left would only grow the sum further. We can permanently discard 10 because nothing to its left can pair with it to reach 9.",
      },
      {
        array: [1, 2, 4, 6, 8, 10],
        pointers: { left: 0, right: 4 },
        compared: [0, 4],
        target: 9,
        eliminated: [5],
        what: "Right moves to index 4. One candidate eliminated.",
        why: "The search space just shrank. We move to the next most promising pair instead of checking every combination.",
      },
      {
        array: [1, 2, 4, 6, 8, 10],
        pointers: { left: 0, right: 4 },
        compared: [0, 4],
        sum: 9,
        target: 9,
        eliminated: [5],
        found: true,
        what: "Sum = 9. Matches target.",
        why: "Found in 2 comparisons instead of the 15 pair checks a brute-force nested loop would need on this array.",
      },
    ],
  },
  same: {
    tab: "same",
    tabLabel: "Same Direction",
    arrayLabel: "[1, 1, 2, 3, 3, 4]",
    code: SAME_CODE,
    steps: [
      {
        array: [1, 1, 2, 3, 3, 4],
        pointers: { slow: 0, fast: 1 },
        compared: [0, 1],
        uniquePrefixEnd: 0,
        what: "Slow = 0 (write head). Fast = 1 (scanner).",
        why: "We need two roles in one array: a reader that sees everything and a writer that only advances on something new. One pass handles both.",
      },
      {
        array: [1, 1, 2, 3, 3, 4],
        pointers: { slow: 0, fast: 1 },
        compared: [0, 1],
        uniquePrefixEnd: 0,
        dimmed: [1],
        what: "arr[fast] = 1 matches arr[slow] = 1. Duplicate - skip.",
        why: "Slow does not earn its next position until a genuinely new value is found.",
      },
      {
        array: [1, 2, 2, 3, 3, 4],
        pointers: { slow: 1, fast: 2 },
        compared: [1, 2],
        uniquePrefixEnd: 1,
        writeIndices: [1],
        what: "arr[fast] = 2 is new. Slow advances and writes 2.",
        why: "The unique prefix just grew. The first two slots now store the deduplicated result so far.",
      },
      {
        array: [1, 2, 3, 3, 3, 4],
        pointers: { slow: 2, fast: 3 },
        compared: [2, 3],
        uniquePrefixEnd: 2,
        writeIndices: [2],
        what: "arr[fast] = 3 is new. Slow advances and writes 3.",
        why: "Prefix [1, 2, 3] is now duplicate-free in the first three slots.",
      },
      {
        array: [1, 2, 3, 3, 3, 4],
        pointers: { slow: 2, fast: 4 },
        compared: [2, 4],
        uniquePrefixEnd: 2,
        dimmed: [4],
        what: "arr[fast] = 3 matches arr[slow] = 3. Duplicate - skip.",
        why: "Slow waits again. No write, no backward movement, and no extra array needed.",
      },
      {
        array: [1, 2, 3, 4, 3, 4],
        pointers: { slow: 3, fast: 5 },
        compared: [3, 5],
        uniquePrefixEnd: 3,
        writeIndices: [3],
        what: "arr[fast] = 4 is new. Slow advances and writes 4.",
        why: "Last unique value placed. The first four slots now hold the deduplicated answer.",
      },
      {
        array: [1, 2, 3, 4, 3, 4],
        pointers: { slow: 3, fast: 5 },
        compared: [3, 5],
        uniquePrefixEnd: 3,
        dimmed: [4, 5],
        found: true,
        what: "Algorithm complete. Return slow + 1 = 4.",
        why: "4 unique values were found in one linear pass with O(1) extra space. The tail after index 3 is irrelevant.",
      },
    ],
  },
};

function pointerRoleLabel(tab: DemoTab, side: "lead" | "trail") {
  if (tab === "opposite") {
    return side === "lead" ? "Left" : "Right";
  }

  return side === "lead" ? "Slow" : "Fast";
}

export function TwoPointersVisual() {
  const [activeTab, setActiveTab] = useState<DemoTab>("opposite");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demo = DEMOS[activeTab];
  const step = demo.steps[currentStep];
  const isAtLastStep = currentStep === demo.steps.length - 1;
  const isAutoRunning = isPlaying && !isAtLastStep;

  const leadIndex =
    typeof step.pointers.left === "number" ? step.pointers.left : step.pointers.slow;
  const trailIndex =
    typeof step.pointers.right === "number" ? step.pointers.right : step.pointers.fast;

  useEffect(() => {
    if (!isAutoRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentStep((previousStep) => {
        if (previousStep >= demo.steps.length - 1) {
          return previousStep;
        }

        return previousStep + 1;
      });
    }, 1400);

    return () => window.clearInterval(timer);
  }, [demo.steps.length, isAutoRunning]);

  function selectTab(nextTab: DemoTab) {
    setActiveTab(nextTab);
    setCurrentStep(0);
    setIsPlaying(false);
  }

  function reset() {
    setCurrentStep(0);
    setIsPlaying(false);
  }

  function nextStep() {
    setCurrentStep((previousStep) =>
      previousStep < demo.steps.length - 1 ? previousStep + 1 : previousStep
    );
  }

  function togglePlay() {
    if (isAutoRunning) {
      setIsPlaying(false);
      return;
    }

    if (isAtLastStep) {
      setCurrentStep(0);
    }

    setIsPlaying(true);
  }

  return (
    <section className="relative flex h-auto min-h-[820px] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 text-slate-100 shadow-xl sm:min-h-[580px]">
      <div className="absolute left-0 top-0 h-1 w-full bg-blue-400" />

      <div className="flex h-[88px] shrink-0 flex-col justify-center gap-3 border-b border-slate-800 px-4 sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {Object.values(DEMOS).map((tab) => (
              <button
                key={tab.tab}
                type="button"
                onClick={() => selectTab(tab.tab)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.tab
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {tab.tabLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-200 hover:bg-blue-500/10">
            O(n) time
          </Badge>
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10">
            O(1) space
          </Badge>
        </div>
      </div>

      <div className="flex h-[72px] shrink-0 items-center border-b border-slate-800 px-4 sm:h-9 sm:px-5">
        <div className="flex w-full flex-wrap gap-2">
          <Badge variant="outline" className="shrink-0 border-slate-700 bg-slate-900 text-slate-400">
            Array: {demo.arrayLabel}
          </Badge>
          {demo.targetLabel ? (
            <Badge variant="outline" className="shrink-0 border-slate-700 bg-slate-900 text-slate-400">
              {demo.targetLabel}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex h-[184px] shrink-0 items-center justify-center border-b border-slate-800 px-4 py-4 sm:h-[132px] sm:px-5">
        <div className="w-full">
          <div className="mx-auto flex w-full justify-center gap-1.5 sm:gap-3">
            {step.array.map((value, index) => {
              const isLead = leadIndex === index;
              const isTrail = trailIndex === index;
              const isCompared = step.compared.includes(index);
              const isUniquePrefix =
                typeof step.uniquePrefixEnd === "number" && index <= step.uniquePrefixEnd;
              const isEliminated = step.eliminated?.includes(index) ?? false;
              const isDimmed = step.dimmed?.includes(index) ?? false;
              const isWritten = step.writeIndices?.includes(index) ?? false;
              const isFound =
                step.found &&
                (activeTab === "opposite"
                  ? isCompared
                  : typeof step.uniquePrefixEnd === "number" && index <= step.uniquePrefixEnd);
              const isTail =
                isDimmed &&
                !isEliminated &&
                !isLead &&
                !isTrail &&
                !(activeTab === "same" && isUniquePrefix);

              return (
                <div
                  key={`${activeTab}-${currentStep}-${index}-${value}`}
                  className="flex w-[2.95rem] shrink-0 flex-col items-center gap-1.5 sm:w-[4.25rem]"
                >
                  <motion.div
                    layout
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className={cn(
                      "relative flex h-[2.95rem] w-[2.95rem] items-center justify-center rounded-[0.8rem] border text-lg font-semibold tracking-tight transition-colors duration-300 sm:h-[3.7rem] sm:w-[3.7rem] sm:rounded-[0.95rem] sm:text-[1.35rem]",
                      "border-slate-800 bg-slate-900 text-white",
                      (isEliminated || isDimmed) && "border-slate-900 bg-slate-950 text-slate-500 opacity-45",
                      isUniquePrefix && "border-emerald-400/30 bg-emerald-500/10",
                      isWritten && "border-emerald-300/50 bg-emerald-500/14",
                      isFound && "border-emerald-300 bg-emerald-500/18 text-emerald-100",
                      isLead && "ring-2 ring-amber-400/80 ring-offset-2 ring-offset-slate-950",
                      isTrail && "ring-2 ring-blue-400/80 ring-offset-2 ring-offset-slate-950",
                      isCompared && !isFound && "shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"
                    )}
                  >
                    <span className="absolute left-1 top-1 rounded-full bg-slate-950 px-1 py-0.5 text-[7px] font-medium text-slate-400 sm:left-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px]">
                      {index}
                    </span>
                    {value}
                  </motion.div>

                  <div className="flex min-h-[2.6rem] flex-col items-center gap-1 text-center sm:min-h-[2.4rem]">
                    <div className="flex min-h-[16px] flex-wrap items-center justify-center gap-1">
                      {isLead ? (
                        <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-200 sm:px-2 sm:text-[9px] sm:tracking-[0.18em]">
                          {pointerRoleLabel(activeTab, "lead")}
                        </span>
                      ) : null}
                      {isTrail ? (
                        <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-blue-200 sm:px-2 sm:text-[9px] sm:tracking-[0.18em]">
                          {pointerRoleLabel(activeTab, "trail")}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex min-h-[14px] flex-wrap items-center justify-center gap-1">
                      {isEliminated ? (
                        <span className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                          Eliminated
                        </span>
                      ) : null}
                      {isTail ? (
                        <span className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                          Tail
                        </span>
                      ) : null}
                      {isUniquePrefix && activeTab === "same" ? (
                        <span className="text-[9px] uppercase tracking-[0.16em] text-emerald-300">
                          Keep
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex h-[92px] shrink-0 flex-col justify-center gap-3 border-b border-slate-800 px-4 py-3 sm:h-11 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-0">
        <div className="flex items-center gap-2">
          {demo.steps.map((_, index) => (
            <span
              key={`${activeTab}-dot-${index}`}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                index <= currentStep ? "bg-blue-400" : "bg-slate-700"
              )}
            />
          ))}
          <span className="ml-2 text-xs font-medium text-slate-500">
            Step {currentStep + 1} of {demo.steps.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-700 bg-transparent px-3 text-slate-200 hover:bg-slate-900 hover:text-white"
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-700 bg-transparent px-3 text-slate-200 hover:bg-slate-900 hover:text-white"
            onClick={togglePlay}
          >
            {isAutoRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoRunning ? "Pause" : "Auto Play"}
          </Button>
          <Button
            className="h-9 rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-500"
            onClick={nextStep}
            disabled={isAtLastStep}
          >
            <SkipForward className="h-4 w-4" />
            Step
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 border-b border-slate-800 px-4 py-3 sm:min-h-[100px] sm:grid-cols-2 sm:px-5 sm:py-2">
        <div className="flex min-h-[90px] flex-col items-start rounded-2xl border border-amber-500/20 bg-slate-900/80 p-4 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
            What
          </p>
          <div className="mt-2 flex-1 overflow-visible pr-1">
            <p className="text-sm leading-6 text-slate-100">{step.what}</p>
          </div>
        </div>

        <div className="flex min-h-[90px] flex-col items-start rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">
            Why
          </p>
          <div className="mt-2 flex-1 overflow-visible pr-1">
            <p className="text-sm leading-6 text-slate-100">{step.why}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-3 sm:px-5 sm:py-2">
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Code2 className="h-4 w-4 text-blue-300" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Code For This Pattern
            </p>
          </div>
          <pre className="mt-3 min-h-0 flex-1 max-h-[160px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-200">
            <code>{demo.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
