"use client";

import { useEffect, useState } from "react";
import PriceInsightCallout from "@/components/listing/PriceInsightCallout";

interface MobilePriceInsightProps {
  message: string;
  enabled?: boolean;
}

const REVEAL_AFTER_SCROLL_Y = 260;
const DISMISS_AFTER_SCROLL_Y = 420;
const DISMISS_WHEN_BACK_AT_TOP_Y = 72;
const MOBILE_BAR_OFFSET_PX = 124;

export default function MobilePriceInsight({
  message,
  enabled = true,
}: MobilePriceInsightProps) {
  const [state, setState] = useState<"idle" | "visible" | "dismissed">("idle");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;

    const syncState = () => {
      const currentY = window.scrollY;

      setState((previous) => {
        if (previous === "dismissed") return "dismissed";

        if (previous === "idle" && currentY >= REVEAL_AFTER_SCROLL_Y) {
          return "visible";
        }

        if (
          previous === "visible" &&
          (currentY >= DISMISS_AFTER_SCROLL_Y || currentY <= DISMISS_WHEN_BACK_AT_TOP_Y)
        ) {
          return "dismissed";
        }

        return previous;
      });

      animationFrame = 0;
    };

    const onScroll = () => {
      if (prefersReducedMotion.matches) {
        syncState();
        return;
      }

      if (animationFrame !== 0) return;
      animationFrame = window.requestAnimationFrame(syncState);
    };

    syncState();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[82] flex justify-center px-4 lg:hidden"
      style={{
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${MOBILE_BAR_OFFSET_PX}px)`,
      }}
      aria-hidden={state !== "visible"}
    >
      <div data-state={state} className="mobile-price-insight">
        <PriceInsightCallout message={message} compact />
      </div>
    </div>
  );
}
