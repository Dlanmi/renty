"use client";

import type { ReactNode } from "react";
import { motion } from "@/lib/motion/runtime";
import { MOTION_TRANSITIONS, PAGE_REVEAL_VARIANTS } from "@/lib/motion/animations";

interface PageRevealProps {
  children: ReactNode;
}

export default function PageReveal({ children }: PageRevealProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={PAGE_REVEAL_VARIANTS}
      transition={MOTION_TRANSITIONS.enter}
    >
      {children}
    </motion.div>
  );
}
