import type { Listing } from "@/lib/domain/types";

export interface SearchFilters {
  neighborhood: string;
  maxPriceCOP: number;
  minBedrooms: number;
}

export interface NumericFilterOption {
  label: string;
  value: number;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  neighborhood: "",
  maxPriceCOP: 0,
  minBedrooms: 0,
};

export const PRICE_OPTIONS: NumericFilterOption[] = [
  { label: "Cualquier precio", value: 0 },
  { label: "Hasta $600.000", value: 600_000 },
  { label: "Hasta $800.000", value: 800_000 },
  { label: "Hasta $1.000.000", value: 1_000_000 },
  { label: "Hasta $1.500.000", value: 1_500_000 },
];

export const BEDROOM_OPTIONS: NumericFilterOption[] = [
  { label: "Cualquier", value: 0 },
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
];

export const HOME_SCROLL_QUERY_STORAGE_KEY = "renty.home.scroll.query";
export const HOME_SCROLL_Y_STORAGE_KEY = "renty.home.scroll.y";

const QUERY_KEY = {
  neighborhood: "q",
  maxPrice: "max",
  minBedrooms: "beds",
} as const;

function parseNumberParam(raw: string | null, fallback = 0): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function parseFiltersFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">
): SearchFilters {
  const neighborhood = (searchParams.get(QUERY_KEY.neighborhood) ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const maxPriceCOP = parseNumberParam(searchParams.get(QUERY_KEY.maxPrice), 0);
  const minBedrooms = parseNumberParam(searchParams.get(QUERY_KEY.minBedrooms), 0);

  return {
    neighborhood,
    maxPriceCOP,
    minBedrooms,
  };
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.neighborhood.trim()) {
    params.set(QUERY_KEY.neighborhood, filters.neighborhood.trim());
  }
  if (filters.maxPriceCOP > 0) {
    params.set(QUERY_KEY.maxPrice, String(filters.maxPriceCOP));
  }
  if (filters.minBedrooms > 0) {
    params.set(QUERY_KEY.minBedrooms, String(filters.minBedrooms));
  }

  return params;
}

export function filtersToQueryString(filters: SearchFilters): string {
  const serialized = filtersToSearchParams(filters).toString();
  return serialized ? `?${serialized}` : "";
}

export function areSearchFiltersEqual(
  a: SearchFilters,
  b: SearchFilters
): boolean {
  return (
    a.neighborhood === b.neighborhood &&
    a.maxPriceCOP === b.maxPriceCOP &&
    a.minBedrooms === b.minBedrooms
  );
}

export function hasActiveSearchFilters(filters: SearchFilters): boolean {
  return !areSearchFiltersEqual(filters, DEFAULT_SEARCH_FILTERS);
}

export function countActiveSearchFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.neighborhood.trim()) count += 1;
  if (filters.maxPriceCOP > 0) count += 1;
  if (filters.minBedrooms > 0) count += 1;
  return count;
}

export function applyListingFilters(
  listings: Listing[],
  filters: SearchFilters
): Listing[] {
  const neighborhoodNeedle = normalizeSearchText(filters.neighborhood);

  return listings.filter((listing) => {
    if (neighborhoodNeedle) {
      const neighborhood = normalizeSearchText(listing.neighborhood);
      const approxLocation = normalizeSearchText(listing.approx_location);
      if (
        !neighborhood.includes(neighborhoodNeedle) &&
        !approxLocation.includes(neighborhoodNeedle)
      ) {
        return false;
      }
    }

    if (filters.maxPriceCOP > 0 && listing.price_cop > filters.maxPriceCOP) {
      return false;
    }

    if (filters.minBedrooms > 0 && listing.bedrooms < filters.minBedrooms) {
      return false;
    }

    return true;
  });
}

export function getPriceLabel(value: number): string {
  return PRICE_OPTIONS.find((option) => option.value === value)?.label ??
    "Cualquier precio";
}

export function getBedroomsLabel(value: number): string {
  return value > 0 ? `${value}+ hab` : "Cualquier";
}
