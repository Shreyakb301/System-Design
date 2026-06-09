"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdjacentTopic = {
  title: string;
  href: string;
};

type SystemDesignSimulationShellProps = {
  title: string;
  goal: string;
  firstAction: string;
  successSignal: string;
  children: ReactNode;
  previousTopic?: AdjacentTopic;
  nextTopic?: AdjacentTopic;
};

export function SystemDesignSimulationShell({
  title,
  goal,
  firstAction,
  successSignal,
  children,
  previousTopic,
  nextTopic,
}: SystemDesignSimulationShellProps) {
  return (
    <section className="space-y-4">
      {/* Compact hint bar */}
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <span className="text-sm leading-6 text-slate-500"><span className="font-semibold text-slate-700">Goal:</span> {goal}</span>
        <span className="text-sm leading-6 text-slate-500"><span className="font-semibold text-slate-700">Try:</span> {firstAction}</span>
      </div>

      <div className="space-y-4">
        {children}
      </div>

      {previousTopic || nextTopic ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          {previousTopic ? (
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link href={previousTopic.href}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {previousTopic.title}
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {nextTopic ? (
            <Button asChild variant="outline" className="justify-end rounded-xl">
              <Link href={nextTopic.href}>
                {nextTopic.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
