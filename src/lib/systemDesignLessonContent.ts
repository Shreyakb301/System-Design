export type SystemDesignLessonContent = {
  badge: string;
  whenToReach: string;
  coreIdea: string;
  watchFor: string;
  concepts: Array<{
    title: string;
    body: string;
  }>;
  takeaways: string[];
};

export const SYSTEM_DESIGN_LESSONS: Record<string, SystemDesignLessonContent> = {
  requirements: {
    badge: "Fundamentals",
    whenToReach:
      "Start here whenever a system-design question feels fuzzy. Good system design begins by deciding what matters before drawing boxes.",
    coreIdea:
      "Requirements gathering exists because architecture is a response to constraints, not a blank-canvas exercise. Functional requirements tell you what the system must do. Non-functional requirements tell you how well it must do it under real load, latency, reliability, and cost limits.",
    watchFor:
      "Use the visual to separate must-have user behavior from system constraints. Notice how each requirement changes the shape of the final architecture decisions.",
    concepts: [
      {
        title: "Functional vs non-functional",
        body:
          "Functional requirements define user-visible behavior. Non-functional requirements define throughput, latency, durability, consistency, availability, and budget.",
      },
      {
        title: "Scope is an engineering tool",
        body:
          "Explicitly saying what you are not building prevents over-design. Good scope cuts away features that would otherwise distort the system.",
      },
      {
        title: "Requirements drive trade-offs",
        body:
          "A low-latency read-heavy system wants very different infrastructure than a write-heavy financial ledger. The architecture follows the constraints.",
      },
    ],
    takeaways: [
      "Start by clarifying users, traffic, reads vs writes, and failure tolerance.",
      "Non-functional requirements are what force real architectural trade-offs.",
      "Undefined scope produces vague systems and vague interviews.",
      "If you cannot state the requirements cleanly, the rest of the design will drift.",
    ],
  },
  capacity: {
    badge: "Fundamentals",
    whenToReach:
      "Use capacity estimation before choosing databases, caches, or scaling strategies. It tells you what the system actually has to survive.",
    coreIdea:
      "Capacity estimation converts product assumptions into engineering numbers: requests per second, bandwidth, storage, and component pressure. Those numbers tell you where the bottleneck will appear long before production traffic does.",
    watchFor:
      "In the live simulator, traffic is generated from daily users and requests per user, then pushed through cache, app servers, and the database. Watch how higher cache hit rates protect DB QPS while peak traffic still stresses the app tier.",
    concepts: [
      {
        title: "Traffic is just arithmetic",
        body:
          "Requests per second comes from users, usage frequency, and time. Once you quantify traffic, architecture choices stop being hand-wavy.",
      },
      {
        title: "Not every request reaches storage",
        body:
          "Caches absorb a fraction of traffic, so the database only sees cache misses. That is why hit rate matters so much.",
      },
      {
        title: "Replication changes cost shape",
        body:
          "Replication improves resilience and read availability, but it multiplies storage cost. Capacity planning must include that multiplier.",
      },
    ],
    takeaways: [
      "Compute traffic first, then decide scaling layers.",
      "Cache hit rate changes database load more than almost any other input.",
      "Peak traffic, not average traffic, usually drives system shape.",
      "Storage estimates must include retention and replication, not raw payload only.",
    ],
  },
  "client-server": {
    badge: "Core concepts",
    whenToReach:
      "Use client-server as the base mental model whenever a system has requesters, processors, and a network boundary between them.",
    coreIdea:
      "Client-server architecture separates the thing asking for work from the thing doing the work. That separation creates clean responsibility boundaries, but it also introduces latency, failure modes, and scaling questions at the network edge.",
    watchFor:
      "In the demonstration, focus on who initiates the request, where computation happens, and how the connection boundary becomes the first scalability constraint.",
    concepts: [
      {
        title: "Separation of concerns",
        body:
          "Clients handle presentation and user interaction. Servers centralize shared logic, data, and coordination.",
      },
      {
        title: "The network is part of the design",
        body:
          "Once the client and server are separated, latency, retries, auth, and failures become first-class design problems.",
      },
      {
        title: "Centralization simplifies control",
        body:
          "A server-controlled system makes updates, authorization, and data consistency easier than fully distributed peers.",
      },
    ],
    takeaways: [
      "Client-server is the foundation that most higher-level architectures build on.",
      "The client/server boundary defines latency and fault lines.",
      "Shared state usually lives on the server side for consistency and control.",
      "Scaling starts by understanding which server responsibilities are becoming hot.",
    ],
  },
  microservices: {
    badge: "Core concepts",
    whenToReach:
      "Reach for this comparison when a single codebase starts slowing down team velocity, release cadence, or fault isolation.",
    coreIdea:
      "Monoliths and microservices solve the same product problem with different organizational and operational shapes. A monolith optimizes simplicity and local reasoning. Microservices optimize independent deployment and fault boundaries, but add distributed-system cost.",
    watchFor:
      "Use the visual to compare coupling, deployment independence, and failure isolation. The point is not that one is always better, but why the trade-offs change as systems and teams grow.",
    concepts: [
      {
        title: "Monoliths are simpler by default",
        body:
          "One deployment unit, one codebase, and in-process calls are easier to build, debug, and reason about early on.",
      },
      {
        title: "Microservices buy isolation",
        body:
          "Independent services let teams deploy separately and contain failures, but every service boundary adds networking, contracts, and observability cost.",
      },
      {
        title: "Team shape matters",
        body:
          "Architecture is partly an organizational choice. If teams cannot own boundaries cleanly, microservices become complexity without leverage.",
      },
    ],
    takeaways: [
      "Monolith first is often the right default until scale or team boundaries demand otherwise.",
      "Microservices solve deployment and ownership problems, not just technical ones.",
      "Distributed systems add latency, retries, and consistency cost immediately.",
      "A bad service boundary is worse than a healthy monolith module boundary.",
    ],
  },
  apis: {
    badge: "Core concepts",
    whenToReach:
      "Use this when choosing how services or clients should communicate: human-friendly HTTP APIs, or efficient service-to-service contracts.",
    coreIdea:
      "REST and gRPC are both ways to move requests between components, but they optimize different things. REST prioritizes broad compatibility and easy debugging. gRPC prioritizes typed contracts, streaming, and efficient binary transport.",
    watchFor:
      "Compare payload size, protocol overhead, schema strictness, and how each protocol behaves for browser clients versus internal services.",
    concepts: [
      {
        title: "REST is operationally familiar",
        body:
          "HTTP verbs, JSON, and browser tooling make REST easy to inspect and integrate across many clients and teams.",
      },
      {
        title: "gRPC favors internal efficiency",
        body:
          "Binary Protobuf payloads, generated clients, and streaming APIs make gRPC strong for internal service-to-service communication.",
      },
      {
        title: "Protocol choice affects evolution",
        body:
          "Typed schemas reduce ambiguity, but can increase coordination cost. Loose JSON is flexible, but easier to misuse over time.",
      },
    ],
    takeaways: [
      "REST is usually the easier default for public APIs and browser-facing systems.",
      "gRPC shines when performance, streaming, and typed contracts matter internally.",
      "Payload format, tooling, and schema evolution all matter beyond raw speed.",
      "Protocol choice should follow client needs, not trendiness.",
    ],
  },
  scaling: {
    badge: "Scalability",
    whenToReach:
      "Use this when one machine is approaching CPU, memory, or throughput limits and you need to decide whether to grow up or grow out.",
    coreIdea:
      "Vertical scaling makes one machine stronger. Horizontal scaling adds more machines. Vertical scaling is simpler but bounded. Horizontal scaling is more flexible but requires coordination, distribution, and stateless design.",
    watchFor:
      "In the visual, focus on what changes operationally when you add more nodes instead of bigger hardware: traffic distribution, state placement, and failure handling.",
    concepts: [
      {
        title: "Vertical scaling preserves simplicity",
        body:
          "One stronger machine avoids load balancing and distributed coordination, but there is a hard ceiling and bigger boxes get expensive quickly.",
      },
      {
        title: "Horizontal scaling changes architecture",
        body:
          "Once you add nodes, you need routing, shared state strategy, health checks, and a plan for partial failure.",
      },
      {
        title: "State is the real constraint",
        body:
          "Stateless app servers scale horizontally easily. Stateful components require partitioning, replication, or coordination mechanisms.",
      },
    ],
    takeaways: [
      "Vertical scaling is easier, but capped.",
      "Horizontal scaling is more elastic, but operationally heavier.",
      "Stateless tiers are the first good candidates for horizontal scaling.",
      "Scaling decisions are really decisions about where state lives.",
    ],
  },
  "load-balancing": {
    badge: "Scalability",
    whenToReach:
      "Use a load balancer when one service tier needs multiple instances and traffic can no longer flow to a single server directly.",
    coreIdea:
      "Load balancing exists to spread requests across healthy servers so no single instance becomes the choke point. The algorithm matters less than the guarantees: distribution, health awareness, and graceful failure handling.",
    watchFor:
      "Pay attention to how traffic shifts between servers, how unhealthy nodes are avoided, and how different policies change fairness and tail latency.",
    concepts: [
      {
        title: "Distribution protects the tier",
        body:
          "A load balancer turns a server group into one logical endpoint and prevents accidental hot-spotting on a single machine.",
      },
      {
        title: "Health checks are non-negotiable",
        body:
          "Balancing across unhealthy servers is worse than not balancing at all. Real load balancers continuously validate targets.",
      },
      {
        title: "Algorithm is context-dependent",
        body:
          "Round robin is simple. Least connections and latency-aware choices help when request cost varies widely.",
      },
    ],
    takeaways: [
      "Load balancers scale stateless tiers by turning many instances into one entry point.",
      "Health checks and failover matter as much as raw distribution.",
      "Session affinity can help some workloads, but it reduces flexibility.",
      "A load balancer is a control plane for traffic, not just a router.",
    ],
  },
  caching: {
    badge: "Scalability",
    whenToReach:
      "Reach for caching when reads dominate, repeated requests are expensive, or downstream systems cannot safely absorb repeated traffic.",
    coreIdea:
      "Caching trades freshness complexity for latency and throughput gains. By serving repeated reads from faster storage, it removes pressure from databases and external services. The hard part is not reading from cache. The hard part is invalidation and consistency.",
    watchFor:
      "In the visual, focus on how hits short-circuit work, how misses fall through to the source of truth, and how cache policy changes backend pressure.",
    concepts: [
      {
        title: "Hits save expensive work",
        body:
          "A good cache removes repeated database queries, remote calls, or expensive computation from the hot path.",
      },
      {
        title: "Misses define the fallback path",
        body:
          "A cache is never the system of record. You still need a correct miss path, fill strategy, and expiration model.",
      },
      {
        title: "Freshness is the tax",
        body:
          "The reason caching is hard is invalidation. Every performance win comes with a consistency question.",
      },
    ],
    takeaways: [
      "Cache hit rate is one of the most powerful leverage points in system design.",
      "Caches reduce latency and backend QPS, but add consistency complexity.",
      "The miss path must remain correct even if the cache is empty or down.",
      "Eviction, TTLs, and invalidation are design choices, not implementation details.",
    ],
  },
  cdn: {
    badge: "Scalability",
    whenToReach:
      "Use a CDN when static or cacheable content is being served globally and origin latency or bandwidth cost is becoming a problem.",
    coreIdea:
      "A CDN moves content closer to users by serving it from geographically distributed edge caches. The main value is not just speed. It is removing repeated load from the origin while reducing latency for distant users.",
    watchFor:
      "Notice how edge hits avoid the origin entirely, while misses still route back. The design question is what can be cached safely at the edge and for how long.",
    concepts: [
      {
        title: "Distance creates latency",
        body:
          "Even a well-tuned origin feels slow when it is far away. Edge caching shortens the physical path for repeated content.",
      },
      {
        title: "Origins should serve the uncommon path",
        body:
          "The origin should mainly handle cold misses, personalization, or dynamic work. Repeated static delivery belongs at the edge.",
      },
      {
        title: "Cacheability determines value",
        body:
          "A CDN is strongest for static assets and cacheable responses. Highly personalized traffic limits what the edge can absorb.",
      },
    ],
    takeaways: [
      "CDNs reduce latency and protect the origin simultaneously.",
      "They work best for static assets and predictable cache lifetimes.",
      "Edge misses still need a healthy origin path.",
      "Cache headers are part of the system design, not just frontend implementation.",
    ],
  },
  "sql-nosql": {
    badge: "Databases",
    whenToReach:
      "Use this comparison when data shape, consistency guarantees, or query patterns are pushing you toward a storage decision.",
    coreIdea:
      "SQL and NoSQL are not opposites so much as different optimization targets. SQL systems prioritize structured relations, transactions, and rich queries. NoSQL systems prioritize flexible schema, horizontal scale, and workload-specific access patterns.",
    watchFor:
      "Compare schema rigidity, join behavior, consistency expectations, and how scaling pressure shifts the right choice depending on the workload.",
    concepts: [
      {
        title: "Relational structure buys powerful queries",
        body:
          "If the domain has strong relationships, constraints, and transactional updates, SQL often reduces complexity instead of adding it.",
      },
      {
        title: "NoSQL trades flexibility for specificity",
        body:
          "Document, key-value, column, and graph stores each optimize for a narrower access pattern than general-purpose relational databases.",
      },
      {
        title: "The workload decides",
        body:
          "High write scale, denormalized reads, or flexible schemas can favor NoSQL. Multi-row consistency and complex joins can favor SQL.",
      },
    ],
    takeaways: [
      "Pick storage based on access patterns, not slogans.",
      "SQL is often the best default until the workload proves otherwise.",
      "NoSQL is not one thing; each model solves a different problem.",
      "Consistency, query flexibility, and scaling shape the real trade-off.",
    ],
  },
  replication: {
    badge: "Databases",
    whenToReach:
      "Reach for replication and sharding when one database cannot meet your read volume, write volume, or capacity requirements alone.",
    coreIdea:
      "Replication copies data to improve availability and read scale. Sharding splits data across nodes to increase total write throughput and storage capacity. Replication preserves the same dataset in more places. Sharding divides the dataset itself.",
    watchFor:
      "Use the visual to separate read scaling from write scaling. Replication changes failover and consistency. Sharding changes routing, fan-out, and rebalancing.",
    concepts: [
      {
        title: "Replication improves resilience",
        body:
          "Multiple copies let the system survive node loss and absorb more reads, but introduce lag and failover complexity.",
      },
      {
        title: "Sharding raises the ceiling",
        body:
          "Partitioning data across nodes lets the system store and write more than one box can handle, but makes routing and rebalancing harder.",
      },
      {
        title: "They solve different bottlenecks",
        body:
          "Replication helps when the same data is being read too often. Sharding helps when one node cannot hold or write the whole dataset anymore.",
      },
    ],
    takeaways: [
      "Replication is about copies. Sharding is about splitting.",
      "Read scale and write scale are different problems.",
      "Failover, lag, and consistency become more visible with replication.",
      "Shard keys determine whether scaling is smooth or painful.",
    ],
  },
  queues: {
    badge: "Messaging",
    whenToReach:
      "Use a queue when producers and consumers should not be tightly coupled in time, speed, or failure handling.",
    coreIdea:
      "Queues turn synchronous pressure into asynchronous work. They buffer bursts, decouple systems, and let workers process at a controlled rate. The cost is latency, delivery semantics, and operational complexity around retries and dead letters.",
    watchFor:
      "Focus on how bursts get absorbed, how consumers drain work over time, and how queue depth reveals backpressure in the system.",
    concepts: [
      {
        title: "Queues absorb mismatched rates",
        body:
          "If producers are faster than consumers, a queue prevents immediate overload by buffering work temporarily.",
      },
      {
        title: "Asynchrony changes user experience",
        body:
          "Queued work is not immediately complete. You often trade lower coupling for higher end-to-end latency.",
      },
      {
        title: "Delivery semantics matter",
        body:
          "At-most-once, at-least-once, retries, and dead-letter handling define correctness under failure more than the queue UI does.",
      },
    ],
    takeaways: [
      "Queues are for decoupling, buffering, and smoothing bursts.",
      "They protect downstream systems, but introduce eventual completion.",
      "Backpressure is visible as queue depth growth.",
      "Retry and failure policy are part of the design, not cleanup work later.",
    ],
  },
  "pub-sub": {
    badge: "Messaging",
    whenToReach:
      "Use publish-subscribe when one event should fan out to multiple independent consumers without the producer knowing who they are.",
    coreIdea:
      "Pub-sub decouples event producers from event consumers through topics or streams. Producers publish once. Multiple subscribers react independently. This is powerful for event-driven systems, but requires careful thinking about ordering, replay, duplication, and consumer lag.",
    watchFor:
      "In the visual, track how one published event becomes many downstream reactions. The system value comes from loose coupling and fan-out, not from simple message delivery alone.",
    concepts: [
      {
        title: "Fan-out is the core value",
        body:
          "One producer can trigger analytics, notifications, search indexing, and billing without directly calling each system.",
      },
      {
        title: "Consumers move independently",
        body:
          "Each subscriber processes at its own speed, with its own failure handling and persistence behavior.",
      },
      {
        title: "Events need contracts too",
        body:
          "Loose coupling does not remove schema evolution problems. It just moves them into event design and consumer compatibility.",
      },
    ],
    takeaways: [
      "Pub-sub is for one-to-many event distribution.",
      "It reduces producer coupling, but increases event contract discipline.",
      "Consumer lag, replay, and ordering matter in real systems.",
      "Event-driven architecture is operationally powerful, not magically simpler.",
    ],
  },
};
