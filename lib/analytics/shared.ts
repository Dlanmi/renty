import { isValidListingId } from "@/lib/domain/listing-paths";
import {
  ANALYTICS_EVENT_NAMES,
  WHATSAPP_TRACKING_INTENTS,
  type AnalyticsEventName,
  type AnalyticsIdentity,
  type AnalyticsPayload,
  type AnalyticsPrimitive,
  type AnalyticsSearchContext,
  type WhatsAppTrackingIntent,
  type WhatsAppTrackingLinkInput,
} from "@/lib/analytics/types";

export const ANALYTICS_ANONYMOUS_ID_COOKIE = "renty_anonymous_id";
export const ANALYTICS_SESSION_ID_COOKIE = "renty_session_id";
export const ANALYTICS_ANONYMOUS_ID_STORAGE_KEY =
  "renty.analytics.anonymous_id";
export const ANALYTICS_SESSION_ID_STORAGE_KEY = "renty.analytics.session_id";
export const ANALYTICS_SESSION_DEDUPE_PREFIX = "renty.analytics.dedupe";

const ANALYTICS_EVENT_NAME_SET = new Set<AnalyticsEventName>(
  ANALYTICS_EVENT_NAMES
);
const WHATSAPP_INTENT_SET = new Set<WhatsAppTrackingIntent>(
  WHATSAPP_TRACKING_INTENTS
);

function normalizeText(
  value: unknown,
  maxLength: number
): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function normalizePagePath(value: unknown): string | undefined {
  const normalized = normalizeText(value, 512);
  if (!normalized || !normalized.startsWith("/")) return undefined;
  return normalized;
}

function normalizeNonNegativeInteger(
  value: unknown,
  maxValue = 100_000_000,
  minValue = 0
): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value >= minValue && value <= maxValue ? value : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isInteger(parsed) && parsed >= minValue && parsed <= maxValue
      ? parsed
      : undefined;
  }

  return undefined;
}

function normalizePayloadValue(value: unknown): AnalyticsPrimitive | undefined {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return normalizeText(value, 300);
}

export function sanitizeAnalyticsPayload(
  payload: unknown
): AnalyticsPayload | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const entries = Object.entries(payload).slice(0, 24);
  const sanitized: AnalyticsPayload = {};

  for (const [key, value] of entries) {
    const normalizedKey = normalizeText(key, 48);
    const normalizedValue = normalizePayloadValue(value);
    if (!normalizedKey || normalizedValue === undefined) continue;
    sanitized[normalizedKey] = normalizedValue;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function normalizeAnalyticsSearchContext(
  searchContext: unknown
): AnalyticsSearchContext | undefined {
  if (!searchContext || typeof searchContext !== "object" || Array.isArray(searchContext)) {
    return undefined;
  }

  const raw = searchContext as Partial<AnalyticsSearchContext>;

  const normalized: AnalyticsSearchContext = {
    searchQuery: normalizeText(raw.searchQuery, 120),
    maxPriceCOP: normalizeNonNegativeInteger(raw.maxPriceCOP),
    minBedrooms: normalizeNonNegativeInteger(raw.minBedrooms, 20),
    resultCount: normalizeNonNegativeInteger(raw.resultCount, 10_000),
  };

  return Object.values(normalized).some((value) => value != null)
    ? normalized
    : undefined;
}

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && ANALYTICS_EVENT_NAME_SET.has(value as AnalyticsEventName);
}

export function isWhatsAppTrackingIntent(
  value: unknown
): value is WhatsAppTrackingIntent {
  return (
    typeof value === "string" &&
    WHATSAPP_INTENT_SET.has(value as WhatsAppTrackingIntent)
  );
}

export function createAnalyticsId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `renty-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function normalizeAnalyticsIdentity(
  identity: Partial<AnalyticsIdentity>
): AnalyticsIdentity | null {
  const anonymousId = normalizeText(identity.anonymousId, 120);
  const sessionId = normalizeText(identity.sessionId, 120);

  if (!anonymousId || !sessionId) return null;

  return {
    anonymousId,
    sessionId,
  };
}

export function buildAnalyticsDedupStorageKey(
  eventName: AnalyticsEventName,
  dedupeKey: string
): string {
  return `${ANALYTICS_SESSION_DEDUPE_PREFIX}:${eventName}:${dedupeKey}`;
}

export function buildListingWhatsAppMessage(title: string): string {
  const safeTitle = normalizeText(title, 160) ?? "este arriendo";
  return `Hola, estoy interesado(a) en el arriendo: "${safeTitle}". ¿Está disponible?`;
}

export function buildPublishWhatsAppMessage(): string {
  return "Hola, quiero publicar un inmueble en Renty. ¿Qué información necesitan para empezar?";
}

export function buildWhatsAppProxyPath({
  intent,
  source,
  pagePath,
  listingId,
  position,
  searchContext,
  anonymousId,
  sessionId,
  utmSource,
  utmMedium,
  utmCampaign,
}: WhatsAppTrackingLinkInput): string {
  const normalizedSource = normalizeText(source, 80);
  const normalizedPath = normalizePagePath(pagePath);

  if (!isWhatsAppTrackingIntent(intent) || !normalizedSource || !normalizedPath) {
    return "/go/whatsapp";
  }

  const params = new URLSearchParams();
  params.set("intent", intent);
  params.set("source", normalizedSource);
  params.set("path", normalizedPath);

  if (listingId && isValidListingId(listingId)) {
    params.set("listing", listingId);
  }

  const normalizedPosition = normalizeNonNegativeInteger(position, 500, 1);
  if (normalizedPosition) {
    params.set("position", String(normalizedPosition));
  }

  const normalizedSearchContext = normalizeAnalyticsSearchContext(searchContext);
  if (normalizedSearchContext?.searchQuery) {
    params.set("q", normalizedSearchContext.searchQuery);
  }
  if (normalizedSearchContext?.maxPriceCOP) {
    params.set("max", String(normalizedSearchContext.maxPriceCOP));
  }
  if (normalizedSearchContext?.minBedrooms) {
    params.set("beds", String(normalizedSearchContext.minBedrooms));
  }
  if (normalizedSearchContext?.resultCount !== undefined) {
    params.set("results", String(normalizedSearchContext.resultCount));
  }

  const normalizedIdentity = normalizeAnalyticsIdentity({
    anonymousId,
    sessionId,
  });
  if (normalizedIdentity) {
    params.set("aid", normalizedIdentity.anonymousId);
    params.set("sid", normalizedIdentity.sessionId);
  }

  const normalizedUtmSource = normalizeText(utmSource, 120);
  const normalizedUtmMedium = normalizeText(utmMedium, 120);
  const normalizedUtmCampaign = normalizeText(utmCampaign, 160);

  if (normalizedUtmSource) params.set("utm_source", normalizedUtmSource);
  if (normalizedUtmMedium) params.set("utm_medium", normalizedUtmMedium);
  if (normalizedUtmCampaign) params.set("utm_campaign", normalizedUtmCampaign);

  return `/go/whatsapp?${params.toString()}`;
}

interface ResolvedAnalyticsEvent {
  eventName: AnalyticsEventName;
  source: string;
  anonymousId: string;
  sessionId: string;
  listingId: string | null;
  pagePath: string;
  referrer: string | null;
  position: number | null;
  searchQuery: string | null;
  maxPriceCOP: number | null;
  minBedrooms: number | null;
  resultCount: number | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  payload: AnalyticsPayload;
}

interface RawAnalyticsEventInput {
  eventName?: unknown;
  source?: unknown;
  anonymousId?: unknown;
  sessionId?: unknown;
  listingId?: unknown;
  pagePath?: unknown;
  referrer?: unknown;
  position?: unknown;
  searchContext?: unknown;
  payload?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
}

export function resolveAnalyticsEvent(
  input: RawAnalyticsEventInput,
  fallbackIdentity?: Partial<AnalyticsIdentity>
): ResolvedAnalyticsEvent | null {
  if (!isAnalyticsEventName(input.eventName)) return null;

  const normalizedSource = normalizeText(input.source, 80);
  const normalizedPagePath = normalizePagePath(input.pagePath);
  const normalizedIdentity =
    normalizeAnalyticsIdentity({
      anonymousId:
        normalizeText(input.anonymousId, 120) ??
        fallbackIdentity?.anonymousId,
      sessionId:
        normalizeText(input.sessionId, 120) ?? fallbackIdentity?.sessionId,
    }) ??
    normalizeAnalyticsIdentity({
      anonymousId: createAnalyticsId(),
      sessionId: createAnalyticsId(),
    });

  if (!normalizedSource || !normalizedPagePath || !normalizedIdentity) {
    return null;
  }

  const normalizedSearchContext = normalizeAnalyticsSearchContext(
    input.searchContext
  );

  return {
    eventName: input.eventName,
    source: normalizedSource,
    anonymousId: normalizedIdentity.anonymousId,
    sessionId: normalizedIdentity.sessionId,
    listingId:
      typeof input.listingId === "string" && isValidListingId(input.listingId)
        ? input.listingId
        : null,
    pagePath: normalizedPagePath,
    referrer: normalizeText(input.referrer, 512) ?? null,
    position: normalizeNonNegativeInteger(input.position, 500, 1) ?? null,
    searchQuery: normalizedSearchContext?.searchQuery ?? null,
    maxPriceCOP: normalizedSearchContext?.maxPriceCOP ?? null,
    minBedrooms: normalizedSearchContext?.minBedrooms ?? null,
    resultCount: normalizedSearchContext?.resultCount ?? null,
    utmSource: normalizeText(input.utmSource, 120) ?? null,
    utmMedium: normalizeText(input.utmMedium, 120) ?? null,
    utmCampaign: normalizeText(input.utmCampaign, 160) ?? null,
    payload: sanitizeAnalyticsPayload(input.payload) ?? {},
  };
}
