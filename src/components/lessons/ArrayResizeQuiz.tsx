"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const choices = [
  {
    label: "Shift every element one slot to the right inside the same block.",
    explanation:
      "Shifting changes positions, but it does not create new capacity. A full array still needs more memory before it can grow.",
  },
  {
    label: "Allocate a larger contiguous block, copy the old elements, then append the new value.",
    explanation:
      "Correct. Dynamic arrays grow by moving to a larger block when their current capacity is exhausted.",
  },
  {
    label: "Convert the array into a linked list so it can keep growing.",
    explanation:
      "Arrays and linked lists have different memory layouts. A dynamic array stays contiguous; it just reallocates to a larger block.",
  },
];

export function ArrayResizeQuiz() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isCorrect = selectedIndex === 1;

  return (
    <Card className="border-primary/10 bg-muted/20">
      <CardHeader>
        <CardTitle className="text-xl">Quick Check</CardTitle>
        <CardDescription>
          Capacity = 4 and size = 4. You append one more value. What should a dynamic
          array do next?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {choices.map((choice, index) => (
          <button
            key={choice.label}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
              selectedIndex === index
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {choice.label}
          </button>
        ))}

        <div
          className={cn(
            "rounded-lg border p-4 text-sm leading-6",
            selectedIndex === null && "border-dashed bg-background text-muted-foreground",
            selectedIndex !== null &&
              isCorrect &&
              "border-emerald-200 bg-emerald-50 text-emerald-900",
            selectedIndex !== null &&
              !isCorrect &&
              "border-amber-200 bg-amber-50 text-amber-900"
          )}
        >
          {selectedIndex === null
            ? "Pick an answer, then compare it with the memory simulation above."
            : choices[selectedIndex].explanation}
        </div>
      </CardContent>
    </Card>
  );
}
