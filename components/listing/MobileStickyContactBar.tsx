"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MOTION_TRANSITIONS,
  PRESSABLE_MOTION_PROPS,
} from "@/lib/motion/animations";
import { motion, useAnimationControls } from "@/lib/motion/runtime";
import Icon from "@/components/ui/Icon";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import useViewportBottomInset from "@/components/ui/useViewportBottomInset";
import MobilePriceInsight from "@/components/listing/MobilePriceInsight";

interface MobileStickyContactBarProps {
  href: string;
  priceLabel: string;
  billingPeriodLabel: string;
  totalLineLabel: string;
  totalLabel: string;
  insightMessage: string;
  hasBreakdown: boolean;
  onWhatsAppClick?: () => void;
  shareUrl: string;
  shareTitle: string;
}

const INSIGHT_GAP_PX = 22;
const FALLBACK_BAR_HEIGHT_PX = 88;

export default function MobileStickyContactBar({
  href,
  priceLabel,
  billingPeriodLabel,
  totalLineLabel,
  totalLabel,
  insightMessage,
  hasBreakdown,
  onWhatsAppClick,
  shareUrl,
  shareTitle,
}: MobileStickyContactBarProps) {
  const viewportBottomInset = useViewportBottomInset();
  const footerRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(FALLBACK_BAR_HEIGHT_PX);
  const infoLineControls = useAnimationControls();
  const totalLineControls = useAnimationControls();
  const [infoPulseCount, setInfoPulseCount] = useState(0);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const syncHeight = () => {
      setBarHeight(Math.round(footer.getBoundingClientRect().height));
    };

    syncHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncHeight);
      return () => window.removeEventListener("resize", syncHeight);
    }

    const observer = new ResizeObserver(syncHeight);
    observer.observe(footer);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  const handleShare = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard?.writeText(shareUrl);
    } catch {
      /* silent fallback */
    }
  }, [shareTitle, shareUrl]);

  const handleInsightAbsorb = useCallback(() => {
    setInfoPulseCount((current) => current + 1);

    // Imperative controls keep the info pulse synchronized with the badge absorption.
    void infoLineControls.start({
      scale: [1, 1.045, 0.99, 1],
      y: [0, -1, 0],
      color: [
        "var(--text-secondary)",
        "var(--accent-500)",
        "var(--text-secondary)",
      ],
      transition: {
        duration: 0.42,
        times: [0, 0.34, 0.7, 1],
      },
    });

    void totalLineControls.start({
      scale: [1, 1.02, 1],
      y: [0, -1, 0],
      transition: {
        duration: 0.4,
        times: [0, 0.4, 1],
      },
    });
  }, [infoLineControls, totalLineControls]);

  return (
    <>
      <MobilePriceInsight
        enabled={hasBreakdown}
        message={insightMessage}
        bottomOffsetPx={barHeight + INSIGHT_GAP_PX}
        viewportBottomInsetPx={viewportBottomInset}
        onAbsorb={handleInsightAbsorb}
      />

      <motion.div
        ref={footerRef}
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={MOTION_TRANSITIONS.enter}
        data-mobile-sticky-cta-state="visible"
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-bg-border bg-bg-surface shadow-[0_-10px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_-12px_24px_rgba(0,0,0,0.28)] lg:hidden"
        style={{
          bottom: `${viewportBottomInset}px`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center gap-2 px-3 py-3 min-[400px]:gap-3 min-[400px]:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[20px] font-extrabold leading-tight tracking-tight text-t-primary min-[380px]:text-[21px]">
              {priceLabel}
              <span className="text-[12px] font-normal text-t-muted">
                {billingPeriodLabel}
              </span>
            </p>
            {hasBreakdown ? (
              <div
                className="mt-1.5 space-y-0.5"
                data-mobile-insight-target="visible"
                data-mobile-insight-pulse={infoPulseCount}
              >
                <motion.p
                  animate={infoLineControls}
                  className="whitespace-nowrap text-[11px] font-medium leading-tight text-t-secondary"
                >
                  {totalLineLabel}
                </motion.p>
                <motion.p
                  animate={totalLineControls}
                  className="whitespace-nowrap text-[11px] font-semibold leading-tight text-t-primary min-[400px]:text-[12px] min-[440px]:text-[13px]"
                >
                  {totalLabel}
                </motion.p>
              </div>
            ) : (
              <p className="mt-1 text-[12px] text-t-muted">Canon mensual</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <motion.button
              type="button"
              onClick={handleShare}
              aria-label="Compartir"
              {...PRESSABLE_MOTION_PROPS}
              className="flex h-[52px] w-11 items-center justify-center rounded-2xl text-t-muted transition-colors hover:text-t-secondary active:text-t-primary focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon name="share" size={20} />
            </motion.button>

            <motion.a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-whatsapp-cta="mobile-sticky"
              onClick={onWhatsAppClick}
              {...PRESSABLE_MOTION_PROPS}
              className="inline-flex h-[52px] w-[124px] shrink-0 items-center justify-center gap-2 rounded-[18px] bg-whatsapp px-3 text-[14px] font-bold text-white transition-colors hover:bg-whatsapp-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface min-[400px]:w-[136px] min-[400px]:px-4 min-[440px]:w-[144px]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp
            </motion.a>
          </div>
        </div>
      </motion.div>
    </>
  );
}
