import {
  LucideIcon,
  Server,
  Database,
  Activity,
  Network,
  Layers,
  Code,
  GitBranch,
  List,
  Hash,
  Zap,
  BookOpen,
  Boxes,
  Workflow,
  BrainCircuit,
  Braces,
  Cpu,
  Package,
} from "lucide-react";

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
        title: "Exercises",
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
      /*
      {
        id: "hashing",
        title: "Hashing",
        icon: Hash,
        items: [
          { id: "hash-tables", title: "Hash Tables", href: "/data-structures/hash-tables" },
        ]
      },
      */
      {
        id: "trees",
        title: "Trees",
        icon: GitBranch,
        items: [
          { id: "bst", title: "Binary Search Tree", href: "/data-structures/bst" },
          { id: "traversals", title: "Tree Traversals", href: "/data-structures/traversals" },
        ]
      },
      /*
      {
        id: "graphs",
        title: "Graphs",
        icon: Network,
        items: [
          { id: "bfs-dfs", title: "BFS vs. DFS", href: "/data-structures/bfs-dfs" },
        ]
      },
      */
      {
        id: "ds-challenges",
        title: "Exercises",
        icon: Zap,
        items: [
          { id: "algorithm-arena", title: "Linked List Connector", href: "/data-structures/challenge" },
        ]
      }
    ]
  },
  /* 
  {
    id: "programming-languages",
    title: "Programming Languages",
    categories: [
      {
        id: "introduction",
        title: "M0 · Introduction",
        icon: BookOpen,
        items: [
          { id: "language-evaluation", title: "Language Evaluation Criteria", href: "/programming-languages/language-evaluation" },
          { id: "syntax-semantics", title: "Syntax vs Semantics", href: "/programming-languages/syntax-semantics" },
        ]
      },
      {
        id: "variables-types",
        title: "M1 · Variables & Types",
        icon: Boxes,
        items: [
          { id: "variable-attributes", title: "Attributes of a Variable", href: "/programming-languages/variable-attributes" },
          { id: "scope-lifetime", title: "Scope and Lifetime", href: "/programming-languages/scope-lifetime" },
          { id: "static-dynamic-types", title: "Static vs Dynamic Types", href: "/programming-languages/static-dynamic-types" },
          { id: "primitive-aggregate-types", title: "Primitive vs Aggregate Data Types", href: "/programming-languages/primitive-aggregate-types" },
        ]
      },
      {
        id: "control-structures",
        title: "M2 · Control Structures",
        icon: Workflow,
        items: [
          { id: "expressions-precedence", title: "Expressions, Precedence, and Association", href: "/programming-languages/expressions-precedence" },
          { id: "assignment-statements", title: "Assignment Statements", href: "/programming-languages/assignment-statements" },
          { id: "selection-statements", title: "Selection Statements", href: "/programming-languages/selection-statements" },
          { id: "iterative-statements", title: "Iterative Statements", href: "/programming-languages/iterative-statements" },
        ]
      },
      {
        id: "subprograms",
        title: "M3 · Subprograms",
        icon: Code,
        items: [
          { id: "procedures-functions", title: "Procedures vs Functions", href: "/programming-languages/procedures-functions" },
          { id: "parameter-passing", title: "Parameter-Passing Methods", href: "/programming-languages/parameter-passing" },
          { id: "local-referencing", title: "Local Referencing", href: "/programming-languages/local-referencing" },
          { id: "calls-returns", title: "Calls and Returns", href: "/programming-languages/calls-returns" },
        ]
      },
      {
        id: "oop",
        title: "M4 · Object-Oriented Programming",
        icon: Package,
        items: [
          { id: "data-abstraction", title: "Data Abstraction", href: "/programming-languages/data-abstraction" },
          { id: "object-allocation", title: "Object Allocation and Deallocation", href: "/programming-languages/object-allocation" },
          { id: "inheritance-polymorphism", title: "Inheritance and Polymorphism", href: "/programming-languages/inheritance-polymorphism" },
          { id: "dynamic-binding", title: "Dynamic Method Binding", href: "/programming-languages/dynamic-binding" },
        ]
      },
      {
        id: "logic-programming",
        title: "M5 · Logic Programming",
        icon: BrainCircuit,
        items: [
          { id: "predicate-calculus", title: "Predicate Calculus", href: "/programming-languages/predicate-calculus" },
          { id: "rules-goals", title: "Rules and Goal Statements", href: "/programming-languages/rules-goals" },
          { id: "inferencing-process", title: "The Inferencing Process", href: "/programming-languages/inferencing-process" },
        ]
      },
      {
        id: "compiler-design",
        title: "M6 · Compiler Design",
        icon: Braces,
        items: [
          { id: "formal-syntax", title: "Formal Syntax and Analysis", href: "/programming-languages/formal-syntax" },
          { id: "attribute-grammars", title: "Attribute Grammars", href: "/programming-languages/attribute-grammars" },
          { id: "translation-pipeline", title: "The Language Translation Pipeline", href: "/programming-languages/translation-pipeline" },
          { id: "lexical-analysis", title: "Lexical Analysis", href: "/programming-languages/lexical-analysis" },
        ]
      },
      {
        id: "concurrency",
        title: "M7 · Concurrency",
        icon: Cpu,
        items: [
          { id: "shared-memory", title: "Shared Memory Architectures", href: "/programming-languages/shared-memory" },
          { id: "data-race-synchronization", title: "Data Race and Synchronization", href: "/programming-languages/data-race-synchronization" },
          { id: "work-sharing-scheduling", title: "Work Sharing and Scheduling", href: "/programming-languages/work-sharing-scheduling" },
        ]
      }
    ]
  }
  */
];
