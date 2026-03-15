import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraphTraversalVisual } from "@/components/visuals/GraphTraversalVisual";

const comparisonRows = [
  {
    aspect: "Main data structure",
    bfs: "Queue",
    dfs: "Stack or recursion",
  },
  {
    aspect: "Exploration pattern",
    bfs: "Visits neighbors layer by layer.",
    dfs: "Dives down one path before backtracking.",
  },
  {
    aspect: "Shortest-path intuition",
    bfs: "Finds shortest path by edge count in an unweighted graph.",
    dfs: "Does not guarantee the shortest path.",
  },
  {
    aspect: "Best mental model",
    bfs: "A wave spreading outward from the start node.",
    dfs: "A path explorer going as deep as possible first.",
  },
];

const takeaways = [
  "BFS and DFS can visit the same graph in very different orders.",
  "BFS uses a queue and explores one layer at a time.",
  "DFS uses a stack-like process and explores one branch deeply before backtracking.",
  "The right traversal depends on whether you care more about levels or deep path exploration.",
];

export function GraphTraversalLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Graph Search</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            BFS and DFS explore the same graph with different priorities
          </h2>
          <p className="leading-7 text-muted-foreground">
            Breadth-first search and depth-first search both start from one node and work
            outward through a graph. The big difference is what they do next: BFS explores
            the closest frontier first, while DFS keeps following one branch until it has
            to backtrack.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                First pick a start node, then watch the frontier structure change.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The current node and discovered nodes are highlighted directly on the graph.
              </p>
              <p>
                The side structure shows the active <strong>queue</strong> for BFS or{" "}
                <strong>stack</strong> for DFS, which explains why the visit order changes.
              </p>
              <p>
                The comparison mode lets you watch both patterns side by side.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Use the same start node and compare the order produced by each traversal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Start from one node and run <strong>BFS</strong> to see the search expand
                level by level.
              </p>
              <p>
                Reset, then run <strong>DFS</strong> from the same node to watch it go deep
                down one branch first.
              </p>
              <p>
                Use <strong>Comparison</strong> mode when you want both traversals visible
                at the same time.
              </p>
            </CardContent>
          </Card>
        </div>

        <GraphTraversalVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">BFS vs DFS</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Queue-first and stack-first searches feel different immediately
          </h2>
          <p className="leading-7 text-muted-foreground">
            These traversals are often taught together because they solve related graph
            tasks, but they prioritize different information while the search is running.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Breadth-first search</CardTitle>
              <CardDescription>
                Best when you care about levels or shortest unweighted paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Explores all nodes at distance 1 before distance 2, then distance 3.</p>
              <p>A natural fit for queue-based frontier expansion.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Depth-first search</CardTitle>
              <CardDescription>
                Best when you want to explore structure deeply before trying alternatives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Pushes deeper into one branch, then backtracks when needed.</p>
              <p>A natural fit for recursion, stacks, and path-style exploration.</p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">BFS</th>
                <th className="px-4 py-3 font-semibold">DFS</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.bfs}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.dfs}</td>
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
