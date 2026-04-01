"use client";

import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { buildWhatsAppProxyPath } from "@/lib/analytics/shared";
import type { AnalyticsSearchContext } from "@/lib/analytics/types";
import { formatCOP, formatBillingPeriod } from "@/lib/domain/format";
import { buildListingCostSummary } from "@/lib/domain/listing-insights";
import type { Listing } from "@/lib/domain/types";
import {
  LIFT_ONLY_MOTION_PROPS,
  PRESSABLE_MOTION_PROPS,
} from "@/lib/motion/animations";
import { motion } from "@/lib/motion/runtime";
import Icon from "@/components/ui/Icon";
import MobileStickyContactBar from "@/components/listing/MobileStickyContactBar";
import PriceInsightCallout from "@/components/listing/PriceInsightCallout";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import ShareListingButton from "@/components/listing/ShareListingButton";

interface ContactCTAProps {
  listing: Pick<
    Listing,
    | "id"
    | "price_cop"
    | "billing_period"
    | "title"
    | "admin_fee_cop"
    | "utilities_cop_min"
    | "utilities_cop_max"
  >;
  pagePath: string;
  searchContext?: AnalyticsSearchContext;
  shareUrl: string;
  shareDescription: string;
}

export default function ContactCTA({
  listing,
  pagePath,
  searchContext,
  shareUrl,
  shareDescription,
}: ContactCTAProps) {
  const { price_cop: price, billing_period: billingPeriod, title } = listing;
  const shareTitle = `${title} | Renty`;
  const costSummary = buildListingCostSummary(listing);
  const desktopWhatsAppHref = buildWhatsAppProxyPath({
    intent: "listing",
    source: "listing_detail_sidebar",
    listingId: listing.id,
    pagePath,
    searchContext,
  });
  const mobileWhatsAppHref = buildWhatsAppProxyPath({
    intent: "listing",
    source: "listing_detail_sticky",
    listingId: listing.id,
    pagePath,
    searchContext,
  });

  const handleWhatsAppClick = useCallback(
    (source: string) => {
      void trackEvent({
        eventName: "whatsapp_click",
        source,
        listingId: listing.id,
        pagePath,
        searchContext,
        dedupeKey: `${listing.id}:${source}`,
      });
    },
    [listing.id, pagePath, searchContext]
  );

  return (
    <>
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-3">
          {costSummary.hasBreakdown && (
            <PriceInsightCallout message={costSummary.insightLabel} />
          )}

          <motion.div
            {...LIFT_ONLY_MOTION_PROPS}
            className="overflow-hidden rounded-card-lg border border-bg-border bg-bg-surface shadow-card"
          >
            <div className="border-b border-bg-border bg-gradient-to-br from-accent-dark/20 via-bg-surface to-bg-elevated px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-t-muted">
                Contacto directo
              </p>
              <p className="mt-1 text-2xl font-bold text-t-primary">
                {formatCOP(price)}
                <span className="text-base font-normal text-t-muted">
                  {formatBillingPeriod(billingPeriod)}
                </span>
              </p>
              {costSummary.hasBreakdown && (
                <div className="mt-3 rounded-2xl border border-accent/15 bg-accent/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                    Costo mensual estimado
                  </p>
                  <p className="mt-1 text-lg font-bold text-t-primary">
                    {costSummary.totalLabel}
                  </p>
                  <p className="mt-1 text-xs text-t-secondary">
                    {costSummary.breakdownLabel}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 p-6">
              <ul className="space-y-2 text-sm text-t-secondary">
                <li className="flex items-center gap-2">
                  <Icon name="bolt" size={16} className="text-accent" />
                  Respuesta rápida por WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="task_alt" size={16} className="text-accent" />
                  Sin intermediarios
                </li>
              </ul>

              <motion.a
                href={desktopWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                data-whatsapp-cta="listing-sidebar"
                onClick={() => handleWhatsAppClick("listing_detail_sidebar")}
                {...PRESSABLE_MOTION_PROPS}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Contactar por WhatsApp
              </motion.a>

              <ShareListingButton
                url={shareUrl}
                title={shareTitle}
                description={shareDescription}
                className="rounded-xl"
              />

              <p className="text-center text-xs text-t-muted">
                Sin intermediarios. Sin comisiones ocultas.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <MobileStickyContactBar
        href={mobileWhatsAppHref}
        priceLabel={formatCOP(price)}
        billingPeriodLabel={formatBillingPeriod(billingPeriod)}
        totalLineLabel={costSummary.totalLineLabel}
        totalLabel={costSummary.totalLabel}
        insightMessage={costSummary.insightLabel}
        hasBreakdown={costSummary.hasBreakdown}
        onWhatsAppClick={() => handleWhatsAppClick("listing_detail_sticky")}
      />
    </>
  );
}
