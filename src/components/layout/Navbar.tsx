"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Code2, Share2, BookOpenText } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/",
      label: "Overview",
      icon: Compass,
      active: pathname === "/",
    },
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
    {
      href: "/programming-languages",
      label: "Programming Languages",
      icon: BookOpenText,
      active: pathname.includes("/programming-languages"),
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#fbfbf8]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[#fbfbf8]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="ProtoPlay logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-[0.85rem] object-contain shadow-sm"
            priority
          />
          <div className="text-[1.35rem] font-bold tracking-tight text-slate-950 sm:text-[1.5rem]">
            ProtoPlay
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-black/5 bg-white p-1 md:flex">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                route.active
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden rounded-full px-4 text-slate-600 hover:bg-white hover:text-slate-950 sm:inline-flex"
          >
            <Link href="/#tracks">Tracks</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-slate-900 px-4 text-white shadow-sm hover:bg-slate-800"
          >
            <Link href="/system-design/challenge">
              Start challenge
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
