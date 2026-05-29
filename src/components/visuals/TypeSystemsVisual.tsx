"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TeachingSimulationFrame,
  type TeachingSimulationTab,
} from "@/components/visuals/TeachingSimulationFrame";

type TypeTab = "static" | "dynamic";

type TypeStep = {
  activeLine: number;
  phase: string;
  status: string;
  output: string;
  variables: Array<{
    name: string;
    type: string;
    value: string;
    state: "default" | "active" | "error";
  }>;
  what: string;
  why: string;
};

type TypeDemo = {
  label: string;
  code: string[];
  context: string[];
  steps: TypeStep[];
};

const TABS: Array<TeachingSimulationTab<TypeTab>> = [
  { id: "static", label: "Static Typing" },
  { id: "dynamic", label: "Dynamic Typing" },
];

const DEMOS: Record<TypeTab, TypeDemo> = {
  static: {
    label: "Compile-time checks",
    code: [
      'let price: string = "12";',
      "let tax: number = 3;",
      "let total: number = price + tax;",
    ],
    context: ["Compiler type-checks before execution", "Error timing: before run"],
    steps: [
      {
        activeLine: 1,
        phase: "Collect declarations",
        status: "Compiler is building the symbol table.",
        output: 'price: string, tax: number',
        variables: [
          { name: "price", type: "string", value: '"12"', state: "active" },
          { name: "tax", type: "number", value: "3", state: "default" },
          { name: "total", type: "number", value: "pending", state: "default" },
        ],
        what: "The compiler records the declared types for price and tax.",
        why: "Static type systems reason about a program before it runs. That gives the compiler enough information to reject incompatible operations early.",
      },
      {
        activeLine: 3,
        phase: "Check expression",
        status: "Type mismatch: string + number cannot produce number.",
        output: "Compilation stopped on line 3.",
        variables: [
          { name: "price", type: "string", value: '"12"', state: "error" },
          { name: "tax", type: "number", value: "3", state: "error" },
          { name: "total", type: "number", value: "blocked", state: "error" },
        ],
        what: "The checker reaches price + tax and flags a mismatch immediately.",
        why: "The static rule is simple: the operator must know its operand types now, not later. Because the types disagree, execution never begins.",
      },
      {
        activeLine: 3,
        phase: "Program rejected",
        status: "Executable not produced.",
        output: "No runtime started.",
        variables: [
          { name: "price", type: "string", value: '"12"', state: "error" },
          { name: "tax", type: "number", value: "3", state: "error" },
          { name: "total", type: "number", value: "never created", state: "error" },
        ],
        what: "The program stops at compilation. total is never created.",
        why: "That early failure is the value of static typing: a bad path is rejected before the user ever triggers it in production.",
      },
    ],
  },
  dynamic: {
    label: "Runtime checks",
    code: ['price = "12"', "tax = 3", "total = price + tax"],
    context: ["Values carry tags at runtime", "Error timing: when line executes"],
    steps: [
      {
        activeLine: 1,
        phase: "Execute assignment",
        status: "price now points to a string value.",
        output: 'price -> string("12")',
        variables: [
          { name: "price", type: "string tag", value: '"12"', state: "active" },
          { name: "tax", type: "unbound", value: "—", state: "default" },
          { name: "total", type: "unbound", value: "—", state: "default" },
        ],
        what: 'The runtime stores "12" and tags it as a string.',
        why: "Dynamic typing does not need the type before execution starts. It waits until values actually exist, then carries the type information with those values.",
      },
      {
        activeLine: 2,
        phase: "Execute assignment",
        status: "tax now points to a number value.",
        output: "tax -> number(3)",
        variables: [
          { name: "price", type: "string tag", value: '"12"', state: "default" },
          { name: "tax", type: "number tag", value: "3", state: "active" },
          { name: "total", type: "unbound", value: "—", state: "default" },
        ],
        what: "The runtime binds tax to the numeric value 3.",
        why: "Dynamic systems discover types as the program runs. That makes them flexible, but it means mismatches are found later.",
      },
      {
        activeLine: 3,
        phase: "Evaluate expression",
        status: "Runtime type error on price + tax.",
        output: 'Cannot add string("12") and number(3).',
        variables: [
          { name: "price", type: "string tag", value: '"12"', state: "error" },
          { name: "tax", type: "number tag", value: "3", state: "error" },
          { name: "total", type: "unbound", value: "error", state: "error" },
        ],
        what: "The failure happens only when line 3 executes.",
        why: "Nothing was wrong with storing the values separately. The error only appears when the operation finally asks whether those runtime tags are compatible.",
      },
      {
        activeLine: 3,
        phase: "Program halted",
        status: "Execution stopped by the runtime.",
        output: "Partial work completed before the crash.",
        variables: [
          { name: "price", type: "string tag", value: '"12"', state: "error" },
          { name: "tax", type: "number tag", value: "3", state: "error" },
          { name: "total", type: "unbound", value: "never assigned", state: "error" },
        ],
        what: "The program already ran partway before the error surfaced.",
        why: "That is the tradeoff: dynamic systems defer checks until use sites. You gain flexibility, but bad combinations can survive farther into execution.",
      },
    ],
  },
};

function VariableChip({
  name,
  type,
  value,
  state,
}: TypeStep["variables"][number]) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 transition-colors",
        state === "active" && "border-blue-400/40 bg-blue-500/10",
        state === "error" && "border-rose-400/40 bg-rose-500/10",
        state === "default" && "border-slate-800 bg-slate-900/60"
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {name}
      </div>
      <div className="mt-2 text-base font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{type}</div>
    </div>
  );
}

export function TypeSystemsVisual() {
  const [activeTab, setActiveTab] = useState<TypeTab>("static");
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

  function selectTab(tab: TypeTab) {
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
          label: activeTab === "static" ? "Checks before run" : "Checks during run",
          className: "border-blue-500/20 bg-blue-500/10 text-blue-200",
        },
        {
          label: activeTab === "static" ? "Errors surface earlier" : "Values stay flexible longer",
          className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        },
      ]}
      contextRow={
        <div className="flex flex-wrap gap-2">
          {demo.context.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-400"
            >
              {item}
            </Badge>
          ))}
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
      code={demo.code.join("\n")}
      stage={
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Program
            </div>
            <div className="mt-4 space-y-1 font-mono text-sm">
              {demo.code.map((line, index) => (
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

          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {activeTab === "static" ? "Type checker" : "Runtime state"}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-100">
                    {step.phase}
                  </div>
                </div>
                <Badge
                  className={cn(
                    "border-slate-700 bg-slate-950 text-slate-200",
                    step.status.includes("error") &&
                      "border-rose-500/20 bg-rose-500/10 text-rose-200"
                  )}
                >
                  {demo.label}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {step.status}
              </p>
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Current output
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-100">
                  {step.output}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {step.variables.map((variable) => (
                <VariableChip key={variable.name} {...variable} />
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
