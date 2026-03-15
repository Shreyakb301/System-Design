"use client";

import { useMemo, useState } from "react";
import { Code, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Criterion = "readability" | "writability" | "reliability" | "cost";
type FeatureKey = "syntax" | "typing" | "abstraction" | "checks";

type FeatureOption = {
  label: string;
  message: string;
  delta: Record<Criterion, number>;
};

type FeatureConfig = {
  label: string;
  hint: string;
  options: Record<string, FeatureOption>;
};

const FEATURE_CONFIG: Record<FeatureKey, FeatureConfig> = {
  syntax: {
    label: "Syntax Simplicity",
    hint: "Choose whether the language leans toward simpler or more complex syntax.",
    options: {
      simple: {
        label: "Simple Syntax",
        message: "Simpler syntax improves readability because programs are easier to scan and understand.",
        delta: { readability: 18, writability: 10, reliability: 4, cost: 6 },
      },
      complex: {
        label: "Complex Syntax",
        message: "Complex syntax can pack more ideas into one line, but it usually hurts readability for new readers.",
        delta: { readability: -10, writability: 6, reliability: -3, cost: -6 },
      },
    },
  },
  typing: {
    label: "Type System",
    hint: "Choose how strongly the language enforces type rules.",
    options: {
      strong: {
        label: "Strong Typing",
        message: "Strong typing improves reliability because more type errors are caught before execution.",
        delta: { readability: 4, writability: -3, reliability: 18, cost: 4 },
      },
      weak: {
        label: "Weak Typing",
        message: "Weaker typing can feel easier to write at first, but more mistakes survive until runtime.",
        delta: { readability: -2, writability: 10, reliability: -16, cost: -6 },
      },
    },
  },
  abstraction: {
    label: "Abstraction Level",
    hint: "Choose how much low-level detail the language hides.",
    options: {
      high: {
        label: "High Abstraction",
        message: "High abstraction improves writability because one feature can replace many low-level steps.",
        delta: { readability: 6, writability: 16, reliability: 5, cost: 8 },
      },
      low: {
        label: "Low Abstraction",
        message: "Low abstraction gives more control, but it usually means more code to write and maintain.",
        delta: { readability: -4, writability: -8, reliability: 2, cost: -2 },
      },
    },
  },
  checks: {
    label: "Runtime Safety",
    hint: "Choose how many safety checks happen while the program runs.",
    options: {
      more: {
        label: "More Runtime Checks",
        message: "More runtime checks improve reliability, but they can increase execution cost.",
        delta: { readability: 2, writability: -1, reliability: 14, cost: -12 },
      },
      fewer: {
        label: "Fewer Runtime Checks",
        message: "Fewer runtime checks can lower execution cost, but unsafe behavior is more likely to slip through.",
        delta: { readability: 0, writability: 3, reliability: -12, cost: 6 },
      },
    },
  },
};

const DEFAULT_SELECTIONS: Record<FeatureKey, string> = {
  syntax: "simple",
  typing: "strong",
  abstraction: "high",
  checks: "more",
};

const CRITERIA = [
  { id: "readability" as const, label: "Readability" },
  { id: "writability" as const, label: "Writability" },
  { id: "reliability" as const, label: "Reliability" },
  { id: "cost" as const, label: "Cost" },
];

function clampScore(value: number) {
  return Math.max(20, Math.min(96, value));
}

function FeatureToggle({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  options: Record<string, FeatureOption>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <p className="text-[11px] leading-4 text-slate-500">{hint}</p>
      </div>

      <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/70 p-0.5">
        <div className="grid grid-cols-2 gap-1 text-[11px]">
          {Object.entries(options).map(([optionKey, option]) => (
            <button
              key={optionKey}
              type="button"
              onClick={() => onChange(optionKey)}
              className={cn(
                "rounded-md px-2.5 py-1.5 font-medium leading-4 transition-colors",
                value === optionKey ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <span className="text-sm font-semibold text-blue-200">{score}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-900">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function LanguageCriteriaVisual() {
  const [selections, setSelections] = useState<Record<FeatureKey, string>>(DEFAULT_SELECTIONS);
  const [lastChanged, setLastChanged] = useState<FeatureKey>("typing");

  const scores = useMemo(() => {
    const startingScores: Record<Criterion, number> = {
      readability: 50,
      writability: 50,
      reliability: 50,
      cost: 50,
    };

    for (const [featureKey, optionKey] of Object.entries(selections) as Array<[FeatureKey, string]>) {
      const option = FEATURE_CONFIG[featureKey].options[optionKey];
      for (const criterion of CRITERIA) {
        startingScores[criterion.id] += option.delta[criterion.id];
      }
    }

    return {
      readability: clampScore(startingScores.readability),
      writability: clampScore(startingScores.writability),
      reliability: clampScore(startingScores.reliability),
      cost: clampScore(startingScores.cost),
    };
  }, [selections]);

  const liveMessage = FEATURE_CONFIG[lastChanged].options[selections[lastChanged]].message;

  const updateSelection = (featureKey: FeatureKey, optionKey: string) => {
    setSelections((current) => ({ ...current, [featureKey]: optionKey }));
    setLastChanged(featureKey);
  };

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
        <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <Code className="h-4 w-4 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="max-w-2xl text-sm leading-5 text-slate-400">
              Adjust one language design choice at a time and watch the four evaluation criteria shift.
            </p>
        </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(Object.entries(FEATURE_CONFIG) as Array<[FeatureKey, FeatureConfig]>).map(([featureKey, feature]) => (
            <FeatureToggle
              key={featureKey}
              label={feature.label}
              hint={feature.hint}
              options={feature.options}
              value={selections[featureKey]}
              onChange={(optionKey) => updateSelection(featureKey, optionKey)}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CRITERIA.map((criterion) => (
            <ScoreCard key={criterion.id} label={criterion.label} score={scores[criterion.id]} />
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            <p className="text-sm text-slate-200">{liveMessage}</p>
          </div>
        </div>
    </section>
  );
}
