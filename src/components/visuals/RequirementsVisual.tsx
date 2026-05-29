"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  RotateCcw, AlertTriangle, Info, CheckCircle2,
  ChevronLeft, ChevronRight, Target, X, Trophy, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeId =
  | "client" | "cdn" | "load_balancer" | "app_server"
  | "cache" | "database" | "read_replica" | "object_storage"
  | "message_queue" | "search_engine";

interface ArchNodeDef {
  label: string;
  x: number;
  y: number;
  always?: boolean;
  color: string;
  tooltip?: string;
  triggeredBy?: string[];
}

interface Req {
  id: string;
  label: string;
  category: "functional" | "nonFunctional" | "outOfScope";
  architectureImpact: NodeId[];
  warning?: string;
  latencyDelta?: number;
  availabilityDelta?: number;
  costDelta?: number;
  complexityDelta?: number;
}

interface Product {
  id: string;
  label: string;
  users: string;
  traffic: string;
  useCase: string;
  defaultReqs: string[];
}

interface Challenge {
  id: string;
  label: string;
  description: string;
  check: (nodes: Set<NodeId>, m: Metrics) => boolean;
}

interface Metrics {
  latency: number;
  availability: number;
  cost: number;
  complexity: number;
}

interface SolutionStepDef {
  title: string;
  why: string;
  reqs: string[];
  nodes: NodeId[];
  tradeoff: string;
}

interface ProductSolution {
  recommendedReqs: string[];
  systemType: string;
  steps: SolutionStepDef[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  {
    id: "youtube",
    label: "YouTube",
    users: "2B+ users",
    traffic: "Read-heavy, large payloads",
    useCase: "Massive video streaming with global delivery needs.",
    defaultReqs: ["watch_stream", "upload_media", "search", "low_latency", "global_delivery", "high_availability"],
  },
  {
    id: "instagram",
    label: "Instagram",
    users: "500M DAU",
    traffic: "Read-heavy + media uploads",
    useCase: "Photo & short-video sharing at social scale.",
    defaultReqs: ["upload_media", "user_feed", "notifications", "low_latency", "high_availability", "scalability"],
  },
  {
    id: "uber",
    label: "Uber",
    users: "137M DAU",
    traffic: "Write-heavy, real-time",
    useCase: "Real-time ride matching with live GPS tracking.",
    defaultReqs: ["real_time", "messaging", "notifications", "low_latency", "fault_tolerance", "strong_consistency"],
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    users: "2B+ users",
    traffic: "Write-heavy messaging",
    useCase: "High-volume real-time messaging at global scale.",
    defaultReqs: ["messaging", "notifications", "upload_media", "real_time", "strong_consistency", "high_availability"],
  },
  {
    id: "twitter",
    label: "Twitter / X",
    users: "350M DAU",
    traffic: "Read-heavy, spiky",
    useCase: "Social feed with trending topics and real-time events.",
    defaultReqs: ["user_feed", "search", "notifications", "low_latency", "scalability", "high_availability"],
  },
];

const REQS: Req[] = [
  // Functional
  { id: "upload_media",  label: "Upload videos / photos",   category: "functional",    architectureImpact: ["object_storage", "message_queue"], costDelta: 15, complexityDelta: 1 },
  { id: "watch_stream",  label: "Watch / stream content",   category: "functional",    architectureImpact: ["cdn", "cache"],                    latencyDelta: -60, costDelta: 18 },
  { id: "search",        label: "Search content",           category: "functional",    architectureImpact: ["search_engine"],                   costDelta: 10, complexityDelta: 1 },
  { id: "messaging",     label: "Messaging / DMs",          category: "functional",    architectureImpact: ["message_queue"],                   costDelta: 8, complexityDelta: 1 },
  { id: "notifications", label: "Push notifications",       category: "functional",    architectureImpact: ["message_queue"],                   costDelta: 5 },
  { id: "user_feed",     label: "Personalised feed",        category: "functional",    architectureImpact: ["cache", "read_replica"],            latencyDelta: -25, costDelta: 12 },
  { id: "real_time",     label: "Real-time updates",        category: "functional",    architectureImpact: ["message_queue"],                   costDelta: 10, complexityDelta: 1 },
  // Non-Functional
  { id: "high_availability", label: "High Availability (99.9%+)", category: "nonFunctional", architectureImpact: ["load_balancer", "read_replica"], availabilityDelta: 2.5, costDelta: 25, complexityDelta: 1 },
  { id: "low_latency",   label: "Low Latency (< 100ms)",    category: "nonFunctional", architectureImpact: ["cdn", "cache"],                    latencyDelta: -70, costDelta: 18 },
  { id: "scalability",   label: "Global Scale",             category: "nonFunctional", architectureImpact: ["load_balancer", "read_replica", "cdn"], costDelta: 35, complexityDelta: 2 },
  {
    id: "strong_consistency", label: "Strong Consistency",  category: "nonFunctional", architectureImpact: [],
    latencyDelta: 60, availabilityDelta: -1, complexityDelta: 2,
    warning: "Strong consistency increases write latency and limits availability under network partitions (CAP theorem).",
  },
  { id: "fault_tolerance", label: "Fault Tolerance",       category: "nonFunctional", architectureImpact: ["load_balancer", "read_replica"],    availabilityDelta: 1.5, costDelta: 20, complexityDelta: 1 },
  { id: "global_delivery", label: "Global Delivery",       category: "nonFunctional", architectureImpact: ["cdn"],                             latencyDelta: -55, costDelta: 28 },
  // Out of scope
  { id: "ai_recs",       label: "AI Recommendations",      category: "outOfScope",    architectureImpact: [] },
  { id: "monetization",  label: "Ads / Monetisation",      category: "outOfScope",    architectureImpact: [] },
  { id: "analytics",     label: "Analytics Platform",      category: "outOfScope",    architectureImpact: [] },
  { id: "billing",       label: "Billing System",          category: "outOfScope",    architectureImpact: [] },
];

const NW = 112;
const NH = 36;

const NODES: Record<NodeId, ArchNodeDef> = {
  client:         { label: "Client",         x: 30,  y: 192, always: true,  color: "#475569" },
  cdn:            { label: "CDN",            x: 185, y: 52,  color: "#b45309", tooltip: "Caches content at global edge nodes — cuts latency for distant users by serving from the nearest region.", triggeredBy: ["watch_stream", "low_latency", "scalability", "global_delivery"] },
  load_balancer:  { label: "Load Balancer",  x: 295, y: 192, color: "#4338ca", tooltip: "Distributes incoming traffic across multiple server instances — enables horizontal scaling and failover.", triggeredBy: ["high_availability", "scalability", "fault_tolerance"] },
  app_server:     { label: "App Server",     x: 450, y: 192, always: true,  color: "#1e293b" },
  cache:          { label: "Cache (Redis)",  x: 450, y: 58,  color: "#b91c1c", tooltip: "Stores hot data in memory — reads served 10× faster than hitting the database.", triggeredBy: ["watch_stream", "low_latency", "user_feed"] },
  database:       { label: "Database",       x: 614, y: 192, always: true,  color: "#1e293b" },
  read_replica:   { label: "Read Replica",   x: 614, y: 322, color: "#047857", tooltip: "A copy of the primary DB that handles read traffic — offloads query pressure from the main node.", triggeredBy: ["high_availability", "scalability", "fault_tolerance", "user_feed"] },
  object_storage: { label: "Object Storage", x: 614, y: 58,  color: "#6d28d9", tooltip: "Stores large files (videos, images) cheaply at massive scale — e.g. S3, GCS.", triggeredBy: ["upload_media"] },
  message_queue:  { label: "Msg Queue",      x: 450, y: 340, color: "#c2410c", tooltip: "Async buffer between services — decouples producers from consumers and absorbs traffic bursts.", triggeredBy: ["messaging", "notifications", "upload_media", "real_time"] },
  search_engine:  { label: "Search Engine",  x: 295, y: 340, color: "#0e7490", tooltip: "Full-text index (e.g. Elasticsearch) for fast content discovery outside the main database.", triggeredBy: ["search"] },
};

const CHALLENGES: Challenge[] = [
  {
    id: "c1",
    label: "< 120ms at global scale",
    description: "Add CDN + cache so response time drops below 120ms.",
    check: (nodes, m) => m.latency <= 120 && nodes.has("cdn"),
  },
  {
    id: "c2",
    label: "99.9%+ availability",
    description: "Reach 99.9% availability with at least a read replica.",
    check: (nodes, m) => m.availability >= 99.9 && nodes.has("read_replica"),
  },
  {
    id: "c3",
    label: "Media upload pipeline",
    description: "Upload files without blocking the app server (object storage + queue).",
    check: (nodes) => nodes.has("object_storage") && nodes.has("message_queue"),
  },
];

// ─── Solution Data ─────────────────────────────────────────────────────────────

const PRODUCT_SOLUTIONS: Record<string, ProductSolution> = {
  youtube: {
    recommendedReqs: ["watch_stream", "upload_media", "search", "low_latency", "global_delivery", "high_availability", "scalability"],
    systemType: "Read-heavy · global · large media payloads",
    steps: [
      {
        title: "Step 1 — Define core features",
        why: "Start every system design by nailing the must-have functionality. YouTube needs video upload, streaming, and search. Without these three, the product doesn't exist. Object storage separates large media from the relational database — keeping DB queries fast.",
        reqs: ["watch_stream", "upload_media", "search"],
        nodes: ["client", "app_server", "database", "object_storage"],
        tradeoff: "Object storage (S3-like) separates large media files from the DB — keeping queries fast and avoiding massive row sizes.",
      },
      {
        title: "Step 2 — Optimize for global delivery",
        why: "YouTube's 2B users are worldwide. Without a CDN, a user in Tokyo hitting a US origin server adds 200–300ms of latency. CDN edge caches serve video and static content from the nearest geographic node. Cache in Redis handles repeated API calls (trending videos, home feed).",
        reqs: ["watch_stream", "upload_media", "search", "global_delivery", "low_latency"],
        nodes: ["client", "cdn", "app_server", "cache", "database", "object_storage"],
        tradeoff: "CDN reduces read latency 40–60% but introduces cache invalidation complexity. Stale content may linger at edges after an update.",
      },
      {
        title: "Step 3 — Ensure high availability",
        why: "99.9% uptime means at most 8.7 hours of downtime per year. A single app server is a single point of failure. A load balancer distributes traffic across multiple instances, and read replicas handle read queries so the primary database isn't a bottleneck.",
        reqs: ["watch_stream", "upload_media", "search", "global_delivery", "low_latency", "high_availability", "fault_tolerance"],
        nodes: ["client", "cdn", "load_balancer", "app_server", "cache", "database", "read_replica", "object_storage"],
        tradeoff: "More infrastructure = more operational overhead. This is the reliability vs simplicity tradeoff every team faces.",
      },
      {
        title: "Step 4 — Decouple the upload pipeline",
        why: "A video upload can take minutes for large files. Blocking the app server during that entire time degrades all other users. A message queue lets the server accept the upload, acknowledge immediately, and process (transcode, index) asynchronously in the background.",
        reqs: ["watch_stream", "upload_media", "search", "global_delivery", "low_latency", "high_availability", "fault_tolerance", "scalability"],
        nodes: ["client", "cdn", "load_balancer", "app_server", "cache", "database", "read_replica", "object_storage", "message_queue"],
        tradeoff: "Async processing introduces eventual consistency — uploaded videos aren't immediately searchable. Typically 10–60s delay, which YouTube users accept.",
      },
      {
        title: "Step 5 — Add dedicated search",
        why: "Full-text search on the main database causes slow queries and table locks at scale. Elasticsearch maintains an inverted index that answers text queries 10–100× faster. It syncs from the primary DB asynchronously.",
        reqs: ["watch_stream", "upload_media", "search", "global_delivery", "low_latency", "high_availability", "fault_tolerance", "scalability"],
        nodes: ["client", "cdn", "load_balancer", "app_server", "cache", "database", "read_replica", "object_storage", "message_queue", "search_engine"],
        tradeoff: "Search index lags the primary DB by seconds — eventual consistency. New uploads appear in search results with a short delay.",
      },
    ],
  },
  instagram: {
    recommendedReqs: ["upload_media", "user_feed", "notifications", "low_latency", "high_availability", "scalability"],
    systemType: "Read-heavy · social graph · media-first",
    steps: [
      {
        title: "Step 1 — Core: upload and read",
        why: "Instagram at its core is photo sharing + social feed. Uploads need object storage from day one — storing images in a relational DB would be prohibitively expensive and slow. The DB stores metadata (captions, likes, follow relationships).",
        reqs: ["upload_media", "user_feed"],
        nodes: ["client", "app_server", "database", "object_storage"],
        tradeoff: "Object storage is essential from day one — but you now manage two stores (DB for metadata, object store for media).",
      },
      {
        title: "Step 2 — Cache the feed (read-heavy)",
        why: "Instagram is roughly 80% reads. Users scroll their feed constantly. Hitting the database for every feed request at 500M DAU requires massive DB capacity. Pre-computed feeds cached in Redis serve reads at memory speed. Read replicas handle the overflow.",
        reqs: ["upload_media", "user_feed", "low_latency"],
        nodes: ["client", "app_server", "cache", "database", "object_storage", "read_replica"],
        tradeoff: "Cached feeds go stale — a new post may take seconds to appear in followers' feeds. Acceptable for Instagram's eventual-consistency model.",
      },
      {
        title: "Step 3 — Fan-out notifications",
        why: "When a celebrity with 10M followers posts, notifying all followers can't block the write operation. A message queue fans out notifications asynchronously — the post succeeds immediately, notifications arrive seconds later.",
        reqs: ["upload_media", "user_feed", "notifications", "low_latency"],
        nodes: ["client", "app_server", "cache", "database", "read_replica", "object_storage", "message_queue"],
        tradeoff: "Fan-out on write is expensive for accounts with millions of followers. Instagram actually uses fan-out on read for celebrities to avoid queue overload.",
      },
      {
        title: "Step 4 — CDN for media delivery",
        why: "Images and Reels are large files. Serving them from the origin server for every user globally wastes bandwidth and adds latency. CDN caches static media at edge nodes closest to each user, cutting load time by 50–80%.",
        reqs: ["upload_media", "user_feed", "notifications", "low_latency", "scalability"],
        nodes: ["client", "cdn", "app_server", "cache", "database", "read_replica", "object_storage", "message_queue"],
        tradeoff: "CDN reduces origin bandwidth cost but requires a cache invalidation strategy when users update their profile photo or delete posts.",
      },
      {
        title: "Step 5 — Load balancer for availability",
        why: "At 500M DAU, every minute of downtime costs millions. A load balancer enables multi-instance deployment so one server failure doesn't bring down the platform. This is where Instagram's architecture matches the scale requirement.",
        reqs: ["upload_media", "user_feed", "notifications", "low_latency", "high_availability", "scalability"],
        nodes: ["client", "cdn", "load_balancer", "app_server", "cache", "database", "read_replica", "object_storage", "message_queue"],
        tradeoff: "Multi-AZ redundancy typically costs 2–3× more infrastructure. Justified at this scale — the revenue loss from downtime far exceeds the extra cost.",
      },
    ],
  },
  uber: {
    recommendedReqs: ["real_time", "messaging", "notifications", "low_latency", "fault_tolerance", "strong_consistency"],
    systemType: "Write-heavy · real-time · consistency-critical",
    steps: [
      {
        title: "Step 1 — Real-time matching core",
        why: "Uber's core operation is matching riders to drivers. Drivers update GPS every 3–5 seconds, and the app server runs the matching algorithm continuously. This is write-heavy — millions of location updates per second at peak.",
        reqs: ["real_time"],
        nodes: ["client", "app_server", "database"],
        tradeoff: "Write-heavy systems stress the database far more than read-heavy ones. Plan for write scaling (partitioning, async queuing) early.",
      },
      {
        title: "Step 2 — Queue the location stream",
        why: "Millions of GPS updates per second can't all hit the DB directly — the DB would immediately become the bottleneck. A message queue absorbs the burst, smooths the write rate, and decouples location ingestion from downstream processing (matching, ETAs).",
        reqs: ["real_time", "notifications"],
        nodes: ["client", "app_server", "database", "message_queue"],
        tradeoff: "The queue adds ~100ms to location update processing. Acceptable for ride matching — a 100ms delay in location is imperceptible to riders.",
      },
      {
        title: "Step 3 — Cache active ride state",
        why: "Active ride status (driver location, ETA, ride phase) is read thousands of times per minute by the rider app. Fetching from DB on every refresh is expensive. Cache stores this hot, volatile state in memory for instant reads.",
        reqs: ["real_time", "notifications", "low_latency"],
        nodes: ["client", "app_server", "cache", "database", "message_queue"],
        tradeoff: "Cache is eventually consistent — if invalidation is delayed, a rider might briefly see a stale ETA. Cache TTL of 5–10s is the standard Uber tradeoff.",
      },
      {
        title: "Step 4 — Fault tolerance",
        why: "A single server failure during peak hours means riders can't find drivers. Load balancer + read replicas ensure the platform stays up even when individual components fail. Multiple AZs protect against datacenter-level failures.",
        reqs: ["real_time", "notifications", "low_latency", "fault_tolerance"],
        nodes: ["client", "load_balancer", "app_server", "cache", "database", "read_replica", "message_queue"],
        tradeoff: "Read replicas require replication lag to be managed. Strong consistency across replicas adds write latency — Uber tolerates some replication lag for location data.",
      },
      {
        title: "Step 5 — Strong consistency for payments",
        why: "Ride completion, payment, and driver payout must be exactly-once and consistent. Double charges or missing payouts are legal liabilities. Uber accepts higher write latency for payment transactions to guarantee correctness.",
        reqs: ["real_time", "messaging", "notifications", "low_latency", "fault_tolerance", "strong_consistency"],
        nodes: ["client", "load_balancer", "app_server", "cache", "database", "read_replica", "message_queue"],
        tradeoff: "Strong consistency via distributed transactions adds 50–200ms write latency. This is the CAP theorem in practice: Uber chooses consistency over availability for payments.",
      },
    ],
  },
  whatsapp: {
    recommendedReqs: ["messaging", "notifications", "upload_media", "real_time", "strong_consistency", "high_availability"],
    systemType: "Write-heavy · real-time messaging · consistency-critical",
    steps: [
      {
        title: "Step 1 — Message delivery core",
        why: "WhatsApp's single job: a message from sender reaches recipient reliably and in order. The core is a message store (database) + delivery service (app server). Every other component exists to make this more reliable or scalable.",
        reqs: ["messaging"],
        nodes: ["client", "app_server", "database"],
        tradeoff: "Message storage is append-heavy. Standard SQL DBs work but Cassandra or key-value stores scale this pattern more naturally at WhatsApp's volume.",
      },
      {
        title: "Step 2 — Async delivery via queue",
        why: "Recipients are frequently offline. A message queue holds messages until the recipient reconnects. The queue also buffers message storms during viral chains or peak usage — preventing the DB from being overwhelmed.",
        reqs: ["messaging", "real_time"],
        nodes: ["client", "app_server", "database", "message_queue"],
        tradeoff: "Queue guarantees at-least-once delivery. Deduplication logic in the app layer prevents the same message appearing twice.",
      },
      {
        title: "Step 3 — Media files via object storage",
        why: "Photos and videos can't live in the message database — they're too large (MBs vs bytes for text). Object storage handles binary files cheaply at scale. Metadata (file reference, caption) stays in the DB; the actual bytes go to S3-equivalent storage.",
        reqs: ["messaging", "real_time", "upload_media"],
        nodes: ["client", "app_server", "database", "message_queue", "object_storage"],
        tradeoff: "Media stored separately from messages means two-phase coordination: metadata write must succeed alongside media upload. Failure handling is more complex.",
      },
      {
        title: "Step 4 — Presence and read receipts",
        why: "Online/offline status and read receipts change constantly (millions of updates/second). Querying the DB for every presence check at 2B users is impossible. Cache stores these ephemeral states in memory with short TTLs.",
        reqs: ["messaging", "real_time", "upload_media", "notifications"],
        nodes: ["client", "app_server", "cache", "database", "message_queue", "object_storage"],
        tradeoff: "Presence data is volatile — a cache node crash briefly shows users as online/offline incorrectly. This is accepted: presence is best-effort, not critical-path.",
      },
      {
        title: "Step 5 — HA + strong consistency",
        why: "Messages must arrive exactly once, in order, even under failures. Load balancer + read replicas provide high availability. Strong consistency ensures delivery guarantees: if WhatsApp says delivered, it is delivered.",
        reqs: ["messaging", "notifications", "upload_media", "real_time", "strong_consistency", "high_availability"],
        nodes: ["client", "load_balancer", "app_server", "cache", "database", "read_replica", "message_queue", "object_storage"],
        tradeoff: "Strong consistency + HA is expensive. WhatsApp ran on remarkably few servers by using Erlang (BEAM VM) and a custom XMPP protocol optimized for this exact workload.",
      },
    ],
  },
  twitter: {
    recommendedReqs: ["user_feed", "search", "notifications", "low_latency", "scalability", "high_availability"],
    systemType: "Read-heavy · spiky · massive fan-out",
    steps: [
      {
        title: "Step 1 — Tweet + timeline core",
        why: "Twitter's core is writing tweets and reading timelines. The immediate challenge: 1 tweet from a 100M-follower account must reach 100M feeds. The naive approach (query DB for all following relationships on every timeline load) doesn't scale — it's O(followers) per read.",
        reqs: ["user_feed"],
        nodes: ["client", "app_server", "database"],
        tradeoff: "Twitter's hardest problem is fan-out. The DB approach is too slow; pre-computed timelines are fast but expensive for write-heavy celebrity accounts.",
      },
      {
        title: "Step 2 — Pre-computed timeline cache",
        why: "Twitter is ~100× more reads than writes. Every timeline refresh would hit the DB without cache. Pre-compute and cache each user's timeline in Redis. When someone tweets, fan out to all followers' cached timelines immediately.",
        reqs: ["user_feed", "low_latency"],
        nodes: ["client", "app_server", "cache", "database", "read_replica"],
        tradeoff: "Pre-computed fan-out means 1 tweet triggers N cache writes (N = follower count). For celebrities with 100M followers, this is expensive — Twitter uses hybrid fan-out for them.",
      },
      {
        title: "Step 3 — Dedicated search index",
        why: "Twitter is used as a real-time search engine for events. Full-text search on the main DB cannot handle the volume. Elasticsearch ingests tweets in near-real-time and serves search queries from an inverted index.",
        reqs: ["user_feed", "low_latency", "search"],
        nodes: ["client", "app_server", "cache", "database", "read_replica", "search_engine"],
        tradeoff: "Search index lags behind real tweets by seconds — acceptable for trending topics. Breaking news tweets appear in search within 5–30 seconds.",
      },
      {
        title: "Step 4 — Scale globally with CDN + LB",
        why: "Breaking news spikes Twitter traffic 10–50× in seconds. CDN absorbs static asset requests and initial bursts. Load balancer distributes app-tier traffic across horizontally-scaled, stateless instances. This is Twitter's 'fail whale' problem solved.",
        reqs: ["user_feed", "low_latency", "search", "scalability"],
        nodes: ["client", "cdn", "load_balancer", "app_server", "cache", "database", "read_replica", "search_engine"],
        tradeoff: "Stateless app servers require external session storage (Redis). Every horizontal scale-out decision must account for session and state externalization.",
      },
      {
        title: "Step 5 — Notification pipeline",
        why: "Notifying followers when you tweet can't block the tweet write operation. Message queue fans out like/retweet/reply notifications asynchronously — the tweet succeeds instantly, notifications flow through the queue to each recipient.",
        reqs: ["user_feed", "search", "notifications", "low_latency", "scalability", "high_availability"],
        nodes: ["client", "cdn", "load_balancer", "app_server", "cache", "database", "read_replica", "search_engine", "message_queue"],
        tradeoff: "Notification delivery is eventually consistent — some followers get notified seconds to minutes later. Acceptable for a social platform.",
      },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeActiveNodes(selected: Set<string>): Set<NodeId> {
  const active = new Set<NodeId>(["client", "app_server", "database"]);
  for (const [id, def] of Object.entries(NODES) as Array<[NodeId, ArchNodeDef]>) {
    if (def.always) continue;
    if (def.triggeredBy?.some(r => selected.has(r))) active.add(id as NodeId);
  }
  return active;
}

function computeEdges(active: Set<NodeId>): Array<[NodeId, NodeId]> {
  const edges: Array<[NodeId, NodeId]> = [];
  const lb  = active.has("load_balancer");
  const cdn = active.has("cdn");

  if (cdn) edges.push(["client", "cdn"]);
  if (lb) {
    edges.push(cdn ? ["cdn", "load_balancer"] : ["client", "load_balancer"]);
    edges.push(["load_balancer", "app_server"]);
  } else {
    edges.push(cdn ? ["cdn", "app_server"] : ["client", "app_server"]);
  }
  edges.push(["app_server", "database"]);
  if (active.has("cache"))          edges.push(["app_server", "cache"]);
  if (active.has("message_queue"))  edges.push(["app_server", "message_queue"]);
  if (active.has("object_storage")) edges.push(["app_server", "object_storage"]);
  if (active.has("search_engine"))  edges.push(["app_server", "search_engine"]);
  if (active.has("read_replica"))   edges.push(["database", "read_replica"]);
  return edges;
}

function computeMetrics(selected: Set<string>): Metrics {
  let latency = 200, availability = 95, cost = 50, complexity = 1;
  for (const r of REQS) {
    if (!selected.has(r.id)) continue;
    latency      += r.latencyDelta      ?? 0;
    availability += r.availabilityDelta ?? 0;
    cost         += r.costDelta         ?? 0;
    complexity   += r.complexityDelta   ?? 0;
  }
  return {
    latency:      Math.max(20, latency),
    availability: Math.min(99.95, availability),
    cost,
    complexity:   Math.min(10, complexity),
  };
}

function computeInsights(selected: Set<string>, active: Set<NodeId>): string[] {
  const out: string[] = [];
  if (active.has("cdn"))           out.push("CDN introduced — static content cached at edge nodes. Latency drops for distant users.");
  if (active.has("cache"))         out.push("Redis cache added — repeated reads skip the database entirely, cutting response time.");
  if (active.has("load_balancer")) out.push("Load Balancer in place — traffic spreads across instances, single points of failure removed.");
  if (active.has("read_replica"))  out.push("Read Replica added — read queries routed away from the primary, increasing read throughput.");
  if (active.has("message_queue")) out.push("Message Queue inserted — producers and consumers decouple; bursts buffer instead of dropping.");
  if (active.has("object_storage"))out.push("Object Storage added — large files stored outside the database, keeping DB lean.");
  if (active.has("search_engine")) out.push("Search Engine added — full-text queries handled by a dedicated index, not the primary DB.");
  return out;
}

function computeScore(selected: Set<string>, productId: string) {
  const solution = PRODUCT_SOLUTIONS[productId];
  if (!solution) return { scalability: 5, reliability: 5, performance: 5, simplicity: 5 };

  const recommended = new Set(solution.recommendedReqs);
  let covered = 0;
  for (const r of recommended) { if (selected.has(r)) covered++; }
  const coverage = covered / recommended.size;

  const relevant = REQS.filter(r => r.category !== "outOfScope").map(r => r.id);
  const extras = relevant.filter(id => selected.has(id) && !recommended.has(id)).length;

  const hasHA    = selected.has("high_availability") || selected.has("fault_tolerance");
  const hasPerf  = selected.has("low_latency") || selected.has("global_delivery") || selected.has("watch_stream") || selected.has("user_feed");
  const hasScale = selected.has("scalability") || selected.has("high_availability");

  const scalability = Math.round(Math.min(10, coverage * 6 + (hasScale ? 2 : 0) + (extras === 0 ? 2 : 0)));
  const reliability = Math.round(Math.min(10, (hasHA ? 6 : 2) + (selected.has("fault_tolerance") ? 2 : 0) + (coverage > 0.75 ? 2 : 0)));
  const performance = Math.round(Math.min(10, (hasPerf ? 5 : 1) + (selected.has("global_delivery") || selected.has("low_latency") ? 3 : 0) + (coverage > 0.6 ? 2 : 0)));
  const simplicity  = Math.round(Math.max(1, 10 - extras * 2));

  return { scalability, reliability, performance, simplicity };
}

// ─── SVG sub-components ────────────────────────────────────────────────────────

function TrafficDot({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  const mx = x1 + (x2 - x1) * 0.5;
  const my = y1 + (y2 - y1) * 0.5;
  return (
    <motion.circle
      r={3}
      fill="#6366f1"
      fillOpacity={0.7}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, mx, x2], cy: [y1, my, y2], opacity: [0, 0.85, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, repeatDelay: delay, ease: "linear" }}
    />
  );
}

function ArchCanvas({
  activeNodes,
  newlyAdded,
  onTooltip,
}: {
  activeNodes: Set<NodeId>;
  newlyAdded: Set<NodeId>;
  onTooltip: (t: string | null) => void;
}) {
  const edges = useMemo(() => computeEdges(activeNodes), [activeNodes]);

  return (
    <svg viewBox="0 0 760 420" className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <pattern id="rq-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.8" fill="#cbd5e1" />
        </pattern>
      </defs>
      <rect width="760" height="420" fill="#f9f9f6" />
      <rect width="760" height="420" fill="url(#rq-dots)" />

      <AnimatePresence>
        {edges.map(([a, b]) => {
          const na = NODES[a], nb = NODES[b];
          const x1 = na.x + NW / 2, y1 = na.y + NH / 2;
          const x2 = nb.x + NW / 2, y2 = nb.y + NH / 2;
          return (
            <motion.line
              key={`e-${a}-${b}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {edges.map(([a, b], i) => {
          const na = NODES[a], nb = NODES[b];
          return (
            <TrafficDot
              key={`td-${a}-${b}`}
              x1={na.x + NW / 2} y1={na.y + NH / 2}
              x2={nb.x + NW / 2} y2={nb.y + NH / 2}
              delay={i * 0.35}
            />
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {(Object.entries(NODES) as Array<[NodeId, ArchNodeDef]>).map(([id, def]) => {
          if (!activeNodes.has(id)) return null;
          const cx = def.x + NW / 2;
          const cy = def.y + NH / 2;
          const isNew = newlyAdded.has(id);
          return (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.55 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              onMouseEnter={() => def.tooltip && onTooltip(def.tooltip)}
              onMouseLeave={() => onTooltip(null)}
              className={def.tooltip ? "cursor-help" : ""}
            >
              {isNew && (
                <motion.rect
                  x={def.x - 6} y={def.y - 6}
                  width={NW + 12} height={NH + 12}
                  rx={12} ry={12}
                  fill="none" stroke={def.color} strokeWidth={2.5}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.25 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              )}
              <rect x={def.x} y={def.y} width={NW} height={NH} rx={7} ry={7} fill={def.color} />
              <text
                x={cx} y={cy + 0.5}
                textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={10.5} fontWeight={600}
                style={{ pointerEvents: "none", userSelect: "none", fontFamily: "inherit" }}
              >
                {def.label}
              </text>
              {def.tooltip && (
                <circle cx={def.x + NW - 7} cy={def.y + 7} r={4} fill="rgba(255,255,255,0.3)" />
              )}
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

// ─── Chip components ───────────────────────────────────────────────────────────

function ReqChip({
  req,
  selected,
  onToggle,
  accent,
}: {
  req: Req;
  selected: boolean;
  onToggle: () => void;
  accent: "sky" | "amber";
}) {
  const on  = accent === "sky"
    ? "bg-sky-50 border-sky-300 text-sky-900"
    : "bg-amber-50 border-amber-300 text-amber-900";
  const dot = accent === "sky" ? "bg-sky-500" : "bg-amber-500";
  const tag = accent === "sky" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700";
  const n   = req.architectureImpact.length;
  return (
    <motion.button
      layout
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
        selected ? on : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", selected ? dot : "bg-slate-300")} />
      <span className="flex-1 leading-snug">{req.label}</span>
      <AnimatePresence>
        {selected && n > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0", tag)}
          >
            +{n}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function OutOfScopeChip({ req, selected, onToggle }: { req: Req; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm transition-all text-left",
        selected
          ? "bg-slate-100 border-slate-200 text-slate-400"
          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className={cn("w-2 h-2 rounded-full shrink-0", selected ? "bg-slate-400" : "bg-slate-300")} />
      <span className={cn("flex-1", selected && "line-through")}>{req.label}</span>
      {selected && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Deferred</span>}
    </button>
  );
}

function MetricCard({ label, value, good, warn }: { label: string; value: string; good: boolean; warn: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "text-base font-bold tabular-nums leading-none",
          good ? "text-emerald-600" : warn ? "text-amber-600" : "text-red-500"
        )}
      >
        {value}
      </motion.p>
    </div>
  );
}

// ─── Solution UI components ────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "bg-emerald-400" : score >= 5 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-slate-600">{label}</span>
        <span className={cn("tabular-nums font-bold",
          score >= 8 ? "text-emerald-600" : score >= 5 ? "text-amber-600" : "text-red-500"
        )}>{score}/10</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function WalkthroughView({ productId }: { productId: string }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => { setStepIdx(0); }, [productId]);

  const solution = PRODUCT_SOLUTIONS[productId];
  if (!solution) return null;
  const { steps } = solution;
  const step = steps[stepIdx];

  const stepNodes = useMemo(() => new Set(step.nodes), [step]);
  const prevNodes = useMemo(
    () => stepIdx > 0 ? new Set(steps[stepIdx - 1].nodes) : new Set<NodeId>(),
    [stepIdx, steps]
  );
  const newlyAdded = useMemo(() => {
    const s = new Set<NodeId>();
    for (const n of stepNodes) { if (!prevNodes.has(n)) s.add(n); }
    return s;
  }, [stepNodes, prevNodes]);

  return (
    <div className="space-y-4">
      {/* Step progress */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <button key={i} onClick={() => setStepIdx(i)}
            className={cn("h-2 rounded-full transition-all",
              i === stepIdx ? "bg-slate-900 w-6" : i < stepIdx ? "bg-slate-400 w-2" : "bg-slate-200 w-2"
            )}
          />
        ))}
        <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {stepIdx + 1} / {steps.length}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-4">
        {/* Explanation */}
        <AnimatePresence mode="wait">
          <motion.div key={stepIdx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-sm font-bold text-slate-900">{step.title}</p>

            {/* Active reqs */}
            <div className="flex flex-wrap gap-1.5">
              {step.reqs.map(reqId => {
                const req = REQS.find(r => r.id === reqId);
                if (!req) return null;
                const isNew = stepIdx > 0 && !steps[stepIdx - 1].reqs.includes(reqId);
                return (
                  <span key={reqId}
                    className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border",
                      isNew
                        ? "bg-sky-100 border-sky-300 text-sky-800"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    )}>
                    {req.label}
                  </span>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {step.why}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span><strong>Tradeoff: </strong>{step.tradeoff}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mini canvas */}
        <div className="rounded-xl border border-slate-200 overflow-hidden" style={{ aspectRatio: "760/420" }}>
          <ArchCanvas activeNodes={stepNodes} newlyAdded={newlyAdded} onTooltip={() => {}} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setStepIdx(i => Math.max(0, i - 1))}
          disabled={stepIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {stepIdx === steps.length - 1 ? (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Walkthrough complete
          </div>
        ) : (
          <button
            onClick={() => setStepIdx(i => i + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function CompareView({ selected, productId }: { selected: Set<string>; productId: string }) {
  const solution = PRODUCT_SOLUTIONS[productId];
  if (!solution) return null;

  const recommended = new Set(solution.recommendedReqs);
  const scores = computeScore(selected, productId);
  const totalScore = Math.round((scores.scalability + scores.reliability + scores.performance + scores.simplicity) / 4);

  const missingReqs = solution.recommendedReqs
    .filter(id => !selected.has(id))
    .map(id => REQS.find(r => r.id === id))
    .filter((r): r is Req => r !== undefined);

  const extraReqs = [...selected]
    .filter(id => !recommended.has(id) && REQS.find(r => r.id === id && r.category !== "outOfScope"))
    .map(id => REQS.find(r => r.id === id))
    .filter((r): r is Req => r !== undefined);

  return (
    <div className="space-y-4">
      {/* Score grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Scalability", score: scores.scalability },
          { label: "Reliability", score: scores.reliability },
          { label: "Performance", score: scores.performance },
          { label: "Simplicity",  score: scores.simplicity  },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <div className="flex items-end gap-1">
              <span className={cn("text-2xl font-black tabular-nums leading-none",
                s.score >= 8 ? "text-emerald-600" : s.score >= 5 ? "text-amber-600" : "text-red-500"
              )}>{s.score}</span>
              <span className="text-xs text-slate-400 mb-0.5">/10</span>
            </div>
            <ScoreBar label="" score={s.score} />
          </div>
        ))}
      </div>

      {/* Missing */}
      {missingReqs.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Missing considerations</p>
          <div className="flex flex-wrap gap-2">
            {missingReqs.map(r => (
              <span key={r.id} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-100 border border-red-300 text-red-800">
                {r.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-red-600 leading-relaxed">
            These would materially change your architecture — adding them shifts the design toward the recommended solution.
          </p>
        </div>
      )}

      {/* Extra */}
      {extraReqs.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Potential overengineering</p>
          <div className="flex flex-wrap gap-2">
            {extraReqs.map(r => (
              <span key={r.id} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 border border-amber-300 text-amber-800">
                {r.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-600 leading-relaxed">
            These add cost and complexity beyond what&apos;s typical for {PRODUCTS.find(p => p.id === productId)?.label} at early scale.
          </p>
        </div>
      )}

      {/* Perfect match */}
      {missingReqs.length === 0 && extraReqs.length === 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-700">Perfect match!</p>
            <p className="text-xs text-emerald-600">Your requirements exactly match the recommended solution.</p>
          </div>
        </div>
      )}

      {/* Verdict */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <strong>System type:</strong> {solution.systemType}.{" "}
        {totalScore >= 8 && "Strong design — you've correctly identified the core tradeoffs."}
        {totalScore >= 6 && totalScore < 8 && "Good foundation. Add the missing requirements to round it out."}
        {totalScore < 6 && "Review the Walkthrough tab — the missing requirements represent significant gaps."}
      </div>
    </div>
  );
}

const INTERVIEW_EVENTS = [
  { at: 480, text: "Traffic just spiked 10×. Can your architecture handle it?", hint: "Consider: load balancer, horizontal scaling, caching layer" },
  { at: 300, text: "You're expanding globally. Latency from Europe is now 400ms.", hint: "Consider: CDN, global delivery requirement, edge caching" },
  { at: 120, text: "Compliance now requires strongly consistent writes.", hint: "Consider: strong consistency requirement and its latency tradeoff" },
];

function InterviewView({ selected, productId }: { selected: Set<string>; productId: string }) {
  const [started,  setStarted]  = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [events,   setEvents]   = useState<typeof INTERVIEW_EVENTS>([]);
  const [ended,    setEnded]    = useState(false);
  const seenRef    = useRef<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scores = computeScore(selected, productId);
  const totalScore = Math.round((scores.scalability + scores.reliability + scores.performance + scores.simplicity) / 4);
  const product = PRODUCTS.find(p => p.id === productId);

  const startInterview = () => {
    seenRef.current = new Set();
    setStarted(true);
    setTimeLeft(600);
    setEnded(false);
    setEvents([]);
  };

  useEffect(() => {
    if (!started || ended) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (next <= 0) {
          setEnded(true);
          clearInterval(intervalRef.current!);
          return 0;
        }
        for (const ev of INTERVIEW_EVENTS) {
          if (next === ev.at && !seenRef.current.has(ev.at)) {
            seenRef.current.add(ev.at);
            setEvents(es => [...es, ev]);
          }
        }
        return next;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started, ended]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  if (!started) {
    return (
      <div className="space-y-5 py-2 text-center">
        <div className="space-y-2">
          <p className="text-base font-bold text-slate-900">System Design Interview</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            10 minutes. Design {product?.label}. Three surprise constraint changes will test your adaptability. Your score updates live.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 max-w-xs mx-auto">
          {[["10:00", "Time limit"], ["3", "Constraints"], ["4", "Score axes"]].map(([v, l]) => (
            <div key={l} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-lg font-bold text-slate-900">{v}</p>
              <p>{l}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">Use the requirements panel above to build your architecture while the timer runs.</p>
        <button onClick={startInterview}
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
          Start Interview
        </button>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-slate-900">Time&apos;s up — final score</p>
            <p className="text-xs text-slate-500">{product?.label} architecture assessment</p>
          </div>
          <button onClick={startInterview} className="ml-auto text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
            Retry
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ScoreBar label={`Scalability — ${scores.scalability}/10`} score={scores.scalability} />
          <ScoreBar label={`Reliability — ${scores.reliability}/10`} score={scores.reliability} />
          <ScoreBar label={`Performance — ${scores.performance}/10`} score={scores.performance} />
          <ScoreBar label={`Simplicity — ${scores.simplicity}/10`}   score={scores.simplicity} />
        </div>
        <div className={cn("p-4 rounded-xl border text-sm font-semibold",
          totalScore >= 8 ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
          totalScore >= 6 ? "bg-amber-50 border-amber-200 text-amber-700" :
          "bg-red-50 border-red-200 text-red-700"
        )}>
          Overall: {totalScore}/10 —{" "}
          {totalScore >= 8 ? "Strong design. You handled the constraints well." :
           totalScore >= 6 ? "Solid foundation. Open the Compare tab to see what's missing." :
           "Review the Walkthrough tab — there are significant architectural gaps."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer + controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg tabular-nums border",
          timeLeft <= 120 ? "bg-red-50 text-red-700 border-red-200 animate-pulse" :
          timeLeft <= 300 ? "bg-amber-50 text-amber-700 border-amber-200" :
          "bg-slate-50 text-slate-700 border-slate-200"
        )}>
          <Clock className="w-5 h-5" />
          {mins}:{secs}
        </div>
        <p className="text-xs text-slate-500 flex-1">Build your architecture above — score updates live as you toggle requirements.</p>
        <button
          onClick={() => { setEnded(true); if (intervalRef.current) clearInterval(intervalRef.current); }}
          className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
        >
          End early
        </button>
      </div>

      {/* Live scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Scalability", score: scores.scalability },
          { label: "Reliability", score: scores.reliability },
          { label: "Performance", score: scores.performance },
          { label: "Simplicity",  score: scores.simplicity  },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <motion.p key={s.score}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("text-xl font-black tabular-nums",
                s.score >= 8 ? "text-emerald-600" : s.score >= 5 ? "text-amber-600" : "text-red-500"
              )}>
              {s.score}<span className="text-xs text-slate-400">/10</span>
            </motion.p>
          </div>
        ))}
      </div>

      {/* Constraint events */}
      <AnimatePresence>
        {events.map(ev => (
          <motion.div key={ev.at}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-red-50 border-2 border-red-300 space-y-1"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-800">⚡ {ev.text}</p>
                <p className="text-xs text-red-600">{ev.hint}</p>
              </div>
              <button onClick={() => setEvents(es => es.filter(e => e.at !== ev.at))}
                className="text-red-400 hover:text-red-600 shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

type SolutionMode = "walkthrough" | "compare" | "interview";

function SolutionPanel({
  selected,
  productId,
  onClose,
}: {
  selected: Set<string>;
  productId: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<SolutionMode>("walkthrough");

  const modeTabs: Array<{ key: SolutionMode; label: string; icon: string }> = [
    { key: "walkthrough", label: "Walkthrough", icon: "🗺" },
    { key: "compare",     label: "Compare",     icon: "⚖️" },
    { key: "interview",   label: "Interview",   icon: "⏱" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      className="rounded-[1.5rem] border-2 border-slate-900 bg-white p-5 shadow-lg space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Solution Mode</p>
          <p className="text-xs text-slate-500">Step-by-step reasoning for {PRODUCTS.find(p => p.id === productId)?.label}.</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
        {modeTabs.map(t => (
          <button key={t.key} onClick={() => setMode(t.key)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all",
              mode === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {mode === "walkthrough" && <WalkthroughView productId={productId} />}
          {mode === "compare"     && <CompareView selected={selected} productId={productId} />}
          {mode === "interview"   && <InterviewView selected={selected} productId={productId} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function RequirementsVisual() {
  const [productId, setProductId]   = useState("youtube");
  const [selected, setSelected]     = useState<Set<string>>(() => new Set(PRODUCTS[0].defaultReqs));
  const [tooltip, setTooltip]       = useState<string | null>(null);
  const [newlyAdded, setNewlyAdded] = useState<Set<NodeId>>(new Set());
  const [activeTab, setActiveTab]   = useState<"functional" | "nonFunctional" | "outOfScope">("functional");
  const [showSolution, setShowSolution] = useState(false);
  const prevActiveRef               = useRef<Set<NodeId>>(new Set(["client", "app_server", "database"]));

  const activeNodes = useMemo(() => computeActiveNodes(selected), [selected]);
  const metrics     = useMemo(() => computeMetrics(selected), [selected]);
  const insights    = useMemo(() => computeInsights(selected, activeNodes), [selected, activeNodes]);
  const warnings    = useMemo(() => REQS.filter(r => selected.has(r.id) && r.warning).map(r => r.warning!), [selected]);

  useEffect(() => {
    const prev = prevActiveRef.current;
    const added = new Set<NodeId>();
    for (const id of activeNodes) {
      if (!prev.has(id)) added.add(id);
    }
    prevActiveRef.current = new Set(activeNodes);
    if (added.size === 0) return;
    setNewlyAdded(added);
    const t = setTimeout(() => setNewlyAdded(new Set()), 2000);
    return () => clearTimeout(t);
  }, [activeNodes]);

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectProduct = (p: Product) => {
    setProductId(p.id);
    setSelected(new Set(p.defaultReqs));
    setShowSolution(false);
  };

  const currentProduct = PRODUCTS.find(p => p.id === productId)!;

  const funcReqs  = REQS.filter(r => r.category === "functional");
  const nfReqs    = REQS.filter(r => r.category === "nonFunctional");
  const oosReqs   = REQS.filter(r => r.category === "outOfScope");

  const complexityLabel =
    metrics.complexity <= 2 ? "Simple" :
    metrics.complexity <= 4 ? "Moderate" :
    metrics.complexity <= 6 ? "Complex" : "Very Complex";

  const tabs = [
    { key: "functional"    as const, label: "Functional",     count: funcReqs.filter(r => selected.has(r.id)).length },
    { key: "nonFunctional" as const, label: "Non-Functional", count: nfReqs.filter(r => selected.has(r.id)).length },
    { key: "outOfScope"    as const, label: "Out of Scope",   count: oosReqs.filter(r => selected.has(r.id)).length },
  ];

  return (
    <div className="space-y-5">

      {/* ── Step 1: Product Selector ─────────────────────────────────────────── */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Step 1 — Pick a product</p>
            <p className="text-sm text-slate-500 mt-0.5">Requirements depend on what you&apos;re building.</p>
          </div>
          <button
            onClick={() => selectProduct(currentProduct)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRODUCTS.map(p => (
            <button
              key={p.id}
              onClick={() => selectProduct(p)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
                p.id === productId
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">{currentProduct.users}</span>
          {" · "}{currentProduct.traffic}{" · "}{currentProduct.useCase}
        </p>
      </div>

      {/* ── Steps 2 + 3: Requirements & Canvas ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.65fr] gap-5">

        {/* Left: requirement chips */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Step 2 — Choose requirements</p>
            <p className="text-sm text-slate-500 mt-0.5">Toggle on/off — the architecture updates live.</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                  activeTab === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold",
                    activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-300 text-slate-600"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2 min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeTab === "functional" && (
                <motion.div key="fn" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  {funcReqs.map(r => (
                    <ReqChip key={r.id} req={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} accent="sky" />
                  ))}
                </motion.div>
              )}
              {activeTab === "nonFunctional" && (
                <motion.div key="nf" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  {nfReqs.map(r => (
                    <ReqChip key={r.id} req={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} accent="amber" />
                  ))}
                </motion.div>
              )}
              {activeTab === "outOfScope" && (
                <motion.div key="oos" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-[11px] text-slate-400 pb-1">Click to mark each as explicitly deferred — shows scope discipline in interviews.</p>
                  {oosReqs.map(r => (
                    <OutOfScopeChip key={r.id} req={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: canvas + metrics */}
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Step 3 — Architecture</p>
                <p className="text-xs text-slate-500 mt-0.5">Hover any node to understand its role.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
              </div>
            </div>

            <div className="relative px-3 pb-3">
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "760/420" }}>
                <ArchCanvas activeNodes={activeNodes} newlyAdded={newlyAdded} onTooltip={setTooltip} />
                <AnimatePresence>
                  {tooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl leading-relaxed pointer-events-none z-10"
                    >
                      <Info className="inline w-3 h-3 mr-1.5 opacity-60" />
                      {tooltip}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">System metrics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <MetricCard label="Response Time" value={`${metrics.latency}ms`} good={metrics.latency <= 100} warn={metrics.latency <= 200} />
              <MetricCard label="Availability" value={`${metrics.availability.toFixed(1)}%`} good={metrics.availability >= 99} warn={metrics.availability >= 97} />
              <MetricCard label="Est. Cost" value={`$${metrics.cost}/mo`} good={metrics.cost <= 100} warn={metrics.cost <= 200} />
              <MetricCard label="Complexity" value={complexityLabel} good={metrics.complexity <= 2} warn={metrics.complexity <= 5} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 4: Tradeoff Insights ─────────────────────────────────────────── */}
      {(insights.length > 0 || warnings.length > 0) && (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Step 4 — Design insights</p>
          <div className="space-y-2">
            <AnimatePresence>
              {warnings.map(w => (
                <motion.div key={w} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  {w}
                </motion.div>
              ))}
              {insights.map(ins => (
                <motion.div key={ins} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-2" />
                  {ins}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Mini Challenges ───────────────────────────────────────────────────── */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Mini Challenges</p>
            <p className="text-sm text-slate-500 mt-0.5">Can you build an architecture that satisfies each goal?</p>
          </div>
          <button
            onClick={() => setShowSolution(s => !s)}
            className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0",
              showSolution
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:border-slate-700"
            )}
          >
            <Target className="w-3.5 h-3.5" />
            {showSolution ? "Hide Solution" : "Show Solution"}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {CHALLENGES.map(ch => {
            const solved = ch.check(activeNodes, metrics);
            return (
              <motion.div
                key={ch.id}
                animate={{ borderColor: solved ? "#86efac" : "#e2e8f0" }}
                className={cn(
                  "p-4 rounded-xl border-2 transition-colors",
                  solved ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {solved
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  }
                  <p className={cn("text-xs font-bold", solved ? "text-emerald-700" : "text-slate-700")}>
                    {ch.label}
                  </p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-6">{ch.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Solution Panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSolution && (
          <SolutionPanel
            selected={selected}
            productId={productId}
            onClose={() => setShowSolution(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
