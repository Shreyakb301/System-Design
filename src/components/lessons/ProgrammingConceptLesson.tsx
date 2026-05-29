import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type ConceptCardData = {
  title: string;
  body: string;
};

type ComparisonTableData = {
  title: string;
  columns: string[];
  rows: Array<{ label: string; values: string[] }>;
};

type ProgrammingConceptLessonProps = {
  summaryTitle: string;
  summaryBody: string;
  whenToReach: string;
  whyThisMatters: string;
  cards?: ConceptCardData[];
  visual?: ReactNode;
  watchList?: string[];
  comparison?: ComparisonTableData;
  takeaways: string[];
};

export function ProgrammingConceptLesson({
  summaryTitle,
  summaryBody,
  whenToReach,
  whyThisMatters,
  cards = [],
  visual,
  watchList = [],
  comparison,
  takeaways,
}: ProgrammingConceptLessonProps) {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">{summaryTitle}</h2>
          <p className="leading-7 text-muted-foreground">{summaryBody}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h3 className="text-lg font-semibold tracking-tight">
                When to reach for this
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {whenToReach}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h3 className="text-lg font-semibold tracking-tight">
                Why this matters
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {whyThisMatters}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {cards.length > 0 ? (
        <section className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">
              The mental model
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <Card key={card.title}>
                <CardContent className="space-y-2 pt-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {card.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {visual ? (
        <section className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Step through the concept
            </h2>
          </div>

          {watchList.length > 0 ? (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold tracking-tight">
                    How to use this page
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Follow the animation one state at a time and connect the
                    code to the runtime behavior.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {watchList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {visual}
        </section>
      ) : null}

      {comparison ? (
        <section className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">
              {comparison.title}
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 font-semibold">Aspect</th>
                  {comparison.columns.map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td
                        key={`${row.label}-${index}`}
                        className="px-4 py-3 text-muted-foreground"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

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
