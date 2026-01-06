"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Database,
    ArrowRight,
    Zap,
    AlertCircle,
    ArrowDownToDot,
    Cpu,
    Trash2,
    Copy,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryCell {
    address: string;
    value: string | number | null;
    isOwned: boolean;
    isNewAllocation?: boolean;
    isOldAllocation?: boolean;
}

export function ArrayMemorySimulation() {
    const [mode, setMode] = useState<"static" | "dynamic">("static");
    const [memory, setMemory] = useState<MemoryCell[]>([]);
    const [arraySize, setArraySize] = useState(0);
    const [capacity, setCapacity] = useState(4);
    const [baseAddress, setBaseAddress] = useState(0x100);
    const [status, setStatus] = useState("System Ready");
    const [isAnimating, setIsAnimating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize memory tape (32 cells)
    useEffect(() => {
        const initialMemory: MemoryCell[] = Array.from({ length: 32 }).map((_, i) => ({
            address: `0x${(0x100 + i * 4).toString(16).toUpperCase()}`,
            value: null,
            isOwned: false
        }));
        setMemory(initialMemory);
    }, []);

    // Helper to get index from address
    const getIndexFromAddress = (addr: number) => (addr - 0x100) / 4;

    // Update memory ownership based on baseAddress, size, and capacity
    useEffect(() => {
        if (memory.length === 0) return;

        setMemory(prev => prev.map((cell, i) => {
            const cellAddr = parseInt(cell.address, 16);
            const isOwned = cellAddr >= baseAddress && cellAddr < baseAddress + capacity * 4;
            const value = (cellAddr >= baseAddress && cellAddr < baseAddress + arraySize * 4)
                ? prev[i].value || Math.floor(Math.random() * 90) + 10
                : null;

            return { ...cell, isOwned, value };
        }));
    }, [baseAddress, capacity, arraySize]);

    const handleAdd = async () => {
        if (isAnimating) return;
        setError(null);

        if (arraySize >= capacity) {
            if (mode === "static") {
                setError("IndexOutOfBoundsException: Array capacity exceeded");
                setStatus("Error: Fixed size limit reached");
                return;
            } else {
                await handleResize();
                return;
            }
        }

        setStatus("Appending element...");
        setArraySize(prev => prev + 1);
        setStatus("O(1) Append Complete");
    };

    const handleResize = async () => {
        setIsAnimating(true);
        setStatus("Capacity Reached! Initializing Resize...");

        const newCapacity = capacity * 2;
        // Find a "new" spot in memory (simulating allocation)
        const newBaseAddress = baseAddress === 0x100 ? 0x140 : 0x100;

        // Step 1: Allocate
        setStatus("Step 1: Allocating new memory block (Size: " + newCapacity + ")...");
        setMemory(prev => prev.map(cell => {
            const addr = parseInt(cell.address, 16);
            if (addr >= newBaseAddress && addr < newBaseAddress + newCapacity * 4) {
                return { ...cell, isNewAllocation: true };
            }
            return cell;
        }));
        await new Promise(r => setTimeout(r, 1000));

        // Step 2: Copy
        setStatus("Step 2: Copying elements to new location (O(n))...");
        for (let i = 0; i < arraySize; i++) {
            const valToCopy = memory[getIndexFromAddress(baseAddress + i * 4)].value;
            setMemory(prev => {
                const next = [...prev];
                next[getIndexFromAddress(newBaseAddress + i * 4)].value = valToCopy;
                return next;
            });
            await new Promise(r => setTimeout(r, 400));
        }

        // Step 3: Update Pointer
        setStatus("Step 3: Updating base pointer...");
        await new Promise(r => setTimeout(r, 800));

        // Mark old as "to be freed"
        setMemory(prev => prev.map(cell => {
            const addr = parseInt(cell.address, 16);
            if (addr >= baseAddress && addr < baseAddress + capacity * 4) {
                return { ...cell, isOldAllocation: true };
            }
            return cell;
        }));

        setBaseAddress(newBaseAddress);
        setCapacity(newCapacity);

        // Step 4: Free
        setStatus("Step 4: Freeing old memory block...");
        await new Promise(r => setTimeout(r, 1000));
        setMemory(prev => prev.map(cell => ({ ...cell, isNewAllocation: false, isOldAllocation: false })));

        setArraySize(prev => prev + 1);
        setStatus("Resize complete. Amortized O(1) achieved.");
        setIsAnimating(false);
    };

    const reset = () => {
        setArraySize(0);
        setCapacity(4);
        setBaseAddress(0x100);
        setStatus("System Ready");
        setError(null);
        setMemory(prev => prev.map(c => ({ ...c, value: null, isOwned: false })));
    };

    return (
        <Card className="p-6 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />


            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: Memory Tape */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-blue-400" />
                            <h3 className="font-bold tracking-tight uppercase text-sm text-slate-400">Physical Memory Tape</h3>
                        </div>
                        <Badge variant="outline" className="font-mono text-blue-400 border-blue-400/30">
                            RAM: 128 Bytes
                        </Badge>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {memory.map((cell, i) => (
                            <motion.div
                                key={cell.address}
                                layout
                                className={cn(
                                    "relative h-14 flex flex-col items-center justify-center rounded border text-[10px] transition-all duration-500",
                                    cell.isOwned ? "border-blue-500/50 bg-blue-500/10" : "border-slate-800 bg-slate-900/50 opacity-40",
                                    cell.isNewAllocation && "border-green-500 ring-2 ring-green-500/20 bg-green-500/5",
                                    cell.isOldAllocation && "border-red-500 bg-red-500/5 grayscale grayscale-fade"
                                )}
                            >
                                <span className="absolute top-1 left-1 opacity-40 scale-75">{cell.address}</span>
                                {cell.value && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="font-bold text-sm"
                                    >
                                        {cell.value}
                                    </motion.span>
                                )}
                                {cell.isOwned && !cell.value && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-800">
                        <div className="flex-1 p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded flex items-center justify-center",
                                error ? "bg-red-500/20 text-red-400" : (isAnimating ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400")
                            )}>
                                {error ? <AlertCircle className="w-5 h-5" /> : (isAnimating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />)}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status</p>
                                <p className={cn("text-xs font-medium", error && "text-red-400")}>{status}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Inspector & Controls */}
                <div className="w-full lg:w-80 space-y-6">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Database className="w-4 h-4" /> Array Inspector
                        </h4>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Mode</span>
                                <div className="flex gap-1 p-0.5 bg-slate-800 rounded-md">
                                    <button
                                        onClick={() => setMode("static")}
                                        className={cn("px-2 py-0.5 rounded text-[10px] transition-colors", mode === "static" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                                    >Static</button>
                                    <button
                                        onClick={() => setMode("dynamic")}
                                        className={cn("px-2 py-0.5 rounded text-[10px] transition-colors", mode === "dynamic" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                                    >Dynamic</button>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Base Pointer</span>
                                <code className="text-blue-400">0x{baseAddress.toString(16).toUpperCase()}</code>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Size / Capacity</span>
                                <span className="font-mono text-yellow-500">{arraySize} / {capacity}</span>
                            </div>
                            <div className="pt-2">
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-yellow-500"
                                        animate={{ width: `${(arraySize / capacity) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            className="bg-blue-600 hover:bg-blue-500 text-white h-12 gap-2"
                            onClick={handleAdd}
                            disabled={isAnimating}
                        >
                            <Plus className="w-4 h-4" /> array.append(val)
                        </Button>
                        <Button
                            variant="outline"
                            className="border-slate-800 hover:bg-slate-900 text-slate-300 h-10 gap-2"
                            onClick={reset}
                        >
                            <Trash2 className="w-4 h-4" /> Free Memory
                        </Button>
                        <Button
                            variant="outline"
                            className="border-slate-800 hover:bg-slate-900 text-slate-300 h-10 gap-2"
                            onClick={reset}
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh Simulation
                        </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                            <ArrowDownToDot className="w-4 h-4" /> Computer Science Tip
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            {mode === "static"
                                ? "Static arrays are immutable in length. This allows for extremely fast access but requires you to know your max size upfront."
                                : "Dynamic arrays (like ArrayList or Vec) double their capacity when full. This means occasional O(n) resizes, but amortized O(1) performance."}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function Plus({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
