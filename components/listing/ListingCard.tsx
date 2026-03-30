import Image from "next/image";
import type { Listing } from "@/lib/domain/types";
import { formatCOP, formatBillingPeriod } from "@/lib/domain/format";
import { iconForPropertyType } from "@/lib/domain/icons";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import ListingCardLink from "@/components/listing/ListingCardLink";

interface ListingCardProps {
  listing: Listing;
  href: string;
  listingQueryString?: string;
  priority?: boolean;
}

export default function ListingCard({
  listing,
  href,
  listingQueryString = "",
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
    cover_photo_url,
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

  return (
    <ListingCardLink
      href={`${href}${listingQueryString}`}
      className="group block h-full min-w-0"
      listingQueryString={listingQueryString}
    >
      <Card className="lift-hover h-full min-w-0 overflow-hidden border border-bg-border transition-all duration-200 ease-out hover:border-accent hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-card">
          <Image
            src={cover_photo_url}
            alt={descriptiveAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />
        </div>

        <div className="min-w-0 space-y-2 p-4">
          <div className="flex min-w-0 items-center gap-1 text-xs text-t-muted">
            <Icon name="location_on" size={14} className="shrink-0" />
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
    </ListingCardLink>
  );
}
