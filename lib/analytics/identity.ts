"use client";

import {
  ANALYTICS_ANONYMOUS_ID_COOKIE,
  ANALYTICS_ANONYMOUS_ID_STORAGE_KEY,
  ANALYTICS_SESSION_ID_COOKIE,
  ANALYTICS_SESSION_ID_STORAGE_KEY,
  createAnalyticsId,
  normalizeAnalyticsIdentity,
} from "@/lib/analytics/shared";
import type { AnalyticsIdentity } from "@/lib/analytics/types";

const ANONYMOUS_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : undefined;
}

function writeCookie(name: string, value: string, maxAgeSeconds?: number) {
  if (typeof document === "undefined") return;

  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
  ];

  if (typeof maxAgeSeconds === "number") {
    attributes.push(`Max-Age=${maxAgeSeconds}`);
  }

  if (window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  document.cookie = attributes.join("; ");
}

function readStorage(
  storage: Storage | undefined,
  key: string
): string | undefined {
  if (!storage) return undefined;

  try {
    return storage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(storage: Storage | undefined, key: string, value: string) {
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage errors; analytics should never block the product.
  }
}

function getOrCreateAnonymousId(): string {
  const existing = normalizeAnalyticsIdentity({
    anonymousId:
      readStorage(
        typeof window !== "undefined" ? window.localStorage : undefined,
        ANALYTICS_ANONYMOUS_ID_STORAGE_KEY
      ) ?? readCookie(ANALYTICS_ANONYMOUS_ID_COOKIE),
    sessionId: createAnalyticsId(),
  });

  if (existing) {
    writeStorage(
      typeof window !== "undefined" ? window.localStorage : undefined,
      ANALYTICS_ANONYMOUS_ID_STORAGE_KEY,
      existing.anonymousId
    );
    writeCookie(
      ANALYTICS_ANONYMOUS_ID_COOKIE,
      existing.anonymousId,
      ANONYMOUS_ID_MAX_AGE_SECONDS
    );
    return existing.anonymousId;
  }

  const anonymousId = createAnalyticsId();
  writeStorage(
    typeof window !== "undefined" ? window.localStorage : undefined,
    ANALYTICS_ANONYMOUS_ID_STORAGE_KEY,
    anonymousId
  );
  writeCookie(
    ANALYTICS_ANONYMOUS_ID_COOKIE,
    anonymousId,
    ANONYMOUS_ID_MAX_AGE_SECONDS
  );
  return anonymousId;
}

function getOrCreateSessionId(): string {
  const existing = normalizeAnalyticsIdentity({
    anonymousId: createAnalyticsId(),
    sessionId:
      readStorage(
        typeof window !== "undefined" ? window.sessionStorage : undefined,
        ANALYTICS_SESSION_ID_STORAGE_KEY
      ) ?? readCookie(ANALYTICS_SESSION_ID_COOKIE),
  });

  if (existing) {
    writeStorage(
      typeof window !== "undefined" ? window.sessionStorage : undefined,
      ANALYTICS_SESSION_ID_STORAGE_KEY,
      existing.sessionId
    );
    writeCookie(ANALYTICS_SESSION_ID_COOKIE, existing.sessionId);
    return existing.sessionId;
  }

  const sessionId = createAnalyticsId();
  writeStorage(
    typeof window !== "undefined" ? window.sessionStorage : undefined,
    ANALYTICS_SESSION_ID_STORAGE_KEY,
    sessionId
  );
  writeCookie(ANALYTICS_SESSION_ID_COOKIE, sessionId);
  return sessionId;
}

export function ensureAnalyticsIdentity(): AnalyticsIdentity {
  return {
    anonymousId: getOrCreateAnonymousId(),
    sessionId: getOrCreateSessionId(),
  };
}

export function getAnalyticsIdentity(): AnalyticsIdentity | null {
  return normalizeAnalyticsIdentity({
    anonymousId:
      readStorage(
        typeof window !== "undefined" ? window.localStorage : undefined,
        ANALYTICS_ANONYMOUS_ID_STORAGE_KEY
      ) ?? readCookie(ANALYTICS_ANONYMOUS_ID_COOKIE),
    sessionId:
      readStorage(
        typeof window !== "undefined" ? window.sessionStorage : undefined,
        ANALYTICS_SESSION_ID_STORAGE_KEY
      ) ?? readCookie(ANALYTICS_SESSION_ID_COOKIE),
  });
}
