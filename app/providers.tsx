"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import ThemeColorMeta from "@/components/ui/ThemeColorMeta";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
} from "@/lib/motion/runtime";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <ThemeColorMeta />
          {children}
        </ThemeProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
