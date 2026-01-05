import { AlgorithmVisualizer } from "@/components/gamification/AlgorithmVisualizer";

// Placeholder content map
const CONTENT_MAP: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "arrays": {
        title: "Static vs Dynamic Arrays",
        description: "Understanding how arrays are stored in memory and how they resize.",
        visual: (
            <div className="h-[300px] border rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                <AlgorithmVisualizer
                    nodes={[
                        { id: "a0", type: "array-node", value: 10, x: 50, y: 120 },
                        { id: "a1", type: "array-node", value: 20, x: 110, y: 120 },
                        { id: "a2", type: "array-node", value: 30, x: 170, y: 120 },
                        { id: "a3", type: "array-node", value: 40, x: 230, y: 120 },
                        { id: "a4", type: "array-node", value: "", x: 290, y: 120 },
                        { id: "a5", type: "array-node", value: "", x: 350, y: 120 },
                    ]}
                    readOnly
                />
            </div>
        ),
    },
    "singly-doubly": {
        title: "Linked Lists",
        description: "A linear collection of data elements whose order is not given by their physical placement in memory.",
        visual: (
            <div className="h-[300px] border rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                <AlgorithmVisualizer
                    nodes={[
                        { id: "n1", type: "list-node", value: "A", x: 50, y: 120, nextId: "n2" },
                        { id: "n2", type: "list-node", value: "B", x: 180, y: 120, nextId: "n3" },
                        { id: "n3", type: "list-node", value: "C", x: 310, y: 120 },
                    ]}
                    readOnly
                />
            </div>
        ),
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
