import { Card } from "@/components/ui/card";
import { TOPICS } from "@/lib/topics";
import Link from "next/link";

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
    );
}
