import { PROGRAMMING_LANGUAGE_CONTENT } from "@/lib/programmingLanguageContent";

export default async function ProgrammingLanguagesTopicPage(props: {
  params: Promise<{ topic: string }>;
}) {
  const params = await props.params;
  const topicId = params.topic;

  const content = PROGRAMMING_LANGUAGE_CONTENT[topicId];

  if (!content) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight capitalize">
          {topicId.replace("-", " ")}
        </h1>
        <p className="text-muted-foreground">
          This lesson is still in development.
        </p>
      </div>
    );
  }

  return (
    <div className="box-border w-full min-w-0 max-w-5xl space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
        <p className="text-xl text-muted-foreground">{content.description}</p>
      </div>

      <div className="my-8 w-full min-w-0 max-w-full">{content.visual}</div>
    </div>
  );
}
