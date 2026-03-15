"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  HelpCircle,
  Layers,
  Maximize2,
  RotateCcw,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ListMode = "singly" | "doubly";

function QuestionPanel({
  question,
  trailing,
}: {
  question: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.1rem] border border-slate-800 bg-slate-900/40 p-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-300">
          Question It Answers
        </p>
        <h3 className="text-sm font-semibold text-slate-100">{question}</h3>
      </div>
      {trailing}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ListMode;
  onChange: (mode: ListMode) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-0.5">
      <div className="grid grid-cols-2 gap-1 text-xs">
        <button
          type="button"
          onClick={() => onChange("singly")}
          className={cn(
            "rounded-lg px-4 py-2 font-medium transition-colors",
            mode === "singly" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
          )}
        >
          Singly
        </button>
        <button
          type="button"
          onClick={() => onChange("doubly")}
          className={cn(
            "rounded-lg px-4 py-2 font-medium transition-colors",
            mode === "doubly" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
          )}
        >
          Doubly
        </button>
      </div>
    </div>
  );
}

function PointerBridge({
  mode,
  active,
}: {
  mode: ListMode;
  active?: boolean;
}) {
  return (
    <div className="flex min-w-[3.6rem] flex-col items-center justify-center gap-1 px-1">
      <div className="flex items-center gap-1">
        <div className={cn("h-px w-6", active ? "bg-blue-300" : "bg-slate-700")} />
        <ArrowRight className={cn("h-4 w-4", active ? "text-blue-300" : "text-slate-700")} />
      </div>
      {mode === "doubly" ? (
        <div className="flex items-center gap-1">
          <ArrowLeft className={cn("h-4 w-4", active ? "text-slate-300" : "text-slate-700")} />
          <div className={cn("h-px w-6", active ? "bg-slate-300" : "bg-slate-700")} />
        </div>
      ) : (
        <div className="h-4 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-600">
          Next
        </div>
      )}
    </div>
  );
}

function LinkedNode({
  value,
  mode,
  active,
  target,
  muted,
  shake,
}: {
  value: string | number;
  mode: ListMode;
  active?: boolean;
  target?: boolean;
  muted?: boolean;
  shake?: boolean;
}) {
  const cellClass = active
    ? "border-blue-400 bg-blue-500/10 shadow-[0_0_0_1px_rgba(96,165,250,0.25)]"
    : target
      ? "border-rose-400/40 bg-rose-500/5"
      : "border-slate-800 bg-slate-900";

  const labelClass = muted ? "text-slate-600" : "text-slate-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={
        shake
          ? { opacity: 1, y: 0, scale: 1, x: [0, -6, 6, -5, 5, 0] }
          : { opacity: 1, y: 0, scale: 1, x: 0 }
      }
      transition={shake ? { duration: 0.4 } : { type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "overflow-hidden rounded-[1rem] border shadow-sm",
        mode === "singly" ? "grid h-[5.25rem] w-[7rem] grid-cols-[1.2fr_0.8fr]" : "grid h-[5.25rem] w-[8.6rem] grid-cols-[0.8fr_1.15fr_0.8fr]",
        cellClass
      )}
    >
      {mode === "doubly" ? (
        <div className="flex flex-col items-center justify-center border-r border-slate-800/90 bg-slate-950/35 px-2">
          <ArrowLeft className={cn("h-4 w-4", muted ? "text-slate-700" : "text-slate-500")} />
          <span className={cn("mt-1 text-[9px] uppercase tracking-[0.18em]", labelClass)}>prev</span>
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col items-center justify-center",
          mode === "singly" ? "border-r border-slate-800/90" : ""
        )}
      >
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">value</span>
        <span className="mt-1 text-[1.45rem] font-semibold tracking-tight text-white">{value}</span>
      </div>

      <div className="flex flex-col items-center justify-center bg-slate-950/35 px-2">
        <ArrowRight className={cn("h-4 w-4", muted ? "text-slate-700" : "text-slate-500")} />
        <span className={cn("mt-1 text-[9px] uppercase tracking-[0.18em]", labelClass)}>next</span>
      </div>
    </motion.div>
  );
}

function MessagePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">
      {children}
    </div>
  );
}

function TraversalFreedomSim() {
  const [mode, setMode] = useState<ListMode>("singly");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [backwardBlocked, setBackwardBlocked] = useState(false);
  const [status, setStatus] = useState(
    "No backward link exists. Traversal is only possible in the forward direction."
  );
  const nodes = ["CP 1", "CP 2", "CP 3", "CP 4"];

  const changeMode = (nextMode: ListMode) => {
    setMode(nextMode);
    setCurrentIndex(0);
    setBackwardBlocked(false);
    setStatus(
      nextMode === "singly"
        ? "No backward link exists. Traversal is only possible in the forward direction."
        : "Each node stores both next and previous pointers, allowing traversal in both directions."
    );
  };

  const handleForward = () => {
    setBackwardBlocked(false);
    if (currentIndex < nodes.length - 1) {
      setCurrentIndex((value) => value + 1);
    }
    setStatus(
      mode === "singly"
        ? "No backward link exists. Traversal is only possible in the forward direction."
        : "Each node stores both next and previous pointers, allowing traversal in both directions."
    );
  };

  const handleBackward = () => {
    if (mode === "singly") {
      setBackwardBlocked(true);
      setStatus("No backward link exists. Traversal is only possible in the forward direction.");
      window.setTimeout(() => setBackwardBlocked(false), 500);
      return;
    }

    setBackwardBlocked(false);
    if (currentIndex > 0) {
      setCurrentIndex((value) => value - 1);
    }

    setStatus("Each node stores both next and previous pointers, allowing traversal in both directions.");
  };

  return (
    <div className="space-y-4">
      <QuestionPanel
        question="“Why can’t I go backwards in a singly linked list?”"
        trailing={<ModeToggle mode={mode} onChange={changeMode} />}
      />

      <div className="rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span>{mode === "singly" ? "[ value | next ]" : "[ prev | value | next ]"}</span>
          <span>{mode === "singly" ? "Forward arrows only" : "Forward and backward arrows"}</span>
        </div>
        <div className="overflow-y-visible py-2">
          <div className="mx-auto flex min-h-[6.25rem] w-max items-center gap-2 px-3">
            {nodes.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative pb-5">
                  <LinkedNode
                    value={index + 1}
                    mode={mode}
                    active={currentIndex === index}
                    muted={currentIndex < index}
                    shake={backwardBlocked && currentIndex === index}
                  />
                  {backwardBlocked && currentIndex === index && mode === "singly" ? (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-amber-200">
                      No prev link
                    </span>
                  ) : null}
                </div>
                {index < nodes.length - 1 ? (
                  <PointerBridge mode={mode} active={currentIndex >= index} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleBackward}
          className={cn(
            "h-10 rounded-xl border-slate-700 bg-transparent px-4 text-slate-200 hover:bg-slate-900 hover:text-white",
            mode === "singly" && backwardBlocked && "border-amber-400/40 bg-amber-500/10 text-amber-100"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Move Backward
        </Button>
        <Button
          onClick={handleForward}
          disabled={currentIndex === nodes.length - 1}
          className="h-10 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-500"
        >
          Move Forward
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <MessagePanel>{status}</MessagePanel>
    </div>
  );
}

function DeletionRealitySim() {
  const [mode, setMode] = useState<ListMode | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleted, setIsDeleted] = useState(false);
  const targetIndex = 2;
  const nodes = ["A", "B", "C", "D"];

  const visibleNodes = nodes.filter((_, index) => !(isDeleted && index === targetIndex));

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsDeleted(false);
  };

  const handleDelete = () => {
    if (mode === "doubly") {
      setIsDeleted(true);
    }
  };

  const handleBypass = () => {
    setIsDeleted(true);
  };

  if (!mode) {
    return (
      <div className="space-y-4">
        <QuestionPanel question="“Why do I need the previous node to delete in a singly list?”" />
        <div className="rounded-[1.2rem] border border-slate-800 bg-slate-900/40 px-5 py-10 text-center">
          <h3 className="text-xl font-semibold text-slate-100">Pick a structure to test deletion</h3>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => setMode("singly")}
              className="h-12 rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-500"
            >
              <ArrowRight className="h-4 w-4" />
              Singly
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode("doubly")}
              className="h-12 rounded-xl border-slate-700 bg-transparent px-6 text-slate-200 hover:bg-slate-900 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Doubly
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status =
    mode === "singly"
      ? currentIndex === targetIndex
        ? "Who points to this node?"
        : currentIndex === targetIndex - 1 && !isDeleted
          ? "✅ Bypass & Delete Next Node"
          : isDeleted
            ? "✅ Bypass & Delete Next Node"
            : "Forward"
      : isDeleted
        ? "Delete Current"
        : "Delete Current";

  return (
    <div className="space-y-4">
      <QuestionPanel
        question="“Why do I need the previous node to delete in a singly list?”"
        trailing={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode(null)}
            className="rounded-xl border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-white"
          >
            Switch Mode
          </Button>
        }
      />

      <div className="rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-4">
        <div className="overflow-y-visible pb-1 pt-2">
          <div className="mx-auto flex w-max items-end gap-2 px-1">
            {visibleNodes.map((value, visualIndex) => {
              const originalIndex = nodes.indexOf(value);
              const isTarget = originalIndex === targetIndex && !isDeleted;
              const isActive = !isDeleted && currentIndex === originalIndex;
              const isMuted = originalIndex > currentIndex && !isDeleted;

              return (
                <div key={`${value}-${visualIndex}`} className="flex items-end gap-2">
                  <div className={cn("relative", isTarget && "pt-5")}>
                    <LinkedNode
                      value={value}
                      mode={mode}
                      active={isActive}
                      target={isTarget}
                      muted={isMuted}
                    />
                    {isTarget ? (
                      <span className="absolute left-3 top-0 z-10 rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-rose-200">
                        Target
                      </span>
                    ) : null}
                  </div>
                  {visualIndex < visibleNodes.length - 1 ? (
                    <PointerBridge mode={mode} active={!isDeleted && originalIndex <= currentIndex} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Button
          variant="outline"
          onClick={handleRestart}
          className="h-10 rounded-xl border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </Button>
        <Button
          onClick={() => currentIndex < nodes.length - 1 && setCurrentIndex((value) => value + 1)}
          disabled={currentIndex === nodes.length - 1}
          className="h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
        >
          Forward
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-[1.05rem] border border-slate-800 bg-slate-900/50 p-3">
        {mode === "singly" ? (
          currentIndex === targetIndex ? (
            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                disabled
                className="h-11 flex-1 rounded-xl border border-dashed border-slate-700 bg-slate-900 text-slate-500 hover:bg-slate-900"
              >
                <XCircle className="h-4 w-4" />
                Delete Current
              </Button>
              <div className="flex items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 text-sm font-medium text-rose-200 md:min-w-[220px]">
                <HelpCircle className="mr-2 h-4 w-4" />
                Who points to this node?
              </div>
            </div>
          ) : currentIndex === targetIndex - 1 && !isDeleted ? (
            <Button
              onClick={handleBypass}
              className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
            >
              ✅ Bypass & Delete Next Node
            </Button>
          ) : (
            <Button
              disabled
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-900"
            >
              Delete Current
            </Button>
          )
        ) : (
          <Button
            variant="destructive"
            disabled={currentIndex !== targetIndex || isDeleted}
            onClick={handleDelete}
            className="h-11 w-full rounded-xl gap-2 font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            Delete Current
          </Button>
        )}
      </div>

      <MessagePanel>{status}</MessagePanel>
    </div>
  );
}

function MetricPanel({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string | number;
  accent?: "default" | "emerald" | "rose";
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold text-slate-100",
          accent === "emerald" && "text-emerald-300",
          accent === "rose" && "text-rose-300"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CostTradeoffSim() {
  const [actionId, setActionId] = useState(0);
  const [isActing, setIsActing] = useState(false);

  const metrics = {
    singly: { steps: 2, updates: 1, memory: 8 },
    doubly: { steps: 0, updates: 2, memory: 16 },
  };

  const runAction = () => {
    setIsActing(true);
    setTimeout(() => setIsActing(false), 2000);
    setActionId((value) => value + 1);
  };

  return (
    <div className="space-y-4">
      <QuestionPanel
        question="“Why don’t we always use doubly linked lists?”"
        trailing={
          <Button
            onClick={runAction}
            disabled={isActing}
            className="h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
          >
            <Zap className="h-4 w-4" />
            Run Delete Test
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0 space-y-3 rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
              Singly
            </span>
            <span className="text-xs font-medium text-slate-400">Lightweight but Limited</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="overflow-y-visible py-2">
              <div className="flex min-h-[4.5rem] w-max min-w-full items-center justify-center gap-1.5 px-1">
                {[1, 2, 3, 4].map((value, index) => (
                  <div key={`s-${value}`} className="flex items-center gap-1.5">
                    <motion.div
                      animate={isActing && index === 2 ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                      className={cn(
                        "flex h-[4rem] w-[4.6rem] items-center justify-center rounded-[0.95rem] border border-slate-800 bg-slate-950 text-xl font-semibold",
                        index === 2 && "border-rose-400/40 text-rose-300"
                      )}
                    >
                      {value}
                    </motion.div>
                    {index < 3 ? <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" /> : null}
                  </div>
                ))}
              </div>
            </div>
            <AnimatePresence>
              {isActing ? (
                <motion.div
                  key={`singly-${actionId}`}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  className="mt-3 h-1 rounded-full bg-blue-500"
                />
              ) : null}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricPanel label="Steps" value={metrics.singly.steps} />
            <MetricPanel label="Updates" value={metrics.singly.updates} />
            <MetricPanel label="Mem/Ptr" value={`${metrics.singly.memory}B`} />
          </div>
        </div>

        <div className="min-w-0 space-y-3 rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Doubly
            </span>
            <span className="text-xs font-medium text-slate-400">Powerful but Heavy</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="overflow-y-visible py-2">
              <div className="flex min-h-[4.5rem] w-max min-w-full items-center justify-center gap-1.5 px-1">
                {[1, 2, 3, 4].map((value, index) => (
                  <div key={`d-${value}`} className="flex items-center gap-1.5">
                    {index > 0 ? <ArrowLeft className="h-4 w-4 shrink-0 text-slate-600" /> : null}
                    <motion.div
                      animate={isActing && index === 2 ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                      className={cn(
                        "flex h-[4rem] w-[4.6rem] items-center justify-center rounded-[0.95rem] border border-slate-800 bg-slate-950 text-xl font-semibold",
                        index === 2 && "border-rose-400/40 text-rose-300"
                      )}
                    >
                      {value}
                    </motion.div>
                    {index < 3 ? <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" /> : null}
                  </div>
                ))}
              </div>
            </div>
            <AnimatePresence>
              {isActing ? (
                <motion.div
                  key={`doubly-${actionId}`}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  className="mt-3 h-1 rounded-full bg-emerald-500"
                />
              ) : null}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricPanel label="Steps" value={metrics.doubly.steps} accent="emerald" />
            <MetricPanel label="Updates" value={metrics.doubly.updates} accent="rose" />
            <MetricPanel label="Mem/Ptr" value={`${metrics.doubly.memory}B`} accent="rose" />
          </div>
        </div>
      </div>

      <div className="rounded-[1.1rem] border border-slate-800 bg-slate-900/50 px-4 py-4 text-sm text-slate-300">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Learning Outcome
        </p>
        <p className="mt-3">
          <strong>Singly:</strong> Fewer pointers mean less memory, but operations like deletion from a middle node are much more complex.
          <strong> Doubly:</strong> More memory and more pointer updates per operation, but any node can be deleted instantly without a search.
        </p>
      </div>
    </div>
  );
}

export function LinkedListTripleVisual() {
  const [activeTab, setActiveTab] = useState<"traversal" | "deletion" | "tradeoffs">("traversal");

  const tabs = [
    { id: "traversal", label: "Traversal Freedom", Icon: Maximize2 },
    { id: "deletion", label: "Deletion Reality", Icon: Trash2 },
    { id: "tradeoffs", label: "Cost Tradeoff", Icon: Database },
  ] as const;

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
        <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <Layers className="h-4 w-4 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Explore traversal, deletion, and pointer-cost tradeoffs without changing the underlying teaching flow.
            </p>

            <div className="mt-4 max-w-4xl rounded-xl border border-slate-800 bg-slate-900/40 p-0.5">
              <div className="grid gap-1 md:grid-cols-3">
                {tabs.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      activeTab === id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === "traversal" ? <TraversalFreedomSim /> : null}
          {activeTab === "deletion" ? <DeletionRealitySim /> : null}
          {activeTab === "tradeoffs" ? <CostTradeoffSim /> : null}
        </div>
    </section>
  );
}
