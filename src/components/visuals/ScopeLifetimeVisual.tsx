"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Boxes, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VariableId = "globalScore" | "level" | "bonus";
type ScopeId = "global" | "play" | "if";

type VariableState = {
  alive: boolean;
  inScope: boolean;
  value: string;
  type: string;
  address: string;
  scopeLabel: string;
  lifetimeLabel: string;
};

type StepConfig = {
  id: number;
  focusLine: number;
  activeScope: ScopeId;
  visibleScopes: ScopeId[];
  variables: Record<VariableId, VariableState>;
  message: string;
};

const CODE_LINES = [
  "int globalScore = 10;",
  "",
  "void play() {",
  "    int level = 1;",
  "    if (level > 0) {",
  "        int bonus = 5;",
  "    }",
  "}",
];

const STEPS: StepConfig[] = [
  {
    id: 1,
    focusLine: 1,
    activeScope: "global",
    visibleScopes: ["global"],
    variables: {
      globalScore: {
        alive: true,
        inScope: true,
        value: "10",
        type: "int",
        address: "0x100",
        scopeLabel: "Global scope",
        lifetimeLabel: "Whole program",
      },
      level: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside play()",
        lifetimeLabel: "During play() only",
      },
      bonus: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside if block",
        lifetimeLabel: "During if block only",
      },
    },
    message:
      "globalScore is declared in global scope, so it is visible throughout the program and lives for the whole run.",
  },
  {
    id: 2,
    focusLine: 4,
    activeScope: "play",
    visibleScopes: ["global", "play"],
    variables: {
      globalScore: {
        alive: true,
        inScope: true,
        value: "10",
        type: "int",
        address: "0x100",
        scopeLabel: "Global scope",
        lifetimeLabel: "Whole program",
      },
      level: {
        alive: true,
        inScope: true,
        value: "1",
        type: "int",
        address: "0x104",
        scopeLabel: "Inside play()",
        lifetimeLabel: "During play() only",
      },
      bonus: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside if block",
        lifetimeLabel: "During if block only",
      },
    },
    message:
      "Entering play() creates level. Its scope is the function body, and its lifetime lasts only while play() is executing.",
  },
  {
    id: 3,
    focusLine: 6,
    activeScope: "if",
    visibleScopes: ["global", "play", "if"],
    variables: {
      globalScore: {
        alive: true,
        inScope: true,
        value: "10",
        type: "int",
        address: "0x100",
        scopeLabel: "Global scope",
        lifetimeLabel: "Whole program",
      },
      level: {
        alive: true,
        inScope: true,
        value: "1",
        type: "int",
        address: "0x104",
        scopeLabel: "Inside play()",
        lifetimeLabel: "During play() only",
      },
      bonus: {
        alive: true,
        inScope: true,
        value: "5",
        type: "int",
        address: "0x108",
        scopeLabel: "Inside if block",
        lifetimeLabel: "During if block only",
      },
    },
    message:
      "Entering the if block creates bonus. It can only be accessed inside that block while execution is still there.",
  },
  {
    id: 4,
    focusLine: 7,
    activeScope: "play",
    visibleScopes: ["global", "play"],
    variables: {
      globalScore: {
        alive: true,
        inScope: true,
        value: "10",
        type: "int",
        address: "0x100",
        scopeLabel: "Global scope",
        lifetimeLabel: "Whole program",
      },
      level: {
        alive: true,
        inScope: true,
        value: "1",
        type: "int",
        address: "0x104",
        scopeLabel: "Inside play()",
        lifetimeLabel: "During play() only",
      },
      bonus: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside if block",
        lifetimeLabel: "During if block only",
      },
    },
    message:
      "bonus is now out of scope and its lifetime has ended because execution left the if block.",
  },
  {
    id: 5,
    focusLine: 8,
    activeScope: "global",
    visibleScopes: ["global"],
    variables: {
      globalScore: {
        alive: true,
        inScope: true,
        value: "10",
        type: "int",
        address: "0x100",
        scopeLabel: "Global scope",
        lifetimeLabel: "Whole program",
      },
      level: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside play()",
        lifetimeLabel: "During play() only",
      },
      bonus: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside if block",
        lifetimeLabel: "During if block only",
      },
    },
    message:
      "When play() returns, level disappears too. It existed only while the function was running.",
  },
  {
    id: 6,
    focusLine: 1,
    activeScope: "global",
    visibleScopes: ["global"],
    variables: {
      globalScore: {
        alive: true,
        inScope: true,
        value: "10",
        type: "int",
        address: "0x100",
        scopeLabel: "Global scope",
        lifetimeLabel: "Whole program",
      },
      level: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside play()",
        lifetimeLabel: "During play() only",
      },
      bonus: {
        alive: false,
        inScope: false,
        value: "—",
        type: "int",
        address: "—",
        scopeLabel: "Inside if block",
        lifetimeLabel: "During if block only",
      },
    },
    message:
      "globalScore still exists because global variables stay alive for the lifetime of the program.",
  },
];

const SCOPE_META = [
  { id: "global", label: "Global scope", indent: "ml-0" },
  { id: "play", label: "play() scope", indent: "ml-5" },
  { id: "if", label: "if block", indent: "ml-10" },
] as const;

function CodeLine({
  line,
  number,
  active,
}: {
  line: string;
  number: number;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1.4rem_1fr] items-start gap-2 rounded-lg px-2.5 py-1 font-mono text-[12px] transition-colors",
        active ? "bg-blue-500/10 text-blue-100" : "text-slate-300"
      )}
    >
      <span className="text-[10px] text-slate-600">{number}</span>
      <span className="whitespace-pre">{line || " "}</span>
    </div>
  );
}

function ScopeChip({
  label,
  visible,
  alive,
}: {
  label: string;
  visible: boolean;
  alive: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
        visible && alive
          ? "border-blue-400/60 bg-blue-500/10 text-blue-200"
          : alive
            ? "border-slate-700 bg-slate-900/60 text-slate-400"
            : "border-dashed border-slate-800 text-slate-600"
      )}
    >
      {alive ? label : `${label} not created`}
    </span>
  );
}

function VariableCard({
  label,
  variable,
  active,
}: {
  label: string;
  variable: VariableState;
  active: boolean;
}) {
  const status = !variable.alive
    ? "Destroyed"
    : variable.inScope
      ? "In scope"
      : "Alive, not visible";

  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2 transition-colors",
        active
          ? "border-blue-400 bg-blue-500/10"
          : variable.alive
            ? "border-slate-800 bg-slate-900/45"
            : "border-slate-800/70 bg-slate-900/25 opacity-70"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px]",
            variable.inScope && variable.alive
              ? "bg-blue-500/12 text-blue-200"
              : variable.alive
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-900 text-slate-500"
          )}
        >
          {status}
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] leading-4 text-slate-300">
        <div>
          <span className="text-slate-500">Type:</span> {variable.type}
        </div>
        <div>
          <span className="text-slate-500">Value:</span> {variable.value}
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">Address:</span> {variable.address}
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">Scope:</span> {variable.scopeLabel}
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">Lifetime:</span> {variable.lifetimeLabel}
        </div>
      </div>
    </div>
  );
}

export function ScopeLifetimeVisual() {
  const [stepIndex, setStepIndex] = useState(0);

  const current = STEPS[stepIndex];

  const stepLabel = useMemo(() => `${stepIndex + 1} / ${STEPS.length}`, [stepIndex]);

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-4 text-slate-100 shadow-xl sm:px-6 sm:py-5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <Boxes className="h-4 w-4 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-5 text-slate-400">
            Step through one short program and watch variables become visible, go out
            of scope, and disappear when their lifetime ends.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Code snippet
        </div>
        <div className="mt-1.5 space-y-0.5">
          {CODE_LINES.map((line, index) => (
            <CodeLine
              key={`${index}-${line}`}
              number={index + 1}
              line={line}
              active={current.focusLine === index + 1}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-[1.15rem] border border-slate-800 bg-slate-900/35 p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Scope view
            </div>
            <div className="mt-2.5 space-y-2">
              {SCOPE_META.map((scope) => {
                const isVisible = current.visibleScopes.includes(scope.id);
                const isActive = current.activeScope === scope.id;
                const scopeVariables =
                  scope.id === "global"
                    ? [{ key: "globalScore", label: "globalScore" }]
                    : scope.id === "play"
                      ? [{ key: "level", label: "level" }]
                      : [{ key: "bonus", label: "bonus" }];

                return (
                  <div
                    key={scope.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 transition-colors",
                      scope.indent,
                      isActive
                        ? "border-blue-400 bg-blue-500/10"
                        : isVisible
                          ? "border-slate-700 bg-slate-900/55"
                          : "border-dashed border-slate-800 bg-slate-950/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        {scope.label}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px]",
                          isActive
                            ? "bg-blue-500/12 text-blue-200"
                            : isVisible
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-900 text-slate-500"
                        )}
                      >
                        {isActive ? "Active" : isVisible ? "Visible" : "Exited"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {scopeVariables.map((variable) => {
                        const state =
                          current.variables[variable.key as VariableId];
                        return (
                          <ScopeChip
                            key={variable.key}
                            label={variable.label}
                            visible={state.inScope}
                            alive={state.alive}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Variable lifetime panel
            </div>
            <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
              <VariableCard
                label="globalScore"
                variable={current.variables.globalScore}
                active={current.focusLine === 1}
              />
              <VariableCard
                label="level"
                variable={current.variables.level}
                active={current.focusLine === 4 || current.focusLine === 8}
              />
              <VariableCard
                label="bonus"
                variable={current.variables.bonus}
                active={current.focusLine === 6 || current.focusLine === 7}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <p className="text-[13px] leading-5 text-slate-200">{current.message}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStepIndex(0)}
          className="h-9 rounded-full border-slate-700 bg-transparent px-4 text-sm text-slate-200 hover:bg-slate-900 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button
          type="button"
          onClick={() =>
            setStepIndex((currentIndex) =>
              Math.min(currentIndex + 1, STEPS.length - 1)
            )
          }
          disabled={stepIndex === STEPS.length - 1}
          className="h-9 rounded-full bg-blue-600 px-4 text-sm text-white hover:bg-blue-500"
        >
          Step
        </Button>
        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
          {stepLabel}
        </span>
      </div>
    </section>
  );
}
