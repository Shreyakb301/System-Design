"use client";

import { Card } from "@/components/ui/card";
import { GameState } from "@/lib/gamification/types";
import { Activity, DollarSign, Gauge, LucideIcon, Users, Zap } from "lucide-react";

interface ResourceMonitorProps {
    metrics: GameState["metrics"];
    budget: number;
}

export function ResourceMonitor({ metrics, budget }: ResourceMonitorProps) {
    const isLatencyGood = metrics.latency < 200;
    const isReliabilityGood = metrics.reliability > 0.99;
    const isBudgetGood = budget >= 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <StatsCard
                label="Latency"
                value={`${metrics.latency}ms`}
                icon={Zap}
                color={isLatencyGood ? "text-emerald-500" : "text-red-500"}
            />

            <StatsCard
                label="Reliability"
                value={`${(metrics.reliability * 100).toFixed(1)}%`}
                icon={Activity}
                color={isReliabilityGood ? "text-emerald-500" : "text-amber-500"}
            />

            <StatsCard
                label="Throughput"
                value={`${metrics.throughput} RPS`}
                icon={Gauge}
                color={metrics.throughput >= 500 ? "text-sky-500" : "text-indigo-500"}
            />

            <StatsCard
                label={budget >= 0 ? "Budget Remaining" : "Demo Mode"}
                value={budget >= 0 ? `$${budget}` : "Not tracked"}
                icon={budget >= 0 ? DollarSign : Users}
                color={budget >= 0 ? (isBudgetGood ? "text-emerald-500" : "text-red-500") : "text-slate-500"}
            />
        </div>
    );
}

function StatsCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
}) {
    return (
        <Card className="p-4 flex items-center justify-between shadow-sm">
            <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-800 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
        </Card>
    );
}
