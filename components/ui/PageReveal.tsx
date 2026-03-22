"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface PageRevealProps {
  children: ReactNode;
}

export default function PageReveal({ children }: PageRevealProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-reveal">
      {children}
    </div>
  );
}
