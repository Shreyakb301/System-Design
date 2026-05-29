"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import { ArrowLeft, CheckCircle2, GripVertical, Link2, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PLAYFIELD_WIDTH = 860;
const PLAYFIELD_HEIGHT = 520;
const NODE_SIZE = 92;

const NODE_VALUES = [1, 2, 3, 4] as const;

type NodeId = `node-${(typeof NODE_VALUES)[number]}`;

type ChallengeNode = {
  id: NodeId;
  value: (typeof NODE_VALUES)[number];
  x: number;
  y: number;
};

type ConnectionMap = Partial<Record<NodeId, NodeId | null>>;

const POSITION_PRESETS = [
  { x: 60, y: 88 },
  { x: 248, y: 76 },
  { x: 430, y: 124 },
  { x: 636, y: 84 },
  { x: 116, y: 302 },
  { x: 304, y: 338 },
  { x: 500, y: 288 },
  { x: 682, y: 330 },
];

const EXPECTED_CONNECTIONS: Record<Exclude<NodeId, "node-4">, NodeId> = {
  "node-1": "node-2",
  "node-2": "node-3",
  "node-3": "node-4",
};

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function buildRound(): ChallengeNode[] {
  const positions = shuffle(POSITION_PRESETS).slice(0, NODE_VALUES.length);

  return NODE_VALUES.map((value, index) => ({
    id: `node-${value}` as NodeId,
    value,
    x: positions[index].x,
    y: positions[index].y,
  }));
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isWinningState(connections: ConnectionMap) {
  return (
    connections["node-1"] === "node-2" &&
    connections["node-2"] === "node-3" &&
    connections["node-3"] === "node-4" &&
    !connections["node-4"]
  );
}

function connectionColor(sourceId: NodeId, targetId: NodeId) {
  return EXPECTED_CONNECTIONS[sourceId as keyof typeof EXPECTED_CONNECTIONS] === targetId
    ? "#22c55e"
    : "#94a3b8";
}

type ChallengeNodeCardProps = {
  completed: boolean;
  node: ChallengeNode;
  selected: boolean;
  nextValue: number | null;
  onMove: (nodeId: NodeId, x: number, y: number) => void;
  onSelect: (nodeId: NodeId) => void;
};

function ChallengeNodeCard({
  completed,
  node,
  selected,
  nextValue,
  onMove,
  onSelect,
}: ChallengeNodeCardProps) {
  const dragControls = useDragControls();
  const dragOrigin = useRef({ x: node.x, y: node.y });

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    onMove(
      node.id,
      clamp(dragOrigin.current.x + info.offset.x, 0, PLAYFIELD_WIDTH - NODE_SIZE),
      clamp(dragOrigin.current.y + info.offset.y, 0, PLAYFIELD_HEIGHT - NODE_SIZE)
    );
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragStart={() => {
        dragOrigin.current = { x: node.x, y: node.y };
      }}
      onDrag={handleDrag}
      className="absolute left-0 top-0"
      style={{ x: node.x, y: node.y }}
    >
      <div
        className={cn(
          "flex h-[92px] w-[92px] flex-col rounded-[1.65rem] border bg-white shadow-[0_18px_30px_rgba(15,23,42,0.12)] transition-all",
          completed
            ? "border-emerald-300 ring-2 ring-emerald-200"
            : selected
              ? "border-violet-400 ring-2 ring-violet-200"
              : "border-slate-200"
        )}
      >
        <button
          type="button"
          className="flex items-center justify-center rounded-t-[1.45rem] border-b border-slate-100 px-2 py-1.5 text-slate-400 transition-colors hover:text-slate-700"
          onPointerDown={(event) => dragControls.start(event)}
          aria-label={`Move node ${node.value}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex flex-1 flex-col items-center justify-center rounded-b-[1.45rem] px-2 text-slate-950"
          onClick={() => onSelect(node.id)}
        >
          <span className="text-3xl font-bold tracking-tight">{node.value}</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
            {nextValue ? `next ${nextValue}` : "tail"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

export function LinkedListConnectorChallenge() {
  const [nodes, setNodes] = useState<ChallengeNode[]>(() => buildRound());
  const [connections, setConnections] = useState<ConnectionMap>({});
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);

  const nodeLookup = useMemo(
    () =>
      nodes.reduce<Record<NodeId, ChallengeNode>>((lookup, node) => {
        lookup[node.id] = node;
        return lookup;
      }, {} as Record<NodeId, ChallengeNode>),
    [nodes]
  );

  useEffect(() => {
    if (completed) return undefined;

    const timer = window.setInterval(() => {
      setSecondsElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [completed]);

  useEffect(() => {
    if (!completed) return;

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.62 },
    });
  }, [completed]);

  const resetRound = () => {
    setNodes(buildRound());
    setConnections({});
    setSelectedNodeId(null);
    setSecondsElapsed(0);
    setMoves(0);
    setCompleted(false);
  };

  const clearConnections = () => {
    setConnections({});
    setSelectedNodeId(null);
    setMoves(0);
    setCompleted(false);
  };

  const handleNodeMove = (nodeId: NodeId, x: number, y: number) => {
    setNodes((current) =>
      current.map((node) => (node.id === nodeId ? { ...node, x, y } : node))
    );
  };

  const commitConnections = (nextConnections: ConnectionMap) => {
    setConnections(nextConnections);
    setMoves((current) => current + 1);

    if (isWinningState(nextConnections)) {
      setCompleted(true);
    }
  };

  const handleNodeSelect = (nodeId: NodeId) => {
    if (completed) return;

    if (!selectedNodeId) {
      setSelectedNodeId(nodeId);
      return;
    }

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      return;
    }

    const nextConnections: ConnectionMap = { ...connections };

    Object.keys(nextConnections).forEach((sourceId) => {
      const typedSourceId = sourceId as NodeId;
      if (typedSourceId !== selectedNodeId && nextConnections[typedSourceId] === nodeId) {
        nextConnections[typedSourceId] = null;
      }
    });

    nextConnections[selectedNodeId] = nodeId;

    setSelectedNodeId(null);
    commitConnections(nextConnections);
  };

  const orderedConnectionLines = useMemo(
    () =>
      (Object.entries(connections) as Array<[NodeId, NodeId | null]>)
        .filter((entry): entry is [NodeId, NodeId] => Boolean(entry[1]))
        .map(([sourceId, targetId]) => ({
          source: nodeLookup[sourceId],
          target: nodeLookup[targetId],
          color: connectionColor(sourceId, targetId),
        }))
        .filter((line) => line.source && line.target),
    [connections, nodeLookup]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/data-structures">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Linked List Connector</h1>
            <p className="text-muted-foreground">
              Drag nodes by the grip, then click one node followed by the node that should come next.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            <Timer className="h-4 w-4 text-violet-500" />
            Time: {formatTime(secondsElapsed)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            <Link2 className="h-4 w-4 text-sky-500" />
            Moves: {moves}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 bg-white py-0">
        <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6 border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                Mission
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Restore the data flow
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Build the chain in ascending order: <strong>1 -&gt; 2 -&gt; 3 -&gt; 4</strong>.
                Only one outgoing pointer is kept per node, so reconnecting a node overwrites its old link.
              </p>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                How to play
              </p>
              <ol className="space-y-2 text-sm text-slate-600">
                <li>1. Drag any node using the grip above it.</li>
                <li>2. Click a source node to select it.</li>
                <li>3. Click the node that should come next to create the pointer.</li>
              </ol>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Status
              </p>
              <p className="text-sm text-slate-700">
                {selectedNodeId
                  ? `Selected source: ${nodeLookup[selectedNodeId].value}. Click the next node in the list.`
                  : "No node selected. Start by clicking the node you want to point from."}
              </p>
              {completed && (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Data flow restored!
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={resetRound}
                className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button type="button" variant="outline" onClick={clearConnections} className="rounded-full">
                Clear links
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <div
                className={cn(
                  "relative mx-auto min-h-[520px] min-w-[860px] overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_32%),linear-gradient(180deg,#fbfbfd_0%,#f8fafc_100%)]",
                  completed && "bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.14),transparent_32%),linear-gradient(180deg,#fbfffd_0%,#f0fdf4_100%)]"
                )}
              >
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: "radial-gradient(#0f172a 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />

                <svg className="absolute inset-0 h-full w-full">
                  <defs>
                    <marker id="arrow-default" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                    <marker id="arrow-success" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                    </marker>
                  </defs>

                  {orderedConnectionLines.map((line) => {
                    const markerId = line.color === "#22c55e" ? "url(#arrow-success)" : "url(#arrow-default)";

                    return (
                      <line
                        key={`${line.source.id}-${line.target.id}`}
                        x1={line.source.x + NODE_SIZE / 2}
                        y1={line.source.y + NODE_SIZE / 2}
                        x2={line.target.x + NODE_SIZE / 2}
                        y2={line.target.y + NODE_SIZE / 2}
                        stroke={line.color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        markerEnd={markerId}
                      />
                    );
                  })}
                </svg>

                {completed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg"
                  >
                    Data flow restored!
                  </motion.div>
                )}

                {nodes.map((node) => (
                  <ChallengeNodeCard
                    key={node.id}
                    completed={completed}
                    node={node}
                    selected={selectedNodeId === node.id}
                    nextValue={
                      connections[node.id] ? nodeLookup[connections[node.id] as NodeId]?.value ?? null : null
                    }
                    onMove={handleNodeMove}
                    onSelect={handleNodeSelect}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
