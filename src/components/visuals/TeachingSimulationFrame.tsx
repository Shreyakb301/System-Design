"use client";

import type { ReactNode } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TeachingSimulationTab<T extends string> = {
  id: T;
  label: string;
};

type TeachingSimulationFrameProps<T extends string> = {
  tabs?: Array<TeachingSimulationTab<T>>;
  activeTab?: T;
  onTabChange?: (tab: T) => void;
  badges?: Array<{ label: string; className?: string }>;
  contextRow?: ReactNode;
  stage: ReactNode;
  stageClassName?: string;
  heightClassName?: string;
  accentClassName?: string;
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onReset: () => void;
  onTogglePlay: () => void;
  onStep: () => void;
  what: string;
  why: string;
  code: string;
  codeLabel?: string;
};

export function TeachingSimulationFrame<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  badges = [],
  contextRow,
  stage,
  stageClassName,
  heightClassName,
  accentClassName,
  currentStep,
  totalSteps,
  isPlaying,
  onReset,
  onTogglePlay,
  onStep,
  what,
  why,
  code,
  codeLabel = "Code for this pattern",
}: TeachingSimulationFrameProps<T>) {
  const isAtLastStep = currentStep >= totalSteps - 1;

  return (
    <section
      className={cn(
        "relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 text-slate-100 shadow-xl",
        "h-[980px] sm:h-[700px]",
        heightClassName
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-1 w-full bg-blue-400",
          accentClassName
        )}
      />

      <div className="flex min-h-[84px] shrink-0 flex-col justify-center gap-3 border-b border-slate-800 px-4 pt-3 sm:min-h-[52px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:pt-0">
        <div className="flex min-w-0 flex-wrap gap-2">
          {tabs && activeTab && onTabChange ? (
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge
              key={badge.label}
              className={cn(
                "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-900",
                badge.className
              )}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>

      {contextRow ? (
        <div className="flex min-h-[62px] shrink-0 items-center border-b border-slate-800 px-4 py-3 sm:min-h-[48px] sm:px-5 sm:py-2.5">
          <div className="w-full">{contextRow}</div>
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-[320px] shrink-0 border-b border-slate-800 px-4 py-4 sm:min-h-[250px] sm:px-5",
          stageClassName
        )}
      >
        {stage}
      </div>

      <div className="flex min-h-[92px] shrink-0 flex-col gap-3 border-b border-slate-800 px-4 py-3 sm:min-h-[64px] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-3 w-3 rounded-full transition-colors",
                  index <= currentStep ? "bg-blue-400" : "bg-slate-700"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-slate-400">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onTogglePlay}
            className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
          >
            {isPlaying && !isAtLastStep ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isPlaying && !isAtLastStep ? "Pause" : "Auto Play"}
          </Button>
          <Button type="button" onClick={onStep} disabled={isAtLastStep}>
            <SkipForward className="mr-2 h-4 w-4" />
            Step
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 gap-4 border-b border-slate-800 px-4 py-3 sm:min-h-[132px] sm:grid-cols-2 sm:px-5">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-4">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">
            What
          </div>
          <div className="mt-3 min-h-[90px] items-start overflow-visible pb-4 text-sm leading-6 text-slate-100">
            {what}
          </div>
        </div>
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-4">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Why
          </div>
          <div className="mt-3 min-h-[90px] items-start overflow-visible pb-4 text-sm leading-6 text-slate-100">
            {why}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-3 sm:px-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {codeLabel}
            </span>
          </div>
          <pre className="max-h-[160px] overflow-x-auto overflow-y-auto whitespace-pre-wrap font-mono text-[13px] leading-6 text-slate-200">
            {code}
          </pre>
        </div>
      </div>
    </section>
  );
}
