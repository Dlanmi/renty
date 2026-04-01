"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/client";
import type { AnalyticsEventInput } from "@/lib/analytics/types";

export default function TrackEventOnMount(props: AnalyticsEventInput) {
  const {
    eventName,
    source,
    listingId,
    pagePath,
    referrer,
    position,
    searchContext,
    payload,
    dedupeKey,
  } = props;
  const searchContextKey = JSON.stringify(searchContext ?? {});
  const payloadKey = JSON.stringify(payload ?? {});

  useEffect(() => {
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
  // Serialized keys replace object refs to avoid duplicate fires.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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

  return null;
}
