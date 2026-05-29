import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { FastSlowVisual } from "@/components/visuals/FastSlowVisual";

const naiveComparisonRows = [
  {
    aspect: "Cycle detection",
    naive: "Store every visited node in a set, check membership on each step",
    pattern: "Two pointers - if they ever meet, a cycle exists",
  },
  {
    aspect: "Time",
    naive: "O(n)",
    pattern: "O(n)",
  },
  {
    aspect: "Space",
    naive: "O(n) - stores every node",
    pattern: "O(1) - just two pointers",
  },
  {
    aspect: "Why it matters",
    naive: "Works, but memory grows with list size",
    pattern: "Memory is constant regardless of list size - no set needed",
  },
];

const comparisonRows = [
  {
    aspect: "Goal",
    middle: "Find the midpoint without counting",
    cycle: "Detect whether next pointers loop back",
  },
  {
    aspect: "Key moment",
    middle: "When fast reaches null",
    cycle: "When slow and fast land on the same node",
  },
  {
    aspect: "Why it works",
    middle: "Fast covers 2x the distance, so slow is halfway when fast finishes",
    cycle: "Inside a cycle, fast gains 1 node per step on slow - it must catch up",
  },
  {
    aspect: "Return value",
    middle: "slow (the middle node)",
    cycle: "true / false",
  },
  {
    aspect: "Complexity",
    middle: "O(n) time, O(1) space",
    cycle: "O(n) time, O(1) space",
  },
];

const takeaways = [
  "The entire pattern is one insight: fast covers twice the distance of slow in the same number of steps.",
  "Find Middle: when fast hits null, slow is at the exact midpoint - no length count needed.",
  "Detect Cycle: inside any loop, a pointer moving 2x faster than another must eventually lap it. Meeting = cycle.",
  "Both patterns use O(1) space - no array, no set, no visited map. Just two pointers.",
  "If the list is null or has one node, fast hits null immediately - handle that edge case first.",
];

export function FastSlowLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="rounded-[1.5rem] border bg-muted/40 p-6">
          <div className="space-y-3">
            <p className="max-w-4xl leading-7 text-foreground">
              The input is a linked list and you need to find the middle node, detect a
              cycle, or find where a cycle begins - without storing visited nodes. The
              speed difference is the entire trick.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            The speed difference beats the naive set approach without extra memory
          </h2>
          <p className="leading-7 text-muted-foreground">
            Fast and slow pointers matters because it solves linked-list problems in one
            pass without remembering every node you have seen. The speed gap is not just
            an implementation detail - it is the proof.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Naive (HashSet)</th>
                <th className="px-4 py-3 font-semibold">Fast &amp; Slow</th>
              </tr>
            </thead>
            <tbody>
              {naiveComparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.naive}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.pattern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm leading-7 text-muted-foreground">
          If a cycle exists, the fast pointer laps the slow pointer inside the loop - they
          must eventually land on the same node. That is the entire proof.
        </p>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            See the mechanic, then the reason behind it
          </h2>
          <p className="leading-7 text-muted-foreground">
            The card below uses the same structure as the two-pointers page: tabs,
            progress dots, step controls, side-by-side What / Why insight, and a fixed
            code panel. The linked-list motion is the only thing that changes.
          </p>
        </div>

        <FastSlowVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            One speed difference solves two classic linked-list problems
          </h2>
          <p className="leading-7 text-muted-foreground">
            The loop looks almost identical in both problems. The difference is what you
            are waiting for: null in one case, a meeting point in the other.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Find Middle</th>
                <th className="px-4 py-3 font-semibold">Detect Cycle</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.middle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.cycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">The short version</h2>
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
