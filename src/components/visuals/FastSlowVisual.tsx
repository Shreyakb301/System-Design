"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Code2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Scenario = "middle" | "cycle";

type DisplayNode = {
  label: string;
  kind: "node" | "null";
};

type DemoStep = {
  slow: number;
  fast: number;
  what: string;
  why: string;
  resultIndex?: number;
  resultLabel?: "Middle" | "Meeting";
  tailIndices?: number[];
  found?: boolean;
};

type DemoDefinition = {
  tab: Scenario;
  tabLabel: string;
  listLabel: string;
  code: string;
  nodes: DisplayNode[];
  steps: DemoStep[];
};

const MIDDLE_CODE = `function findMiddle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;       // one hop
    fast = fast.next.next;  // two hops
  }

  return slow; // slow is at the middle
}`;

const CYCLE_CODE = `function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;       // one hop
    fast = fast.next.next;  // two hops

    if (slow === fast) return true; // cycle detected
  }

  return false; // fast reached null - no cycle
}`;

const DEMOS: Record<Scenario, DemoDefinition> = {
  middle: {
    tab: "middle",
    tabLabel: "Find Middle",
    listLabel: "List: 1 -> 2 -> 3 -> 4 -> 5 -> null",
    code: MIDDLE_CODE,
    nodes: [
      { label: "1", kind: "node" },
      { label: "2", kind: "node" },
      { label: "3", kind: "node" },
      { label: "4", kind: "node" },
      { label: "5", kind: "node" },
      { label: "null", kind: "null" },
    ],
    steps: [
      {
        slow: 0,
        fast: 0,
        what: "Both pointers start at head (node 1).",
        why: "Slow will cover half the distance fast does. When fast hits the end, slow is exactly at the middle - no counting needed.",
      },
      {
        slow: 1,
        fast: 2,
        what: "Slow moves to node 2. Fast moves to node 3 (two hops).",
        why: "Fast is already one node ahead. The gap between them grows by one every step - that gap is what positions slow at the midpoint.",
      },
      {
        slow: 2,
        fast: 4,
        what: "Slow moves to node 3. Fast moves to node 5 (two hops).",
        why: "Fast just reached the last node. Slow has moved exactly half as far - it is at the middle.",
      },
      {
        slow: 2,
        fast: 5,
        resultIndex: 2,
        resultLabel: "Middle",
        tailIndices: [3, 4],
        found: true,
        what: "Fast reached null. Algorithm complete. Middle = node 3.",
        why: "Fast covered the full list in the same steps slow covered half. Return slow - it is always the middle node.",
      },
    ],
  },
  cycle: {
    tab: "cycle",
    tabLabel: "Detect Cycle",
    listLabel: "List: 1 -> 2 -> 3 -> 4 -> 5, with 5 -> 3",
    code: CYCLE_CODE,
    nodes: [
      { label: "1", kind: "node" },
      { label: "2", kind: "node" },
      { label: "3", kind: "node" },
      { label: "4", kind: "node" },
      { label: "5", kind: "node" },
    ],
    steps: [
      {
        slow: 0,
        fast: 0,
        what: "Both start at head (node 1). The cycle tail is node 5, which points back to node 3.",
        why: "We show the cycle upfront intentionally. The question is not whether you can see it - it is whether the algorithm can detect it without a map of visited nodes.",
      },
      {
        slow: 1,
        fast: 2,
        what: "Slow moves to node 2. Fast moves to node 3.",
        why: "Both are in the linear section. Fast is gaining one node per step on slow.",
      },
      {
        slow: 2,
        fast: 4,
        what: "Slow moves to node 3. Fast moves to node 5.",
        why: "Fast entered the cycle on the previous step. Slow just entered. Once both are inside the cycle, fast will lap slow.",
      },
      {
        slow: 3,
        fast: 3,
        resultIndex: 3,
        resultLabel: "Meeting",
        what: "Slow moves to node 4. Fast moves two hops: 5 -> 3 -> 4. They meet at node 4.",
        why: "Inside a cycle, fast gains exactly one node on slow per step. It must catch up - there is no way to skip over slow when incrementing by one. Meeting = cycle confirmed.",
      },
      {
        slow: 3,
        fast: 3,
        resultIndex: 3,
        resultLabel: "Meeting",
        found: true,
        what: "Pointers met at node 4. Return true - cycle exists.",
        why: "If the list had no cycle, fast would have reached null before they ever met. Null means no cycle. Meeting means cycle. Those are the only two outcomes.",
      },
    ],
  },
};

function NodeBox({
  node,
  isSlow,
  isFast,
  isResult,
  resultLabel,
  isTail,
}: {
  node: DisplayNode;
  isSlow: boolean;
  isFast: boolean;
  isResult: boolean;
  resultLabel?: "Middle" | "Meeting";
  isTail: boolean;
}) {
  return (
    <div className="flex w-[52px] shrink-0 flex-col items-center gap-1.5 text-center">
      <motion.div
        layout
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className={cn(
          "relative flex h-[54px] w-[52px] overflow-hidden rounded-[0.95rem] border shadow-sm",
          node.kind === "null" ? "items-center justify-center" : "items-stretch",
          isTail && "border-slate-900 bg-slate-950 text-slate-500 opacity-45",
          !isTail && !isResult && !isSlow && !isFast && "border-slate-800 bg-slate-900 text-white",
          isSlow && !isResult && "border-amber-400/70 bg-amber-500/10 text-white",
          isFast && !isResult && "border-blue-400/70 bg-blue-500/10 text-white",
          isResult && "border-emerald-300 bg-emerald-500/18 text-emerald-100"
        )}
      >
        {node.kind === "null" ? (
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">null</span>
        ) : (
          <>
            <div className="flex flex-1 items-center justify-center text-lg font-semibold tracking-tight">
              {node.label}
            </div>
            <div className="flex w-[16px] items-center justify-center border-l border-slate-700 text-[11px] text-slate-400">
              →
            </div>
          </>
        )}
      </motion.div>

      <div className="flex min-h-[2.5rem] flex-col items-center gap-1">
        <div className="flex min-h-[16px] flex-wrap items-center justify-center gap-1">
          {isResult ? (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              {resultLabel}
            </span>
          ) : null}
          {isSlow && !isResult ? (
            <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-amber-200">
              SLOW
            </span>
          ) : null}
          {isFast && !isResult ? (
            <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-200">
              FAST
            </span>
          ) : null}
        </div>

        <div className="flex min-h-[14px] items-center justify-center">
          {isTail ? (
            <span className="text-[9px] uppercase tracking-[0.16em] text-slate-600">TAIL</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ForwardConnector() {
  return (
    <div className="flex h-[54px] w-[20px] shrink-0 items-center justify-center text-slate-600">
      <div className="flex items-center">
        <div className="h-px w-3 bg-slate-700" />
        <ArrowRight className="-ml-0.5 h-3.5 w-3.5 text-slate-700" strokeWidth={2} />
      </div>
    </div>
  );
}

function CycleOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[40px] w-[340px]"
      viewBox="0 0 340 40"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="cycle-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#f87171" />
        </marker>
      </defs>
      <path
        d="M314 24 C338 24 338 4 264 4 L188 4 C166 4 156 12 170 22"
        fill="none"
        stroke="#f87171"
        strokeWidth="2"
        strokeDasharray="5 4"
        markerEnd="url(#cycle-arrowhead)"
      />
      <text x="244" y="16" fill="#fca5a5" fontSize="10" fontWeight="600" letterSpacing="0.14em">
        cycle
      </text>
    </svg>
  );
}

export function FastSlowVisual() {
  const [activeTab, setActiveTab] = useState<Scenario>("middle");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demo = DEMOS[activeTab];
  const step = demo.steps[currentStep];
  const isAtLastStep = currentStep === demo.steps.length - 1;
  const isAutoRunning = isPlaying && !isAtLastStep;

  useEffect(() => {
    if (!isAutoRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentStep((previousStep) =>
        previousStep < demo.steps.length - 1 ? previousStep + 1 : previousStep
      );
    }, 1400);

    return () => window.clearInterval(timer);
  }, [demo.steps.length, isAutoRunning]);

  function selectTab(nextTab: Scenario) {
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
    <section className="relative flex h-auto min-h-[860px] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 text-slate-100 shadow-xl sm:min-h-[620px]">
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
            {demo.listLabel}
          </Badge>
        </div>
      </div>

      <div className="flex h-[240px] shrink-0 items-center justify-center border-b border-slate-800 px-4 py-4 sm:h-[184px] sm:px-5">
        <div className="w-full">
          <div className={cn("relative mx-auto w-max", activeTab === "cycle" && "pt-9")}>
            {activeTab === "cycle" ? <CycleOverlay /> : null}

            <div className="flex items-start">
              {demo.nodes.map((node, index) => {
                const isSlow = step.slow === index;
                const isFast = step.fast === index;
                const isResult = step.resultIndex === index;
                const isTail = step.tailIndices?.includes(index) ?? false;

                return (
                  <div key={`${activeTab}-${node.label}-${index}`} className="flex items-start">
                    <NodeBox
                      node={node}
                      isSlow={isSlow}
                      isFast={isFast}
                      isResult={isResult}
                      resultLabel={step.resultLabel}
                      isTail={isTail}
                    />
                    {index < demo.nodes.length - 1 && !(activeTab === "cycle" && index === demo.nodes.length - 1) ? (
                      <ForwardConnector />
                    ) : null}
                  </div>
                );
              })}
            </div>
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
