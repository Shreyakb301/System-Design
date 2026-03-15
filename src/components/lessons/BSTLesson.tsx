import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BSTVisual } from "@/components/visuals/BSTVisual";

const operationRows = [
  {
    operation: "Search",
    rule: "Compare the target with the current node and move left or right.",
    payoff: "Each comparison throws away one whole subtree.",
  },
  {
    operation: "Insert",
    rule: "Follow the same search path until you find an empty child position.",
    payoff: "The ordering rule stays true after the new node is attached.",
  },
  {
    operation: "Delete",
    rule: "Handle leaf, one-child, and two-child cases differently.",
    payoff: "The tree keeps its search property after rewiring or replacement.",
  },
  {
    operation: "Worst-case mode",
    rule: "Watch what happens when the tree becomes skewed instead of balanced.",
    payoff: "BST performance can fall from near O(log n) toward O(n).",
  },
];

const takeaways = [
  "A BST keeps smaller values on the left and larger values on the right.",
  "That ordering turns search into a sequence of left-or-right decisions.",
  "Insert follows the same path as search until it finds an empty spot.",
  "Delete is more subtle because the tree must stay ordered after the node is removed.",
];

export function BSTLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Ordered Trees</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Binary search trees use ordering to cut down the search space
          </h2>
          <p className="leading-7 text-muted-foreground">
            In a binary search tree, every node splits the remaining values into two
            groups: smaller values go left, larger values go right. Because of that rule,
            search, insert, and delete do not need to scan the whole structure. They only
            follow one path from the root downward.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                Read each comparison as a left-or-right decision.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The active node is the value currently being compared with the target.
              </p>
              <p>
                If the target is smaller, the algorithm moves left. If it is larger, the
                algorithm moves right.
              </p>
              <p>
                The log explains each step of the path so the decision process stays visible.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Use the same number with search, insert, and delete to compare behaviors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Search for a value that exists, then search for one that does not.
              </p>
              <p>
                Insert a new value and notice that it always lands at the end of one search
                path.
              </p>
              <p>
                Toggle <strong>Worst Case</strong> to see why a skewed tree loses the
                advantage of balanced branching.
              </p>
            </CardContent>
          </Card>
        </div>

        <BSTVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Operations</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            One ordering rule powers search, insert, and delete
          </h2>
          <p className="leading-7 text-muted-foreground">
            All three operations begin with the same idea: compare the current node to the
            target and discard the half that cannot contain the answer.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Search</CardTitle>
              <CardDescription>Follow one path until you find the value or hit null.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Fast when the tree stays balanced.</p>
              <p>Only one subtree matters after each comparison.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insert</CardTitle>
              <CardDescription>Search for the correct gap, then attach the new node.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>The path is the same as search until an empty child appears.</p>
              <p>The BST rule remains true after insertion.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delete</CardTitle>
              <CardDescription>Deletion depends on how many children the node has.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Leaf and one-child cases are direct rewires.</p>
              <p>Two-child deletion usually uses the inorder successor.</p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Operation</th>
                <th className="px-4 py-3 font-semibold">Core Rule</th>
                <th className="px-4 py-3 font-semibold">Why It Helps</th>
              </tr>
            </thead>
            <tbody>
              {operationRows.map((row) => (
                <tr key={row.operation} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.operation}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.rule}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.payoff}</td>
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
