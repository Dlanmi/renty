import { NextResponse, type NextRequest } from "next/server";
import {
  applyTrackingCookies,
  buildPublishWhatsAppFallbackUrl,
  buildWhatsAppRedirectUrl,
  persistAnalyticsEvent,
  resolveWhatsAppTarget,
} from "@/lib/analytics/server";
import {
  ANALYTICS_ANONYMOUS_ID_COOKIE,
  ANALYTICS_SESSION_ID_COOKIE,
  isWhatsAppTrackingIntent,
} from "@/lib/analytics/shared";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const intent = params.get("intent");
  const source = params.get("source");
  const listingId = params.get("listing");
  const pagePath = params.get("path");

  if (!isWhatsAppTrackingIntent(intent) || !source || !pagePath) {
    return NextResponse.redirect(buildPublishWhatsAppFallbackUrl(), 307);
  }

  const target = await resolveWhatsAppTarget(intent, listingId);
  if (!target) {
    // For listing intents, redirect to the listing page (or home) instead of
    // the operator's WhatsApp — sending the user to the wrong chat is worse
    // than a soft failure.
    if (intent === "listing" && pagePath) {
      const fallbackUrl = new URL(pagePath, request.nextUrl.origin);
      return NextResponse.redirect(fallbackUrl.toString(), 307);
    }
    return NextResponse.redirect(buildPublishWhatsAppFallbackUrl(), 307);
  }

  const fallbackIdentity = {
    anonymousId:
      params.get("aid") ??
      request.cookies.get(ANALYTICS_ANONYMOUS_ID_COOKIE)?.value,
    sessionId:
      params.get("sid") ??
      request.cookies.get(ANALYTICS_SESSION_ID_COOKIE)?.value,
  };

  const result = await persistAnalyticsEvent(
    {
      eventName: target.eventName,
      source,
      anonymousId: params.get("aid") ?? undefined,
      sessionId: params.get("sid") ?? undefined,
      listingId,
      pagePath,
      referrer: request.headers.get("referer"),
      position: params.get("position") ?? undefined,
      searchContext: {
        searchQuery: params.get("q") ?? undefined,
        maxPriceCOP:
          params.get("max") != null ? Number.parseInt(params.get("max")!, 10) : undefined,
        minBedrooms:
          params.get("beds") != null
            ? Number.parseInt(params.get("beds")!, 10)
            : undefined,
        resultCount:
          params.get("results") != null
            ? Number.parseInt(params.get("results")!, 10)
            : undefined,
      },
      payload:
        intent === "publish"
          ? {
              intent: "publish",
            }
          : {
              intent: "listing",
            },
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
    },
    fallbackIdentity
  );

  const response = NextResponse.redirect(
    buildWhatsAppRedirectUrl(target.phone, target.message),
    307
  );
  applyTrackingCookies(response, request, result.identity);
  return response;
}
