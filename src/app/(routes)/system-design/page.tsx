import { Card } from "@/components/ui/card";
import { TOPICS } from "@/lib/topics";
import Link from "next/link";
import { Trophy } from "lucide-react";

export default function SystemDesignPage() {
    const systemDesign = TOPICS.find((t) => t.id === "system-design");

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">System Design</h1>
                <p className="text-muted-foreground">
                    Understand how large-scale systems are designed, built, and scaled.
                </p>
            </div>
            <div className="space-y-6">
                {/* Featured Challenge Banner */}
                <Link href="/system-design/challenge">
                    <Card className="group relative cursor-pointer overflow-hidden border-slate-200 bg-slate-950 p-8 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10 transition-opacity group-hover:opacity-20">
                            <Trophy className="w-64 h-64 -mr-16 -mt-16 rotate-12" />
                        </div>
                        <div className="relative z-10 flex items-start justify-between">
                            <div className="space-y-4 max-w-xl">
                                <h2 className="text-3xl font-bold">System Architect Challenge</h2>
                                <p className="text-lg text-white/90">
                                    Add components, adjust the architecture, and watch latency, reliability,
                                    and cost respond as the system changes.
                                </p>
                            </div>
                            <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:block">
                                <Trophy className="w-16 h-16 text-emerald-200 drop-shadow-lg" />
                            </div>
                        </div>
                    </Card>
                </Link>

                <div className="grid gap-6 md:grid-cols-2">
                    {systemDesign?.categories.map((category) => (
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
