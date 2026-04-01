"use client";

import {
  buildAnalyticsDedupStorageKey,
  normalizeAnalyticsSearchContext,
} from "@/lib/analytics/shared";
import { ensureAnalyticsIdentity } from "@/lib/analytics/identity";
import type { AnalyticsEventInput } from "@/lib/analytics/types";

function getCurrentUtmContext() {
  if (typeof window === "undefined") {
    return {
      utmSource: undefined,
      utmMedium: undefined,
      utmCampaign: undefined,
    };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
}

function isSessionDedupeSeen(storageKey: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function markSessionDedupeSeen(storageKey: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // Ignore quota/storage errors.
  }
}

async function sendTrackRequest(body: Record<string, unknown>) {
  const payload = JSON.stringify(body);

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([payload], { type: "application/json" });
    const queued = navigator.sendBeacon("/api/track", blob);
    if (queued) return;
  }

  await fetch("/api/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
    keepalive: true,
    body: payload,
  });
}

export async function trackEvent({
  eventName,
  source,
  listingId,
  pagePath,
  referrer,
  position,
  searchContext,
  payload,
  dedupeKey,
}: AnalyticsEventInput): Promise<void> {
  if (typeof window === "undefined") return;

  const identity = ensureAnalyticsIdentity();
  const dedupeStorageKey =
    dedupeKey ? buildAnalyticsDedupStorageKey(eventName, dedupeKey) : null;

  if (dedupeStorageKey && isSessionDedupeSeen(dedupeStorageKey)) {
    return;
  }

  if (dedupeStorageKey) {
    markSessionDedupeSeen(dedupeStorageKey);
  }

  const normalizedSearchContext = normalizeAnalyticsSearchContext(searchContext);
  const { utmSource, utmMedium, utmCampaign } = getCurrentUtmContext();

  try {
    await sendTrackRequest({
      eventName,
      source,
      anonymousId: identity.anonymousId,
      sessionId: identity.sessionId,
      listingId,
      pagePath: pagePath ?? window.location.pathname,
      referrer: (referrer ?? document.referrer) || undefined,
      position,
      searchContext: normalizedSearchContext,
      payload,
      utmSource,
      utmMedium,
      utmCampaign,
    });
  } catch {
    // Tracking should never interrupt the user flow.
  }
}
