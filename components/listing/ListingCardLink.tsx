"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  HOME_SCROLL_QUERY_STORAGE_KEY,
  HOME_SCROLL_Y_STORAGE_KEY,
} from "@/lib/domain/search";

interface ListingCardLinkProps {
  href: string;
  className?: string;
  listingQueryString?: string;
  onNavigate?: () => void;
  "aria-label"?: string;
  children: ReactNode;
}

export default function ListingCardLink({
  href,
  className,
  listingQueryString = "",
  onNavigate,
  "aria-label": ariaLabel,
  children,
}: ListingCardLinkProps) {
  const handleClick = () => {
    onNavigate?.();

    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      HOME_SCROLL_Y_STORAGE_KEY,
      String(window.scrollY)
    );
    window.sessionStorage.setItem(
      HOME_SCROLL_QUERY_STORAGE_KEY,
      listingQueryString.replace(/^\?/, "")
    );
  };

  return (
    <Link href={href} className={className} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </Link>
  );
}
