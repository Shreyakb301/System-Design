"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { InteractiveDiagram } from "./InteractiveDiagram";
import { Server, Monitor } from "lucide-react";

export function LoadBalancerVisual() {
    const [requests, setRequests] = useState<{ id: number; target: number }[]>([]);
    const [activeServer, setActiveServer] = useState<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (requests.length < 5) {
                setRequests((prev) => [
                    ...prev,
                    { id: Date.now(), target: Math.floor(Math.random() * 3) },
                ]);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [requests]);

    return (
        <InteractiveDiagram>
            {() => (
                <div className="flex flex-col items-center justify-between h-[300px] w-full">
                    {/* Client Layer */}
                    <div className="flex items-center gap-2 mb-8">
                        <Monitor className="h-8 w-8 text-blue-500" />
                        <span className="text-sm font-medium">Clients</span>
                    </div>

                    {/* Load Balancer */}
                    <div className="relative flex items-center justify-center p-4 bg-purple-100 dark:bg-purple-900 rounded-full w-32 h-32 mb-8 border-2 border-purple-500">
                        <div className="text-center text-xs font-bold text-purple-700 dark:text-purple-300">
                            Load Balancer
                        </div>
                        {/* Visualizing packets passing through */}
                        <AnimatePresence>
                            {requests.map((req) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ y: -100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    transition={{ duration: 1 }}
                                    className="absolute h-3 w-3 bg-blue-500 rounded-full shadow-sm"
                                    onAnimationComplete={() => {
                                        setRequests((prev) => prev.filter((r) => r.id !== req.id));
                                        setActiveServer(req.target);
                                        setTimeout(() => setActiveServer(null), 500);
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Server Layer */}
                    <div className="flex justify-center gap-8 w-full">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="flex flex-col items-center">
                                <motion.div
                                    animate={{ scale: activeServer === i ? 1.1 : 1, color: activeServer === i ? "#22c55e" : "#64748b" }}
                                    className="transition-colors"
                                >
                                    <Server className="h-8 w-8" />
                                </motion.div>
                                <span className="text-xs mt-2 text-muted-foreground">Server {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </InteractiveDiagram>
    );
}
