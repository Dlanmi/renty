import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/domain/format";
import {
  getRentyPublishWhatsAppUrl,
  getRentyPublishWhatsAppE164,
  normalizeWhatsAppE164,
} from "@/lib/domain/contact";
import {
  ANALYTICS_ANONYMOUS_ID_COOKIE,
  ANALYTICS_SESSION_ID_COOKIE,
  buildListingWhatsAppMessage,
  buildPublishWhatsAppMessage,
  createAnalyticsId,
  resolveAnalyticsEvent,
} from "@/lib/analytics/shared";
import type {
  AnalyticsEventName,
  AnalyticsIdentity,
  WhatsAppTrackingIntent,
} from "@/lib/analytics/types";

interface PersistAnalyticsEventInput {
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

interface PersistAnalyticsEventResult {
  ok: boolean;
  identity: AnalyticsIdentity;
}

let hasWarnedMissingAnalyticsTable = false;

export async function persistAnalyticsEvent(
  input: PersistAnalyticsEventInput,
  fallbackIdentity?: Partial<AnalyticsIdentity>
): Promise<PersistAnalyticsEventResult> {
  const identity = {
    anonymousId: fallbackIdentity?.anonymousId ?? createAnalyticsId(),
    sessionId: fallbackIdentity?.sessionId ?? createAnalyticsId(),
  };

  const event = resolveAnalyticsEvent(input, identity);
  if (!event) {
    return {
      ok: false,
      identity,
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("listing_events").insert({
    event_name: event.eventName,
    source: event.source,
    anonymous_id: event.anonymousId,
    session_id: event.sessionId,
    listing_id: event.listingId,
    page_path: event.pagePath,
    referrer: event.referrer,
    position: event.position,
    search_query: event.searchQuery,
    max_price_cop: event.maxPriceCOP,
    min_bedrooms: event.minBedrooms,
    result_count: event.resultCount,
    utm_source: event.utmSource,
    utm_medium: event.utmMedium,
    utm_campaign: event.utmCampaign,
    payload: event.payload,
  });

  if (error) {
    if (error.message.includes("Could not find the table 'public.listing_events'")) {
      if (!hasWarnedMissingAnalyticsTable) {
        hasWarnedMissingAnalyticsTable = true;
        console.warn(
          "[persistAnalyticsEvent] listing_events no existe en este entorno. Aplica supabase/009_product_analytics_foundation.sql para habilitar tracking persistente."
        );
      }
    } else {
      console.error("[persistAnalyticsEvent]", error.message);
    }
  }

  return {
    ok: !error,
    identity: {
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
    },
  };
}

interface ListingWhatsAppTarget {
  eventName: AnalyticsEventName;
  phone: string;
  message: string;
}

export async function resolveWhatsAppTarget(
  intent: WhatsAppTrackingIntent,
  listingId?: string | null
): Promise<ListingWhatsAppTarget | null> {
  if (intent === "publish") {
    return {
      eventName: "publish_cta_click",
      phone: getRentyPublishWhatsAppE164(),
      message: buildPublishWhatsAppMessage(),
    };
  }

  if (!listingId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("title, whatsapp_e164")
    .eq("id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[resolveWhatsAppTarget]", error.message);
    return null;
  }

  if (!data?.title || !data?.whatsapp_e164) return null;

  const normalizedPhone = normalizeWhatsAppE164(data.whatsapp_e164);
  if (!normalizedPhone) return null;

  return {
    eventName: "whatsapp_click",
    phone: normalizedPhone,
    message: buildListingWhatsAppMessage(data.title),
  };
}

export function buildWhatsAppRedirectUrl(phone: string, message: string): string {
  return whatsappLink(phone, message);
}

export function buildPublishWhatsAppFallbackUrl(): string {
  return getRentyPublishWhatsAppUrl(buildPublishWhatsAppMessage());
}

export function applyTrackingCookies(
  response: NextResponse,
  request: NextRequest,
  identity: { anonymousId: string; sessionId: string }
) {
  const currentAnonymousId =
    request.cookies.get(ANALYTICS_ANONYMOUS_ID_COOKIE)?.value;
  const currentSessionId = request.cookies.get(ANALYTICS_SESSION_ID_COOKIE)?.value;

  if (currentAnonymousId !== identity.anonymousId) {
    response.cookies.set(ANALYTICS_ANONYMOUS_ID_COOKIE, identity.anonymousId, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  if (currentSessionId !== identity.sessionId) {
    response.cookies.set(ANALYTICS_SESSION_ID_COOKIE, identity.sessionId, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
