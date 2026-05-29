import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LanguageCriteriaVisual } from "@/components/visuals/LanguageCriteriaVisual";

const comparisonRows = [
  {
    aspect: "Definition",
    readability: "How easy it is to understand a program by reading it.",
    writability: "How easy it is to express an idea in code.",
    reliability: "How likely the program is to behave correctly.",
    cost: "The total cost of learning, building, running, and maintaining software.",
  },
  {
    aspect: "Improves with",
    readability: "Simpler syntax and consistent rules.",
    writability: "Higher abstraction and concise constructs.",
    reliability: "Strong typing and more safety checks.",
    cost: "Cleaner code and fewer long-term bugs to fix.",
  },
  {
    aspect: "Tradeoff example",
    readability: "Very compact syntax can be fast to write but harder to read.",
    writability: "Low-level control can reduce convenience and increase code length.",
    reliability: "More runtime checks improve safety but can raise execution cost.",
    cost: "Extra safety and tooling can improve quality while increasing short-term effort.",
  },
];

const takeaways = [
  "Programming languages are evaluated by tradeoffs, not just by popularity or syntax style.",
  "A feature that helps one criterion can make another criterion worse.",
  "Readability, writability, reliability, and cost are connected, so language design is always a balancing act.",
  "The most useful question is not 'Which language is best?' but 'Which tradeoff fits this job best?'",
];

export function LanguageCriteriaLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Language design is a set of tradeoffs, not one perfect formula
          </h2>
          <p className="leading-7 text-muted-foreground">
            Programming languages are not judged only by popularity or speed.
            They are evaluated by how easily programmers can write, read,
            maintain, and trust their programs. Language designers balance four
            main criteria: <strong className="text-foreground">readability</strong>,
            {" "}<strong className="text-foreground">writability</strong>,{" "}
            <strong className="text-foreground">reliability</strong>, and{" "}
            <strong className="text-foreground">cost</strong>. One feature can
            improve one criterion while making another worse.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">
                How to read the demo
              </h3>
              <p className="text-sm text-muted-foreground">
                The simulator lets you experiment with language design choices.
                Each choice shifts the four evaluation criteria in a different
                way.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Adjust the feature controls one by one.</li>
              <li>Watch the four evaluation indicators change together.</li>
              <li>Use the live explanation message to connect each choice to its tradeoff.</li>
            </ul>
          </CardContent>
        </Card>

        <LanguageCriteriaVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            The four criteria describe different kinds of language quality
          </h2>
          <p className="leading-7 text-muted-foreground">
            Languages are evaluated through tradeoffs. A choice that improves
            readability or reliability can also change writability or cost.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Readability</th>
                <th className="px-4 py-3 font-semibold">Writability</th>
                <th className="px-4 py-3 font-semibold">Reliability</th>
                <th className="px-4 py-3 font-semibold">Cost</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.readability}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.writability}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.reliability}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.cost}</td>
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
