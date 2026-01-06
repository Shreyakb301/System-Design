import { AlgorithmVisualizer } from "@/components/gamification/AlgorithmVisualizer";
import { ArrayVisual } from "@/components/visuals/ArrayVisual";
import { ArrayMemorySimulation } from "@/components/visuals/ArrayMemorySimulation";
import { TwoPointersVisual } from "@/components/visuals/TwoPointersVisual";
import { LinkedListTripleVisual } from "@/components/visuals/LinkedListTripleVisual";
import { FastSlowVisual } from "@/components/visuals/FastSlowVisual";

// Placeholder content map
const CONTENT_MAP: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "arrays": {
        title: "Static vs Dynamic Arrays",
        description: "Understanding how arrays are stored in memory and how they resize.",
        visual: (
            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">1. Contiguous Memory Allocation</h2>
                    <p className="text-muted-foreground">
                        Unlike other data structures, arrays are stored in a single, unbroken block of memory.
                        This is why we can access any element in O(1) time using its physical address index.
                    </p>
                    <ArrayMemorySimulation />
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">2. Performance & Operations</h2>
                    <p className="text-muted-foreground">
                        Interact with high-level array operations below. Notice the difference in "cost"
                        between end operations (Push/Pop) and beginning operations (Shift/Unshift).
                    </p>
                    <ArrayVisual />
                </section>
            </div>
        ),
    },
    "two-pointers": {
        title: "Two Pointers Technique",
        description: "An optimization technique that uses two pointers to process linear data structures in O(n) time.",
        visual: <TwoPointersVisual />,
    },
    "singly-doubly": {
        title: "Linked Lists",
        description: "A linear collection of data elements whose order is not given by their physical placement in memory.",
        visual: <LinkedListTripleVisual />,
    },
    "fast-slow": {
        title: "Fast & Slow Pointers",
        description: "A pattern that uses two pointers moving at different speeds to solve complex linked list problems like cycle detection and finding the middle node.",
        visual: <FastSlowVisual />,
    },
};

export default async function DataStructureTopicPage(props: { params: Promise<{ topic: string }> }) {
    const params = await props.params;
    const topicId = params.topic;

    const content = CONTENT_MAP[topicId];

    if (!content) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight capitalize">{topicId.replace("-", " ")}</h1>
                <p className="text-muted-foreground">Visual explanation coming soon.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
                <p className="text-xl text-muted-foreground">
                    {content.description}
                </p>
            </div>

            {content.visual && (
                <div className="my-8">
                    {content.visual}
                </div>
            )}

            <div className="prose dark:prose-invert max-w-none">
                <p>
                    Detailed explanation about {content.title}.
                </p>
            </div>
        </div>
    );
}
