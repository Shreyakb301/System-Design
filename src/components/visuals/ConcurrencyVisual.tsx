"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TeachingSimulationFrame,
  type TeachingSimulationTab,
} from "@/components/visuals/TeachingSimulationFrame";

type ConcurrencyTab = "race" | "lock";

type ConcurrencyStep = {
  sharedCount: number;
  t1State: string;
  t2State: string;
  t1Local: string;
  t2Local: string;
  lockState: string;
  activeThread: "t1" | "t2" | "both";
  what: string;
  why: string;
};

type ConcurrencyDemo = {
  code: string;
  steps: ConcurrencyStep[];
};

const TABS: Array<TeachingSimulationTab<ConcurrencyTab>> = [
  { id: "race", label: "Race Condition" },
  { id: "lock", label: "With Lock" },
];

const DEMOS: Record<ConcurrencyTab, ConcurrencyDemo> = {
  race: {
    code: `// Thread 1 and Thread 2 both run this
count = count + 1`,
    steps: [
      {
        sharedCount: 0,
        t1State: "Ready to read count",
        t2State: "Ready to read count",
        t1Local: "—",
        t2Local: "—",
        lockState: "No lock",
        activeThread: "both",
        what: "Both threads are about to execute count = count + 1 against the same memory cell.",
        why: "That statement is not atomic. It is really read, compute, then write. Interleaving those substeps is where races come from.",
      },
      {
        sharedCount: 0,
        t1State: "Read count -> 0",
        t2State: "Still waiting to read",
        t1Local: "0",
        t2Local: "—",
        lockState: "No lock",
        activeThread: "t1",
        what: "Thread 1 reads count and stores a local copy of 0.",
        why: "At this point Thread 1 has only a snapshot. The shared value has not changed yet, so another thread can still read the same old value.",
      },
      {
        sharedCount: 0,
        t1State: "Holding stale local 0",
        t2State: "Read count -> 0",
        t1Local: "0",
        t2Local: "0",
        lockState: "No lock",
        activeThread: "t2",
        what: "Thread 2 also reads 0 before Thread 1 writes anything back.",
        why: "Now both threads are computing from the same stale base value. That makes a lost update possible even though both increments look correct locally.",
      },
      {
        sharedCount: 1,
        t1State: "Write 1",
        t2State: "Still holding stale local 0",
        t1Local: "1",
        t2Local: "0",
        lockState: "No lock",
        activeThread: "t1",
        what: "Thread 1 computes 0 + 1 and writes 1 to shared memory.",
        why: "So far nothing looks wrong. The bug is already latent, though, because Thread 2 still plans to write based on the stale 0 it read earlier.",
      },
      {
        sharedCount: 1,
        t1State: "Finished",
        t2State: "Write stale 1",
        t1Local: "1",
        t2Local: "1",
        lockState: "No lock",
        activeThread: "t2",
        what: "Thread 2 also writes 1. One increment disappears.",
        why: "This is the race: two increments happened, but the final count is still 1. The later write overwrote a result that should have become 2.",
      },
    ],
  },
  lock: {
    code: `lock.acquire()
count = count + 1
lock.release()`,
    steps: [
      {
        sharedCount: 0,
        t1State: "Attempts to acquire lock",
        t2State: "Waiting behind the lock",
        t1Local: "—",
        t2Local: "—",
        lockState: "Free",
        activeThread: "t1",
        what: "Thread 1 reaches the critical section first and grabs the lock.",
        why: "The lock serializes access to the shared counter. Only one thread can perform the read-modify-write sequence at a time.",
      },
      {
        sharedCount: 0,
        t1State: "Read count -> 0 under lock",
        t2State: "Blocked on lock",
        t1Local: "0",
        t2Local: "—",
        lockState: "Held by Thread 1",
        activeThread: "t1",
        what: "Thread 1 reads count while Thread 2 is forced to wait.",
        why: "Waiting is the point. The second thread cannot slip into the middle of the first thread's update anymore.",
      },
      {
        sharedCount: 1,
        t1State: "Write 1 and release lock",
        t2State: "Ready to enter next",
        t1Local: "1",
        t2Local: "—",
        lockState: "Free again",
        activeThread: "t1",
        what: "Thread 1 completes the full increment and releases the lock.",
        why: "The critical section finishes as one indivisible unit from the other thread's perspective. The shared value is now safely 1.",
      },
      {
        sharedCount: 1,
        t1State: "Finished",
        t2State: "Acquire lock and read 1",
        t1Local: "1",
        t2Local: "1",
        lockState: "Held by Thread 2",
        activeThread: "t2",
        what: "Thread 2 enters only after the updated value is already visible.",
        why: "Now Thread 2 bases its computation on the correct latest state, not a stale copy. Serialization prevents the lost update.",
      },
      {
        sharedCount: 2,
        t1State: "Finished",
        t2State: "Write 2 and release lock",
        t1Local: "1",
        t2Local: "2",
        lockState: "Free",
        activeThread: "t2",
        what: "Thread 2 increments from 1 to 2 and releases the lock.",
        why: "Both increments now survive. Locks trade some parallelism for correctness by protecting the critical section.",
      },
    ],
  },
};

function ThreadCard({
  label,
  state,
  local,
  active,
}: {
  label: string;
  state: string;
  local: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border px-4 py-4 transition-colors",
        active
          ? "border-blue-400/40 bg-blue-500/10"
          : "border-slate-800 bg-slate-900/60"
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-100">{state}</div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          Local copy
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          {local}
        </div>
      </div>
    </div>
  );
}

export function ConcurrencyVisual() {
  const [activeTab, setActiveTab] = useState<ConcurrencyTab>("race");
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
    }, 1500);

    return () => window.clearInterval(timer);
  }, [demo.steps.length, isAutoRunning]);

  function selectTab(tab: ConcurrencyTab) {
    setActiveTab(tab);
    setCurrentStep(0);
    setIsPlaying(false);
  }

  function reset() {
    setCurrentStep(0);
    setIsPlaying(false);
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
    <TeachingSimulationFrame
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={selectTab}
      badges={[
        {
          label: "Shared memory",
          className: "border-blue-500/20 bg-blue-500/10 text-blue-200",
        },
        {
          label:
            activeTab === "race"
              ? "Lost update in action"
              : "Critical section protected",
          className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        },
      ]}
      contextRow={
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-400"
          >
            Shared count starts at 0
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-400"
          >
            Two threads each increment once
          </Badge>
        </div>
      }
      currentStep={currentStep}
      totalSteps={demo.steps.length}
      isPlaying={isPlaying}
      onReset={reset}
      onTogglePlay={togglePlay}
      onStep={() =>
        setCurrentStep((previousStep) =>
          previousStep < demo.steps.length - 1 ? previousStep + 1 : previousStep
        )
      }
      what={step.what}
      why={step.why}
      code={demo.code}
      codeLabel="Critical section"
      stage={
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1fr)]">
          <ThreadCard
            label="Thread 1"
            state={step.t1State}
            local={step.t1Local}
            active={step.activeThread === "t1" || step.activeThread === "both"}
          />

          <div className="flex flex-col justify-center gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 px-4 py-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Shared count
              </div>
              <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-100">
                {step.sharedCount}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 px-4 py-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Lock state
              </div>
              <div
                className={cn(
                  "mt-3 text-sm font-medium",
                  activeTab === "lock" ? "text-emerald-200" : "text-slate-400"
                )}
              >
                {step.lockState}
              </div>
            </div>
          </div>

          <ThreadCard
            label="Thread 2"
            state={step.t2State}
            local={step.t2Local}
            active={step.activeThread === "t2" || step.activeThread === "both"}
          />
        </div>
      }
    />
  );
}
