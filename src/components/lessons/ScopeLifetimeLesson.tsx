import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScopeLifetimeVisual } from "@/components/visuals/ScopeLifetimeVisual";

const comparisonRows = [
  {
    aspect: "Definition",
    scope: "Where a variable can be accessed.",
    lifetime: "How long a variable exists during execution.",
  },
  {
    aspect: "Example",
    scope: "bonus is only visible inside the if block.",
    lifetime: "bonus exists only while that block is executing.",
  },
  {
    aspect: "Question answered",
    scope: "Where can I use it?",
    lifetime: "When does it exist?",
  },
];

const takeaways = [
  "Scope is about visibility.",
  "Lifetime is about existence.",
  "Variables can appear and disappear as execution enters and leaves blocks.",
  "Global, local, and block variables behave differently.",
];

export function ScopeLifetimeLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Programming Languages</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Scope controls visibility. Lifetime controls existence.
          </h2>
          <p className="leading-7 text-muted-foreground">
            Scope and lifetime are two different attributes of a variable.{" "}
            <strong className="text-foreground">Scope</strong> determines where in
            the program a variable can be accessed.{" "}
            <strong className="text-foreground">Lifetime</strong> determines how
            long the variable exists during execution. A variable may be in
            scope only inside a block, while its lifetime depends on when that
            block begins and ends.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">
                How to read the demo
              </h3>
              <p className="text-sm text-muted-foreground">
                The simulation shows the same variable from two angles: where it
                is visible and how long it stays alive.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Watch the highlighted line to see where execution currently is.</li>
              <li>Use the scope view to see which block is active and which variables are visible there.</li>
              <li>Use the lifetime panel to see variables appear, fade, and disappear as execution moves.</li>
            </ul>
          </CardContent>
        </Card>

        <ScopeLifetimeVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Comparison Summary</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Scope and lifetime answer different questions
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Scope</th>
                <th className="px-4 py-3 font-semibold">Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.scope}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.lifetime}</td>
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
