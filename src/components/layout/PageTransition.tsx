"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        {!shouldReduceMotion ? (
          <motion.div
            key={`${pathname}-progress`}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 z-[60] h-0.5 w-full origin-left bg-slate-950/80"
          />
        ) : null}
        <motion.div
          key={pathname}
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 18, scale: 0.992, filter: "blur(8px)" }
          }
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: -10, scale: 0.998, filter: "blur(5px)" }
          }
          transition={{
            duration: 0.46,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex-1"
          style={{
            backfaceVisibility: "hidden",
            transformOrigin: "center top",
            willChange: "opacity, transform, filter",
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
