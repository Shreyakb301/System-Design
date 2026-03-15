import Link from "next/link";
import { BookOpenText, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TOPICS } from "@/lib/topics";

export default function ProgrammingLanguagesPage() {
  const programmingLanguages = TOPICS.find(
    (section) => section.id === "programming-languages"
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Programming Languages
        </h1>
        <p className="text-muted-foreground">
          Learn how language design choices trade off readability, writability,
          reliability, and cost.
        </p>
      </div>

      <div className="space-y-6">
        <Link href="/programming-languages/language-evaluation">
          <Card className="group cursor-pointer overflow-hidden border-none bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  <Scale className="h-4 w-4" />
                  Core tradeoffs
                </div>
                <h2 className="text-3xl font-bold">
                  Language Evaluation Criteria
                </h2>
                <p className="text-lg text-white/90">
                  Explore how syntax, typing, abstraction, and runtime checks
                  shift readability, writability, reliability, and cost.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:block">
                <BookOpenText className="h-16 w-16 text-amber-100" />
              </div>
            </div>
          </Card>
        </Link>

        <div className="grid gap-6 md:grid-cols-2">
          {programmingLanguages?.categories.map((category) => (
            <Card key={category.id} className="p-6">
              <div className="mb-4 flex items-center gap-4">
                {category.icon && (
                  <category.icon className="h-6 w-6 text-primary" />
                )}
                <h3 className="text-lg font-semibold">{category.title}</h3>
              </div>
              <div className="grid gap-2">
                {category.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
