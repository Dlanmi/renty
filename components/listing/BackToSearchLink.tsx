"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import useBackToSearchHref from "@/lib/hooks/useBackToSearchHref";

interface BackToSearchLinkProps {
  fallbackHref: string;
  className?: string;
  children: ReactNode;
}

export default function BackToSearchLink({
  fallbackHref,
  className,
  children,
}: BackToSearchLinkProps) {
  const href = useBackToSearchHref(fallbackHref);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
