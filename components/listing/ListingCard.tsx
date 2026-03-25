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
      <Card className="lift-hover h-full min-w-0 overflow-hidden border border-stone-200">
        {/* Image */}
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

        {/* Content */}
        <div className="min-w-0 space-y-2 p-4">
          {/* Location */}
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted">
            <Icon name="location_on" size={14} className="shrink-0" />
            <span className="min-w-0 truncate">{approx_location}</span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 break-words text-[14px] font-semibold leading-snug text-stone-900">
            {title}
          </h3>

          {/* Price */}
          <p className="break-words text-[18px] font-bold tracking-tight text-stone-900">
            {formatCOP(price_cop)}
            <span className="ml-0.5 text-[13px] font-normal text-muted">
              {formatBillingPeriod(billing_period)}
            </span>
          </p>

          {/* Chips */}
          <div className="flex min-w-0 flex-wrap gap-1.5 pt-1">
            <Chip
              icon={iconForPropertyType(property_type)}
              label={property_type}
              className="max-w-full"
            />
            <Chip icon="bed" label={`${bedrooms} hab`} className="max-w-full" />
            <Chip
              icon="shower"
              label={`${bathrooms} baño${bathrooms > 1 ? "s" : ""}`}
              className="max-w-full"
            />
            {showAreaChip && (
              <Chip icon="square_foot" label={`${area_m2} m2`} className="max-w-full" />
            )}
            {showParkingChip && (
              <Chip icon="local_parking" label="Parqueadero" className="max-w-full" />
            )}
            {!showAreaChip && !showParkingChip && firstInclude && (
              <Chip icon="check_circle" label={firstInclude} className="max-w-full" />
            )}
          </div>
        </div>
      </Card>
    </ListingCardLink>
  );
}
