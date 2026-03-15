import { Badge } from "@/components/ui/badge";
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
    aspect: "Pointer layout",
    opposite: "One pointer starts at the left end and one starts at the right end.",
    same: "Both pointers move forward through the same sequence.",
  },
  {
    aspect: "Best fit",
    opposite: "Sorted arrays, pair sums, and problems where moving inward shrinks the search space.",
    same: "Deduplication, partitioning, and problems where one pointer scans while the other tracks progress.",
  },
  {
    aspect: "Main idea",
    opposite: "Use the comparison result to decide which side should move next.",
    same: "Let one pointer explore while the other marks the next valid write position.",
  },
  {
    aspect: "Runtime benefit",
    opposite: "Often reduces nested-loop thinking to one linear pass.",
    same: "Often compresses scanning and rewriting into one linear pass.",
  },
];

const takeaways = [
  "Think of the technique as two markers moving through the same array with a rule for what moves next.",
  "Opposite direction pointers are useful when each comparison lets you ignore one side of the search space.",
  "Same direction pointers are useful when one pointer reads ahead and the other tracks the result.",
  "The pattern often replaces O(n^2) brute force with O(n) time and O(1) extra space.",
];

export function TwoPointersLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Technique</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Two pointers coordinate two positions in one pass
          </h2>
          <p className="leading-7 text-muted-foreground">
            The two pointers technique puts two markers on the same array or list. At
            each step, you look at the values at those two positions and use a simple
            rule to decide which pointer should move next. Because each move cuts down
            the remaining work, the technique is often much faster than brute force.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                Follow the highlighted cells as the pointers move across the array.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The highlighted cells are the values the algorithm is looking at right
                now. After each step, the message below the row explains what was
                compared and why one pointer moved.
              </p>
              <p>
                In <strong>Opposite Direction</strong>, the pointers start at the two ends
                and move inward. In <strong>Same Direction</strong>, the fast pointer scans
                ahead while the slow pointer marks the next useful position.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Step slowly and watch which pointer moves after each comparison.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                In <strong>Opposite Direction</strong>, notice how the current sum tells
                you which side can be ignored next. One move makes the remaining search
                space smaller.
              </p>
              <p>
                In <strong>Same Direction</strong>, notice that the fast pointer reads
                every value, but the slow pointer only moves when the next kept value
                should be written forward.
              </p>
            </CardContent>
          </Card>
        </div>

        <TwoPointersVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Pattern Types</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Opposite direction and same direction solve different jobs
          </h2>
          <p className="leading-7 text-muted-foreground">
            Both approaches use two pointers, but they do different kinds of work. One
            usually narrows a search from both ends. The other usually scans forward
            while building or tracking the useful part of the array.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Opposite direction</CardTitle>
              <CardDescription>
                Best when the values at the two ends tell you which pointer should move.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Common examples include pair-sum and palindrome-style problems.</p>
              <p>Each comparison tells you which side cannot be part of the answer.</p>
              <p>That is why the search space gets smaller after every move.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Same direction</CardTitle>
              <CardDescription>
                Best when one pointer reads ahead and the other tracks where the next good
                value should go.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Common examples include removing duplicates and compacting data in place.</p>
              <p>The fast pointer scans the array while the slow pointer tracks progress.</p>
              <p>This keeps the work linear and uses only constant extra space.</p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
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
          <Badge variant="outline">Key Takeaways</Badge>
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
