import { Sidebar } from "@/components/layout/Sidebar";

export default function SystemDesignLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 max-w-7xl mx-auto px-4">
            <Sidebar sectionId="system-design" />
            <main className="relative py-6 lg:gap-10 lg:py-8">
                <div className="mx-auto w-full min-w-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
