"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Braces, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "syntax" | "execution";

type SyntaxStep = {
  label: string;
  description: string;
  message: string;
  lineIndex: number | null;
};

const CODE_LINES = [
  "x = 5",
  "y = x + 2",
  "print(y)",
];

const SYNTAX_STEPS = [
  {
    label: "Program",
    description: "A program is made of ordered statements that follow grammar rules.",
    message:
      "Syntax defines the structure of the program according to grammar rules.",
    lineIndex: null,
  },
  {
    label: "assignment: x = 5",
    description: "The first statement is an assignment that binds x to a literal value.",
    message:
      "This line is syntactically an assignment statement: a variable name, an equals sign, and an expression.",
    lineIndex: 0,
  },
  {
    label: "assignment: y = x + 2",
    description: "The second statement is another assignment whose right side is an expression.",
    message:
      "This line is also an assignment statement, but the expression uses x and the + operator.",
    lineIndex: 1,
  },
  {
    label: "function call: print(y)",
    description: "The last statement is a function call with y as the argument.",
    message:
      "This line is syntactically a function call: a function name followed by parentheses and an argument.",
    lineIndex: 2,
  },
] as const satisfies readonly SyntaxStep[];

const EXECUTION_STEPS = [
  {
    label: "Step 1",
    lineIndex: 0,
    statement: "x = 5",
    memory: [{ name: "x", value: "5" }],
    output: null,
    message:
      "Semantics describes what the program does during execution. After this statement, x stores 5.",
  },
  {
    label: "Step 2",
    lineIndex: 1,
    statement: "y = x + 2",
    memory: [
      { name: "x", value: "5" },
      { name: "y", value: "7" },
    ],
    output: null,
    message:
      "Execution now reads x, adds 2, and stores the result 7 in y.",
  },
  {
    label: "Step 3",
    lineIndex: 2,
    statement: "print(y)",
    memory: [
      { name: "x", value: "5" },
      { name: "y", value: "7" },
    ],
    output: "7",
    message:
      "The call to print uses the current value of y, so the program outputs 7.",
  },
] as const;

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-0.5">
      <div className="grid grid-cols-2 gap-1 text-xs">
        <button
          type="button"
          onClick={() => onChange("syntax")}
          className={cn(
            "rounded-lg px-4 py-2 font-medium transition-colors",
            value === "syntax"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white"
          )}
        >
          Syntax
        </button>
        <button
          type="button"
          onClick={() => onChange("execution")}
          className={cn(
            "rounded-lg px-4 py-2 font-medium transition-colors",
            value === "execution"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white"
          )}
        >
          Execution
        </button>
      </div>
    </div>
  );
}

function CodeLine({
  code,
  lineNumber,
  active,
}: {
  code: string;
  lineNumber: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr] items-center rounded-lg px-3 py-2 font-mono text-sm transition-colors",
        active ? "bg-blue-500/10 text-white" : "text-slate-300"
      )}
    >
      <span className="text-xs text-slate-500">{lineNumber}</span>
      <span>{code}</span>
    </div>
  );
}

function SyntaxStructure({ step }: { step: number }) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-xl border px-4 py-3 transition-colors",
          step === 0
            ? "border-blue-400 bg-blue-500/10"
            : "border-slate-800 bg-slate-900/40"
        )}
      >
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          Program
        </div>
        <div className="mt-1 text-sm text-slate-300">
          Three statements executed in order
        </div>
      </div>

      <div className="ml-4 space-y-2 border-l border-slate-800 pl-4">
        {SYNTAX_STEPS.slice(1).map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "rounded-xl border px-4 py-3 transition-colors",
              step === index + 1
                ? "border-blue-400 bg-blue-500/10"
                : "border-slate-800 bg-slate-900/40"
            )}
          >
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              {item.label}
            </div>
            <div className="mt-1 text-sm text-slate-300">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutionPanel({ step }: { step: number }) {
  const current = EXECUTION_STEPS[step];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-400 bg-blue-500/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {current.label}
          </span>
          <span className="font-mono text-sm text-slate-100">
            {current.statement}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Memory
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {current.memory.map((entry) => (
              <div
                key={entry.name}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
              >
                <span className="font-medium">{entry.name}</span>
                <span className="mx-1.5 text-slate-500">→</span>
                <span className="font-mono">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Output
          </div>
          <div className="mt-3 font-mono text-xl font-semibold text-slate-100">
            {current.output ?? "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SyntaxSemanticsVisual() {
  const [view, setView] = useState<ViewMode>("syntax");
  const [syntaxStep, setSyntaxStep] = useState(0);
  const [executionStep, setExecutionStep] = useState(0);

  const currentStep = view === "syntax" ? syntaxStep : executionStep;
  const stepCount =
    view === "syntax" ? SYNTAX_STEPS.length : EXECUTION_STEPS.length;

  const highlightedLine =
    view === "syntax"
      ? SYNTAX_STEPS[syntaxStep].lineIndex
      : EXECUTION_STEPS[executionStep].lineIndex;

  const liveMessage = useMemo(() => {
    return view === "syntax"
      ? SYNTAX_STEPS[syntaxStep].message
      : EXECUTION_STEPS[executionStep].message;
  }, [view, syntaxStep, executionStep]);

  const handleStep = () => {
    if (view === "syntax") {
      setSyntaxStep((current) => Math.min(current + 1, SYNTAX_STEPS.length - 1));
      return;
    }

    setExecutionStep((current) =>
      Math.min(current + 1, EXECUTION_STEPS.length - 1)
    );
  };

  const handleReset = () => {
    if (view === "syntax") {
      setSyntaxStep(0);
      return;
    }

    setExecutionStep(0);
  };

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
        <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <Braces className="h-4 w-4 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="max-w-2xl text-sm leading-5 text-slate-400">
              Compare the structure of a small program with what it actually does during execution.
            </p>
        </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Code snippet
          </div>
          <div className="mt-2 space-y-1">
            {CODE_LINES.map((line, index) => (
              <CodeLine
                key={line}
                lineNumber={index + 1}
                code={line}
                active={highlightedLine === index}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <ViewToggle value={view} onChange={setView} />
          <div className="text-sm text-slate-400">
            {view === "syntax"
              ? "Syntax view shows how the program is organized into statements."
              : "Execution view shows how the same statements change memory and produce output."}
          </div>
        </div>

        <div className="mt-4 rounded-[1.15rem] border border-slate-800 bg-slate-900/35 p-4">
          {view === "syntax" ? (
            <SyntaxStructure step={syntaxStep} />
          ) : (
            <ExecutionPanel step={executionStep} />
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            <p className="text-sm text-slate-200">{liveMessage}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="rounded-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleStep}
            disabled={currentStep >= stepCount - 1}
            className="rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            Step
          </Button>
          <div className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {currentStep + 1} / {stepCount}
          </div>
        </div>
    </section>
  );
}
