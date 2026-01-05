
import { TOPICS } from "@/lib/topics";
import { LoadBalancerVisual } from "@/components/visuals/LoadBalancerVisual";

// This would ideally come from a CMS or MDX source
const CONTENT_MAP: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "load-balancing": {
        title: "Load Balancing",
        description: "Distributing network traffic across multiple servers to ensure reliability and scalability.",
        visual: <LoadBalancerVisual />,
    },
    // Add more mappings here
};

export default async function SystemDesignTopicPage(props: { params: Promise<{ topic: string }> }) {
    const params = await props.params;
    const topicId = params.topic;

    // Find the topic in our navigation structure
    let topicInfo = null;
    for (const section of TOPICS) {
        if (section.id === "system-design") {
            for (const category of section.categories) {
                if (category.items.some(item => item.href.endsWith(`/${topicId}`))) {
                    topicInfo = category.items.find(item => item.href.endsWith(`/${topicId}`));
                    break;
                }
            }
        }
    }

    const content = CONTENT_MAP[topicId];

    if (!topicInfo && !content) {
        // If valid topic but no content map entry yet, show placeholder
        // If invalid topic, 404
        // For now, let's just 404 if not in our menu structure
        // Actually checking topicInfo is better
    }

    // Fallback for demo if content is missing but route is valid
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

            {/* Additional Text Content would go here */}
            <div className="prose dark:prose-invert max-w-none">
                <p>
                    Detailed explanation about {content.title} goes here. This section would explain the
                    algorithms, trade-offs, and real-world use cases.
                </p>
            </div>
        </div>
    );
}
