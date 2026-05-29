"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export function SidebarLayout({ children, sectionId }: { children: React.ReactNode, sectionId: any }) {
    const pathname = usePathname();
    const isChallenge = pathname?.includes('/challenge');

    if (isChallenge) {
        return (
            <div className="flex flex-col flex-1 w-full px-4 md:px-8 mx-auto h-full min-h-[calc(100vh-4rem)]">
                {children}
            </div>
        );
    }

    return (
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 max-w-7xl mx-auto px-4">
            <Sidebar sectionId={sectionId} />
            <main className="relative py-6 lg:gap-10 lg:py-8">
                <div className="mx-auto w-full min-w-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
