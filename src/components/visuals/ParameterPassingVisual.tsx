"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TeachingSimulationFrame,
  type TeachingSimulationTab,
} from "@/components/visuals/TeachingSimulationFrame";

type PassingTab = "value" | "reference" | "value-result";

type PassingStep = {
  activeLine: number;
  callerValue: number;
  formalValue?: number;
  localNote: string;
  relationship: "copy" | "alias" | "copy-out" | "none";
  relationshipLabel: string;
  status: string;
  what: string;
  why: string;
};

type PassingDemo = {
  label: string;
  relationshipLabel: string;
  steps: PassingStep[];
};

const TABS: Array<TeachingSimulationTab<PassingTab>> = [
  { id: "value", label: "Pass by Value" },
  { id: "reference", label: "Pass by Reference" },
  { id: "value-result", label: "Pass by Value-Result" },
];

const CODE = [
  "void boost(int n) {",
  "  n = n + 5;",
  "}",
  "",
  "int score = 10;",
  "boost(score);",
];

const DEMOS: Record<PassingTab, PassingDemo> = {
  value: {
    label: "Copies the argument into a local slot",
    relationshipLabel: "copy in",
    steps: [
      {
        activeLine: 5,
        callerValue: 10,
        localNote: "Caller score exists before the call.",
        relationship: "none",
        relationshipLabel: "call setup",
        status: "Caller owns score = 10.",
        what: "The caller has one variable: score = 10.",
        why: "Before the call, only the caller's memory exists. The callee will receive a copy, not the original slot.",
      },
      {
        activeLine: 6,
        callerValue: 10,
        formalValue: 10,
        localNote: "n receives a copied value.",
        relationship: "copy",
        relationshipLabel: "copy in",
        status: "Formal n starts as 10.",
        what: "Calling boost(score) copies 10 into the parameter n.",
        why: "Pass by value duplicates the argument's value. The function can change its local copy without touching the caller.",
      },
      {
        activeLine: 2,
        callerValue: 10,
        formalValue: 15,
        localNote: "The callee changed only its own local value.",
        relationship: "copy",
        relationshipLabel: "local update",
        status: "n becomes 15, score stays 10.",
        what: "Inside the function, n is reassigned to 15.",
        why: "Because n is a separate slot, the caller still owns an unchanged score. No aliasing exists between the two frames.",
      },
      {
        activeLine: 6,
        callerValue: 10,
        localNote: "The local copy disappears on return.",
        relationship: "none",
        relationshipLabel: "return",
        status: "Caller still has score = 10.",
        what: "The call ends and the callee's local n disappears.",
        why: "The only thing that crossed the call boundary was the original value. Since nothing is copied back, the caller keeps the old result.",
      },
    ],
  },
  reference: {
    label: "Parameter aliases the caller slot",
    relationshipLabel: "alias",
    steps: [
      {
        activeLine: 5,
        callerValue: 10,
        localNote: "Caller score exists before the call.",
        relationship: "none",
        relationshipLabel: "call setup",
        status: "Caller owns score = 10.",
        what: "The caller starts with score = 10.",
        why: "Reference passing is interesting only because the callee will not get a copy. It will get another name for the same location.",
      },
      {
        activeLine: 6,
        callerValue: 10,
        formalValue: 10,
        localNote: "n points at the same storage as score.",
        relationship: "alias",
        relationshipLabel: "shared slot",
        status: "n and score now refer to one memory cell.",
        what: "The parameter n aliases the caller's score slot.",
        why: "Pass by reference shares storage. That makes updates cheap, but it also means the callee can directly mutate the caller's state.",
      },
      {
        activeLine: 2,
        callerValue: 15,
        formalValue: 15,
        localNote: "One write updates both names.",
        relationship: "alias",
        relationshipLabel: "shared write",
        status: "score changes immediately to 15.",
        what: "Executing n = n + 5 changes the shared slot to 15.",
        why: "Because n and score are aliases, there is no distinction between local update and caller update. One assignment reaches both views at once.",
      },
      {
        activeLine: 6,
        callerValue: 15,
        localNote: "The alias disappears, but the caller keeps the new value.",
        relationship: "none",
        relationshipLabel: "return",
        status: "Caller returns with score = 15.",
        what: "The function returns, but the caller retains the mutated value.",
        why: "Reference semantics make side effects visible outside the callee. That is powerful, but it increases coupling because the callee can change distant state.",
      },
    ],
  },
  "value-result": {
    label: "Copy in, mutate locally, copy back on return",
    relationshipLabel: "copy in/out",
    steps: [
      {
        activeLine: 5,
        callerValue: 10,
        localNote: "Caller score exists before the call.",
        relationship: "none",
        relationshipLabel: "call setup",
        status: "Caller owns score = 10.",
        what: "The caller starts with score = 10.",
        why: "Value-result begins like pass by value: the callee gets its own local slot first, not an alias.",
      },
      {
        activeLine: 6,
        callerValue: 10,
        formalValue: 10,
        localNote: "n receives a copy of the caller value.",
        relationship: "copy",
        relationshipLabel: "copy in",
        status: "Formal n starts as 10.",
        what: "On entry, score is copied into n.",
        why: "This isolates the callee while it is running. The caller does not see intermediate writes yet.",
      },
      {
        activeLine: 2,
        callerValue: 10,
        formalValue: 15,
        localNote: "The local copy changes first.",
        relationship: "copy",
        relationshipLabel: "local update",
        status: "n becomes 15, caller still has 10.",
        what: "Inside the function, n changes to 15.",
        why: "During the body, value-result behaves like pass by value. The callee can compute freely without mutating the caller mid-call.",
      },
      {
        activeLine: 6,
        callerValue: 15,
        formalValue: 15,
        localNote: "The final local value is copied back into the caller slot.",
        relationship: "copy-out",
        relationshipLabel: "copy out",
        status: "Return copies 15 back into score.",
        what: "At return, the final local value is written back to the caller.",
        why: "That last copy-out is the key difference. It preserves pass-by-value isolation during execution while still letting the call produce an updated argument afterward.",
      },
    ],
  },
};

function MemoryCell({
  label,
  value,
  note,
  active,
  colorClass,
}: {
  label: string;
  value?: number;
  note: string;
  active: boolean;
  colorClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border px-4 py-4 transition-colors",
        active ? colorClass : "border-slate-800 bg-slate-900/60"
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
        {typeof value === "number" ? value : "—"}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{note}</div>
    </div>
  );
}

export function ParameterPassingVisual() {
  const [activeTab, setActiveTab] = useState<PassingTab>("value");
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

  function selectTab(tab: PassingTab) {
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
          label: activeTab === "reference" ? "Aliasing allowed" : "Local copy first",
          className: "border-blue-500/20 bg-blue-500/10 text-blue-200",
        },
        {
          label: activeTab === "value" ? "Caller unchanged" : activeTab === "reference" ? "Caller mutates during call" : "Caller mutates on return",
          className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        },
      ]}
      contextRow={
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-400"
          >
            Caller starts with score = 10
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-400"
          >
            Same function body, different call semantics
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
      code={CODE.join("\n")}
      stage={
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,0.95fr)_80px_minmax(0,1.05fr)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Caller frame
            </div>
            <div className="mt-4">
              <MemoryCell
                label="score"
                value={step.callerValue}
                note="Lives in the caller."
                active
                colorClass="border-amber-400/40 bg-amber-500/10"
              />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Status
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {step.status}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <ArrowRightLeft
                className={cn(
                  "h-8 w-8",
                  step.relationship === "alias"
                    ? "text-blue-300"
                    : step.relationship === "copy-out"
                      ? "text-emerald-300"
                      : "text-slate-500"
                )}
              />
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {step.relationshipLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Callee frame
              </div>
              <div className="mt-4">
                <MemoryCell
                  label="n"
                  value={step.formalValue}
                  note={step.localNote}
                  active={typeof step.formalValue === "number"}
                  colorClass={
                    step.relationship === "alias"
                      ? "border-blue-400/40 bg-blue-500/10"
                      : "border-emerald-400/40 bg-emerald-500/10"
                  }
                />
              </div>
              <div className="mt-4 space-y-1 font-mono text-sm">
                {CODE.map((line, index) => (
                  <div
                    key={line}
                    className={cn(
                      "grid grid-cols-[1.5rem_1fr] gap-3 rounded-xl px-3 py-2 transition-colors",
                      step.activeLine === index + 1
                        ? "bg-blue-500/12 text-blue-100"
                        : "text-slate-300"
                    )}
                  >
                    <span className="text-slate-600">{index + 1}</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Mental model
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {demo.label}
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}
