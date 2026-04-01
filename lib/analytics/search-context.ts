import type { SearchFilters } from "@/lib/domain/search";
import type { AnalyticsSearchContext } from "@/lib/analytics/types";

function getSingleValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function buildAnalyticsSearchContextFromFilters(
  filters: SearchFilters,
  resultCount?: number
): AnalyticsSearchContext {
  return {
    searchQuery: filters.neighborhood.trim() || undefined,
    maxPriceCOP: filters.maxPriceCOP > 0 ? filters.maxPriceCOP : undefined,
    minBedrooms: filters.minBedrooms > 0 ? filters.minBedrooms : undefined,
    resultCount,
  };
}

export function buildAnalyticsSearchContextFromRecord(
  searchParams?: Record<string, string | string[] | undefined>
): AnalyticsSearchContext | undefined {
  if (!searchParams) return undefined;

  const searchQuery = getSingleValue(searchParams.q)?.trim() || undefined;
  const maxPriceCOP = parsePositiveInteger(getSingleValue(searchParams.max));
  const minBedrooms = parsePositiveInteger(getSingleValue(searchParams.beds));

  if (!searchQuery && maxPriceCOP == null && minBedrooms == null) {
    return undefined;
  }

  return {
    searchQuery,
    maxPriceCOP,
    minBedrooms,
  };
}
