"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Share2, Code2, BookOpenText, Trophy, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    {
      href: "/system-design",
      label: "System Design",
      icon: Share2,
      active: pathname.includes("/system-design") && !pathname.includes("/system-design/challenge"),
    },
    {
      href: "/data-structures",
      label: "Data Structures",
      icon: Code2,
      active: pathname.includes("/data-structures") && !pathname.includes("/data-structures/challenge"),
    },
    /*
    {
      href: "/programming-languages",
      label: "Programming Languages",
      icon: BookOpenText,
      active: pathname.includes("/programming-languages"),
    },
    */
    {
      href: "/system-design/challenge",
      label: "Challenges",
      icon: Trophy,
      active: pathname.includes("/challenge"),
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#fbfbf8]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[#fbfbf8]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
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

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1 rounded-full border border-black/5 bg-white p-1">
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

        {/* Mobile Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden border-t border-black/5 bg-white px-4 py-4 space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                route.active
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
