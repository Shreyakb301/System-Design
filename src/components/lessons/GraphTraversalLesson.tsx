import { Card, CardContent } from "@/components/ui/card";
import { GraphTraversalVisual } from "@/components/visuals/GraphTraversalVisual";

const whyRows = [
  {
    aspect: "Data structure",
    bfs: "Queue (FIFO)",
    dfs: "Stack (LIFO)",
  },
  {
    aspect: "Next node",
    bfs: "Oldest unvisited neighbor",
    dfs: "Most recently discovered neighbor",
  },
  {
    aspect: "Pattern",
    bfs: "Expands like a wave outward",
    dfs: "Dives down one branch, then backtracks",
  },
  {
    aspect: "Guarantees",
    bfs: "Shortest path by edge count",
    dfs: "Full path exploration",
  },
  {
    aspect: "Classic uses",
    bfs: "Shortest path, level-order, social graph distance",
    dfs: "Cycle detection, topological sort, connected components",
  },
];

const comparisonRows = [
  {
    aspect: "Data structure",
    bfs: "Queue (FIFO)",
    dfs: "Stack (LIFO)",
  },
  {
    aspect: "Visits neighbors",
    bfs: "Level by level",
    dfs: "Branch by branch",
  },
  {
    aspect: "Shortest path",
    bfs: "Guaranteed in unweighted graphs",
    dfs: "Not guaranteed",
  },
  {
    aspect: "Memory",
    bfs: "O(width) - wide graphs are costly",
    dfs: "O(depth) - deep graphs are costly",
  },
  {
    aspect: "Best for",
    bfs: "Shortest path, level-order, social distance",
    dfs: "Cycle detection, topological sort, maze solving",
  },
  {
    aspect: "Worst case",
    bfs: "Very wide graphs",
    dfs: "Very deep graphs (stack overflow risk)",
  },
];

const takeaways = [
  "BFS and DFS visit the same nodes - the order is what changes. That order is entirely determined by queue vs stack.",
  "BFS processes all nodes at distance 1 before distance 2. That is why it guarantees the shortest path in unweighted graphs.",
  "DFS dives as deep as possible before backtracking. That is why it is natural for exhaustive search, cycle detection, and path problems.",
  "Swap queue.shift() for stack.pop() and BFS becomes DFS. The rest of the code is nearly identical.",
  "BFS is expensive on wide graphs. DFS is expensive on deep graphs.",
];

export function GraphTraversalLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border bg-muted/40 p-6">
            <div className="space-y-3">
              <p className="leading-7 text-foreground">
                You need the shortest path in an unweighted graph, or you need to
                process nodes level by level.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border bg-muted/40 p-6">
            <div className="space-y-3">
              <p className="leading-7 text-foreground">
                You need to explore all paths, detect cycles, check connectivity, or
                solve maze and backtracking problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Queue versus stack is the entire behavioral difference
          </h2>
          <p className="leading-7 text-muted-foreground">
            BFS and DFS do not disagree about the graph. They disagree about which
            frontier node gets processed next. The queue makes BFS stay shallow. The
            stack makes DFS go deep.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">BFS</th>
                <th className="px-4 py-3 font-semibold">DFS</th>
              </tr>
            </thead>
            <tbody>
              {whyRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.bfs}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.dfs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm leading-7 text-muted-foreground">
          Swap the queue for a stack and BFS becomes DFS. That is the entire difference.
        </p>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            See the data structure force the traversal order
          </h2>
          <p className="leading-7 text-muted-foreground">
            The simulator keeps the graph fixed and changes only the frontier structure.
            Queue chips on the right explain BFS. Stack chips on the right explain DFS.
            The side-by-side tab makes the divergence explicit.
          </p>
        </div>

        <GraphTraversalVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Same graph, same start node, different traversal priorities
          </h2>
          <p className="leading-7 text-muted-foreground">
            BFS pays memory to keep an entire frontier. DFS pays memory to keep a deep
            path. Their best-use cases come directly from that tradeoff.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
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
