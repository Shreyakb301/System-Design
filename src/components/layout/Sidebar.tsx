"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TOPICS } from "@/lib/topics";

interface SidebarProps {
    sectionId: "system-design" | "data-structures" | "programming-languages";
}

export function Sidebar({ sectionId }: SidebarProps) {
    const pathname = usePathname();
    const section = TOPICS.find((t) => t.id === sectionId);

    if (!section) return null;

    return (
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
            <div className="h-full py-6 pr-6 lg:py-8">
                {/* We will implement a custom scroll area or stick to div if radix scroll-area not installed yet.
             For now, using a simple div with overflow.
          */}
                <div className="h-full overflow-y-auto">
                    <div className="w-full">
                        {section.categories.map((category) => (
                            <div key={category.id} className="pb-4">
                                <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold flex items-center gap-2">
                                    {category.icon && <category.icon className="h-4 w-4" />}
                                    {category.title}
                                </h4>
                                {category.items?.length > 0 && (
                                    <div className="grid grid-flow-row auto-rows-max text-sm">
                                        {category.items.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline",
                                                    pathname === item.href
                                                        ? "font-medium text-foreground underline"
                                                        : "text-muted-foreground"
                                                )}
                                            >
                                                {item.title}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
