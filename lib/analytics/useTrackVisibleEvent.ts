"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { trackEvent } from "@/lib/analytics/client";
import type { AnalyticsEventInput } from "@/lib/analytics/types";

interface UseTrackVisibleEventOptions extends AnalyticsEventInput {
  elementRef: RefObject<Element>;
  enabled?: boolean;
  threshold?: number;
}

export function useTrackVisibleEvent({
  elementRef,
  enabled = true,
  threshold = 0.45,
  eventName,
  source,
  listingId,
  pagePath,
  referrer,
  position,
  searchContext,
  payload,
  dedupeKey,
}: UseTrackVisibleEventOptions) {
  const searchContextKey = JSON.stringify(searchContext ?? {});
  const payloadKey = JSON.stringify(payload ?? {});

  useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element || typeof IntersectionObserver === "undefined") {
      return;
    }

    let didTrack = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || didTrack) return;
        if (!entry.isIntersecting || entry.intersectionRatio < threshold) return;

        didTrack = true;
        void trackEvent({
          eventName,
          source,
          listingId,
          pagePath,
          referrer,
          position,
          searchContext,
          payload,
          dedupeKey,
        });
        observer.disconnect();
      },
      {
        threshold: [threshold],
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  // Serialized keys (searchContextKey, payloadKey) replace object refs to
  // avoid observer teardown on referential-only changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    elementRef,
    enabled,
    threshold,
    dedupeKey,
    eventName,
    listingId,
    pagePath,
    payloadKey,
    position,
    referrer,
    searchContextKey,
    source,
  ]);
}
