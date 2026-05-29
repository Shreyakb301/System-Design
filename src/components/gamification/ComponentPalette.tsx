"use client";

import type { DragEvent } from "react";
import { COMPONENT_CATALOG, ComponentType } from "@/lib/gamification/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ComponentPaletteProps {
    balance: number;
    onSelectComponent: (type: ComponentType | null) => void;
    selectedType: ComponentType | null;
}

export function ComponentPalette({ balance, onSelectComponent, selectedType }: ComponentPaletteProps) {
    const handleDragStart = (event: DragEvent<HTMLButtonElement>, type: ComponentType) => {
        event.dataTransfer.setData("application/x-system-component", type);
        event.dataTransfer.effectAllowed = "copy";
        onSelectComponent(type);
    };

    return (
        <div className="h-full p-4 flex flex-col">
            <div className="mb-3 shrink-0 space-y-1">
                <h3 className="font-semibold text-sm">Components</h3>
                <p className="text-xs text-muted-foreground">
                    Click to arm placement, or drag directly onto the canvas.
                </p>
            </div>
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 md:pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {Object.entries(COMPONENT_CATALOG).map(([type, item]) => {
                    if (type === "client") return null; // Cannot add clients manually in this version

                    const canAfford = balance >= item.cost;
                    const isSelected = selectedType === type;
                    const Icon = item.icon;

                    return (
                        <TooltipProvider key={type}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        aria-pressed={isSelected}
                                        draggable={canAfford}
                                        className={cn(
                                            "flex-shrink-0 h-auto w-auto md:w-full justify-start gap-3 p-3 text-left transition-transform",
                                            canAfford ? "cursor-grab active:cursor-grabbing hover:-translate-y-0.5" : "opacity-50",
                                            isSelected && "ring-2 ring-primary/20"
                                        )}
                                        onClick={() => canAfford && onSelectComponent(isSelected ? null : (type as ComponentType))}
                                        onDragStart={(event) => canAfford && handleDragStart(event, type as ComponentType)}
                                        disabled={!canAfford}
                                    >
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md shrink-0">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                                            <span className="text-xs text-muted-foreground">${item.cost}/mo</span>
                                            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">
                                                {isSelected ? "Click again to cancel" : "Drag or click to place"}
                                            </span>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs max-w-[200px]">{item.description}</p>
                                    <div className="mt-2 text-xs grid grid-cols-2 gap-2 border-t pt-2">
                                        <span>Capacity: {item.capacity} RPS</span>
                                        <span>Latency: {item.latency}ms</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </div>
    );
}
