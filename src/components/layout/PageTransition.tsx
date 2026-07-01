"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: 14, filter: "blur(6px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: -8, filter: "blur(4px)" }
        }
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
