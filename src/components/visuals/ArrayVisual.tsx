"use client";

import { useState } from "react";
import { InteractiveDiagram } from "./InteractiveDiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export function ArrayVisual() {
    const [array, setArray] = useState<number[]>([10, 20, 30, 40]);
    const [inputValue, setInputValue] = useState("");

    const addElement = () => {
        if (!inputValue) return;
        setArray([...array, parseInt(inputValue)]);
        setInputValue("");
    };

    const removeElement = (index: number) => {
        setArray(array.filter((_, i) => i !== index));
    };

    return (
        <InteractiveDiagram>
            {() => (
                <div className="flex flex-col items-center gap-8 w-full">
                    <div className="flex gap-4">
                        <Input
                            type="number"
                            value={inputValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                            placeholder="Value"
                            className="w-24"
                        />
                        <Button onClick={addElement} disabled={array.length >= 8}>Add (Push)</Button>
                    </div>

                    <div className="flex gap-2 min-h-[60px] items-center">
                        <AnimatePresence mode="popLayout">
                            {array.map((val, index) => (
                                <motion.div
                                    key={`${index}-${val}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="relative flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-primary bg-primary/10 shadow-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-500 transition-colors group"
                                    onClick={() => removeElement(index)}
                                    title="Click to remove"
                                >
                                    <span className="text-lg font-bold">{val}</span>
                                    <span className="absolute -bottom-6 text-xs text-muted-foreground font-mono">
                                        [{index}]
                                    </span>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-background/80 rounded-lg">
                                        <span className="text-xs text-red-500 font-bold">DEL</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {array.length === 0 && (
                            <div className="text-muted-foreground italic">Array is empty</div>
                        )}
                    </div>

                    <div className="mt-8 text-sm text-muted-foreground text-center max-w-md">
                        <p>Arrays represent a contiguous block of memory. Accessing by index is O(1).</p>
                        <p>Adding/Removing from the end is O(1), but shifting elements is O(n).</p>
                    </div>
                </div>
            )}
        </InteractiveDiagram>
    );
}
