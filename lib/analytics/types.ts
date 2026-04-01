export const ANALYTICS_EVENT_NAMES = [
  "search_results_viewed",
  "filter_applied",
  "listing_card_impression",
  "listing_card_click",
  "listing_detail_view",
  "gallery_opened",
  "whatsapp_click",
  "publish_cta_click",
  "publish_page_view",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export const WHATSAPP_TRACKING_INTENTS = ["listing", "publish"] as const;

export type WhatsAppTrackingIntent =
  (typeof WHATSAPP_TRACKING_INTENTS)[number];

export interface AnalyticsSearchContext {
  searchQuery?: string;
  maxPriceCOP?: number;
  minBedrooms?: number;
  resultCount?: number;
}

export type AnalyticsPrimitive = string | number | boolean | null;

export type AnalyticsPayload = Record<string, AnalyticsPrimitive>;

export interface AnalyticsIdentity {
  anonymousId: string;
  sessionId: string;
}

export interface AnalyticsEventInput {
  eventName: AnalyticsEventName;
  source: string;
  listingId?: string | null;
  pagePath?: string;
  referrer?: string | null;
  position?: number;
  searchContext?: AnalyticsSearchContext;
  payload?: AnalyticsPayload;
  dedupeKey?: string;
}

export interface WhatsAppTrackingLinkInput {
  intent: WhatsAppTrackingIntent;
  source: string;
  pagePath: string;
  listingId?: string | null;
  position?: number;
  searchContext?: AnalyticsSearchContext;
  anonymousId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
