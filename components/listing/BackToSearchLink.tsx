"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { HOME_SCROLL_QUERY_STORAGE_KEY } from "@/lib/domain/search";

interface BackToSearchLinkProps {
  fallbackHref: string;
  className?: string;
  children: ReactNode;
}

function toHomeHref(queryString: string): string {
  const normalized = queryString.replace(/^\?/, "").trim();
  return normalized ? `/?${normalized}` : "/";
}

export default function BackToSearchLink({
  fallbackHref,
  className,
  children,
}: BackToSearchLinkProps) {
  const [href, setHref] = useState(fallbackHref);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedQuery = window.sessionStorage.getItem(HOME_SCROLL_QUERY_STORAGE_KEY);
    if (!storedQuery) {
      setHref(fallbackHref);
      return;
    }

    setHref(toHomeHref(storedQuery));
  }, [fallbackHref]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
