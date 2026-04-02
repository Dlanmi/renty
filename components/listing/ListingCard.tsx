"use client";

import { useMemo, useRef } from "react";
import { motion } from "@/lib/motion/runtime";
import { trackEvent } from "@/lib/analytics/client";
import type { AnalyticsSearchContext } from "@/lib/analytics/types";
import { useTrackVisibleEvent } from "@/lib/analytics/useTrackVisibleEvent";
import type { Listing } from "@/lib/domain/types";
import { formatCOP, formatBillingPeriod } from "@/lib/domain/format";
import { iconForPropertyType } from "@/lib/domain/icons";
import { buildListingCardImageAsset } from "@/lib/domain/public-seo";
import {
  CARD_INTERACTION_VARIANTS,
  CARD_MEDIA_INTERACTION_VARIANTS,
  MOTION_TRANSITIONS,
} from "@/lib/motion/animations";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import ListingCardLink from "@/components/listing/ListingCardLink";

interface ListingCardProps {
  listing: Listing;
  href: string;
  position: number;
  listingQueryString?: string;
  searchContext?: AnalyticsSearchContext;
  priority?: boolean;
}

export default function ListingCard({
  listing,
  href,
  position,
  listingQueryString = "",
  searchContext,
  priority = false,
}: ListingCardProps) {
  const {
    title,
    approx_location,
    city,
    neighborhood,
    price_cop,
    billing_period,
    property_type,
    bedrooms,
    bathrooms,
    includes,
    listing_kind,
    area_m2,
    parking_car_count,
  } = listing;

  // Pick first include tag for the card chip
  const firstInclude = includes[0] ?? null;
  const showAreaChip =
    area_m2 != null && listing_kind !== "room_private" && listing_kind !== "room_shared";
  const showParkingChip = parking_car_count > 0;
  const descriptiveAlt = `${property_type} en arriendo en ${neighborhood}, ${city}: ${title}`;
  const cardImage = buildListingCardImageAsset(listing);
  const cardRef = useRef<HTMLDivElement>(null);
  const impressionDedupeKey = useMemo(
    () =>
      `${listing.id}:${searchContext?.searchQuery ?? ""}:${searchContext?.maxPriceCOP ?? 0}:${searchContext?.minBedrooms ?? 0}`,
    [
      listing.id,
      searchContext?.searchQuery,
      searchContext?.maxPriceCOP,
      searchContext?.minBedrooms,
    ]
  );

  useTrackVisibleEvent({
    elementRef: cardRef,
    eventName: "listing_card_impression",
    source: "listing_grid",
    listingId: listing.id,
    position,
    searchContext,
    dedupeKey: impressionDedupeKey,
  });

  const handleCardNavigate = () => {
    void trackEvent({
      eventName: "listing_card_click",
      source: "listing_grid",
      listingId: listing.id,
      position,
      searchContext,
      payload: {
        destinationPath: href,
      },
    });
  };

  return (
    <ListingCardLink
      href={`${href}${listingQueryString}`}
      className="group block h-full min-w-0"
      listingQueryString={listingQueryString}
      onNavigate={handleCardNavigate}
      aria-label={`${title} — ${formatCOP(price_cop)}${formatBillingPeriod(billing_period)} en ${neighborhood}`}
    >
      <motion.div
        ref={cardRef}
        layout
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileTap="tap"
        variants={CARD_INTERACTION_VARIANTS}
        transition={{
          ...MOTION_TRANSITIONS.hover,
          layout: MOTION_TRANSITIONS.layout,
        }}
      >
        <Card className="h-full min-w-0 overflow-hidden border border-bg-border transition-[border-color,box-shadow] duration-200 ease-out hover:border-accent hover:shadow-lg group-focus-visible:border-accent group-focus-visible:shadow-lg">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-card">
          {/* Use a native img here so the browser can pick thumb vs large directly from R2. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={cardImage.src}
              srcSet={cardImage.srcSet}
              sizes={cardImage.sizes}
              alt={descriptiveAlt}
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              variants={CARD_MEDIA_INTERACTION_VARIANTS}
              transition={MOTION_TRANSITIONS.hover}
            />
          </div>

          <div className="min-w-0 space-y-2 p-4">
            <div className="flex min-w-0 items-center gap-1 text-xs text-t-muted">
              <Icon name="place" size={14} className="shrink-0" />
              <span className="min-w-0 truncate">{approx_location}</span>
            </div>

            <h3 className="line-clamp-2 break-words text-[14px] font-semibold leading-snug text-t-primary">
              {title}
            </h3>

            <p className="break-words text-[18px] font-bold tracking-tight text-accent">
              {formatCOP(price_cop)}
              <span className="ml-0.5 text-[13px] font-normal text-t-muted">
                {formatBillingPeriod(billing_period)}
              </span>
            </p>

            <div className="relative min-w-0 pt-1">
              <div className="scrollbar-hide flex min-w-0 gap-1.5 overflow-x-auto pr-6 sm:flex-wrap sm:overflow-x-visible sm:pr-0">
                <Chip
                  icon={iconForPropertyType(property_type)}
                  label={property_type}
                  className="shrink-0"
                />
                <Chip icon="bed" label={`${bedrooms} hab`} className="shrink-0" />
                <Chip
                  icon="shower"
                  label={`${bathrooms} baño${bathrooms > 1 ? "s" : ""}`}
                  className="shrink-0"
                />
                {showAreaChip && (
                  <Chip icon="square_foot" label={`${area_m2} m2`} className="shrink-0" />
                )}
                {showParkingChip && (
                  <Chip icon="local_parking" label="Parqueadero" className="shrink-0" />
                )}
                {!showAreaChip && !showParkingChip && firstInclude && (
                  <Chip icon="check_circle" label={firstInclude} className="shrink-0" />
                )}
              </div>
              {/* Fade hint — indicates scrollable content on mobile */}
              <div
                className="pointer-events-none absolute right-0 top-1 bottom-0 w-8 bg-gradient-to-l from-bg-surface to-transparent sm:hidden"
                aria-hidden="true"
              />
            </div>
          </div>
        </Card>
      </motion.div>
    </ListingCardLink>
  );
}
