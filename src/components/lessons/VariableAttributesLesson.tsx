import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VariableAttributesVisual } from "@/components/visuals/VariableAttributesVisual";

const comparisonRows = [
  { attribute: "Name", meaning: "Identifier used in code" },
  { attribute: "Type", meaning: "Kind of value stored" },
  { attribute: "Value", meaning: "Current contents" },
  { attribute: "Address", meaning: "Memory location" },
  { attribute: "Scope", meaning: "Where it is accessible" },
  { attribute: "Lifetime", meaning: "How long it exists" },
];

const takeaways = [
  "Variables have multiple attributes, not just values.",
  "Type, scope, and lifetime affect how variables behave in a program.",
  "Understanding variable attributes helps explain memory and program execution.",
];

export function VariableAttributesLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Programming Languages</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            A variable is a bundle of attributes, not just a label
          </h2>
          <p className="leading-7 text-muted-foreground">
            A variable is not just a label for data. In programming languages,
            a variable has several attributes that describe how it behaves in a
            program. Common attributes include{" "}
            <strong className="text-foreground">name</strong>,{" "}
            <strong className="text-foreground">type</strong>,{" "}
            <strong className="text-foreground">value</strong>,{" "}
            <strong className="text-foreground">address</strong>,{" "}
            <strong className="text-foreground">scope</strong>, and{" "}
            <strong className="text-foreground">lifetime</strong>. Together,
            these explain how languages manage data and memory.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">
                How to read the demo
              </h3>
              <p className="text-sm text-muted-foreground">
                The simulation shows one variable and reveals its attributes one
                by one.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Watch the code line to see which part of the variable is being emphasized.</li>
              <li>Use the variable snapshot and attribute panel to connect code to memory behavior.</li>
              <li>Step through the demo to see how name, type, value, address, scope, and lifetime describe one variable.</li>
            </ul>
          </CardContent>
        </Card>

        <VariableAttributesVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Comparison Summary</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Each attribute answers a different question about the variable
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Attribute</th>
                <th className="px-4 py-3 font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.attribute} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.attribute}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.meaning}</td>
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
