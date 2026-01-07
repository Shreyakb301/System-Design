import { LucideIcon, Server, Database, Activity, Network, Layers, Code, GitBranch, List, Hash, Zap } from "lucide-react";

export type TopicItem = {
  id: string;
  title: string;
  href: string;
};

export type TopicCategory = {
  id: string;
  title: string;
  icon?: LucideIcon;
  items: TopicItem[];
};

export type TopicSection = {
  id: string;
  title: string;
  categories: TopicCategory[];
};

export const TOPICS: TopicSection[] = [
  {
    id: "system-design",
    title: "System Design",
    categories: [
      {
        id: "fundamentals",
        title: "Fundamentals",
        icon: Server,
        items: [
          { id: "requirements", title: "Requirements Gathering", href: "/system-design/requirements" },
          { id: "capacity", title: "Capacity Estimation", href: "/system-design/capacity" },
        ]
      },
      {
        id: "core-concepts",
        title: "Core Concepts",
        icon: Layers,
        items: [
          { id: "client-server", title: "Client-Server", href: "/system-design/client-server" },
          { id: "microservices", title: "Monolith vs Microservices", href: "/system-design/microservices" },
          { id: "apis", title: "REST vs gRPC", href: "/system-design/apis" },
        ]
      },
      {
        id: "scalability",
        title: "Scalability",
        icon: Activity,
        items: [
          { id: "scaling", title: "Vertical vs Horizontal", href: "/system-design/scaling" },
          { id: "load-balancing", title: "Load Balancing", href: "/system-design/load-balancing" },
          { id: "caching", title: "Caching", href: "/system-design/caching" },
          { id: "cdn", title: "CDN", href: "/system-design/cdn" },
        ]
      },
      {
        id: "databases",
        title: "Databases",
        icon: Database,
        items: [
          { id: "sql-nosql", title: "SQL vs NoSQL", href: "/system-design/sql-nosql" },
          { id: "replication", title: "Replication & Sharding", href: "/system-design/replication" },
        ]
      },
      {
        id: "messaging",
        title: "Messaging",
        icon: Network,
        items: [
          { id: "queues", title: "Message Queues", href: "/system-design/queues" },
          { id: "pub-sub", title: "Pub-Sub", href: "/system-design/pub-sub" },
        ]
      },
      {
        id: "challenges",
        title: "Gamified Challenges",
        icon: Zap,
        items: [
          { id: "architect-challenge", title: "System Architect Challenge", href: "/system-design/challenge" },
        ]
      }
    ]
  },
  {
    id: "data-structures",
    title: "Data Structures",
    categories: [
      {
        id: "arrays-strings",
        title: "Arrays & Strings",
        icon: Code,
        items: [
          { id: "arrays", title: "Static vs Dynamic", href: "/data-structures/arrays" },
          { id: "two-pointers", title: "Two Pointers", href: "/data-structures/two-pointers" },
        ]
      },
      {
        id: "linked-lists",
        title: "Linked Lists",
        icon: List,
        items: [
          { id: "singly-doubly", title: "Singly vs Doubly", href: "/data-structures/singly-doubly" },
          { id: "fast-slow", title: "Fast & Slow Pointers", href: "/data-structures/fast-slow" },
        ]
      },
      {
        id: "hashing",
        title: "Hashing",
        icon: Hash,
        items: [
          { id: "hash-tables", title: "Hash Tables", href: "/data-structures/hash-tables" },
        ]
      },
      {
        id: "trees",
        title: "Trees",
        icon: GitBranch,
        items: [
          { id: "bst", title: "Binary Search Tree", href: "/data-structures/bst" },
          { id: "traversals", title: "Tree Traversals", href: "/data-structures/traversals" },
        ]
      },
      {
        id: "graphs",
        title: "Graphs",
        icon: Network,
        items: [
          { id: "bfs-dfs", title: "BFS vs. DFS", href: "/data-structures/bfs-dfs" },
        ]
      },
      {
        id: "ds-challenges",
        title: "Gamified Challenges",
        icon: Zap,
        items: [
          { id: "algorithm-arena", title: "Algorithm Arena", href: "/data-structures/challenge" },
        ]
      }
    ]
  }
];
