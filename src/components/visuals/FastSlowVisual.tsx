"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Split,
  Repeat2,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scenario = "middle" | "cycle";

const VALUES = [1, 2, 3, 4, 5, 6, 7];
const CYCLE_ENTRY_INDEX = 3;

function getNextIndex(index: number, scenario: Scenario) {
  if (scenario === "cycle") {
    return index === VALUES.length - 1 ? CYCLE_ENTRY_INDEX : index + 1;
  }

  return index < VALUES.length - 1 ? index + 1 : null;
}

function NodeCell({
  value,
  activeSlow,
  activeFast,
  cycleMember,
  cycleEntry,
  collision,
}: {
  value: number;
  activeSlow?: boolean;
  activeFast?: boolean;
  cycleMember?: boolean;
  cycleEntry?: boolean;
  collision?: boolean;
}) {
  const labels = [
    activeSlow ? { text: "Slow", tone: "border-blue-400/20 bg-blue-500/12 text-blue-200" } : null,
    activeFast ? { text: "Fast", tone: "border-emerald-400/20 bg-emerald-500/12 text-emerald-200" } : null,
  ].filter(Boolean) as Array<{ text: string; tone: string }>;

  return (
    <div className="flex flex-col items-center">
      <div className="pointer-events-none mb-1.5 flex min-h-[1.9rem] flex-col items-center justify-end gap-0.5">
        {cycleEntry ? (
          <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-0.5 text-[7px] font-medium uppercase tracking-[0.16em] text-blue-200">
            Loop Start
          </span>
        ) : null}

        {labels.map((label) => (
          <span
            key={label.text}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[7px] font-medium uppercase tracking-[0.16em] shadow-sm",
              label.tone
            )}
          >
            {label.text}
          </span>
        ))}
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={cn(
          "relative flex h-[4.7rem] w-[4.7rem] flex-col rounded-[0.95rem] border px-2.5 py-2 shadow-sm",
          collision
            ? "border-rose-400 bg-rose-500/10 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]"
            : activeSlow || activeFast
              ? "border-blue-400 bg-blue-500/10 shadow-[0_0_0_1px_rgba(96,165,250,0.2)]"
              : cycleMember
                ? "border-blue-500/20 bg-slate-900"
                : "border-slate-800 bg-slate-900"
        )}
      >
        <div className="flex min-h-4 items-start">
          <span className="text-[7px] uppercase tracking-[0.18em] text-slate-600">node</span>
        </div>

        <div className="flex flex-1 items-center justify-center py-0.5">
          <span className="text-[1.5rem] font-semibold leading-none tracking-tight text-white">
            {value}
          </span>
        </div>

        <div className="pt-0.5 text-center text-[7px] uppercase tracking-[0.18em] text-slate-600">
          value
        </div>
      </motion.div>
    </div>
  );
}

function ForwardConnector({
  active,
  scenario,
}: {
  active?: boolean;
  scenario: Scenario;
}) {
  return (
    <div className="flex min-w-[2.7rem] flex-col items-center justify-center gap-0.5">
      <div className="flex h-4 items-center">
        <div className={cn("h-px w-4.5", active ? "bg-blue-300" : "bg-slate-700")} />
        <ArrowRight
          className={cn("-ml-0.5 h-[0.7rem] w-[0.7rem]", active ? "text-blue-300" : "text-slate-700")}
          strokeWidth={2}
        />
      </div>
      <span className="text-[7px] uppercase tracking-[0.18em] text-slate-600">
        {scenario === "cycle" ? "next" : "next"}
      </span>
    </div>
  );
}

function MessagePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/35 px-4 py-2.5 text-sm text-slate-200">
      {children}
    </div>
  );
}

export function FastSlowVisual() {
  const [scenario, setScenario] = useState<Scenario>("middle");
  const [slowIndex, setSlowIndex] = useState(0);
  const [fastIndex, setFastIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [status, setStatus] = useState(
    "Slow moves one hop. Fast moves two hops. Step through the list to watch the gap change."
  );
  const [stepCount, setStepCount] = useState(0);
  const [collisionIndex, setCollisionIndex] = useState<number | null>(null);

  const reset = useCallback((nextScenario: Scenario) => {
    setScenario(nextScenario);
    setSlowIndex(0);
    setFastIndex(0);
    setIsPlaying(false);
    setIsFinished(false);
    setStepCount(0);
    setCollisionIndex(null);
    setStatus(
      nextScenario === "middle"
        ? "Slow moves one hop. Fast moves two hops. Step through the list to see why slow reaches the middle."
        : `Slow moves one hop. Fast moves two hops. The tail loops back to node ${VALUES[CYCLE_ENTRY_INDEX]}.`
    );
  }, []);

  const step = useCallback(() => {
    if (isFinished) return;

    if (scenario === "middle") {
      const slowNext = getNextIndex(slowIndex, "middle");
      const fastOne = getNextIndex(fastIndex, "middle");

      if (slowNext === null || fastOne === null) {
        setIsFinished(true);
        setIsPlaying(false);
        setStatus(`Fast reached the end. Slow is at node ${VALUES[slowIndex]}, which is the middle.`);
        return;
      }

      const fastTwo = getNextIndex(fastOne, "middle");
      const nextSlow = slowNext;
      const nextFast = fastTwo ?? fastOne;

      setSlowIndex(nextSlow);
      setFastIndex(nextFast);
      setStepCount((value) => value + 1);

      if (fastTwo === null || getNextIndex(nextFast, "middle") === null) {
        setIsFinished(true);
        setIsPlaying(false);
        setStatus(`Fast reached the end. Slow is at node ${VALUES[nextSlow]}, which is the middle.`);
        return;
      }

      setStatus(`Slow moved to ${VALUES[nextSlow]}. Fast moved to ${VALUES[nextFast]}.`);
      return;
    }

    const nextSlow = getNextIndex(slowIndex, "cycle") ?? slowIndex;
    const fastOne = getNextIndex(fastIndex, "cycle") ?? fastIndex;
    const nextFast = getNextIndex(fastOne, "cycle") ?? fastOne;

    setSlowIndex(nextSlow);
    setFastIndex(nextFast);
    setStepCount((value) => value + 1);

    if (nextSlow === nextFast && stepCount > 0) {
      setCollisionIndex(nextSlow);
      setIsFinished(true);
      setIsPlaying(false);
      setStatus(`Cycle detected. Slow and fast met at node ${VALUES[nextSlow]}.`);
      return;
    }

    setStatus(`Slow moved to ${VALUES[nextSlow]}. Fast moved to ${VALUES[nextFast]}.`);
  }, [fastIndex, isFinished, scenario, slowIndex, stepCount]);

  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const id = window.setInterval(() => {
      step();
    }, 900);

    return () => window.clearInterval(id);
  }, [isFinished, isPlaying, step]);

  const cycleNodes = scenario === "cycle" ? VALUES.map((_, index) => index >= CYCLE_ENTRY_INDEX) : [];

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[70rem]">
        <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <Timer className="h-4 w-4 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="max-w-2xl text-[13px] leading-6 text-slate-400">
              Slow moves one node at a time while fast moves two to find the middle or detect a loop.
            </p>

            <div className="mt-3.5 max-w-4xl rounded-xl border border-slate-800 bg-slate-900/40 p-0.5">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => reset("middle")}
                  className={cn(
                    "rounded-lg px-3 py-2 font-medium transition-colors",
                    scenario === "middle" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Split className="h-3.5 w-3.5" />
                    Find Middle
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => reset("cycle")}
                  className={cn(
                    "rounded-lg px-3 py-2 font-medium transition-colors",
                    scenario === "cycle" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Repeat2 className="h-3.5 w-3.5" />
                    Detect Cycle
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-2 flex max-w-4xl flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span>Slow = +1 hop</span>
              <span>Fast = +2 hops</span>
              <span>O(n) time / O(1) space</span>
              {scenario === "cycle" ? <span>Tail loops back to node {VALUES[CYCLE_ENTRY_INDEX]}</span> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.2rem] border border-slate-800 bg-slate-900/40 px-4 py-4">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
            <span>[ value | next ]</span>
            <span>{scenario === "middle" ? "Linear list" : "Cycle closes back into the list"}</span>
          </div>

          <div className="overflow-x-auto overflow-y-visible py-2">
            <div className="mx-auto w-max max-w-full px-5">
              <div className="flex min-h-[7.8rem] items-end gap-1.5">
                {VALUES.map((value, index) => (
                  <div key={value} className="flex items-end gap-1.5">
                    <NodeCell
                      value={value}
                      activeSlow={slowIndex === index}
                      activeFast={fastIndex === index}
                      cycleMember={scenario === "cycle" ? cycleNodes[index] : false}
                      cycleEntry={scenario === "cycle" && index === CYCLE_ENTRY_INDEX}
                      collision={collisionIndex === index}
                    />
                    {index < VALUES.length - 1 ? (
                      <ForwardConnector
                        scenario={scenario}
                        active={scenario === "middle" ? fastIndex > index : index >= CYCLE_ENTRY_INDEX || fastIndex > index}
                      />
                    ) : null}
                  </div>
                ))}
              </div>

              {scenario === "cycle" ? (
                <div className="mt-2 flex items-center justify-end gap-2 pr-[4.9rem] text-[10px] text-blue-300">
                  <Repeat2 className="h-3.5 w-3.5" />
                  <span>Tail links back to node {VALUES[CYCLE_ENTRY_INDEX]}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-2.5">
          <MessagePanel>{status}</MessagePanel>
        </div>

        <div className="mt-3.5 border-t border-slate-800 pt-3">
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-slate-700 bg-transparent px-4 text-slate-200 hover:bg-slate-900 hover:text-white"
              onClick={() => reset(scenario)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl border-slate-700 bg-transparent px-4 text-slate-200 hover:bg-slate-900 hover:text-white"
              onClick={step}
              disabled={isPlaying || isFinished}
            >
              <SkipForward className="h-4 w-4" />
              Step
            </Button>
            <Button
              className={cn(
                "h-10 rounded-xl px-5 text-white",
                isPlaying ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"
              )}
              onClick={() => setIsPlaying((value) => !value)}
              disabled={isFinished}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Auto Play
                </>
              )}
            </Button>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-sm text-slate-400">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-500">steps</span>{" "}
              <span className="text-sm text-slate-300">{stepCount}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
