import { Card } from "@/components/ui/card";
import { TOPICS } from "@/lib/topics";
import Link from "next/link";
import { Zap, Sparkles, ArrowRight, Code } from "lucide-react";

export default function DataStructuresPage() {
    const dataStructures = TOPICS.find((t) => t.id === "data-structures");

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Data Structures</h1>
                <p className="text-muted-foreground">
                    Master the fundamental building blocks of efficient algorithms.
                </p>
            </div>
            <div className="space-y-6">
                {/* Featured Challenge Banner */}
                <Link href="/data-structures/challenge">
                    <Card className="p-8 bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-none shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-64 h-64 -mr-16 -mt-16 rotate-12" />
                        </div>
                        <div className="relative z-10 flex items-start justify-between">
                            <div className="space-y-4 max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm">
                                    <Sparkles className="w-4 h-4" />
                                    <span>New: Memory Master</span>
                                </div>
                                <h2 className="text-3xl font-bold">Algorithm Arena</h2>
                                <p className="text-lg text-white/90">
                                    Solve interactive puzzles to master pointers, memory, and complexity.
                                    Can you optimize the traversal sequence?
                                </p>
                                <div className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold mt-2 group-hover:bg-white/90 transition-colors">
                                    Enter Arena
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="hidden md:block p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                                <Code className="w-16 h-16 text-yellow-300 drop-shadow-lg" />
                            </div>
                        </div>
                    </Card>
                </Link>

                <div className="grid gap-6 md:grid-cols-2">
                    {dataStructures?.categories.map((category) => (
                        <Card key={category.id} className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                {category.icon && <category.icon className="h-6 w-6 text-primary" />}
                                <h3 className="text-lg font-semibold">{category.title}</h3>
                            </div>
                            <div className="grid gap-2">
                                {category.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
