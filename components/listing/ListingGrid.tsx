import type { Listing } from "@/lib/domain/types";
import ListingCard from "./ListingCard";
import Icon from "@/components/ui/Icon";
import { getListingPath } from "@/lib/domain/listing-paths";

interface ListingGridProps {
  listings: Listing[];
  listingQueryString?: string;
  onClearFilters?: () => void;
}

export default function ListingGrid({
  listings,
  listingQueryString = "",
  onClearFilters,
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-t-muted">No encontramos arriendos con estos filtros.</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-full border border-bg-border px-4 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated"
          >
            <Icon name="close" size={16} />
            Quitar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="stagger-list grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing, index) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          href={getListingPath(listing)}
          listingQueryString={listingQueryString}
          priority={index < 3}
        />
      ))}
    </div>
  );
}
