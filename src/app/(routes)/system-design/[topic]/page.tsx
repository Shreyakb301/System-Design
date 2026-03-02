
import { TOPICS } from "@/lib/topics";
import { ConceptDemonstration } from "@/components/gamification/ConceptDemonstration";
import { CapacityEstimationVisual } from "@/components/visuals/CapacityEstimationVisual";
import { ArchitectureComparisonVisual } from "@/components/visuals/ArchitectureComparisonVisual";
import { ApiComparisonVisual } from "@/components/visuals/ApiComparisonVisual";
import { ScalingVisual } from "@/components/visuals/ScalingVisual";
import { LoadBalancingVisual } from "@/components/visuals/LoadBalancingVisual";
import { CachingVisual } from "@/components/visuals/CachingVisual";
import { CDNVisual } from "@/components/visuals/CDNVisual";
import { SQLNoSQLVisual } from "@/components/visuals/SQLNoSQLVisual";
import { ReplicationVisual } from "@/components/visuals/ReplicationVisual";
import { MessageQueueVisual } from "@/components/visuals/MessageQueueVisual";
import { PubSubVisual } from "@/components/visuals/PubSubVisual";

// Helper to create simple configs
const DEMO_CONFIGS: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "capacity": {
        title: "Capacity Estimation",
        description: "The process of estimating the load, traffic, and storage requirements for a system to ensure it can scale effectively.",
        visual: <CapacityEstimationVisual />,
    },
    "caching": {
        title: "Caching",
        description: "Explore how high-speed data storage improves performance, and the challenges of invalidation and eviction.",
        visual: <CachingVisual />,
    },
    "cdn": {
        title: "Content Delivery Network (CDN)",
        description: "Visualize how CDNs reduce latency by serving content from edge locations closer to users, with real-time cache behavior and performance metrics.",
        visual: <CDNVisual />,
    },
    "sql-nosql": {
        title: "SQL vs NoSQL",
        description: "Compare relational and non-relational database models, their schemas, query patterns, and use cases.",
        visual: <SQLNoSQLVisual />,
    },
    "replication": {
        title: "Replication & Sharding",
        description: "Understand data replication strategies (master-slave, master-master) and horizontal partitioning (sharding) for scalability.",
        visual: <ReplicationVisual />,
    },
    "queues": {
        title: "Message Queues",
        description: "Explore asynchronous message processing, queue types (FIFO, priority, delayed), and producer-consumer patterns.",
        visual: <MessageQueueVisual />,
    },
    "pub-sub": {
        title: "Pub-Sub (Publish-Subscribe)",
        description: "Understand event-driven messaging with topics, publishers, and subscribers for one-to-many message distribution.",
        visual: <PubSubVisual />,
    },
    "load-balancing": {
        title: "Load Balancer",
        description: "Explore how traffic is distributed across multiple servers using different algorithms and health check strategies.",
        visual: <LoadBalancingVisual />,
    },
    "scaling": {
        title: "Vertical vs Horizontal Scaling",
        description: "Explore the differences between upgrading a single server and adding multiple servers to a cluster.",
        visual: <ScalingVisual />,
    },
    "apis": {
        title: "REST vs gRPC",
        description: "Compare communication protocols, payload efficiency, and transport optimizations in modern APIs.",
        visual: <ApiComparisonVisual />,
    },
    "microservices": {
        title: "Monolith vs Microservices",
        description: "Explore the trade-offs between a single unified codebase and a distributed collection of isolated services.",
        visual: <ArchitectureComparisonVisual />,
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
