import Link from "next/link";
import {
  BookOpenText,
  Calculator,
  Cpu,
  FileCode2,
  Type,
  Waypoints,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { TOPICS } from "@/lib/topics";

const LIVE_LESSONS = [
  {
    title: "Expressions and Precedence",
    description: "Step through grouping, association, and explicit parentheses.",
    href: "/programming-languages/expressions-precedence",
    icon: Calculator,
  },
  {
    title: "Static vs Dynamic Types",
    description: "Watch the same program fail before execution versus during execution.",
    href: "/programming-languages/static-dynamic-types",
    icon: Type,
  },
  {
    title: "Parameter Passing Methods",
    description: "See copies, aliases, and copy-out semantics across one function call.",
    href: "/programming-languages/parameter-passing",
    icon: Waypoints,
  },
  {
    title: "Compiler Pipeline",
    description: "Follow source text through tokens, parse trees, semantic checks, and codegen.",
    href: "/programming-languages/translation-pipeline",
    icon: FileCode2,
  },
  {
    title: "Data Race and Synchronization",
    description: "Step through a lost update, then fix it with a lock.",
    href: "/programming-languages/data-race-synchronization",
    icon: Cpu,
  },
];

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
          Textbook-aligned modules with self-teaching lessons on variables,
          types, control flow, subprograms, object models, compilers, logic,
          and concurrency.
        </p>
      </div>

      <div className="space-y-6">
        <Link href="/programming-languages/language-evaluation">
          <Card className="group cursor-pointer overflow-hidden border-none bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-2xl space-y-4">
                <h2 className="text-3xl font-bold">
                  Sebesta-style Programming Languages Track
                </h2>
                <p className="text-lg text-white/90">
                  Start with the foundations, then move into live simulations
                  for type systems, parameter passing, compiler translation,
                  and synchronization.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:block">
                <BookOpenText className="h-16 w-16 text-amber-100" />
              </div>
            </div>
          </Card>
        </Link>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Live lessons</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {LIVE_LESSONS.map((lesson) => (
              <Link key={lesson.href} href={lesson.href}>
                <Card className="h-full p-6 transition-colors hover:border-primary hover:bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl border bg-background p-3">
                      <lesson.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {lesson.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

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
