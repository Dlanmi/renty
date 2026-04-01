import { NextResponse, type NextRequest } from "next/server";
import {
  persistAnalyticsEvent,
  applyTrackingCookies,
} from "@/lib/analytics/server";
import {
  ANALYTICS_ANONYMOUS_ID_COOKIE,
  ANALYTICS_SESSION_ID_COOKIE,
} from "@/lib/analytics/shared";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const fallbackIdentity = {
    anonymousId: request.cookies.get(ANALYTICS_ANONYMOUS_ID_COOKIE)?.value,
    sessionId: request.cookies.get(ANALYTICS_SESSION_ID_COOKIE)?.value,
  };

  const result = await persistAnalyticsEvent(
    {
      eventName: body.eventName,
      source: body.source,
      anonymousId: body.anonymousId,
      sessionId: body.sessionId,
      listingId: body.listingId,
      pagePath: body.pagePath,
      referrer: body.referrer,
      position: body.position,
      searchContext:
        body.searchContext && typeof body.searchContext === "object"
          ? (body.searchContext as Record<string, unknown>)
          : undefined,
      payload:
        body.payload && typeof body.payload === "object"
          ? (body.payload as Record<string, unknown>)
          : undefined,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
    },
    fallbackIdentity
  );

  const response = NextResponse.json({ ok: result.ok }, { status: 202 });
  applyTrackingCookies(response, request, result.identity);
  return response;
}
