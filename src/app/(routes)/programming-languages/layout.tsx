import { Sidebar } from "@/components/layout/Sidebar";

export default function ProgrammingLanguagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto flex-1 max-w-7xl items-start px-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <Sidebar sectionId="programming-languages" />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0">{children}</div>
      </main>
    </div>
  );
}
