"use client";

import { useEffect, useState } from "react";
import { HOME_SCROLL_QUERY_STORAGE_KEY } from "@/lib/domain/search";

function toHomeHref(queryString: string): string {
  const normalized = queryString.replace(/^\?/, "").trim();
  return normalized ? `/?${normalized}` : "/";
}

export default function useBackToSearchHref(fallbackHref: string): string {
  const [href, setHref] = useState(fallbackHref);

  useEffect(() => {
    const storedQuery = window.sessionStorage.getItem(
      HOME_SCROLL_QUERY_STORAGE_KEY
    );
    setHref(storedQuery ? toHomeHref(storedQuery) : fallbackHref);
  }, [fallbackHref]);

  return href;
}
