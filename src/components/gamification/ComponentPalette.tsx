"use client";

import { COMPONENT_CATALOG, ComponentType } from "@/lib/gamification/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComponentPaletteProps {
    balance: number;
    onSelectComponent: (type: ComponentType) => void;
    selectedType: ComponentType | null;
}

export function ComponentPalette({ balance, onSelectComponent, selectedType }: ComponentPaletteProps) {
    return (
        <div className="h-full border-r bg-slate-50 dark:bg-slate-900/50 p-4">
            <h3 className="font-semibold text-sm mb-4">Components</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="grid grid-cols-1 gap-2">
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
                                            variant={isSelected ? "default" : "outline"}
                                            className={`h-auto w-full justify-start gap-3 p-3 ${!canAfford ? 'opacity-50' : ''}`}
                                            onClick={() => canAfford && onSelectComponent(type as ComponentType)}
                                            disabled={!canAfford}
                                        >
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col items-start text-left">
                                                <span className="text-sm font-medium">{item.name}</span>
                                                <span className="text-xs text-muted-foreground">${item.cost}/mo</span>
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
            </ScrollArea>
        </div>
    );
}
