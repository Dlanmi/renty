"use client";

import { useEffect, useState } from "react";

function measureViewportBottomInset(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(window.innerHeight - visualViewport.height - visualViewport.offsetTop)
  );
}

export default function useViewportBottomInset() {
  const [viewportBottomInset, setViewportBottomInset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const visualViewport = window.visualViewport;
    const syncInset = () => {
      setViewportBottomInset(measureViewportBottomInset());
    };

    syncInset();

    visualViewport?.addEventListener("resize", syncInset);
    visualViewport?.addEventListener("scroll", syncInset);
    window.addEventListener("resize", syncInset);
    window.addEventListener("orientationchange", syncInset);

    return () => {
      visualViewport?.removeEventListener("resize", syncInset);
      visualViewport?.removeEventListener("scroll", syncInset);
      window.removeEventListener("resize", syncInset);
      window.removeEventListener("orientationchange", syncInset);
    };
  }, []);

  return viewportBottomInset;
}
