import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrayMemorySimulation } from "@/components/visuals/ArrayMemorySimulation";
import { ArrayVisual } from "@/components/visuals/ArrayVisual";
import { ArrayResizeQuiz } from "./ArrayResizeQuiz";

const comparisonRows = [
  {
    aspect: "Size",
    staticArray: "Fixed when the array is created.",
    dynamicArray: "Changes as elements are added or removed.",
  },
  {
    aspect: "Memory allocation",
    staticArray: "One contiguous block sized exactly for the array.",
    dynamicArray: "One contiguous block plus extra capacity for future growth.",
  },
  {
    aspect: "Growth",
    staticArray: "Cannot grow automatically.",
    dynamicArray: "Allocates a larger block when capacity is full.",
  },
  {
    aspect: "Index access",
    staticArray: "O(1) direct address calculation.",
    dynamicArray: "O(1) direct address calculation.",
  },
  {
    aspect: "Append at end",
    staticArray: "O(1) only if spare space was manually reserved.",
    dynamicArray: "Amortized O(1); occasional O(n) resize.",
  },
  {
    aspect: "Typical examples",
    staticArray: "C arrays, fixed-size buffers.",
    dynamicArray: "Python list, Java ArrayList, C++ vector.",
  },
];

const operationRows = [
  {
    operation: "Push / Append",
    complexity: "Amortized O(1)",
    reason: "Usually writes into the next free slot. A resize makes one append cost O(n).",
  },
  {
    operation: "Pop",
    complexity: "O(1)",
    reason: "Removes the last element without shifting the rest of the array.",
  },
  {
    operation: "Shift / Unshift",
    complexity: "O(n)",
    reason: "Every element after index 0 must move one position.",
  },
  {
    operation: "Index access",
    complexity: "O(1)",
    reason: "The address is computed directly with base + index * element size.",
  },
  {
    operation: "Search",
    complexity: "O(n)",
    reason: "An unsorted array may require checking each element until a match is found.",
  },
];

const languageExamples = [
  {
    name: "C arrays",
    summary: "A classic static array.",
    details:
      "The size is fixed when memory is allocated. The compiler or programmer is responsible for managing the storage.",
  },
  {
    name: "Python lists",
    summary: "A dynamic array under the hood.",
    details:
      "Python over-allocates capacity so appends are usually cheap, even though the list may occasionally resize.",
  },
  {
    name: "Java ArrayList",
    summary: "A resizable array object.",
    details:
      "ArrayList stores elements in an internal array and grows by allocating a larger backing array and copying values.",
  },
  {
    name: "C++ vector",
    summary: "A contiguous dynamic array.",
    details:
      "vector keeps elements contiguous, supports fast indexing, and may invalidate pointers or iterators when it reallocates.",
  },
];

const resizeSteps = [
  "The dynamic array checks whether size === capacity before writing the new value.",
  "If the array is full, it requests a larger contiguous block of memory, often about 2x the old capacity.",
  "The runtime copies each existing element from the old block into the new block.",
  "The new value is written into the next open slot in the larger block.",
  "The old memory block can now be released, and the array points to the new base address.",
];

const takeaways = [
  "Arrays are fast at indexing because elements sit in contiguous memory.",
  "Static arrays keep a fixed size; dynamic arrays track both size and capacity.",
  "Dynamic resizing is expensive in one moment because it copies elements, but appends stay amortized O(1).",
  "Operations at the front of an array are costly because many elements must shift.",
  "Real language collections such as Python lists, Java ArrayList, and C++ vector all rely on the same resizing idea.",
];

export function ArraysLesson() {
  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Memory Model</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Arrays store data in contiguous memory
          </h2>
          <p className="leading-7 text-muted-foreground">
            An array keeps its elements in one continuous block of memory. If the base
            address is <code className="rounded bg-muted px-1 py-0.5">B</code> and each
            element uses <code className="rounded bg-muted px-1 py-0.5">s</code> bytes,
            then element <code className="rounded bg-muted px-1 py-0.5">i</code> lives at{" "}
            <code className="rounded bg-muted px-1 py-0.5">B + i * s</code>. That direct
            address calculation is why index access is <strong>O(1)</strong>: the runtime
            jumps straight to the slot instead of walking through earlier elements. Use the
            demo below to switch between static and dynamic modes, append values, and reset
            the example back to its starting state.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the tape</CardTitle>
              <CardDescription>
                The visualization is meant to be read from left to right.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Each cell is one array slot. The index is shown inside the cell, and the
                address increases by 4 bytes because this demo uses integers.
              </p>
              <p>
                The formula under the tape updates for the focused cell, showing exactly
                how the address is computed from the base pointer and index.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                The controls now map directly to the concepts on the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Switch to <strong>Static</strong> to see one fixed block that cannot grow
                after allocation.
              </p>
              <p>
                Switch to <strong>Dynamic</strong> to see spare capacity, then press{" "}
                <strong>Append</strong> until the array must resize into a larger
                contiguous block.
              </p>
              <p>
                Use <strong>Reset</strong> any time to return the current mode to its
                starting example.
              </p>
            </CardContent>
          </Card>
        </div>

        <ArrayMemorySimulation />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Static vs Dynamic</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Static arrays have fixed size. Dynamic arrays grow with capacity.
          </h2>
          <p className="leading-7 text-muted-foreground">
            A static array reserves exactly one block and cannot grow automatically.
            A dynamic array still uses contiguous memory, but it also tracks extra
            capacity so appends can be cheap until the block fills up. The simulator
            makes this difference visible immediately when you switch modes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Static array</CardTitle>
              <CardDescription>Useful when the maximum size is known ahead of time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>One allocation, fixed length, and no automatic resizing.</p>
              <p>Very predictable memory layout.</p>
              <p>Common in low-level systems code and fixed-size buffers.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dynamic array</CardTitle>
              <CardDescription>Useful when the number of elements changes over time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Tracks both current size and allocated capacity.</p>
              <p>Appends are fast until capacity is exhausted.</p>
              <p>When full, the array reallocates to a larger block and copies elements.</p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Static Array</th>
                <th className="px-4 py-3 font-semibold">Dynamic Array</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.staticArray}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.dynamicArray}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Resize Flow</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            What happens when a dynamic array runs out of capacity?
          </h2>
          <p className="leading-7 text-muted-foreground">
            In dynamic mode, the array stays contiguous, so it cannot simply spill into
            random free cells. When it fills up, it moves to a new, larger block.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-step resize</CardTitle>
              <CardDescription>
                Follow these steps while watching the memory simulation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {resizeSteps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <ArrayResizeQuiz />
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Operation Costs</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            End operations are cheap. Front operations are not.
          </h2>
          <p className="leading-7 text-muted-foreground">
            Use the interactive controls below to compare operations. Appending at the end
            usually touches one slot. Inserting or removing at the front forces many values
            to shift.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                Watch which side of the array changes after each operation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The row starts with sample values, and each cell represents one array
                slot in order.
              </p>
              <p>
                If only the last cell changes, the operation stays local. If the whole
                row shifts left or right, many elements had to move.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Compare end operations against front operations directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Press <strong>Push</strong> and <strong>Pop</strong> to see changes happen
                at the end of the row.
              </p>
              <p>
                Press <strong>Shift</strong> and <strong>Unshift</strong> to see every
                remaining value move, which is why these front operations cost{" "}
                <strong>O(n)</strong>.
              </p>
            </CardContent>
          </Card>
        </div>

        <ArrayVisual />

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Operation</th>
                <th className="px-4 py-3 font-semibold">Complexity</th>
                <th className="px-4 py-3 font-semibold">Why</th>
              </tr>
            </thead>
            <tbody>
              {operationRows.map((row) => (
                <tr key={row.operation} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.operation}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{row.complexity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Language Examples</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            The same ideas appear in real programming languages
          </h2>
          <p className="leading-7 text-muted-foreground">
            The syntax changes, but the memory model stays recognizable.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {languageExamples.map((example) => (
            <Card key={example.name}>
              <CardHeader>
                <CardTitle>{example.name}</CardTitle>
                <CardDescription>{example.summary}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {example.details}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Key Takeaways</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            The short version
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              {takeaways.map((takeaway) => (
                <li key={takeaway} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
