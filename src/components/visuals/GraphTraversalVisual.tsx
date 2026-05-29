"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "bfs" | "dfs" | "side";
type NodeId = "A" | "B" | "C" | "D" | "E" | "F";
type Algorithm = "bfs" | "dfs";

type Snapshot = {
  current: NodeId | null;
  seen: NodeId[];
  frontier: NodeId[];
  panelItems: NodeId[];
  currentLevel?: 0 | 1 | 2;
  path?: NodeId[];
  complete?: boolean;
};

type SingleStep = {
  snapshot: Snapshot;
  what: string;
  why: string;
};

type SideBySideStep = {
  bfs: Snapshot;
  dfs: Snapshot;
  what: string;
  why: string;
  divergence?: string;
};

type SingleDemo = {
  tab: "bfs" | "dfs";
  tabLabel: string;
  badges: string[];
  useCase: string;
  code: string;
  steps: SingleStep[];
};

type SideDemo = {
  tab: "side";
  tabLabel: string;
  badges: string[];
  useCase: string;
  code: string;
  steps: SideBySideStep[];
};

type DemoMap = {
  bfs: SingleDemo;
  dfs: SingleDemo;
  side: SideDemo;
};

type GraphNode = {
  id: NodeId;
  x: number;
  y: number;
};

type GraphEdge = {
  from: NodeId;
  to: NodeId;
};

const TARGET: NodeId = "F";

const GRAPH_NODES: GraphNode[] = [
  { id: "A", x: 152, y: 32 },
  { id: "B", x: 92, y: 102 },
  { id: "C", x: 212, y: 102 },
  { id: "D", x: 52, y: 182 },
  { id: "E", x: 132, y: 182 },
  { id: "F", x: 232, y: 182 },
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "B", to: "D" },
  { from: "B", to: "E" },
  { from: "C", to: "F" },
];

const BFS_CODE = `function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];         // FIFO - process in discovery order
  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift();  // dequeue oldest
    console.log(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);    // enqueue - will process after current level
      }
    }
  }
}`;

const DFS_CODE = `function dfs(graph, start) {
  const visited = new Set();
  const stack = [start];         // LIFO - process most recent first

  while (stack.length > 0) {
    const node = stack.pop();    // pop most recently added
    if (visited.has(node)) continue;
    visited.add(node);
    console.log(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);    // push - will process before older nodes
      }
    }
  }
}`;

const SIDE_BY_SIDE_CODE = `// BFS and DFS only differ in the frontier data structure.

// BFS
const queue = [start];
const node = queue.shift();

// DFS
const stack = [start];
const node = stack.pop();
`;

const BFS_DEMO: SingleDemo = {
  tab: "bfs",
  tabLabel: "BFS",
  badges: ["LeetCode #1971 - Find if Path Exists", "Start: A", "Target: F"],
  useCase:
    "Use BFS when you need the shortest path in an unweighted graph or you need to process the graph level by level.",
  code: BFS_CODE,
  steps: [
    {
      snapshot: {
        current: "A",
        seen: ["A"],
        frontier: ["A"],
        panelItems: ["A"],
        currentLevel: 0,
      },
      what: "A added to queue. A visited. Queue: [A].",
      why: "BFS always starts by enqueuing the source. The queue ensures we process nodes in the order we discovered them - nearest first.",
    },
    {
      snapshot: {
        current: "A",
        seen: ["A", "B", "C"],
        frontier: ["B", "C"],
        panelItems: ["B", "C"],
        currentLevel: 0,
      },
      what: "Dequeue A. Enqueue its neighbors B and C. Queue: [B, C].",
      why: "All of A's neighbors are 1 hop away. They are added together and will be processed before anything 2 hops away. This is the wave expanding.",
    },
    {
      snapshot: {
        current: "B",
        seen: ["A", "B", "C", "D", "E"],
        frontier: ["C", "D", "E"],
        panelItems: ["C", "D", "E"],
        currentLevel: 1,
      },
      what: "Dequeue B. Enqueue D and E. Queue: [C, D, E].",
      why: "B's neighbors are 2 hops from A. Notice C is still in the queue - BFS finishes all level-1 nodes before processing level-2 nodes.",
    },
    {
      snapshot: {
        current: "C",
        seen: ["A", "B", "C", "D", "E", "F"],
        frontier: ["D", "E", "F"],
        panelItems: ["D", "E", "F"],
        currentLevel: 1,
      },
      what: "Dequeue C. Enqueue F. Queue: [D, E, F].",
      why: "C is the last level-1 node. F is 2 hops from A, the same level as D and E. All three will be processed next.",
    },
    {
      snapshot: {
        current: "D",
        seen: ["A", "B", "C", "D", "E", "F"],
        frontier: ["E", "F"],
        panelItems: ["E", "F"],
        currentLevel: 2,
      },
      what: "Dequeue D. No new neighbors. Queue: [E, F].",
      why: "D is a leaf. Nothing new gets enqueued, so BFS simply moves on to the next node waiting at the same level.",
    },
    {
      snapshot: {
        current: "E",
        seen: ["A", "B", "C", "D", "E", "F"],
        frontier: ["F"],
        panelItems: ["F"],
        currentLevel: 2,
      },
      what: "Dequeue E. No new neighbors. Queue: [F].",
      why: "E is also a leaf. One item is left in the queue, and it is still on the same level-2 frontier.",
    },
    {
      snapshot: {
        current: "F",
        seen: ["A", "B", "C", "D", "E", "F"],
        frontier: [],
        panelItems: [],
        currentLevel: 2,
        path: ["A", "C", "F"],
        complete: true,
      },
      what: "Dequeue F. Target reached. Shortest path: A -> C -> F (2 hops).",
      why: "BFS guarantees this is the shortest path by edge count. Any path found later would be longer because the queue always processes closer nodes first.",
    },
  ],
};

const DFS_DEMO: SingleDemo = {
  tab: "dfs",
  tabLabel: "DFS",
  badges: ["Start: A", "Target: F", "Same graph, stack-driven traversal"],
  useCase:
    "Use DFS when you need exhaustive path exploration, cycle detection, connectivity checks, or backtracking through a maze or puzzle.",
  code: DFS_CODE,
  steps: [
    {
      snapshot: {
        current: "A",
        seen: ["A"],
        frontier: ["A"],
        panelItems: ["A"],
      },
      what: "A pushed to stack. A visited. Stack: [A].",
      why: "DFS uses a stack. The most recently discovered node is explored next, which is what causes it to dive deep before backtracking.",
    },
    {
      snapshot: {
        current: "B",
        seen: ["A", "B", "C"],
        frontier: ["C"],
        panelItems: ["B", "C"],
      },
      what: "Pop A. Push neighbors C then B. Visit B (top of stack). Stack: [B, C].",
      why: "B was pushed last, so it sits on top. C waits underneath. This is LIFO causing the depth-first behavior.",
    },
    {
      snapshot: {
        current: "D",
        seen: ["A", "B", "C", "D", "E"],
        frontier: ["C", "E"],
        panelItems: ["D", "E", "C"],
      },
      what: "Pop B. Push E then D. Visit D (top). Stack: [D, E, C].",
      why: "DFS immediately dives into B's children before ever visiting C. We are already 2 levels deep while C, still at level 1, waits in the stack.",
    },
    {
      snapshot: {
        current: "D",
        seen: ["A", "B", "C", "D", "E"],
        frontier: ["C", "E"],
        panelItems: ["E", "C"],
      },
      what: "Pop D. No unvisited neighbors. Backtrack. Stack: [E, C].",
      why: "D is a dead end. DFS backtracks by popping D and trying the next item on the stack. That pop is the backtracking mechanism.",
    },
    {
      snapshot: {
        current: "E",
        seen: ["A", "B", "C", "D", "E"],
        frontier: ["C"],
        panelItems: ["C"],
      },
      what: "Pop E. No unvisited neighbors. Backtrack. Stack: [C].",
      why: "E is another dead end. DFS has now exhausted B's entire subtree before returning to the still-waiting node C.",
    },
    {
      snapshot: {
        current: "F",
        seen: ["A", "B", "C", "D", "E", "F"],
        frontier: [],
        panelItems: ["F"],
      },
      what: "Pop C. Push F. Visit F. Stack: [F].",
      why: "DFS finally reaches C after fully exhausting B's branch. That depth-first commitment is why DFS feels natural for exhaustive search and backtracking.",
    },
    {
      snapshot: {
        current: "F",
        seen: ["A", "B", "C", "D", "E", "F"],
        frontier: [],
        panelItems: [],
        complete: true,
      },
      what: "All nodes visited. DFS complete.",
      why: "DFS found F only after exploring A -> B -> D, backtracking to E, then returning to C. It explores deeply, but it does not guarantee the shortest route.",
    },
  ],
};

const SIDE_DEMO: SideDemo = {
  tab: "side",
  tabLabel: "Side by Side",
  badges: ["Same graph, same source", "Queue vs stack", "Target: F"],
  useCase:
    "Queue keeps BFS shallow and shortest-path safe. Stack sends DFS deep for full-path exploration and backtracking.",
  code: SIDE_BY_SIDE_CODE,
  steps: [
    {
      bfs: BFS_DEMO.steps[0].snapshot,
      dfs: DFS_DEMO.steps[0].snapshot,
      what: "Both start at A.",
      why: "Same source, same graph - only the data structure differs.",
    },
    {
      bfs: {
        current: "A",
        seen: ["A", "B", "C"],
        frontier: ["B", "C"],
        panelItems: ["B", "C"],
        currentLevel: 0,
      },
      dfs: {
        current: "D",
        seen: ["A", "B", "C", "D", "E"],
        frontier: ["C", "E"],
        panelItems: ["D", "E", "C"],
      },
      divergence: "This is where they diverge - BFS stays at level 1, DFS dives to level 2.",
      what: "BFS visits B and C at level 1. DFS visits B, then immediately dives to D at level 2.",
      why: "The queue keeps level-1 nodes together. The stack sends DFS straight down B's branch before C gets a turn.",
    },
    {
      bfs: BFS_DEMO.steps[2].snapshot,
      dfs: DFS_DEMO.steps[4].snapshot,
      what: "BFS expands B and adds D and E. DFS has already backtracked through D and E and is only now returning to C.",
      why: "BFS is still systematically finishing the level-1 frontier. DFS drains B's entire subtree before it ever returns to the other branch.",
    },
    {
      bfs: BFS_DEMO.steps[3].snapshot,
      dfs: DFS_DEMO.steps[5].snapshot,
      what: "BFS finally processes C and discovers F. DFS reaches F only after exhausting B's whole branch.",
      why: "BFS delays deeper nodes until every shallower node is handled. DFS accepts a longer exploration order because depth, not distance, is the priority.",
    },
    {
      bfs: BFS_DEMO.steps[4].snapshot,
      dfs: DFS_DEMO.steps[6].snapshot,
      what: "BFS still has to drain D and E before F leaves the queue. DFS is already complete.",
      why: "That extra waiting is the price of the shortest-path guarantee: BFS preserves discovery order within a level. DFS can stop early once its goal is satisfied.",
    },
    {
      bfs: BFS_DEMO.steps[6].snapshot,
      dfs: DFS_DEMO.steps[6].snapshot,
      what: "BFS returns the shortest path A -> C -> F. DFS also reached F, but only after exploring more deeply.",
      why: "Reach for BFS when distance matters. Reach for DFS when full exploration, cycle checks, or backtracking matter more than shortest path.",
    },
  ],
};

const DEMOS: DemoMap = {
  bfs: BFS_DEMO,
  dfs: DFS_DEMO,
  side: SIDE_DEMO,
};

const LEVEL_GROUPS: Array<{ level: 0 | 1 | 2; nodes: NodeId[] }> = [
  { level: 0, nodes: ["A"] },
  { level: 1, nodes: ["B", "C"] },
  { level: 2, nodes: ["D", "E", "F"] },
];

function makeEdgeKey(a: NodeId, b: NodeId) {
  return [a, b].sort().join("-");
}

function pathEdgeSet(path?: NodeId[]) {
  const keys = new Set<string>();

  if (!path || path.length < 2) {
    return keys;
  }

  for (let index = 0; index < path.length - 1; index += 1) {
    keys.add(makeEdgeKey(path[index], path[index + 1]));
  }

  return keys;
}

function FrontierPanel({
  algorithm,
  items,
}: {
  algorithm: Algorithm;
  items: NodeId[];
}) {
  const title = algorithm === "bfs" ? "QUEUE - FIFO" : "STACK - LIFO";
  const description =
    algorithm === "bfs"
      ? "Oldest discovered node leaves first."
      : "Most recently discovered node leaves first.";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.24em]",
          algorithm === "bfs" ? "text-blue-200" : "text-amber-200"
        )}
      >
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>

      <div className="mt-3 min-h-[192px] rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3">
        <AnimatePresence mode="popLayout">
          {items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {items.map((item, index) => (
                <motion.div
                  key={`${algorithm}-${item}-${index}`}
                  layout
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-semibold",
                    index === 0
                      ? algorithm === "bfs"
                        ? "border-blue-400/40 bg-blue-500/12 text-blue-100"
                        : "border-amber-400/40 bg-amber-500/12 text-amber-100"
                      : "border-slate-700 bg-slate-900 text-slate-300"
                  )}
                >
                  {item}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-14 text-center text-xs italic text-slate-500"
            >
              Empty
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LevelIndicator({
  currentLevel,
  seen,
}: {
  currentLevel: 0 | 1 | 2 | undefined;
  seen: NodeId[];
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        BFS levels
      </p>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {LEVEL_GROUPS.map((group) => (
          <div
            key={`level-${group.level}`}
            className={cn(
              "rounded-xl border px-3 py-3 transition-colors",
              currentLevel === group.level
                ? "border-blue-400/40 bg-blue-500/10"
                : "border-slate-800 bg-slate-950"
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Level {group.level}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {group.nodes.map((node) => (
                <span
                  key={`level-${group.level}-${node}`}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-semibold",
                    seen.includes(node)
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-700 bg-slate-900 text-slate-400"
                  )}
                >
                  {node}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraphDiagram({
  snapshot,
  algorithm,
  compact = false,
}: {
  snapshot: Snapshot;
  algorithm: Algorithm;
  compact?: boolean;
}) {
  const seen = useMemo(() => new Set(snapshot.seen), [snapshot.seen]);
  const frontier = useMemo(() => new Set(snapshot.frontier), [snapshot.frontier]);
  const highlightedPath = useMemo(() => pathEdgeSet(snapshot.path), [snapshot.path]);
  const currentLabel = algorithm === "bfs" ? "CURRENT" : "CURRENT";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <svg
        className={cn("w-full", compact ? "h-[240px]" : "h-[280px]")}
        viewBox="0 0 280 230"
        aria-label={algorithm === "bfs" ? "BFS graph diagram" : "DFS graph diagram"}
      >
        {GRAPH_EDGES.map((edge) => {
          const from = GRAPH_NODES.find((node) => node.id === edge.from)!;
          const to = GRAPH_NODES.find((node) => node.id === edge.to)!;
          const isPathEdge = highlightedPath.has(makeEdgeKey(edge.from, edge.to));

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isPathEdge ? "#a855f7" : "#334155"}
              strokeWidth={isPathEdge ? 3.5 : 2}
              opacity={isPathEdge ? 1 : 0.7}
            />
          );
        })}

        {GRAPH_NODES.map((node) => {
          const isCurrent = snapshot.current === node.id;
          const isSeen = seen.has(node.id);
          const isFrontier = frontier.has(node.id) && !isCurrent;
          const isTarget = node.id === TARGET;

          const circleFill = isCurrent
            ? "#0f172a"
            : isSeen
              ? "#14532d"
              : "#020617";
          const circleStroke = isCurrent
            ? "#60a5fa"
            : isFrontier
              ? "#f59e0b"
              : isSeen
                ? "#4ade80"
                : "#334155";
          const textColor = isCurrent
            ? "#bfdbfe"
            : isSeen || isFrontier
              ? "#f8fafc"
              : "#94a3b8";

          return (
            <g key={node.id}>
              {isTarget ? (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="30"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  opacity="0.9"
                />
              ) : null}

              {isCurrent ? (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="34"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  animate={{ opacity: [0.7, 0.1], scale: [1, 1.12] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}

              <motion.circle
                layout
                transition={{ duration: 0.28, ease: "easeInOut" }}
                cx={node.x}
                cy={node.y}
                r="24"
                fill={circleFill}
                stroke={circleStroke}
                strokeWidth={isCurrent ? 4 : 2.5}
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                fill={textColor}
              >
                {node.id}
              </text>

              {isCurrent ? (
                <text
                  x={node.x}
                  y={node.y + 42}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  letterSpacing="0.16em"
                  fill="#93c5fd"
                >
                  {currentLabel}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SingleTraversalView({
  algorithm,
  snapshot,
  useCase,
  showLevels = false,
  compact = false,
}: {
  algorithm: Algorithm;
  snapshot: Snapshot;
  useCase: string;
  showLevels?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div
        className={cn(
          "rounded-2xl border p-3",
          algorithm === "bfs"
            ? "border-blue-500/20 bg-blue-500/10"
            : "border-amber-500/20 bg-amber-500/10"
        )}
      >
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.24em]",
            algorithm === "bfs" ? "text-blue-200" : "text-amber-200"
          )}
        >
          Inside the demo
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-100">{useCase}</p>
      </div>

      {showLevels ? (
        <LevelIndicator currentLevel={snapshot.currentLevel} seen={snapshot.seen} />
      ) : null}

      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3",
          compact
            ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_150px]"
            : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px]"
        )}
      >
        <GraphDiagram snapshot={snapshot} algorithm={algorithm} compact={compact} />
        <FrontierPanel algorithm={algorithm} items={snapshot.panelItems} />
      </div>
    </div>
  );
}

export function GraphTraversalVisual() {
  const [activeTab, setActiveTab] = useState<Tab>("bfs");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demo = DEMOS[activeTab];
  const step = demo.steps[currentStep];
  const isAtLastStep = currentStep === demo.steps.length - 1;
  const isAutoRunning = isPlaying && !isAtLastStep;

  useEffect(() => {
    if (!isAutoRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentStep((previousStep) =>
        previousStep < demo.steps.length - 1 ? previousStep + 1 : previousStep
      );
    }, 1400);

    return () => window.clearInterval(timer);
  }, [demo.steps.length, isAutoRunning]);

  function selectTab(nextTab: Tab) {
    setActiveTab(nextTab);
    setCurrentStep(0);
    setIsPlaying(false);
  }

  function reset() {
    setCurrentStep(0);
    setIsPlaying(false);
  }

  function nextStep() {
    setCurrentStep((previousStep) =>
      previousStep < demo.steps.length - 1 ? previousStep + 1 : previousStep
    );
  }

  function togglePlay() {
    if (isAutoRunning) {
      setIsPlaying(false);
      return;
    }

    if (isAtLastStep) {
      setCurrentStep(0);
    }

    setIsPlaying(true);
  }

  return (
    <section className="relative flex h-auto min-h-[1480px] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 text-slate-100 shadow-xl sm:min-h-[920px]">
      <div className="absolute left-0 top-0 h-1 w-full bg-blue-400" />

      <div className="flex h-[88px] shrink-0 flex-col justify-center gap-3 border-b border-slate-800 px-4 sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {(["bfs", "dfs", "side"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => selectTab(tab)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                {DEMOS[tab].tabLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-200 hover:bg-blue-500/10">
            O(V+E) time
          </Badge>
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10">
            O(V) space
          </Badge>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-3">
        <div className="flex flex-wrap gap-2">
          {demo.badges.map((badge) => (
            <Badge
              key={`${activeTab}-${badge}`}
              variant="outline"
              className="shrink-0 border-slate-700 bg-slate-900 text-slate-400"
            >
              {badge}
            </Badge>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-3">
        {activeTab === "bfs" ? (
          <SingleTraversalView
            algorithm="bfs"
            snapshot={(step as SingleStep).snapshot}
            useCase={demo.useCase}
            showLevels
          />
        ) : null}

        {activeTab === "dfs" ? (
          <SingleTraversalView
            algorithm="dfs"
            snapshot={(step as SingleStep).snapshot}
            useCase={demo.useCase}
          />
        ) : null}

        {activeTab === "side" ? (
          <div className="flex h-full flex-col gap-3">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
                Inside the demo
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-100">{demo.useCase}</p>
            </div>

            {(step as SideBySideStep).divergence ? (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
                  Divergence moment
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {(step as SideBySideStep).divergence}
                </p>
              </div>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
              <SingleTraversalView
                algorithm="bfs"
                snapshot={(step as SideBySideStep).bfs}
                useCase="BFS keeps level-1 neighbors together before anything deeper runs."
                compact
              />
              <SingleTraversalView
                algorithm="dfs"
                snapshot={(step as SideBySideStep).dfs}
                useCase="DFS keeps pushing the most recent branch until it hits a dead end."
                compact
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex h-[92px] shrink-0 flex-col justify-center gap-3 border-b border-slate-800 px-4 py-3 sm:h-11 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-0">
        <div className="flex items-center gap-2">
          {demo.steps.map((_, index) => (
            <span
              key={`${activeTab}-dot-${index}`}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                index <= currentStep ? "bg-blue-400" : "bg-slate-700"
              )}
            />
          ))}
          <span className="ml-2 text-xs font-medium text-slate-500">
            Step {currentStep + 1} of {demo.steps.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-700 bg-transparent px-3 text-slate-200 hover:bg-slate-900 hover:text-white"
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-700 bg-transparent px-3 text-slate-200 hover:bg-slate-900 hover:text-white"
            onClick={togglePlay}
          >
            {isAutoRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoRunning ? "Pause" : "Auto Play"}
          </Button>
          <Button
            className="h-9 rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-500"
            onClick={nextStep}
            disabled={isAtLastStep}
          >
            <SkipForward className="h-4 w-4" />
            Step
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 border-b border-slate-800 px-4 py-3 sm:min-h-[100px] sm:grid-cols-2 sm:px-5 sm:py-2">
        <div className="flex min-h-[90px] flex-col items-start rounded-2xl border border-amber-500/20 bg-slate-900/80 p-4 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
            What
          </p>
          <div className="mt-2 flex-1 overflow-visible pr-1">
            <p className="text-sm leading-6 text-slate-100">{step.what}</p>
          </div>
        </div>

        <div className="flex min-h-[90px] flex-col items-start rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">
            Why
          </p>
          <div className="mt-2 flex-1 overflow-visible pr-1">
            <p className="text-sm leading-6 text-slate-100">{step.why}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-3 sm:px-5 sm:py-2">
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Code2 className="h-4 w-4 text-blue-300" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Code For This Pattern
            </p>
          </div>
          <pre className="mt-3 min-h-0 flex-1 max-h-[160px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-200">
            <code>{demo.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
