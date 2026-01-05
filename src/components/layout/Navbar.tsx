"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Code2, Share2 } from "lucide-react";

export function Navbar() {
    const pathname = usePathname();

    const routes = [
        {
            href: "/system-design",
            label: "System Design",
            icon: Share2,
            active: pathname.includes("/system-design"),
        },
        {
            href: "/data-structures",
            label: "Data Structures",
            icon: Code2,
            active: pathname.includes("/data-structures"),
        },
    ];

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
                <Link href="/" className="mr-6 flex items-center space-x-2 font-bold text-xl">
                    <div className="h-8 w-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <span className="text-white dark:text-black font-mono text-lg">V</span>
                    </div>
                    <span className="hidden sm:inline-block">VisualConcepts</span>
                </Link>
                <div className="flex items-center space-x-4 lg:space-x-6 mx-6">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                                route.active ? "text-black dark:text-white" : "text-muted-foreground"
                            )}
                        >
                            <route.icon className="h-4 w-4" />
                            {route.label}
                        </Link>
                    ))}
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    {/* Add GitHub link or Theme toggle here later */}
                    <Button variant="ghost" size="sm">
                        About
                    </Button>
                </div>
            </div>
        </nav>
    );
}
