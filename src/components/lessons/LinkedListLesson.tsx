import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkedListTripleVisual } from "@/components/visuals/LinkedListTripleVisual";

const comparisonRows = [
  {
    aspect: "Pointers stored",
    singly: "One next pointer per node.",
    doubly: "One next pointer and one previous pointer per node.",
  },
  {
    aspect: "Traversal direction",
    singly: "Forward only.",
    doubly: "Forward and backward.",
  },
  {
    aspect: "Delete a known node",
    singly: "Usually needs access to the previous node to rewire links.",
    doubly: "Can update both sides directly once the node is known.",
  },
  {
    aspect: "Memory cost",
    singly: "Lower overhead because each node stores fewer references.",
    doubly: "Higher overhead because each node stores an extra pointer.",
  },
  {
    aspect: "Best fit",
    singly: "Simple forward traversal with minimal memory.",
    doubly: "Bidirectional traversal and easier local updates.",
  },
];

const takeaways = [
  "A linked list connects nodes with pointers instead of storing them in one contiguous block.",
  "A singly linked list can move forward, but it cannot move backward because no previous link is stored.",
  "A doubly linked list uses more memory per node, but the extra previous pointer makes reverse traversal possible.",
  "Deletion is a good tradeoff example: singly lists are lighter, while doubly lists make local rewiring easier.",
];

export function LinkedListLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Linked List Basics</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Linked lists connect nodes through pointers
          </h2>
          <p className="leading-7 text-muted-foreground">
            A linked list stores each value inside a node, and each node points to the next
            one. Unlike arrays, the nodes do not need to sit next to each other in memory.
            Traversal works by following links from one node to the next, which makes the
            pointer structure more important than physical placement.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                Focus on the node fields and the arrows between them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                In <strong>Singly</strong> mode, each node only shows a{" "}
                <strong>next</strong> link, so the arrows move forward.
              </p>
              <p>
                In <strong>Doubly</strong> mode, each node also stores a{" "}
                <strong>prev</strong> link, so the diagram can show movement in both
                directions.
              </p>
              <p>
                The active node is highlighted so you can see exactly where traversal or
                deletion is happening.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Use the controls to compare the limits and tradeoffs directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                In the traversal tab, press <strong>Move Backward</strong> in singly mode
                and notice that the explanation tells you why the move is impossible.
              </p>
              <p>
                Switch to doubly mode and try the same action again to see how the extra
                previous pointer changes the result.
              </p>
              <p>
                In the deletion and tradeoff tabs, compare how many pointer updates and how
                much extra memory each structure needs.
              </p>
            </CardContent>
          </Card>
        </div>

        <LinkedListTripleVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Singly vs Doubly</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            One extra pointer changes how the list behaves
          </h2>
          <p className="leading-7 text-muted-foreground">
            Both structures store data as linked nodes, but the extra previous pointer in a
            doubly linked list changes traversal, deletion, and memory usage. That is the
            main tradeoff the interactive module is trying to make visible.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Singly linked list</CardTitle>
              <CardDescription>
                Lightweight structure with one forward link per node.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Stores less pointer metadata in each node.</p>
              <p>Traversal naturally moves forward one node at a time.</p>
              <p>Operations that need the previous node become less convenient.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doubly linked list</CardTitle>
              <CardDescription>
                Heavier structure with both forward and backward links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Supports traversal in both directions.</p>
              <p>Deleting or rewiring a known node is easier because both neighbors are linked.</p>
              <p>The tradeoff is extra memory and more pointers to maintain on updates.</p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Singly Linked List</th>
                <th className="px-4 py-3 font-semibold">Doubly Linked List</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.singly}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.doubly}</td>
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
