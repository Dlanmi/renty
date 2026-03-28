"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Listing } from "@/lib/domain/types";
import {
  applyListingFilters,
  BEDROOM_OPTIONS,
  countActiveSearchFilters,
  DEFAULT_SEARCH_FILTERS,
  filtersToQueryString,
  filtersToSearchParams,
  HOME_SCROLL_QUERY_STORAGE_KEY,
  HOME_SCROLL_Y_STORAGE_KEY,
  parseFiltersFromSearchParams,
  PRICE_OPTIONS,
  type SearchFilters,
} from "@/lib/domain/search";
import {
  createSearchFlowState,
  searchFlowReducer,
} from "@/lib/domain/search-flow";

import SearchFlowModal from "@/components/search/SearchFlowModal";
import SearchPill from "@/components/search/SearchPill";
import SearchTabs from "@/components/search/SearchTabs";
import ListingGrid from "@/components/listing/ListingGrid";
import Icon from "@/components/ui/Icon";

interface Props {
  listings: Listing[];
}

export default function SearchAndResults({ listings }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlFilters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  const [state, dispatch] = useReducer(
    searchFlowReducer,
    urlFilters,
    createSearchFlowState
  );

  const didRestoreScroll = useRef(false);

  useEffect(() => {
    dispatch({ type: "sync_from_url", filters: urlFilters });
  }, [urlFilters]);

  const updateUrlWithFilters = useCallback(
    (nextFilters: SearchFilters, mode: "push" | "replace" = "push") => {
      const nextParams = filtersToSearchParams(nextFilters).toString();
      const currentParams = searchParams.toString();
      if (nextParams === currentParams) return;

      const href = nextParams ? `${pathname}?${nextParams}` : pathname;
      if (mode === "replace") {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    dispatch({ type: "clear_all_filters" });
    updateUrlWithFilters(DEFAULT_SEARCH_FILTERS, "push");
  }, [updateUrlWithFilters]);

  const applyDesktopChange = useCallback(
    (patch: Partial<SearchFilters>) => {
      const nextFilters = { ...state.appliedFilters, ...patch };
      dispatch({ type: "set_applied_filters", filters: nextFilters });

      const mode = Object.prototype.hasOwnProperty.call(patch, "neighborhood")
        ? "replace"
        : "push";
      updateUrlWithFilters(nextFilters, mode);
    },
    [state.appliedFilters, updateUrlWithFilters]
  );

  const openMobileFlow = useCallback(() => {
    dispatch({ type: "open_mobile_flow" });
  }, []);

  const closeMobileFlow = useCallback(() => {
    dispatch({ type: "cancel_mobile_flow" });
  }, []);

  const applyMobileFilters = useCallback(() => {
    updateUrlWithFilters(state.draftFilters, "push");
    dispatch({ type: "apply_mobile_filters" });
  }, [state.draftFilters, updateUrlWithFilters]);

  const neighborhoods = useMemo(() => {
    const set = new Set(listings.map((listing) => listing.neighborhood));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [listings]);

  const filteredListings = useMemo(
    () => applyListingFilters(listings, state.appliedFilters),
    [listings, state.appliedFilters]
  );

  const draftCount = useMemo(
    () => applyListingFilters(listings, state.draftFilters).length,
    [listings, state.draftFilters]
  );

  const activeFilterCount = countActiveSearchFilters(state.appliedFilters);
  const listingQueryString = useMemo(
    () => filtersToQueryString(state.appliedFilters),
    [state.appliedFilters]
  );

  const appliedQuery = useMemo(
    () => filtersToSearchParams(state.appliedFilters).toString(),
    [state.appliedFilters]
  );

  useEffect(() => {
    if (didRestoreScroll.current || typeof window === "undefined") return;

    const storedY = window.sessionStorage.getItem(HOME_SCROLL_Y_STORAGE_KEY);
    const storedQuery =
      window.sessionStorage.getItem(HOME_SCROLL_QUERY_STORAGE_KEY) ?? "";

    if (!storedY || storedQuery !== appliedQuery) return;

    const scrollY = Number(storedY);
    if (Number.isFinite(scrollY)) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      });
    }

    window.sessionStorage.removeItem(HOME_SCROLL_Y_STORAGE_KEY);
    window.sessionStorage.removeItem(HOME_SCROLL_QUERY_STORAGE_KEY);
    didRestoreScroll.current = true;
  }, [appliedQuery]);

  return (
    <div className="space-y-6">
      <SearchPill
        filters={state.appliedFilters}
        neighborhoods={neighborhoods}
        priceOptions={PRICE_OPTIONS}
        bedroomOptions={BEDROOM_OPTIONS}
        activeFilterCount={activeFilterCount}
        onOpenMobileFlow={openMobileFlow}
        onChange={applyDesktopChange}
        onClearApplied={clearAllFilters}
      />

      {activeFilterCount === 0 && <SearchTabs />}

      <div className="mt-4 flex flex-col gap-3 text-sm text-t-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon name="home_work" size={18} />
          <span>
            <strong className="font-semibold text-t-primary">
              {filteredListings.length}
            </strong>{" "}
            {filteredListings.length === 1
              ? "arriendo disponible"
              : "arriendos disponibles"}
          </span>
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="lift-hover inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-dark/20 sm:w-auto"
          >
            <Icon name="close" size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      <section className="mt-4">
        <ListingGrid
          listings={filteredListings}
          listingQueryString={listingQueryString}
          onClearFilters={activeFilterCount > 0 ? clearAllFilters : undefined}
        />
      </section>

      <SearchFlowModal
        isOpen={state.isMobileFlowOpen}
        step={state.mobileStep}
        filters={state.draftFilters}
        neighborhoods={neighborhoods}
        priceOptions={PRICE_OPTIONS}
        bedroomOptions={BEDROOM_OPTIONS}
        resultsCount={draftCount}
        onClose={closeMobileFlow}
        onClear={clearAllFilters}
        onApply={applyMobileFilters}
        onStepChange={(step) => dispatch({ type: "set_mobile_step", step })}
        onChange={(patch) => dispatch({ type: "set_draft_patch", patch })}
      />
    </div>
  );
}
