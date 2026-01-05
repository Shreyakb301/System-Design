
import { ArrayVisual } from "@/components/visuals/ArrayVisual";

// Placeholder content map
const CONTENT_MAP: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "arrays": {
        title: "Static vs Dynamic Arrays",
        description: "Understanding how arrays are stored in memory and how they resize.",
        visual: <ArrayVisual />,
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
