"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw, StepBack, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ScenarioId = "precedence" | "association" | "parentheses";

type Step = {
  label: string;
  expression: string;
  note: string;
};

type Scenario = {
  id: ScenarioId;
  title: string;
  rule: string;
  answer: string;
  steps: Step[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "precedence",
    title: "Operator Precedence",
    rule: "Multiply before adding.",
    answer: "14",
    steps: [
      {
        label: "Read Tokens",
        expression: "2 + 3 * 4",
        note: "The expression contains addition and multiplication.",
      },
      {
        label: "Group Multiply",
        expression: "2 + (3 * 4)",
        note: "Multiplication has higher precedence than addition.",
      },
      {
        label: "Multiply First",
        expression: "2 + 12",
        note: "The grouped multiplication produces twelve.",
      },
      {
        label: "Final Result",
        expression: "14",
        note: "Addition completes the expression.",
      },
    ],
  },
  {
    id: "association",
    title: "Left Association",
    rule: "Equal ranks group left.",
    answer: "12",
    steps: [
      {
        label: "Read Tokens",
        expression: "20 - 5 - 3",
        note: "Both operators have equal precedence.",
      },
      {
        label: "Group Left",
        expression: "(20 - 5) - 3",
        note: "Subtraction associates from the left.",
      },
      {
        label: "First Subtract",
        expression: "15 - 3",
        note: "The left group is evaluated first.",
      },
      {
        label: "Final Result",
        expression: "12",
        note: "The remaining subtraction completes the expression.",
      },
    ],
  },
  {
    id: "parentheses",
    title: "Parentheses Override",
    rule: "Explicit groups win.",
    answer: "20",
    steps: [
      {
        label: "Read Tokens",
        expression: "(2 + 3) * 4",
        note: "Parentheses create an explicit group.",
      },
      {
        label: "Honor Group",
        expression: "(2 + 3) * 4",
        note: "The grouped addition runs before multiplication.",
      },
      {
        label: "Add First",
        expression: "5 * 4",
        note: "The parenthesized expression produces five.",
      },
      {
        label: "Final Result",
        expression: "20",
        note: "Multiplication completes the expression.",
      },
    ],
  },
];

export function ExpressionsPrecedenceVisual() {
  const shouldReduceMotion = useReducedMotion();
  const [scenarioId, setScenarioId] = useState<ScenarioId>("precedence");
  const [stepIndex, setStepIndex] = useState(0);

  const scenario =
    SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0];
  const step = scenario.steps[stepIndex];
  const isComplete = stepIndex === scenario.steps.length - 1;

  function selectScenario(id: ScenarioId) {
    setScenarioId(id);
    setStepIndex(0);
  }

  function advance() {
    setStepIndex((current) =>
      Math.min(current + 1, scenario.steps.length - 1)
    );
  }

  function retreat() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function reset() {
    setStepIndex(0);
  }

  return (
    <div className="space-y-5">
      <div
        className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-1"
        role="tablist"
        aria-label="Expression rules"
      >
        {SCENARIOS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`rule-tab-${item.id}`}
            aria-controls={`rule-panel-${item.id}`}
            aria-selected={item.id === scenarioId}
            onClick={() => selectScenario(item.id)}
            className={cn(
              "min-h-11 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              item.id === scenarioId
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.id === "precedence"
              ? "Precedence"
              : item.id === "association"
                ? "Association"
                : "Parentheses"}
          </button>
        ))}
      </div>

      <Card
        id={`rule-panel-${scenarioId}`}
        role="tabpanel"
        aria-labelledby={`rule-tab-${scenarioId}`}
        className="overflow-hidden border-slate-200"
      >
        <div className="grid min-h-[360px] lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
          <div className="flex flex-col justify-between bg-slate-950 p-6 text-white sm:p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase text-sky-300">
                  {scenario.title}
                </p>
                <p className="text-base text-slate-300">{scenario.rule}</p>
              </div>

              <motion.div
                key={`${scenarioId}-${stepIndex}`}
                initial={
                  shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                aria-live="polite"
                aria-atomic="true"
                className="flex min-h-32 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 py-8"
              >
                <code className="break-words text-center text-3xl font-bold text-white sm:text-4xl">
                  {step.expression}
                </code>
              </motion.div>

              <div className="space-y-2">
                <p className="font-semibold text-white">{step.label}</p>
                <p className="leading-7 text-slate-300">{step.note}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={retreat}
                disabled={stepIndex === 0}
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <StepBack className="h-4 w-4" />
                Previous
              </Button>
              <Button
                type="button"
                onClick={advance}
                disabled={isComplete}
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                <StepForward className="h-4 w-4" />
                Next Step
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={stepIndex === 0}
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-6 bg-white p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Evaluation Order
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Step {stepIndex + 1}</span>
                  <span>{scenario.steps.length} total</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Evaluation progress"
                  aria-valuemin={1}
                  aria-valuemax={scenario.steps.length}
                  aria-valuenow={stepIndex + 1}
                  className="h-2 overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className="h-full rounded-full bg-sky-600 transition-[width]"
                    style={{
                      width: `${((stepIndex + 1) / scenario.steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {scenario.steps.map((item, index) => {
                  const reached = index <= stepIndex;
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-3 rounded-md border px-3 py-3 transition-colors",
                        reached
                          ? "border-sky-200 bg-sky-50 text-sky-950"
                          : "border-slate-200 text-slate-400"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          reached
                            ? "bg-sky-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {index < stepIndex ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">
                Correct Result
              </p>
              <p className="mt-1 text-3xl font-bold text-emerald-950">
                {isComplete ? scenario.answer : "Pending"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
