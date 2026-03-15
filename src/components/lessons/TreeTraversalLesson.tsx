import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TreeTraversalVisual } from "@/components/visuals/TreeTraversalVisual";

const traversalRows = [
  {
    order: "Preorder",
    visitRule: "Visit node, then left subtree, then right subtree.",
    bestFor: "Creating or copying tree structure, prefix-style processing.",
  },
  {
    order: "Inorder",
    visitRule: "Visit left subtree, then node, then right subtree.",
    bestFor: "Reading BST values in sorted order.",
  },
  {
    order: "Postorder",
    visitRule: "Visit left subtree, then right subtree, then node.",
    bestFor: "Deleting or freeing a tree after processing children first.",
  },
  {
    order: "Level order",
    visitRule: "Visit nodes breadth-first, one level at a time.",
    bestFor: "Shortest path by edge count in a tree or level-by-level processing.",
  },
];

const takeaways = [
  "Traversal order changes the meaning of the same tree.",
  "Preorder, inorder, and postorder are depth-first patterns built around a recursive call stack.",
  "Level order uses a queue instead of a stack and explores one layer at a time.",
  "Inorder on a binary search tree produces values in sorted order.",
];

export function TreeTraversalLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Traversal Order</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Tree traversals are different rules for visiting the same nodes
          </h2>
          <p className="leading-7 text-muted-foreground">
            A tree traversal answers one question: in what order should we visit the
            nodes? The structure stays the same, but the order changes depending on whether
            you visit the node before its children, between its children, after its
            children, or level by level.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                Watch the visited order grow while the stack or queue changes beside it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The active node shows where the traversal is working right now.
              </p>
              <p>
                For the depth-first traversals, the side panel behaves like a call stack.
                For level order, it becomes a queue.
              </p>
              <p>
                The message at each step explains why the traversal moved to that next node.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Run the same tree through all four orders and compare the visit sequence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Step through <strong>Preorder</strong>, <strong>Inorder</strong>, and{" "}
                <strong>Postorder</strong> to compare the three depth-first patterns.
              </p>
              <p>
                Switch to <strong>Level Order</strong> to see how the queue changes the
                exploration pattern completely.
              </p>
              <p>
                Use <strong>Play</strong>, <strong>Step</strong>, and <strong>Reset</strong>{" "}
                to replay the same tree under different rules.
              </p>
            </CardContent>
          </Card>
        </div>

        <TreeTraversalVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Traversal Types</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            The order changes, but the same tree is being visited every time
          </h2>
          <p className="leading-7 text-muted-foreground">
            The best traversal depends on what your algorithm needs to do with each node
            and whether it needs a stack-style depth-first walk or a queue-style
            breadth-first walk.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {traversalRows.map((row) => (
            <Card key={row.order}>
              <CardHeader>
                <CardTitle>{row.order}</CardTitle>
                <CardDescription>{row.visitRule}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {row.bestFor}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Traversal</th>
                <th className="px-4 py-3 font-semibold">Visit Rule</th>
                <th className="px-4 py-3 font-semibold">Common Use</th>
              </tr>
            </thead>
            <tbody>
              {traversalRows.map((row) => (
                <tr key={row.order} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.order}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.visitRule}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.bestFor}</td>
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
