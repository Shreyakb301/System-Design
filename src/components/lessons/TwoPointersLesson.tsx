import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TwoPointersVisual } from "@/components/visuals/TwoPointersVisual";

const comparisonRows = [
  {
    aspect: "Starting layout",
    opposite: "One at each end",
    same: "Both start left",
  },
  {
    aspect: "Decision rule",
    opposite: "Move the pointer whose side can be eliminated",
    same: "Move fast always; slow only on a new unique value",
  },
  {
    aspect: "Best for",
    opposite: "Pair sums, palindromes, container problems",
    same: "Deduplication, partitioning, in-place compaction",
  },
  {
    aspect: "Classic problems",
    opposite: "Two Sum II, Valid Palindrome, 3Sum",
    same: "Remove Duplicates, Move Zeroes, Merge Sorted Array",
  },
  {
    aspect: "Complexity",
    opposite: "O(n) time, O(1) space",
    same: "O(n) time, O(1) space",
  },
];

const takeaways = [
  "Reach for two pointers when the input is sorted and you need a pair or to compact an array.",
  "Opposite direction: each comparison tells you which side to discard. Search space provably shrinks every step.",
  "Same direction: fast reads every element; slow only advances on a new unique value. No backtracking.",
  "Both patterns: O(n) time, O(1) space. No extra array, no nested loop.",
  "If the array is unsorted, sort it first. O(n log n) sort is still far cheaper than O(n^2) brute force.",
];

export function TwoPointersLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="rounded-[1.5rem] border bg-muted/40 p-6">
          <div className="space-y-3">
            <p className="max-w-4xl leading-7 text-foreground">
              The input is a sorted array or string, or the problem asks you to find a
              pair or subarray satisfying a condition. If you catch yourself writing a
              nested loop to compare every pair, stop. Two pointers likely cuts it to
              one pass.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            The motivation should be clear before the demo starts
          </h2>
          <p className="leading-7 text-muted-foreground">
            Two pointers is worth learning because it replaces pair-by-pair brute force
            with a controlled one-pass rule. You are not just moving pointers around.
            You are using structure in the input to throw away work.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Brute force: O(n^2)</CardTitle>
              <CardDescription>
                Nested loop. Check every pair. About 500K comparisons on n = 1,000.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>You compare one element against every other candidate.</p>
              <p>The work grows quadratically because the search space is never discarded.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two pointers: O(n)</CardTitle>
              <CardDescription>
                One pass. Each pointer moves at most n times. About 1K comparisons on n = 1,000.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>Every comparison gives you a rule for what can be safely ignored next.</p>
              <p>The total movement is linear because the pointers never need to backtrack.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            See the move, then see the reason behind it
          </h2>
          <p className="leading-7 text-muted-foreground">
            The demo is split into the two core variants of the pattern. Every step
            explains both what the algorithm just did and why that move was logically
            correct.
          </p>
        </div>

        <TwoPointersVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Opposite direction and same direction solve different jobs
          </h2>
          <p className="leading-7 text-muted-foreground">
            Both versions use two markers on the same array, but the movement rule is
            different. The best clue is the type of question the problem is asking.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Opposite Direction</th>
                <th className="px-4 py-3 font-semibold">Same Direction</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.opposite}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.same}</td>
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
