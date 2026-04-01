import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWhatsAppProxyPath,
  resolveAnalyticsEvent,
} from "@/lib/analytics/shared";
import { getRentyPublishWhatsAppE164 } from "@/lib/domain/contact";

type ContactEnvKey =
  | "NEXT_PUBLIC_RENTY_PUBLISH_WHATSAPP_E164"
  | "RENTY_PUBLISH_WHATSAPP_E164";

function withEnv<T>(
  nextEnv: Partial<Record<ContactEnvKey, string | undefined>>,
  run: () => T
): T {
  const previous: Partial<Record<ContactEnvKey, string | undefined>> = {
    NEXT_PUBLIC_RENTY_PUBLISH_WHATSAPP_E164:
      process.env.NEXT_PUBLIC_RENTY_PUBLISH_WHATSAPP_E164,
    RENTY_PUBLISH_WHATSAPP_E164: process.env.RENTY_PUBLISH_WHATSAPP_E164,
  };

  for (const [key, value] of Object.entries(nextEnv)) {
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }

  try {
    return run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === "string") {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    }
  }
}

test("buildWhatsAppProxyPath serializa contexto clave del funnel", () => {
  const href = buildWhatsAppProxyPath({
    intent: "listing",
    source: "listing_detail_sidebar",
    pagePath: "/arriendos/apartamento-prueba",
    listingId: "00000000-0000-4000-8000-000000000001",
    position: 3,
    searchContext: {
      searchQuery: "Usaquén",
      maxPriceCOP: 2200000,
      minBedrooms: 2,
      resultCount: 7,
    },
    anonymousId: "anon-1",
    sessionId: "session-1",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "usaquen",
  });

  const url = new URL(href, "https://rentyco.app");

  assert.equal(url.pathname, "/go/whatsapp");
  assert.equal(url.searchParams.get("intent"), "listing");
  assert.equal(url.searchParams.get("listing"), "00000000-0000-4000-8000-000000000001");
  assert.equal(url.searchParams.get("path"), "/arriendos/apartamento-prueba");
  assert.equal(url.searchParams.get("q"), "Usaquén");
  assert.equal(url.searchParams.get("max"), "2200000");
  assert.equal(url.searchParams.get("beds"), "2");
  assert.equal(url.searchParams.get("results"), "7");
  assert.equal(url.searchParams.get("aid"), "anon-1");
  assert.equal(url.searchParams.get("sid"), "session-1");
});

test("resolveAnalyticsEvent sanea entrada cruda y exige mínimos del contrato", () => {
  const event = resolveAnalyticsEvent(
    {
      eventName: "whatsapp_click",
      source: "listing_detail_sticky",
      pagePath: "/arriendos/apartamento-prueba",
      listingId: "00000000-0000-4000-8000-000000000001",
      referrer: " https://google.com/search?q=renty ",
      position: "2",
      searchContext: {
        searchQuery: "  Mazurén  ",
        maxPriceCOP: "1800000",
        minBedrooms: "1",
        resultCount: "5",
      },
      payload: {
        intent: "listing",
        extra: " valor ",
      },
    },
    {
      anonymousId: "anon-123",
      sessionId: "session-123",
    }
  );

  assert.ok(event);
  assert.equal(event?.anonymousId, "anon-123");
  assert.equal(event?.sessionId, "session-123");
  assert.equal(event?.searchQuery, "Mazurén");
  assert.equal(event?.maxPriceCOP, 1800000);
  assert.equal(event?.minBedrooms, 1);
  assert.equal(event?.resultCount, 5);
  assert.equal(event?.position, 2);
  assert.deepEqual(event?.payload, {
    intent: "listing",
    extra: "valor",
  });
});

test("getRentyPublishWhatsAppE164 prioriza env server-side cuando ambos existen", () => {
  const phone = withEnv(
    {
      NEXT_PUBLIC_RENTY_PUBLISH_WHATSAPP_E164: "+57 300 111 2233",
      RENTY_PUBLISH_WHATSAPP_E164: "573001112244",
    },
    () => getRentyPublishWhatsAppE164()
  );

  assert.equal(phone, "573001112244");
});

test("getRentyPublishWhatsAppE164 usa env server-side cuando no hay override público", () => {
  const phone = withEnv(
    {
      NEXT_PUBLIC_RENTY_PUBLISH_WHATSAPP_E164: undefined,
      RENTY_PUBLISH_WHATSAPP_E164: "573001112244",
    },
    () => getRentyPublishWhatsAppE164()
  );

  assert.equal(phone, "573001112244");
});
