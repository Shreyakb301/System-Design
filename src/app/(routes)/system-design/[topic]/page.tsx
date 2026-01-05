
import { TOPICS } from "@/lib/topics";
import { ConceptDemonstration } from "@/components/gamification/ConceptDemonstration";

// Helper to create simple configs
const DEMO_CONFIGS: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "load-balancing": {
        title: "Load Balancing",
        description: "Distributing network traffic across multiple servers to ensure reliability and scalability.",
        visual: (
            <ConceptDemonstration
                initialComponents={[
                    { id: "c1", type: "client", x: 50, y: 180, config: { cost: 0, capacity: 0, latency: 0, reliability: 1 } },
                    { id: "lb1", type: "load-balancer", x: 250, y: 180, config: { cost: 20, capacity: 1000, latency: 5, reliability: 0.9999 } },
                    { id: "s1", type: "server", x: 450, y: 80, config: { cost: 50, capacity: 100, latency: 50, reliability: 0.99 } },
                    { id: "s2", type: "server", x: 450, y: 180, config: { cost: 50, capacity: 100, latency: 50, reliability: 0.99 } },
                    { id: "s3", type: "server", x: 450, y: 280, config: { cost: 50, capacity: 100, latency: 50, reliability: 0.99 } },
                ]}
                initialConnections={[
                    { id: "l1", sourceId: "c1", targetId: "lb1" },
                    { id: "l2", sourceId: "lb1", targetId: "s1" },
                    { id: "l3", sourceId: "lb1", targetId: "s2" },
                    { id: "l4", sourceId: "lb1", targetId: "s3" },
                ]}
                initialTraffic={800}
            />
        ),
    },
    "caching": {
        title: "Caching",
        description: "Using a high-speed data storage layer to store a subset of data, so that future requests for that data are served up faster.",
        visual: (
            <ConceptDemonstration
                initialComponents={[
                    { id: "c1", type: "client", x: 50, y: 180, config: { cost: 0, capacity: 0, latency: 0, reliability: 1 } },
                    { id: "cache1", type: "cache", x: 250, y: 180, config: { cost: 80, capacity: 2000, latency: 2, reliability: 0.995 } },
                    { id: "db1", type: "database", x: 450, y: 180, config: { cost: 100, capacity: 200, latency: 20, reliability: 0.999 } },
                ]}
                initialConnections={[
                    { id: "l1", sourceId: "c1", targetId: "cache1" },
                    { id: "l2", sourceId: "cache1", targetId: "db1" },
                ]}
                initialTraffic={1200}
            />
        ),
    },
    "client-server": {
        title: "Client-Server Architecture",
        description: "A distributed application structure that partitions tasks or workloads between the providers of a resource or service, called servers, and service requesters, called clients.",
        visual: (
            <ConceptDemonstration
                initialComponents={[
                    { id: "c1", type: "client", x: 100, y: 180, config: { cost: 0, capacity: 0, latency: 0, reliability: 1 } },
                    { id: "s1", type: "server", x: 400, y: 180, config: { cost: 50, capacity: 100, latency: 50, reliability: 0.99 } },
                ]}
                initialConnections={[
                    { id: "l1", sourceId: "c1", targetId: "s1" },
                ]}
                initialTraffic={100}
            />
        ),
    }
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

    const content = DEMO_CONFIGS[topicId];

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
