"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "@/lib/motion/runtime";
import PriceInsightCallout from "@/components/listing/PriceInsightCallout";

interface MobilePriceInsightProps {
  message: string;
  enabled?: boolean;
  bottomOffsetPx?: number;
  viewportBottomInsetPx?: number;
  onAbsorb?: () => void;
}

const REVEAL_AFTER_SCROLL_Y = 260;
const MIN_VISIBLE_MS = 1600;
const MIN_SCROLL_DELTA_BEFORE_DISMISS = 280;
const FORCE_DISMISS_AFTER_SCROLL_Y = 760;
const DISMISS_WHEN_BACK_AT_TOP_Y = 72;
export default function MobilePriceInsight({
  message,
  enabled = true,
  bottomOffsetPx = 108,
  viewportBottomInsetPx = 0,
  onAbsorb,
}: MobilePriceInsightProps) {
  const [state, setState] = useState<"idle" | "visible" | "dismissed">("idle");
  const prefersReducedMotion = useReducedMotion();
  const stateRef = useRef<"idle" | "visible" | "dismissed">("idle");
  const visibleAtRef = useRef<number | null>(null);
  const revealScrollYRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const onAbsorbRef = useRef(onAbsorb);

  useEffect(() => {
    onAbsorbRef.current = onAbsorb;
  }, [onAbsorb]);

  const updateState = (newState: "idle" | "visible" | "dismissed") => {
    const previousState = stateRef.current;
    stateRef.current = newState;
    setState(newState);

    if (newState === "dismissed" && previousState === "visible") {
      onAbsorbRef.current?.();
    }
  };

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let animationFrame = 0;

    const clearDismissTimer = () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };

    const scheduleDismissCheck = () => {
      if (visibleAtRef.current === null) return;

      const remainingMs = MIN_VISIBLE_MS - (Date.now() - visibleAtRef.current);
      if (remainingMs <= 0) return;

      clearDismissTimer();
      dismissTimerRef.current = window.setTimeout(() => {
        dismissTimerRef.current = null;
        syncState();
      }, remainingMs);
    };

    const syncState = () => {
      animationFrame = 0;
      const currentY = window.scrollY;
      const now = Date.now();
      const currentState = stateRef.current;

      if (currentState === "dismissed") return;

      if (currentState === "idle" && currentY >= REVEAL_AFTER_SCROLL_Y) {
        visibleAtRef.current = now;
        revealScrollYRef.current = currentY;
        updateState("visible");
        scheduleDismissCheck();
        return;
      }

      if (currentState === "visible") {
        const minVisibleTimeElapsed =
          visibleAtRef.current !== null &&
          now - visibleAtRef.current >= MIN_VISIBLE_MS;

        const revealScrollY = revealScrollYRef.current ?? REVEAL_AFTER_SCROLL_Y;
        const scrolledFarEnough = currentY >= revealScrollY + MIN_SCROLL_DELTA_BEFORE_DISMISS;

        const shouldDismiss =
          currentY <= DISMISS_WHEN_BACK_AT_TOP_Y ||
          (minVisibleTimeElapsed && scrolledFarEnough) ||
          currentY >= FORCE_DISMISS_AFTER_SCROLL_Y;

        if (shouldDismiss) {
          clearDismissTimer();
          updateState("dismissed");
          return;
        }

        if (!minVisibleTimeElapsed && dismissTimerRef.current === null) {
          scheduleDismissCheck();
        }
      }
    };

    updateState("idle");
    visibleAtRef.current = null;
    revealScrollYRef.current = null;
    clearDismissTimer();

    const onScroll = () => {
      if (prefersReducedMotion) {
        syncState();
        return;
      }

      if (animationFrame !== 0) return;
      animationFrame = window.requestAnimationFrame(syncState);
    };

    // Ejecutar chequeo inicial por si el usuario ya recargó la página a mitad del scroll
    syncState();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearDismissTimer();
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [enabled, prefersReducedMotion]);

  if (!enabled) return null;

  const hiddenAnimation = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 18, scale: 0.94 };
  const visibleAnimation = prefersReducedMotion
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 1, y: 0, scale: 1 };
  const dismissedAnimation = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 10, y: 14, scale: 0.88 };

  const badgeTransition = prefersReducedMotion
    ? { duration: 0.18 }
    : state === "visible"
      ? {
          y: {
            type: "spring",
            visualDuration: 0.34,
            bounce: 0.24,
          },
          scale: {
            type: "spring",
            visualDuration: 0.32,
            bounce: 0.2,
          },
          opacity: {
            duration: 0.2,
            ease: "easeOut",
          },
        }
      : {
          y: {
            type: "spring",
            visualDuration: 0.26,
            bounce: 0.08,
          },
          x: {
            duration: 0.22,
            ease: [0.4, 0, 0.2, 1],
          },
          scale: {
            type: "spring",
            visualDuration: 0.24,
            bounce: 0.12,
          },
          opacity: {
            duration: 0.16,
            ease: "easeIn",
          },
        };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[82] flex justify-center px-4 lg:hidden"
      style={{
        bottom: `${bottomOffsetPx + viewportBottomInsetPx}px`,
      }}
      aria-hidden={state !== "visible"}
    >
      <motion.div
        data-state={state}
        className="mobile-price-insight w-fit max-w-[min(208px,calc(100vw-3rem))]"
        initial={false}
        animate={
          state === "visible"
            ? visibleAnimation
            : state === "dismissed"
              ? dismissedAnimation
              : hiddenAnimation
        }
        transition={badgeTransition}
        style={{ transformOrigin: "center bottom" }}
      >
        <PriceInsightCallout
          message={message}
          compact
          className="origin-center"
        />
      </motion.div>
    </div>
  );
}
