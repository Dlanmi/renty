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
      <div className="flex flex-col items-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
          <Icon name="search_off" size={32} className="text-t-muted" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-t-primary">
          No encontramos arriendos
        </h3>
        <p className="mt-1 max-w-xs text-sm text-t-muted">
          Intenta ajustar los filtros o busca en otro barrio para ver más opciones.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-bg-border bg-bg-surface px-5 py-2.5 text-sm font-medium text-t-secondary shadow-card transition-colors hover:bg-bg-elevated active:scale-95"
          >
            <Icon name="filter_alt_off" size={18} />
            Limpiar filtros
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
