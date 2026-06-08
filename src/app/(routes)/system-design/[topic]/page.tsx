import { SystemDesignSimulationShell } from "@/components/visuals/SystemDesignSimulationShell";
import { Card, CardContent } from "@/components/ui/card";
import { CapacityEstimationVisual } from "@/components/visuals/CapacityEstimationVisual";
import { ArchitectureComparisonVisual } from "@/components/visuals/ArchitectureComparisonVisual";
import { ApiComparisonVisual } from "@/components/visuals/ApiComparisonVisual";
import { ScalingVisual } from "@/components/visuals/ScalingVisual";
import { LoadBalancerVisual } from "@/components/visuals/LoadBalancerVisual";
import { CachingVisual } from "@/components/visuals/CachingVisual";
import { CDNVisual } from "@/components/visuals/CDNVisual";
import { SQLNoSQLVisual } from "@/components/visuals/SQLNoSQLVisual";
import { ReplicationVisual } from "@/components/visuals/ReplicationVisual";
import { MessageQueueVisual } from "@/components/visuals/MessageQueueVisual";
import { PubSubVisual } from "@/components/visuals/PubSubVisual";
import { RequirementsVisual } from "@/components/visuals/RequirementsVisual";
import { ClientServerVisual } from "@/components/visuals/ClientServerVisual";
import { SYSTEM_DESIGN_LESSONS } from "@/lib/systemDesignLessonContent";
import { TOPICS } from "@/lib/topics";

const SIMULATION_GUIDES: Record<string, { goal: string; firstAction: string; successSignal: string }> = {
    "requirements": {
        goal: "See how requirements directly shape architecture — each choice you make adds or removes infrastructure.",
        firstAction: "Pick a product (e.g. YouTube), then toggle Non-Functional requirements one at a time and watch the architecture canvas evolve.",
        successSignal: "By the end you should feel why 'High Availability' forces a load balancer and read replica, while 'Low Latency' forces CDN and cache.",
    },
    "capacity": {
        goal: "Turn product assumptions into traffic, storage, and bottleneck estimates.",
        firstAction: "Push daily users or requests per user upward, then raise cache hit rate and compare the app and DB pressure.",
        successSignal: "The useful pattern is that DB load falls fastest when cache hit rate rises, even while peak traffic stays high.",
    },
    "client-server": {
        goal: "See the client and server as separate responsibilities with a network boundary between them.",
        firstAction: "Watch the traffic metric for a few cycles and compare how much work is centralized on the server side.",
        successSignal: "The server should emerge as the control point for throughput, latency, and shared state.",
    },
    "microservices": {
        goal: "Compare isolation and deployment trade-offs between one binary and many services.",
        firstAction: "Trigger a failure and a deploy in both modes so you can compare blast radius side by side.",
        successSignal: "Monolith failures should feel broad, while microservice failures and deploys should stay more contained.",
    },
    "apis": {
        goal: "Compare how REST and gRPC change payload size, latency, and call patterns.",
        firstAction: "Run the comparison in all three scenarios, especially streaming, and watch the overhead bar and call count.",
        successSignal: "The strongest contrast should appear when repeated polling makes REST much chattier than gRPC.",
    },
    "scaling": {
        goal: "See how one larger server differs from a pool of smaller nodes under rising traffic.",
        firstAction: "Increase traffic until the system strains, then try an upgrade in vertical mode or add nodes in horizontal mode.",
        successSignal: "Vertical scaling should hit a hard ceiling, while horizontal scaling should spread the load across nodes.",
    },
    "load-balancing": {
        goal: "Understand how balancing policy and health checks affect fairness, latency, and failures.",
        firstAction: "Mark one server slow or failed, then turn health checks off and compare the error rate and distribution metrics.",
        successSignal: "Healthy routing should avoid failed nodes; without health checks, failed targets should start hurting the system.",
    },
    "caching": {
        goal: "See how hits shorten the read path and how stale data appears when invalidation is weak.",
        firstAction: "Warm a few keys with reads, switch to stale-cache mode, update a DB value, then read the same key again.",
        successSignal: "A stale read should appear only when the cache is allowed to drift away from the source of truth.",
    },
    "cdn": {
        goal: "See how edge caches cut latency and protect the origin during static-content traffic.",
        firstAction: "Keep content static, let edges warm up, then flip traffic spike on and compare origin load with CDN on vs off.",
        successSignal: "The origin should stay much calmer once the edges have cache hits, especially during a spike.",
    },
    "sql-nosql": {
        goal: "Compare relational and document models through schema shape and workload behavior.",
        firstAction: "Switch between SQL and NoSQL, then let a few query cycles complete before comparing latency and operation mix.",
        successSignal: "SQL should surface joins and stronger structure, while NoSQL should emphasize flexibility and scaling.",
    },
    "replication": {
        goal: "Compare read replicas, multi-master sync, and sharding without treating them as interchangeable.",
        firstAction: "Cycle through each topology and watch how writes move, where copies appear, and what the consistency note changes to.",
        successSignal: "Replication should duplicate data for availability, while sharding should split it for scale.",
    },
    "queues": {
        goal: "See how queues absorb bursts and let consumers work asynchronously.",
        firstAction: "Raise the producer rate, then add consumers and compare queue growth against throughput.",
        successSignal: "The queue should build up under pressure and then drain as you increase consumer capacity.",
    },
    "pub-sub": {
        goal: "See how a single publish fans out to every subscriber on the topic.",
        firstAction: "Subscribe different consumers to different topics, then publish messages and compare fan-out counts.",
        successSignal: "Each topic should deliver to all matching subscribers, not just one consumer.",
    },
};

// Helper to create simple configs
const DEMO_CONFIGS: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "requirements": {
        title: "Requirements Gathering",
        description: "Pick a product, select requirements, and watch the architecture evolve live. Every requirement you add changes the infrastructure — that's the point.",
        visual: <RequirementsVisual />,
    },
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
        visual: <LoadBalancerVisual />,
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
        description: "See how clients and servers split responsibilities across a network boundary — and what happens when a single server can't keep up.",
        visual: <ClientServerVisual />,
    }
};

export default async function SystemDesignTopicPage(props: { params: Promise<{ topic: string }> }) {
    const params = await props.params;
    const topicId = params.topic;

    const content = DEMO_CONFIGS[topicId];
    const lesson = SYSTEM_DESIGN_LESSONS[topicId];
    const guide = SIMULATION_GUIDES[topicId];
    const orderedTopics = TOPICS.find((section) => section.id === "system-design")
        ?.categories
        .flatMap((category) => category.items)
        .filter((item) => item.id !== "architect-challenge") ?? [];
    const topicIndex = orderedTopics.findIndex((item) => item.id === topicId);
    const previousTopic = topicIndex > 0 ? orderedTopics[topicIndex - 1] : undefined;
    const nextTopic = topicIndex >= 0 && topicIndex < orderedTopics.length - 1 ? orderedTopics[topicIndex + 1] : undefined;

    // Fallback for demo if content is missing but route is valid
    if (!content) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight capitalize">{topicId.replace("-", " ")}</h1>
                <p className="text-muted-foreground">
                    This lesson is still in development.
                </p>
            </div>
        );
    }

    if (topicId === "load-balancing") {
        return <LoadBalancerVisual />;
    }

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Compact header */}
            <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {content.description}
                </p>
            </div>

            {/* Visual comes first */}
            {content.visual && guide ? (
                <SystemDesignSimulationShell
                    title={content.title}
                    goal={guide.goal}
                    firstAction={guide.firstAction}
                    successSignal={guide.successSignal}
                    previousTopic={previousTopic ? { title: previousTopic.title, href: previousTopic.href } : undefined}
                    nextTopic={nextTopic ? { title: nextTopic.title, href: nextTopic.href } : undefined}
                >
                    {content.visual}
                </SystemDesignSimulationShell>
            ) : null}

            {/* Lesson text follows the visual */}
            {lesson ? (
                <section className="space-y-6 pt-2">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold tracking-tight">Why this exists</h2>
                        <p className="text-sm leading-7 text-muted-foreground max-w-3xl">
                            {lesson.coreIdea}
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {lesson.concepts.map((concept) => (
                            <Card key={concept.title}>
                                <CardContent className="space-y-2 pt-5 pb-5">
                                    <h3 className="text-sm font-semibold tracking-tight">{concept.title}</h3>
                                    <p className="text-xs leading-6 text-muted-foreground">
                                        {concept.body}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardContent className="pt-5 pb-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Key takeaways</p>
                            <ul className="space-y-2.5">
                                {lesson.takeaways.map((takeaway) => (
                                    <li key={takeaway} className="flex gap-3 text-sm text-muted-foreground">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <span>{takeaway}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </section>
            ) : null}
        </div>
    );
}
