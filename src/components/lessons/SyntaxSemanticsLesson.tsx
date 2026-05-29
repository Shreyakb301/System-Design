import { Card, CardContent } from "@/components/ui/card";
import { SyntaxSemanticsVisual } from "@/components/visuals/SyntaxSemanticsVisual";

const comparisonRows = [
  {
    aspect: "Definition",
    syntax: "Rules for writing valid programs.",
    semantics: "Meaning of valid programs.",
  },
  {
    aspect: "Focus",
    syntax: "Structure of code.",
    semantics: "Behavior of code.",
  },
  {
    aspect: "Example",
    syntax: "Grammar rules and parse trees.",
    semantics: "Program evaluation and execution.",
  },
  {
    aspect: "Common mistake",
    syntax: "Syntax errors.",
    semantics: "Logical errors.",
  },
];

const takeaways = [
  "Syntax describes how programs must be written.",
  "Semantics describes what programs mean when they run.",
  "A program can be syntactically correct but still produce incorrect results.",
  "Understanding both syntax and semantics is essential for programming languages and compilers.",
];

export function SyntaxSemanticsLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Syntax describes form. Semantics describes meaning.
          </h2>
          <p className="leading-7 text-muted-foreground">
            Programming languages have two important aspects:{" "}
            <strong className="text-foreground">syntax</strong> and{" "}
            <strong className="text-foreground">semantics</strong>. Syntax is
            the set of rules that defines how symbols, keywords, and expressions
            must be arranged for a program to be valid. Semantics is the meaning
            of those syntactically correct programs. A program can follow the
            grammar perfectly and still behave incorrectly if its meaning is
            misunderstood.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">
                How to read the demo
              </h3>
              <p className="text-sm text-muted-foreground">
                The simulation shows one short program and two ways to think
                about it.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>The syntax view focuses on how the program is structured.</li>
              <li>The execution view focuses on what the program does as it runs.</li>
              <li>Step through both views to see why structure and meaning are different concepts.</li>
            </ul>
          </CardContent>
        </Card>

        <SyntaxSemanticsVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Syntax and semantics answer different questions
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Syntax</th>
                <th className="px-4 py-3 font-semibold">Semantics</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.syntax}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.semantics}</td>
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
