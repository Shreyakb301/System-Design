"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Code2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HashTab = "basic" | "collisions" | "rehash";

type HashFormula = {
  key: string;
  rawHash: number;
  size: number;
  index: number;
  action: string;
  status: string;
};

type CommonStep = {
  what: string;
  why: string;
  loadFactor: number;
  itemCount: number;
  bucketCount: number;
};

type BasicStep = CommonStep & {
  formula: HashFormula;
  buckets: string[][];
  activeIndices: number[];
  collisionIndices?: number[];
  foundIndices?: number[];
};

type CollisionStep = CommonStep & {
  formula: HashFormula;
  chainBuckets: string[][];
  chainActive: number[];
  chainCollision?: number[];
  chainOverflow?: number[];
  chainFoundKey?: string;
  chainPath: string;
  probingBuckets: (string | null)[];
  probingIndices: number[];
  probingFoundIndex?: number;
  probingCollisionAt?: number[];
  probingPathLabel: string;
};

type RehashStep = CommonStep & {
  summaryLabel: string;
  summaryValue: string;
  oldBuckets: string[][];
  newBuckets: string[][];
  oldSize: number;
  newSize: number;
  activeOldIndices?: number[];
  activeNewIndices?: number[];
  movedKey?: string;
  oldDimmed?: boolean;
  newTableActive?: boolean;
};

type DemoDefinition<TStep> = {
  tab: HashTab;
  tabLabel: string;
  badges: string[];
  code: string;
  steps: TStep[];
};

const BASIC_CODE = `class HashTable {
  constructor(size = 8) {
    this.buckets = new Array(size).fill(null);
    this.size = size;
    this.count = 0;
  }

  hash(key) {
    let hash = 0;
    for (const char of key) {
      hash = (hash * 31 + char.charCodeAt(0)) % this.size;
    }
    return hash;
  }

  insert(key, value) {
    const index = this.hash(key);     // O(1) - jump to bucket
    this.buckets[index] = { key, value };
    this.count++;
    if (this.count / this.size >= 0.75) this.rehash();
  }

  lookup(key) {
    const index = this.hash(key);     // same hash = same bucket
    return this.buckets[index];       // O(1) - direct access
  }
}`;

const CHAINING_CODE = `insert(key, value) {
  const index = this.hash(key);
  if (!this.buckets[index]) {
    this.buckets[index] = [];         // start a new chain
  }
  this.buckets[index].push({ key, value }); // append to chain
}

lookup(key) {
  const index = this.hash(key);
  const chain = this.buckets[index] || [];
  return chain.find(item => item.key === key); // scan chain
}`;

const REHASH_CODE = `rehash() {
  const old = this.buckets;
  this.size *= 2;                     // double the capacity
  this.buckets = new Array(this.size).fill(null);
  this.count = 0;

  for (const bucket of old) {
    if (bucket) {
      this.insert(bucket.key, bucket.value); // re-place every item
    }
  }
  // O(n) - but amortized O(1) per insert across all rehashes
}`;

const BASIC_DEMO: DemoDefinition<BasicStep> = {
  tab: "basic",
  tabLabel: "Insert & Lookup",
  badges: ["8 buckets", "Live hash computation", "Load factor updates live"],
  code: BASIC_CODE,
  steps: [
    {
      formula: {
        key: "apple",
        rawHash: 739837,
        size: 8,
        index: 5,
        action: "Insert",
        status: "Written to bucket 5",
      },
      buckets: [[], [], [], [], [], ["apple"], [], []],
      activeIndices: [5],
      itemCount: 1,
      bucketCount: 8,
      loadFactor: 1 / 8,
      what: "'apple' hashes to bucket 5. Written to index 5.",
      why: "The hash function converts the string to a large integer. Modulo 8 maps that integer into our table's range. The same key always produces the same index, which is what makes lookup possible.",
    },
    {
      formula: {
        key: "banana",
        rawHash: 820346,
        size: 8,
        index: 2,
        action: "Insert",
        status: "Written to bucket 2",
      },
      buckets: [[], [], ["banana"], [], [], ["apple"], [], []],
      activeIndices: [2],
      itemCount: 2,
      bucketCount: 8,
      loadFactor: 2 / 8,
      what: "'banana' hashes to bucket 2. Written to index 2.",
      why: "Different key, different hash, different bucket. No conflict. Direct access keeps insert O(1) on average.",
    },
    {
      formula: {
        key: "cherry",
        rawHash: 918029,
        size: 8,
        index: 5,
        action: "Insert",
        status: "Collision at bucket 5",
      },
      buckets: [[], [], ["banana"], [], [], ["apple", "cherry"], [], []],
      activeIndices: [5],
      collisionIndices: [5],
      itemCount: 3,
      bucketCount: 8,
      loadFactor: 3 / 8,
      what: "'cherry' also hashes to bucket 5. Collision with 'apple'.",
      why: "Two different keys can produce the same index. That is unavoidable because there are infinitely many keys but only 8 buckets. The collision strategy decides what happens next.",
    },
    {
      formula: {
        key: "banana",
        rawHash: 820346,
        size: 8,
        index: 2,
        action: "Search",
        status: "Found at bucket 2",
      },
      buckets: [[], [], ["banana"], [], [], ["apple", "cherry"], [], []],
      activeIndices: [2],
      foundIndices: [2],
      itemCount: 3,
      bucketCount: 8,
      loadFactor: 3 / 8,
      what: "hash('banana') -> bucket 2. 'banana' is there. Return value.",
      why: "The same key always hashes to the same bucket. Lookup is just: hash the key, jump to that index, and check. No scanning across the whole table.",
    },
    {
      formula: {
        key: "grape",
        rawHash: 66001,
        size: 8,
        index: 1,
        action: "Search",
        status: "Bucket 1 is empty",
      },
      buckets: [[], [], ["banana"], [], [], ["apple", "cherry"], [], []],
      activeIndices: [1],
      itemCount: 3,
      bucketCount: 8,
      loadFactor: 3 / 8,
      what: "hash('grape') -> bucket 1. Bucket is empty. Return null.",
      why: "An empty bucket is an immediate miss. You do not need to check other buckets. That direct miss is part of the O(1) average lookup guarantee.",
    },
  ],
};

const COLLISION_DEMO: DemoDefinition<CollisionStep> = {
  tab: "collisions",
  tabLabel: "Chaining",
  badges: ["8 buckets", "All keys hash to bucket 3", "Chaining vs linear probing"],
  code: CHAINING_CODE,
  steps: [
    {
      formula: {
        key: "apple",
        rawHash: 73003,
        size: 8,
        index: 3,
        action: "Insert",
        status: "Bucket 3 is empty",
      },
      chainBuckets: [[], [], [], ["apple"], [], [], [], []],
      chainActive: [3],
      chainPath: "Bucket 3 -> [apple]",
      probingBuckets: [null, null, null, "apple", null, null, null, null],
      probingIndices: [3],
      probingPathLabel: "Probe path: 3",
      itemCount: 1,
      bucketCount: 8,
      loadFactor: 1 / 8,
      what: "First item in bucket 3. No conflict.",
      why: "Chaining stores items as a linked list inside each bucket. One item means a list of length 1. Linear probing also writes directly because bucket 3 is open.",
    },
    {
      formula: {
        key: "mango",
        rawHash: 73011,
        size: 8,
        index: 3,
        action: "Insert",
        status: "Collision at bucket 3",
      },
      chainBuckets: [[], [], [], ["apple", "mango"], [], [], [], []],
      chainActive: [3],
      chainCollision: [3],
      chainPath: "Bucket 3 -> [apple -> mango]",
      probingBuckets: [null, null, null, "apple", "mango", null, null, null],
      probingIndices: [3, 4],
      probingCollisionAt: [3],
      probingPathLabel: "Probe path: 3 -> 4",
      itemCount: 2,
      bucketCount: 8,
      loadFactor: 2 / 8,
      what: "'mango' also maps to bucket 3. Chaining appends it. Linear probing stores it at index 4.",
      why: "Chaining keeps the bucket index fixed and grows a short list at that index. Linear probing walks forward until it finds an open slot, so the key lives in a different bucket than its original hash result.",
    },
    {
      formula: {
        key: "peach",
        rawHash: 73019,
        size: 8,
        index: 3,
        action: "Insert",
        status: "A third collision hits bucket 3",
      },
      chainBuckets: [[], [], [], ["apple", "mango", "peach"], [], [], [], []],
      chainActive: [3],
      chainCollision: [3],
      chainOverflow: [3],
      chainPath: "Bucket 3 -> [apple -> mango -> peach]",
      probingBuckets: [null, null, null, "apple", "mango", "peach", null, null],
      probingIndices: [3, 4, 5],
      probingCollisionAt: [3, 4],
      probingPathLabel: "Probe path: 3 -> 4 -> 5",
      itemCount: 3,
      bucketCount: 8,
      loadFactor: 3 / 8,
      what: "'peach' collides again. The chain grows, while linear probing pushes farther to index 5.",
      why: "This is the key tradeoff. Chaining turns one bucket into a short list. Linear probing creates clustering, where nearby buckets fill together and future probe sequences get longer.",
    },
    {
      formula: {
        key: "mango",
        rawHash: 73011,
        size: 8,
        index: 3,
        action: "Search",
        status: "Lookup follows the collision path",
      },
      chainBuckets: [[], [], [], ["apple", "mango", "peach"], [], [], [], []],
      chainActive: [3],
      chainCollision: [3],
      chainOverflow: [3],
      chainFoundKey: "mango",
      chainPath: "Chain scan: apple != mango, then mango = mango",
      probingBuckets: [null, null, null, "apple", "mango", "peach", null, null],
      probingIndices: [3, 4],
      probingFoundIndex: 4,
      probingCollisionAt: [3],
      probingPathLabel: "Probe path: 3 -> 4 (found)",
      itemCount: 3,
      bucketCount: 8,
      loadFactor: 3 / 8,
      what: "hash('mango') -> bucket 3. Chaining scans the bucket list; probing checks 3 then 4. Both find 'mango'.",
      why: "Chaining degrades to O(k) inside one bucket when a chain gets long. Linear probing must replay the same probe sequence used during insert, which is why deletions need tombstones in real implementations.",
    },
  ],
};

const REHASH_DEMO: DemoDefinition<RehashStep> = {
  tab: "rehash",
  tabLabel: "Rehashing",
  badges: ["Threshold = 0.75", "Table doubles when crowded", "Rehashing is O(n)"],
  code: REHASH_CODE,
  steps: [
    {
      summaryLabel: "Threshold reached",
      summaryValue: "3 items / 4 buckets = 0.75",
      oldBuckets: [[], ["apple"], ["banana"], ["plum"]],
      newBuckets: [[], [], [], [], [], [], [], []],
      oldSize: 4,
      newSize: 8,
      itemCount: 3,
      bucketCount: 4,
      loadFactor: 3 / 4,
      what: "Three items already live in a 4-bucket table. Load factor = 3/4 = 0.75.",
      why: "0.75 is the standard rehash threshold. At this density, collisions become frequent enough to degrade average O(1) operations toward O(n). Time to grow.",
    },
    {
      summaryLabel: "Allocate the new table",
      summaryValue: "New capacity = 8 buckets",
      oldBuckets: [[], ["apple"], ["banana"], ["plum"]],
      newBuckets: [[], [], [], [], [], [], [], []],
      oldSize: 4,
      newSize: 8,
      activeOldIndices: [1, 2, 3],
      oldDimmed: true,
      newTableActive: true,
      itemCount: 0,
      bucketCount: 8,
      loadFactor: 0,
      what: "The table doubles from 4 to 8 buckets. A new empty table is allocated.",
      why: "Doubling is the standard growth strategy. It keeps the amortized cost of inserts at O(1) because rehashing happens only occasionally as the table fills.",
    },
    {
      summaryLabel: "Move item 1",
      summaryValue: "banana -> hash % 8 = 2",
      oldBuckets: [[], ["apple"], ["banana"], ["plum"]],
      newBuckets: [[], [], ["banana"], [], [], [], [], []],
      oldSize: 4,
      newSize: 8,
      activeOldIndices: [2],
      activeNewIndices: [2],
      movedKey: "banana",
      oldDimmed: true,
      newTableActive: true,
      itemCount: 1,
      bucketCount: 8,
      loadFactor: 1 / 8,
      what: "Every existing item is re-hashed with % 8 and placed into the new table. First: 'banana' lands in bucket 2.",
      why: "Changing the table size changes every possible bucket index. That is why rehashing is O(n): every existing item must be re-placed.",
    },
    {
      summaryLabel: "Move item 2",
      summaryValue: "apple -> hash % 8 = 5",
      oldBuckets: [[], ["apple"], ["banana"], ["plum"]],
      newBuckets: [[], [], ["banana"], [], [], ["apple"], [], []],
      oldSize: 4,
      newSize: 8,
      activeOldIndices: [1],
      activeNewIndices: [5],
      movedKey: "apple",
      oldDimmed: true,
      newTableActive: true,
      itemCount: 2,
      bucketCount: 8,
      loadFactor: 2 / 8,
      what: "'apple' is re-hashed for the larger table and now lands in bucket 5.",
      why: "The modulo uses the table size. When the size changes from 4 to 8, bucket indices change too, so items spread out again.",
    },
    {
      summaryLabel: "Move item 3",
      summaryValue: "plum -> hash % 8 = 7",
      oldBuckets: [[], ["apple"], ["banana"], ["plum"]],
      newBuckets: [[], [], ["banana"], [], [], ["apple"], [], ["plum"]],
      oldSize: 4,
      newSize: 8,
      activeOldIndices: [3],
      activeNewIndices: [7],
      movedKey: "plum",
      oldDimmed: true,
      newTableActive: true,
      itemCount: 3,
      bucketCount: 8,
      loadFactor: 3 / 8,
      what: "'plum' re-hashes into bucket 7. The new table is almost rebuilt.",
      why: "This O(n) cost is real, but it is paid rarely. The work is spread across all future inserts, which is why overall insert performance is amortized O(1).",
    },
    {
      summaryLabel: "Rehash complete",
      summaryValue: "3 items / 8 buckets = 0.38",
      oldBuckets: [[], ["apple"], ["banana"], ["plum"]],
      newBuckets: [[], [], ["banana"], [], [], ["apple"], [], ["plum"]],
      oldSize: 4,
      newSize: 8,
      activeNewIndices: [2, 5, 7],
      oldDimmed: true,
      newTableActive: true,
      itemCount: 3,
      bucketCount: 8,
      loadFactor: 3 / 8,
      what: "Rehash complete. The old table is discarded and the new 8-bucket table becomes active.",
      why: "Load factor dropped to 0.38, so collisions are rare again and average O(1) lookup resumes. That is why rehashing exists in the first place.",
    },
  ],
};

const DEMO_MAP = {
  basic: BASIC_DEMO,
  collisions: COLLISION_DEMO,
  rehash: REHASH_DEMO,
} as const;

const TAB_ORDER: HashTab[] = ["basic", "collisions", "rehash"];

function loadFactorTone(loadFactor: number) {
  if (loadFactor > 0.75) {
    return {
      text: "text-red-200",
      border: "border-red-500/20",
      bg: "bg-red-500/10",
      fill: "bg-red-500",
    };
  }

  if (loadFactor >= 0.5) {
    return {
      text: "text-amber-200",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      fill: "bg-amber-500",
    };
  }

  return {
    text: "text-emerald-200",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    fill: "bg-emerald-500",
  };
}

function formatLoadFactor(loadFactor: number) {
  return loadFactor.toFixed(2);
}

function HashChip({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
        highlight
          ? "border-emerald-400/30 bg-emerald-500/14 text-emerald-200"
          : "border-slate-700 bg-slate-950 text-slate-300"
      )}
    >
      {label}
    </span>
  );
}

function HashFormulaPanel({ formula }: { formula: HashFormula }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          key -&gt; hash(key) -&gt; % table size -&gt; bucket index
        </p>
        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">
          {formula.action}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Key</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{formula.key}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">hash(key)</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{formula.rawHash}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">% {formula.size}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{formula.index}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Result</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{formula.status}</p>
        </div>
      </div>
    </div>
  );
}

function LoadFactorBar({
  itemCount,
  bucketCount,
  loadFactor,
}: {
  itemCount: number;
  bucketCount: number;
  loadFactor: number;
}) {
  const tone = loadFactorTone(loadFactor);

  return (
    <div className={cn("rounded-2xl border p-3", tone.border, tone.bg)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Load factor = items / buckets
        </p>
        <span className={cn("text-xs font-semibold", tone.text)}>
          {itemCount} / {bucketCount} = {formatLoadFactor(loadFactor)}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950">
        <motion.div
          animate={{ width: `${Math.min(loadFactor, 1) * 100}%` }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className={cn("h-full rounded-full", tone.fill)}
        />
      </div>
    </div>
  );
}

function BucketGrid({
  title,
  subtitle,
  size,
  buckets,
  activeIndices = [],
  collisionIndices = [],
  overflowIndices = [],
  foundIndices = [],
  foundKey,
  pathText,
  faded = false,
  chainStyle = false,
}: {
  title: string;
  subtitle: string;
  size: number;
  buckets: string[][];
  activeIndices?: number[];
  collisionIndices?: number[];
  overflowIndices?: number[];
  foundIndices?: number[];
  foundKey?: string;
  pathText?: string;
  faded?: boolean;
  chainStyle?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-3",
        faded && "opacity-55"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        {pathText ? (
          <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {pathText}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-3 grid min-h-0 flex-1 auto-rows-fr gap-2 overflow-hidden",
          size === 4 ? "grid-cols-4" : "grid-cols-4"
        )}
      >
        {Array.from({ length: size }, (_, index) => {
          const items = buckets[index] ?? [];
          const isFound = foundIndices.includes(index);
          const isOverflow = overflowIndices.includes(index);
          const isCollision = collisionIndices.includes(index);
          const isActive = activeIndices.includes(index);
          const toneClass = isFound
            ? "border-emerald-400/60 bg-emerald-500/12"
            : isOverflow
              ? "border-red-400/60 bg-red-500/12"
              : isCollision
                ? "border-amber-400/60 bg-amber-500/12"
                : isActive || items.length > 0
                  ? "border-blue-400/45 bg-blue-500/10"
                  : "border-slate-800 bg-slate-950";
          const label = isFound
            ? "FOUND"
            : isOverflow
              ? "OVERLOAD"
              : isCollision
                ? "COLLISION"
                : isActive && items.length === 0
                  ? "EMPTY"
                  : items.length > 0
                    ? "OCCUPIED"
                    : "";

          return (
            <motion.div
              key={`${title}-${index}-${items.join("-") || "empty"}`}
              layout
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className={cn("flex min-h-0 flex-col rounded-xl border p-2", toneClass)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {index}
                </span>
                {label ? (
                  <span
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-[0.16em]",
                      isFound
                        ? "text-emerald-200"
                        : isOverflow
                          ? "text-red-200"
                          : isCollision
                            ? "text-amber-200"
                            : "text-blue-200"
                    )}
                  >
                    {label}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex min-h-0 flex-1 flex-wrap items-start gap-1.5 overflow-hidden">
                {items.length === 0 ? (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Empty</span>
                ) : chainStyle && items.length > 1 ? (
                  items.map((item, itemIndex) => (
                    <div key={`${index}-${item}`} className="flex items-center gap-1">
                      <HashChip label={item} highlight={item === foundKey} />
                      {itemIndex < items.length - 1 ? (
                        <ArrowRight className="h-3 w-3 text-slate-600" strokeWidth={2} />
                      ) : null}
                    </div>
                  ))
                ) : (
                  items.map((item) => (
                    <HashChip key={`${index}-${item}`} label={item} highlight={item === foundKey} />
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RehashView({ step }: { step: RehashStep }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Rehash phase
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{step.summaryLabel}</p>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            {step.summaryValue}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <BucketGrid
          title="Old table"
          subtitle={`${step.oldSize} buckets`}
          size={step.oldSize}
          buckets={step.oldBuckets}
          activeIndices={step.activeOldIndices}
          faded={step.oldDimmed}
        />
        <BucketGrid
          title="New table"
          subtitle={`${step.newSize} buckets`}
          size={step.newSize}
          buckets={step.newBuckets}
          activeIndices={step.activeNewIndices}
          foundIndices={step.activeNewIndices}
        />
      </div>
    </div>
  );
}

export function HashTableVisual() {
  const [activeTab, setActiveTab] = useState<HashTab>("basic");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demo = DEMO_MAP[activeTab];
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

  function selectTab(nextTab: HashTab) {
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
    <section className="relative flex h-auto min-h-[1320px] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 text-slate-100 shadow-xl sm:min-h-[900px]">
      <div className="absolute left-0 top-0 h-1 w-full bg-blue-400" />

      <div className="flex h-[88px] shrink-0 flex-col justify-center gap-3 border-b border-slate-800 px-4 sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {TAB_ORDER.map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => selectTab(tabKey)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tabKey
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {DEMO_MAP[tabKey].tabLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-200 hover:bg-blue-500/10">
            O(1) avg time
          </Badge>
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10">
            O(n) space
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

        <LoadFactorBar
          itemCount={step.itemCount}
          bucketCount={step.bucketCount}
          loadFactor={step.loadFactor}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-3">
        {activeTab === "basic" ? (
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
            <div className="shrink-0">
              <HashFormulaPanel formula={(step as BasicStep).formula} />
            </div>
            <BucketGrid
              title="Table view"
              subtitle="8 buckets indexed 0-7"
              size={8}
              buckets={(step as BasicStep).buckets}
              activeIndices={(step as BasicStep).activeIndices}
              collisionIndices={(step as BasicStep).collisionIndices}
              foundIndices={(step as BasicStep).foundIndices}
              chainStyle
            />
          </div>
        ) : null}

        {activeTab === "collisions" ? (
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
            <div className="shrink-0">
              <HashFormulaPanel formula={(step as CollisionStep).formula} />
            </div>
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
              <BucketGrid
                title="Chaining"
                subtitle="Collisions stay in bucket 3 as a short list"
                size={8}
                buckets={(step as CollisionStep).chainBuckets}
                activeIndices={(step as CollisionStep).chainActive}
                collisionIndices={(step as CollisionStep).chainCollision}
                overflowIndices={(step as CollisionStep).chainOverflow}
                foundKey={(step as CollisionStep).chainFoundKey}
                pathText={(step as CollisionStep).chainPath}
                chainStyle
              />
              <BucketGrid
                title="Linear probing"
                subtitle="Collisions walk forward to the next open slot"
                size={8}
                buckets={(step as CollisionStep).probingBuckets.map((item) => (item ? [item] : []))}
                activeIndices={(step as CollisionStep).probingIndices}
                collisionIndices={(step as CollisionStep).probingCollisionAt}
                foundIndices={
                  typeof (step as CollisionStep).probingFoundIndex === "number"
                    ? [(step as CollisionStep).probingFoundIndex as number]
                    : []
                }
                pathText={(step as CollisionStep).probingPathLabel}
              />
            </div>
          </div>
        ) : null}

        {activeTab === "rehash" ? <RehashView step={step as RehashStep} /> : null}
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

      <div className="shrink-0 px-4 py-3 sm:h-[208px] sm:px-5 sm:py-2">
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
