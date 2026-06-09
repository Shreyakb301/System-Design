import { SystemDesignSimulationShell } from "@/components/visuals/SystemDesignSimulationShell";
import { Card, CardContent } from "@/components/ui/card";
import { CapacityEstimationVisual } from "@/components/visuals/CapacityEstimationVisual";
import { ArchitectureComparisonVisual } from "@/components/visuals/ArchitectureComparisonVisual";
import { ApiComparisonVisual } from "@/components/visuals/ApiComparisonVisual";
// import { RestVsGrpcVisual } from "@/components/visuals/RestVsGrpcVisual";
import { ScalingVisual } from "@/components/visuals/ScalingVisual";
import { LoadBalancerVisual } from "@/components/visuals/LoadBalancerVisual";
import { CachingLearningVisual } from "@/components/visuals/CachingLearningVisual";
import { CDNVisual } from "@/components/visuals/CDNVisual";
import { SQLNoSQLVisual } from "@/components/visuals/SQLNoSQLVisual";
import { ReplicationShardingVisual } from "@/components/visuals/ReplicationShardingVisual";
import { MessageQueueLearningVisual } from "@/components/visuals/MessageQueueLearningVisual";
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
        goal: "Feel the difference between hitting the database directly and reusing cached work — then see where staleness and load tradeoffs appear.",
        firstAction: "Pick a scenario, then push the request rate and repeated-request percentage up while switching between No Cache, Cache, and Compare.",
        successSignal: "A high repeat rate should drive the hit rate up and database load down; a long TTL should raise stale-data risk.",
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
        goal: "Feel replication and sharding as two competing tools first — copy data vs split data — before combining them.",
        firstAction: "Pick a workload, then switch between Single, Replication, Sharding, and Combined while pushing read, write, and storage traffic up.",
        successSignal: "Replication should scale reads but not writes; sharding should scale writes and storage but not reliability — and Combined should do both.",
    },
    "queues": {
        goal: "Feel the difference between a direct synchronous chain and a buffered, asynchronous queue — then see where the backlog moves.",
        firstAction: "Pick a scenario, then push incoming requests up and switch between No Queue, Queue, and Compare while adjusting consumers, retries, and failure rate.",
        successSignal: "Without a queue a spike should overload the chain immediately; with a queue the backlog should build and then drain as you scale consumers.",
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
        description: "Store expensive work closer. Compare a direct database path with a cached path — and watch hit rate, latency, database load, and stale-data risk move as you change traffic.",
        visual: <CachingLearningVisual />,
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
        title: "Replication vs Sharding",
        description: "Two different tools solving different bottlenecks. Replication copies data to scale reads and availability; sharding splits data to scale writes and storage. See where the bottleneck moves — and why large systems combine both.",
        visual: <ReplicationShardingVisual />,
    },
    "queues": {
        title: "Message Queues",
        description: "Buffer work instead of blocking everything. Compare a direct synchronous chain with a queued, asynchronous system — and watch where the backlog and bottlenecks move.",
        visual: <MessageQueueLearningVisual />,
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
    // "apis": {
    //     title: "REST vs gRPC",
    //     description: "Compare communication protocols, payload efficiency, and transport optimizations in modern APIs.",
    //     visual: <RestVsGrpcVisual />,
    // },
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

    // if (topicId === "apis") {
    //     return <RestVsGrpcVisual />;
    // }

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Compact header */}
            <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
                <p className="text-lg leading-8 text-muted-foreground max-w-2xl">
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
                        <h2 className="text-xl font-semibold tracking-tight">Why this exists</h2>
                        <p className="text-base leading-7 text-muted-foreground max-w-3xl">
                            {lesson.coreIdea}
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {lesson.concepts.map((concept) => (
                            <Card key={concept.title}>
                                <CardContent className="space-y-2 pt-5 pb-5">
                                    <h3 className="text-base font-semibold tracking-tight">{concept.title}</h3>
                                    <p className="text-base leading-7 text-muted-foreground">
                                        {concept.body}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardContent className="pt-5 pb-5">
                            <p className="text-base font-semibold uppercase tracking-widest text-muted-foreground mb-3">Key takeaways</p>
                            <ul className="space-y-2.5">
                                {lesson.takeaways.map((takeaway) => (
                                    <li key={takeaway} className="flex gap-3 text-base leading-7 text-muted-foreground">
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
