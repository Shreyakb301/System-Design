import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FastSlowVisual } from "@/components/visuals/FastSlowVisual";

const comparisonRows = [
  {
    aspect: "Main job",
    middle: "Find the middle node without first counting the whole list.",
    cycle: "Detect whether the next pointers eventually loop back into the list.",
  },
  {
    aspect: "Slow pointer",
    middle: "Moves one hop each step and ends at the middle when fast reaches the end.",
    cycle: "Moves one hop each step and helps reveal when the two pointers meet.",
  },
  {
    aspect: "Fast pointer",
    middle: "Moves two hops each step, so it reaches the end sooner.",
    cycle: "Moves two hops each step, so it laps slow inside the cycle.",
  },
  {
    aspect: "Why it works",
    middle: "Fast covers the list twice as quickly, so slow is halfway when fast finishes.",
    cycle: "If a loop exists, two runners moving at different speeds must eventually land on the same node.",
  },
];

const takeaways = [
  "Fast and slow pointers use two speeds on the same linked list.",
  "The middle-node version works because fast reaches the end while slow only travels half as far.",
  "The cycle-detection version works because the faster pointer eventually catches the slower one inside the loop.",
  "Both patterns run in O(n) time and use O(1) extra space.",
];

export function FastSlowLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Pointer Pattern</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Fast and slow pointers read one linked list at two different speeds
          </h2>
          <p className="leading-7 text-muted-foreground">
            This pattern places two pointers on the same linked list. The slow pointer
            moves one node at a time, while the fast pointer moves two. That small speed
            difference is enough to solve two common problems: finding the middle node and
            detecting whether a cycle exists.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                Watch the two highlighted pointers move through the same list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Slow</strong> advances one hop per step. <strong>Fast</strong>
                advances two hops per step.
              </p>
              <p>
                In <strong>Find Middle</strong>, the key moment is when fast reaches the
                end of the list. In <strong>Detect Cycle</strong>, the key moment is when
                the two pointers land on the same node.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Step through both scenarios and compare what the speed difference reveals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                In <strong>Find Middle</strong>, step until fast runs out of list. Notice
                where slow stops.
              </p>
              <p>
                In <strong>Detect Cycle</strong>, watch the tail loop back into the list,
                then keep stepping until fast catches slow inside the cycle.
              </p>
              <p>
                Use <strong>Auto Play</strong> to watch the motion continuously, or{" "}
                <strong>Reset</strong> to replay the same example.
              </p>
            </CardContent>
          </Card>
        </div>

        <FastSlowVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Pattern Uses</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            One speed difference solves two different linked-list questions
          </h2>
          <p className="leading-7 text-muted-foreground">
            The setup is the same in both demos, but the goal changes. One version finds
            the midpoint of a finite list. The other checks whether the list ever loops
            back into itself.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Find Middle</CardTitle>
              <CardDescription>
                Useful when you need the midpoint without a separate counting pass.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Slow moves once while fast moves twice.</p>
              <p>When fast reaches the end, slow has only covered half the distance.</p>
              <p>That leaves slow at the middle node.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detect Cycle</CardTitle>
              <CardDescription>
                Useful when you need to know whether the list ever loops back.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Slow and fast both enter the loop if a cycle exists.</p>
              <p>Fast gains one node on slow during each step inside the cycle.</p>
              <p>That guarantees a meeting point, which proves the cycle exists.</p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
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
