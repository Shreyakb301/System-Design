"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Boxes, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AttributeId =
  | "name"
  | "type"
  | "value"
  | "address"
  | "scope"
  | "lifetime";

type AttributeStep = {
  id: AttributeId;
  label: string;
  message: string;
  codeFocus: "type" | "name" | "value" | "scope" | "lifetime";
};

const CODE_LINES = [
  { number: 1, text: "void updateScore() {" },
  { number: 2, text: "  int score = 42;" },
  { number: 3, text: "}" },
];

const ATTRIBUTE_STEPS: AttributeStep[] = [
  {
    id: "name",
    label: "Name",
    codeFocus: "name",
    message:
      "The name is the identifier used to refer to the variable in the program.",
  },
  {
    id: "type",
    label: "Type",
    codeFocus: "type",
    message:
      "The type tells the language what kind of value this variable can store.",
  },
  {
    id: "value",
    label: "Value",
    codeFocus: "value",
    message: "The value is the data currently stored in the variable.",
  },
  {
    id: "address",
    label: "Address",
    codeFocus: "value",
    message:
      "The address represents the memory location where the variable is stored.",
  },
  {
    id: "scope",
    label: "Scope",
    codeFocus: "scope",
    message:
      "Scope determines where the variable can be accessed in the program.",
  },
  {
    id: "lifetime",
    label: "Lifetime",
    codeFocus: "lifetime",
    message:
      "Lifetime determines how long the variable exists while the program runs.",
  },
];

const ATTRIBUTE_VALUES: Record<AttributeId, string> = {
  name: "score",
  type: "int",
  value: "42",
  address: "0x104",
  scope: "Local to updateScore()",
  lifetime: "Exists while updateScore runs",
};

const ATTRIBUTE_DESCRIPTIONS: Record<AttributeId, string> = {
  name: "Identifier used in code",
  type: "Kind of value stored",
  value: "Current contents",
  address: "Memory location",
  scope: "Where it is accessible",
  lifetime: "How long it exists",
};

function CodeLine({
  line,
  focus,
}: {
  line: { number: number; text: string };
  focus: AttributeStep["codeFocus"];
}) {
  if (line.number !== 2) {
    return (
      <div className="grid grid-cols-[1.4rem_1fr] items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-[13px] text-slate-400">
        <span className="text-[10px] text-slate-600">{line.number}</span>
        <span
          className={cn(
            line.number === 1 && focus === "scope" && "text-blue-200",
            line.number === 3 && focus === "lifetime" && "text-blue-200"
          )}
        >
          {line.text}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1.4rem_1fr] items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-[13px] text-slate-200">
      <span className="text-[10px] text-slate-600">{line.number}</span>
      <span>
        <span
          className={cn(
            "rounded px-1 py-0.5 transition-colors",
            focus === "type"
              ? "bg-blue-500/15 text-blue-200"
              : "text-slate-300"
          )}
        >
          int
        </span>
        {" "}
        <span
          className={cn(
            "rounded px-1 py-0.5 transition-colors",
            focus === "name"
              ? "bg-blue-500/15 text-blue-200"
              : "text-slate-100"
          )}
        >
          score
        </span>
        {" = "}
        <span
          className={cn(
            "rounded px-1 py-0.5 transition-colors",
            focus === "value"
              ? "bg-blue-500/15 text-blue-200"
              : "text-slate-100"
          )}
        >
          42
        </span>
        ;
      </span>
    </div>
  );
}

function AttributeCard({
  id,
  label,
  visible,
  active,
}: {
  id: AttributeId;
  label: string;
  visible: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2 transition-colors",
        active
          ? "border-blue-400 bg-blue-500/10"
          : "border-slate-800 bg-slate-900/45"
      )}
    >
      <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-1.5 text-[13px] font-medium leading-4 text-slate-100">
        {visible ? ATTRIBUTE_VALUES[id] : "—"}
      </div>
      <div className="mt-1 text-[10px] leading-3.5 text-slate-500">
        {ATTRIBUTE_DESCRIPTIONS[id]}
      </div>
    </div>
  );
}

export function VariableAttributesVisual() {
  const [step, setStep] = useState(0);

  const current = ATTRIBUTE_STEPS[step];

  const revealed = useMemo(() => {
    const currentIndex = ATTRIBUTE_STEPS.findIndex((item) => item.id === current.id);
    return new Set(
      ATTRIBUTE_STEPS.slice(0, currentIndex + 1).map((item) => item.id)
    );
  }, [current.id]);

  const handleStep = () => {
    setStep((currentStep) =>
      Math.min(currentStep + 1, ATTRIBUTE_STEPS.length - 1)
    );
  };

  const handleReset = () => {
    setStep(0);
  };

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-4 text-slate-100 shadow-xl sm:px-6 sm:py-5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
            <Boxes className="h-4 w-4 text-blue-300" />
          </div>
          <p className="max-w-2xl pt-1 text-[13px] leading-5 text-slate-400">
            Step through one variable and reveal the attributes that define how it behaves in a program.
          </p>
        </div>

        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Code snippet
          </div>
          <div className="mt-1.5 space-y-0.5">
            {CODE_LINES.map((line) => (
              <CodeLine key={line.number} line={line} focus={current.codeFocus} />
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-[1.15rem] border border-slate-800 bg-slate-900/35 p-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Variable snapshot
              </div>
              <div className="mt-2.5 rounded-[1rem] border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5",
                      current.id === "name"
                        ? "border-blue-400/60 bg-blue-500/10 text-blue-200"
                        : "border-slate-700"
                    )}
                  >
                    {revealed.has("name") ? ATTRIBUTE_VALUES.name : "name"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5",
                      current.id === "type"
                        ? "border-blue-400/60 bg-blue-500/10 text-blue-200"
                        : "border-slate-700"
                    )}
                  >
                    {revealed.has("type") ? ATTRIBUTE_VALUES.type : "type"}
                  </span>
                </div>

                <div className="mt-3.5 text-center">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Current value
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 text-[2.15rem] font-semibold tracking-tight leading-none transition-colors",
                      current.id === "value" ? "text-blue-200" : "text-slate-100"
                    )}
                  >
                    {revealed.has("value") ? ATTRIBUTE_VALUES.value : "—"}
                  </div>
                </div>

                <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                  <div
                    className={cn(
                      "rounded-lg border px-2.5 py-2",
                      current.id === "address"
                        ? "border-blue-400/60 bg-blue-500/10"
                        : "border-slate-800 bg-slate-900/60"
                    )}
                  >
                    <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
                      Address
                    </div>
                    <div className="mt-1 font-mono text-[13px] text-slate-200">
                      {revealed.has("address") ? ATTRIBUTE_VALUES.address : "0x---"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-2">
                    <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
                      Memory
                    </div>
                    <div className="mt-1 text-[13px] leading-4 text-slate-200">
                      {revealed.has("value")
                        ? `stores ${ATTRIBUTE_VALUES.value}`
                        : "waiting for value"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px]",
                      current.id === "scope"
                        ? "border-blue-400/60 bg-blue-500/10 text-blue-200"
                        : "border-slate-700 text-slate-400"
                    )}
                  >
                    Scope: {revealed.has("scope") ? "local" : "—"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px]",
                      current.id === "lifetime"
                        ? "border-blue-400/60 bg-blue-500/10 text-blue-200"
                        : "border-slate-700 text-slate-400"
                    )}
                  >
                    Lifetime: {revealed.has("lifetime") ? "stack frame" : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Attribute panel
              </div>
              <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {ATTRIBUTE_STEPS.map((item) => (
                  <AttributeCard
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    visible={revealed.has(item.id)}
                    active={current.id === item.id}
                  />
                ))}
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
            onClick={handleReset}
            className="h-9 rounded-full border-slate-700 bg-transparent px-4 text-sm text-slate-200 hover:bg-slate-900 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleStep}
            disabled={step === ATTRIBUTE_STEPS.length - 1}
            className="h-9 rounded-full bg-blue-600 px-4 text-sm text-white hover:bg-blue-500"
          >
            Step
          </Button>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
            {step + 1} / {ATTRIBUTE_STEPS.length}
          </span>
        </div>
    </section>
  );
}
