"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Cpu, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const CELL_BYTES = 4;
const TOTAL_CELLS = 16;
const RAM_BYTES = TOTAL_CELLS * CELL_BYTES;
const INITIAL_BASE_ADDRESS = 0x100;
const ALTERNATE_BASE_ADDRESS = 0x120;
const MAX_CAPACITY = 16;
const DEFAULT_VALUES = [18, 55, 77, 36];
const STATIC_CAPACITY = DEFAULT_VALUES.length;
const DYNAMIC_INITIAL_CAPACITY = 8;
const VALUE_SEQUENCE = [18, 55, 77, 36, 91, 42, 63, 28, 74, 11, 57, 88, 96, 33, 67, 52];

type Mode = "static" | "dynamic";
type RenderCellKind =
  | "active"
  | "active-empty"
  | "preview"
  | "preview-empty";

interface PreviewBlock {
  baseAddress: number;
  capacity: number;
  copiedCount: number;
}

interface HoveredCell {
  index: number;
  address: number;
  baseAddress: number;
  value: number | null;
  kind: RenderCellKind;
}

interface RenderCell {
  address: number;
  indexLabel: number;
  value: number | null;
  kind: RenderCellKind;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatAddress(address: number) {
  return `0x${address.toString(16).toUpperCase()}`;
}

function getValueForIndex(index: number) {
  return VALUE_SEQUENCE[index] ?? 100 + index * 7;
}

function getInitialCapacity(mode: Mode) {
  return mode === "static" ? STATIC_CAPACITY : DYNAMIC_INITIAL_CAPACITY;
}

export function ArrayMemorySimulation() {
  const [mode, setMode] = useState<Mode>("static");
  const [arrayValues, setArrayValues] = useState<number[]>(DEFAULT_VALUES);
  const [capacity, setCapacity] = useState(STATIC_CAPACITY);
  const [baseAddress, setBaseAddress] = useState(INITIAL_BASE_ADDRESS);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previewBlock, setPreviewBlock] = useState<PreviewBlock | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);

  const arraySize = arrayValues.length;
  const isFull = arraySize === capacity;
  const visibleBlock = previewBlock
    ? {
        baseAddress: previewBlock.baseAddress,
        capacity: previewBlock.capacity,
        filledCount: previewBlock.copiedCount,
        filledKind: "preview" as const,
        emptyKind: "preview-empty" as const,
      }
    : {
        baseAddress,
        capacity: mode === "static" ? arraySize : capacity,
        filledCount: arraySize,
        filledKind: "active" as const,
        emptyKind: "active-empty" as const,
      };

  const visibleSlots = Math.min(visibleBlock.capacity, TOTAL_CELLS);

  const renderCells: RenderCell[] = Array.from({ length: visibleSlots }, (_, index) => ({
      address: visibleBlock.baseAddress + index * CELL_BYTES,
      indexLabel: index,
      value: index < visibleBlock.filledCount ? arrayValues[index] ?? null : null,
      kind:
        index < visibleBlock.filledCount ? visibleBlock.filledKind : visibleBlock.emptyKind,
    }));

  const fallbackIndex = arraySize > 0 ? arraySize - 1 : 0;
  const focusedCell =
    hoveredCell ??
    ({
      index: fallbackIndex,
      address: baseAddress + fallbackIndex * CELL_BYTES,
      baseAddress,
      value: arrayValues[fallbackIndex] ?? null,
      kind: arrayValues.length > 0 ? "active" : "active-empty",
    } satisfies HoveredCell);

  const nextAppendValue = getValueForIndex(arrayValues.length);
  const helperText = isAnimating
    ? "Dynamic arrays resize by allocating a larger block and copying elements."
    : mode === "static"
      ? "Static arrays cannot grow after allocation."
      : isFull && capacity >= MAX_CAPACITY
        ? "This demo reached its maximum dynamic capacity."
      : isFull
        ? "Capacity is full. The next append allocates a larger contiguous block."
        : "Dynamic arrays keep spare capacity, so the next append fills the next open slot.";

  function resetSimulation(nextMode = mode) {
    setPreviewBlock(null);
    setHoveredCell(null);
    setBaseAddress(INITIAL_BASE_ADDRESS);
    setArrayValues(DEFAULT_VALUES);
    setCapacity(getInitialCapacity(nextMode));
    setIsAnimating(false);
  }

  function switchMode(nextMode: Mode) {
    if (isAnimating || mode === nextMode) {
      return;
    }

    setMode(nextMode);
    resetSimulation(nextMode);
  }

  async function handleAdd() {
    if (isAnimating) {
      return;
    }

    if (mode === "static" && arraySize === capacity) {
      return;
    }

    if (arraySize < capacity) {
      const nextValue = nextAppendValue;
      const nextIndex = arraySize;

      setArrayValues((currentValues) => [...currentValues, nextValue]);
      setHoveredCell({
        index: nextIndex,
        address: baseAddress + nextIndex * CELL_BYTES,
        baseAddress,
        value: nextValue,
        kind: "active",
      });
      return;
    }

    if (mode === "static") {
      return;
    }

    if (capacity >= MAX_CAPACITY) {
      return;
    }

    await handleResize(nextAppendValue);
  }

  async function handleResize(appendedValue: number) {
    const currentValues = [...arrayValues];
    const nextCapacity = capacity * 2;
    const nextBaseAddress =
      baseAddress === INITIAL_BASE_ADDRESS ? ALTERNATE_BASE_ADDRESS : INITIAL_BASE_ADDRESS;

    setIsAnimating(true);
    setPreviewBlock({
      baseAddress: nextBaseAddress,
      capacity: nextCapacity,
      copiedCount: 0,
    });
    setHoveredCell(null);
    await wait(900);

    for (let index = 0; index < currentValues.length; index += 1) {
      setPreviewBlock((currentPreview) =>
        currentPreview ? { ...currentPreview, copiedCount: index + 1 } : currentPreview
      );
      setHoveredCell({
        index,
        address: nextBaseAddress + index * CELL_BYTES,
        baseAddress: nextBaseAddress,
        value: currentValues[index],
        kind: "preview",
      });
      await wait(450);
    }

    await wait(700);

    setBaseAddress(nextBaseAddress);
    setCapacity(nextCapacity);
    setArrayValues([...currentValues, appendedValue]);
    setPreviewBlock(null);
    setHoveredCell({
      index: currentValues.length,
      address: nextBaseAddress + currentValues.length * CELL_BYTES,
      baseAddress: nextBaseAddress,
      value: appendedValue,
      kind: "active",
    });
    await wait(700);

    await wait(800);

    setIsAnimating(false);
  }

  const formulaResult = focusedCell.baseAddress + focusedCell.index * CELL_BYTES;
  const focusedValueLabel = focusedCell.value !== null ? focusedCell.value.toString() : "empty";
  const appendDisabled =
    isAnimating ||
    (mode === "static" && isFull) ||
    (mode === "dynamic" && isFull && capacity >= MAX_CAPACITY);

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-5 text-slate-100 shadow-xl sm:px-6 sm:py-6">
        <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <Cpu className="h-4 w-4 text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Switch between static and dynamic arrays to compare a fixed contiguous block
              with one that keeps spare capacity for future appends.
            </p>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-1">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  disabled={isAnimating}
                  onClick={() => switchMode("static")}
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors",
                    mode === "static" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  Static
                </button>
                <button
                  type="button"
                  disabled={isAnimating}
                  onClick={() => switchMode("dynamic")}
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors",
                    mode === "dynamic" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  Dynamic
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span>RAM: {RAM_BYTES} bytes</span>
              <span>{CELL_BYTES} bytes per cell</span>
              {mode === "dynamic" && (
                <>
                  <span>Size: {arraySize}</span>
                  <span>Capacity: {capacity}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-slate-800 bg-slate-900/40 p-3">
          <div className="overflow-x-auto pb-1">
            <div className="flex w-max min-w-full justify-start gap-1 pr-2">
              {renderCells.map((cell) => {
                const hoverPayload = {
                  index: cell.indexLabel,
                  address: cell.address,
                  baseAddress:
                    cell.kind === "preview" || cell.kind === "preview-empty"
                      ? previewBlock?.baseAddress ?? baseAddress
                      : baseAddress,
                  value: cell.value,
                  kind: cell.kind,
                };

                return (
                  <Tooltip key={cell.address}>
                    <TooltipTrigger asChild>
                      <motion.button
                        layout
                        type="button"
                        onMouseEnter={() => setHoveredCell(hoverPayload)}
                        onFocus={() => setHoveredCell(hoverPayload)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onBlur={() => setHoveredCell(null)}
                        className={cn(
                          "relative h-[3.6rem] w-[3.25rem] rounded-[0.8rem] border px-1 py-1 text-left transition-all duration-300",
                          cell.kind === "active" && "border-slate-700 bg-slate-900",
                          cell.kind === "active-empty" && "border-slate-800 bg-slate-900/70",
                          cell.kind === "preview" && "border-blue-500/45 bg-blue-500/5",
                          cell.kind === "preview-empty" && "border-blue-500/25 bg-blue-500/5",
                          hoveredCell?.address === cell.address && "border-blue-400 bg-blue-500/8"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[7px] font-medium",
                              "bg-slate-950 text-slate-300"
                            )}
                          >
                            {`idx ${cell.indexLabel}`}
                          </span>
                          <span className="text-[7px] text-slate-500">
                            {formatAddress(cell.address)}
                          </span>
                        </div>

                        <div className="mt-1.5 flex h-5 items-center justify-center">
                          {cell.value !== null ? (
                            <motion.span
                              key={`${cell.address}-${cell.value}`}
                              initial={{ opacity: 0, scale: 0.8, y: 6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="text-[1.1rem] font-semibold tracking-tight text-white"
                            >
                              {cell.value}
                            </motion.span>
                          ) : cell.kind === "active-empty" || cell.kind === "preview-empty" ? (
                            <span className="text-[7px] font-medium uppercase tracking-[0.16em] text-slate-500">
                              empty
                            </span>
                          ) : null}
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent
                      sideOffset={8}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 shadow-xl"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold text-slate-100">{`Index ${cell.indexLabel}`}</div>
                        <div className="text-slate-400">Address: {formatAddress(cell.address)}</div>
                        <div className="text-slate-400">
                          Value: {cell.value !== null ? cell.value : "empty"}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-400">{helperText}</p>

        <div className="mt-6 space-y-3 border-t border-slate-800 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Address Formula
          </p>
          <p className="text-sm text-slate-400">
            Address = BasePointer + (index x element_size)
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
            <span>Base pointer: {formatAddress(baseAddress)}</span>
            <span>Selected index: {focusedCell.index}</span>
            <span>Selected value: {focusedValueLabel}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 font-mono text-sm text-slate-100">
            {formatAddress(focusedCell.baseAddress)} + ({focusedCell.index} x {CELL_BYTES}) ={" "}
            {formatAddress(formulaResult)}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <div className="flex flex-wrap gap-3">
            <Button
              className="h-11 rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-500"
              onClick={handleAdd}
              disabled={appendDisabled}
            >
              <Plus className="h-4 w-4" />
              Append {nextAppendValue}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-700 bg-transparent px-5 text-slate-200 hover:bg-slate-900 hover:text-white"
              onClick={() => resetSimulation()}
              disabled={isAnimating}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
    </section>
  );
}
