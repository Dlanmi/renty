"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import ThemeColorMeta from "@/components/ui/ThemeColorMeta";

export default function Providers({ children }: { children: ReactNode }) {
  return (
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
  );
}
