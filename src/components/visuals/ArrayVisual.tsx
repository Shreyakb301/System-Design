"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, Plus, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INITIAL_VALUES = [10, 20, 30, 40];
const INITIAL_CAPACITY = 8;

interface ArrayItem {
  id: number;
  value: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildInitialItems() {
  return INITIAL_VALUES.map((value, index) => ({
    id: index + 1,
    value,
  }));
}

function parseInteger(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function ArrayVisual() {
  const [items, setItems] = useState<ArrayItem[]>(() => buildInitialItems());
  const [capacity, setCapacity] = useState(INITIAL_CAPACITY);
  const [inputValue, setInputValue] = useState("");
  const [searchTarget, setSearchTarget] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [insight, setInsight] = useState(
    "Push and pop only touch the last filled slot. Shift and unshift move every remaining value, so they cost O(n)."
  );
  const nextId = useRef(INITIAL_VALUES.length + 1);

  const parsedInputValue = parseInteger(inputValue);
  const parsedSearchTarget = parseInteger(searchTarget);

  const slots = Array.from({ length: capacity }, (_, index) => ({
    index,
    item: items[index] ?? null,
    isActive: activeSearchIndex === index,
    isFound: foundIndex === index,
  }));

  function clearHighlights() {
    setActiveSearchIndex(null);
    setFoundIndex(null);
  }

  function ensureCapacity(nextSize: number) {
    setCapacity((currentCapacity) =>
      nextSize > currentCapacity ? currentCapacity * 2 : currentCapacity
    );
  }

  function resetDemo() {
    setItems(buildInitialItems());
    setCapacity(INITIAL_CAPACITY);
    setInputValue("");
    setSearchTarget("");
    clearHighlights();
    setIsSearching(false);
    setInsight(
      "Push and pop only touch the last filled slot. Shift and unshift move every remaining value, so they cost O(n)."
    );
    nextId.current = INITIAL_VALUES.length + 1;
  }

  function push() {
    if (parsedInputValue === null || isSearching) {
      return;
    }

    clearHighlights();
    ensureCapacity(items.length + 1);
    setItems((currentItems) => [
      ...currentItems,
      { id: nextId.current++, value: parsedInputValue },
    ]);
    setInputValue("");
    setInsight("Push adds one value at the end, so the existing cells stay in place. That is why push is O(1).");
  }

  function pop() {
    if (!items.length || isSearching) {
      return;
    }

    clearHighlights();
    setItems((currentItems) => currentItems.slice(0, -1));
    setInsight("Pop removes the last value only. No other element has to move, so pop stays O(1).");
  }

  function unshift() {
    if (parsedInputValue === null || isSearching) {
      return;
    }

    clearHighlights();
    ensureCapacity(items.length + 1);
    setItems((currentItems) => [
      { id: nextId.current++, value: parsedInputValue },
      ...currentItems,
    ]);
    setInputValue("");
    setInsight(
      "Unshift inserts at index 0, so every existing element slides one slot to the right. That full-row movement makes it O(n)."
    );
  }

  function shift() {
    if (!items.length || isSearching) {
      return;
    }

    clearHighlights();
    setItems((currentItems) => currentItems.slice(1));
    setInsight(
      "Shift removes the front value, so every remaining element slides left to close the gap. That is why shift is O(n)."
    );
  }

  async function startSearch() {
    if (parsedSearchTarget === null || isSearching) {
      return;
    }

    const snapshot = [...items];

    clearHighlights();
    setIsSearching(true);
    setInsight(`Linear search checks one value at a time from left to right while looking for ${parsedSearchTarget}.`);

    for (let index = 0; index < snapshot.length; index += 1) {
      setActiveSearchIndex(index);
      await wait(450);

      if (snapshot[index]?.value === parsedSearchTarget) {
        setFoundIndex(index);
        setInsight(
          `Search found ${parsedSearchTarget} at index ${index} after checking ${index + 1} cells. Linear search is O(n).`
        );
        setIsSearching(false);
        return;
      }
    }

    setInsight(
      `Search checked all ${snapshot.length} cells and did not find ${parsedSearchTarget}. The worst case for search is O(n).`
    );
    setIsSearching(false);
    await wait(700);
    setActiveSearchIndex(null);
  }

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
        <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <ArrowRightLeft className="h-4 w-4 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Push and pop touch the end of the array. Shift and unshift touch the front,
              so every existing value has to move.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span>Size: {items.length}</span>
              <span>Capacity: {capacity}</span>
              <span>Search: O(n)</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-3">
          <div className="overflow-x-auto pb-1">
            <div className="flex w-max min-w-full justify-start gap-2 pr-2">
              <AnimatePresence initial={false} mode="popLayout">
                {slots.map((slot) => (
                  <motion.div
                    layout
                    key={slot.item ? slot.item.id : `empty-${slot.index}`}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className={cn(
                      "h-[5rem] w-[4.8rem] rounded-[0.9rem] border px-1.5 py-1.5",
                      slot.item ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-900/60",
                      slot.isActive && "border-blue-400 bg-blue-500/10",
                      slot.isFound && "border-blue-300 bg-blue-500/15"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-slate-950 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">
                        {`idx ${slot.index}`}
                      </span>
                    </div>

                    <div className="mt-2.5 flex h-7 items-center justify-center">
                      {slot.item ? (
                        <span className="text-[1.75rem] font-semibold tracking-tight text-white">
                          {slot.item.value}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
                          empty
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 border-t border-slate-800 pt-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Update Array
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Enter a value, then compare end operations against front operations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="number"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="New value"
                className="h-11 rounded-xl border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 sm:max-w-[170px]"
              />

              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Button
                  className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
                  onClick={push}
                  disabled={parsedInputValue === null || isSearching}
                >
                  <Plus className="h-4 w-4" />
                  Push (O(1))
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-blue-500/30 bg-blue-500/10 text-blue-100 hover:bg-blue-500/15 hover:text-white"
                  onClick={pop}
                  disabled={!items.length || isSearching}
                >
                  Pop (O(1))
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15 hover:text-amber-50"
                  onClick={unshift}
                  disabled={parsedInputValue === null || isSearching}
                >
                  Unshift (O(n))
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15 hover:text-amber-50"
                  onClick={shift}
                  disabled={!items.length || isSearching}
                >
                  Shift (O(n))
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Search
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Linear search checks one array element at a time from left to right.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                type="number"
                value={searchTarget}
                onChange={(event) => setSearchTarget(event.target.value)}
                placeholder="Find value"
                className="h-11 rounded-xl border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-slate-700 bg-transparent px-5 text-slate-200 hover:bg-slate-900 hover:text-white"
                  onClick={startSearch}
                  disabled={parsedSearchTarget === null || isSearching}
                >
                  <Search className="h-4 w-4" />
                  Search (O(n))
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-slate-700 bg-transparent px-5 text-slate-200 hover:bg-slate-900 hover:text-white"
                  onClick={resetDemo}
                  disabled={isSearching}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 border-t border-slate-800 pt-5 text-sm text-slate-400">
          {insight}
        </p>
    </section>
  );
}
