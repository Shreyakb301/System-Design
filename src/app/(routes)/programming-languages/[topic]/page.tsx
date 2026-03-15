import { LanguageCriteriaLesson } from "@/components/lessons/LanguageCriteriaLesson";
import { ScopeLifetimeLesson } from "@/components/lessons/ScopeLifetimeLesson";
import { SyntaxSemanticsLesson } from "@/components/lessons/SyntaxSemanticsLesson";
import { VariableAttributesLesson } from "@/components/lessons/VariableAttributesLesson";

const CONTENT_MAP: Record<
  string,
  { title: string; description: string; visual?: React.ReactNode }
> = {
  "language-evaluation": {
    title: "Language Evaluation Criteria",
    description:
      "Programming languages are evaluated through tradeoffs in readability, writability, reliability, and cost rather than by syntax style alone.",
    visual: <LanguageCriteriaLesson />,
  },
  "syntax-semantics": {
    title: "Syntax vs Semantics",
    description:
      "Syntax describes how code is structured, while semantics explains what that code means when it runs.",
    visual: <SyntaxSemanticsLesson />,
  },
  "variable-attributes": {
    title: "Attributes of a Variable",
    description:
      "Variables are defined by attributes such as name, type, value, address, scope, and lifetime rather than by a label alone.",
    visual: <VariableAttributesLesson />,
  },
  "scope-lifetime": {
    title: "Scope and Lifetime",
    description:
      "Scope determines where a variable can be used, while lifetime determines how long it exists during execution.",
    visual: <ScopeLifetimeLesson />,
  },
};

export default async function ProgrammingLanguagesTopicPage(props: {
  params: Promise<{ topic: string }>;
}) {
  const params = await props.params;
  const topicId = params.topic;

  const content = CONTENT_MAP[topicId];

  if (!content) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight capitalize">
          {topicId.replace("-", " ")}
        </h1>
        <p className="text-muted-foreground">Visual explanation coming soon.</p>
      </div>
    );
  }

  return (
    <div className="box-border w-full min-w-0 max-w-5xl space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
        <p className="text-xl text-muted-foreground">{content.description}</p>
      </div>

      {content.visual && (
        <div className="my-8 w-full min-w-0 max-w-full">{content.visual}</div>
      )}
    </div>
  );
}
