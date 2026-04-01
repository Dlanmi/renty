"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Listing } from "@/lib/domain/types";
import {
  applyListingFilters,
  areSearchFiltersEqual,
  BEDROOM_OPTIONS,
  countActiveSearchFilters,
  DEFAULT_SEARCH_FILTERS,
  filtersToQueryString,
  filtersToSearchParams,
  getBedroomsLabel,
  getPriceLabel,
  HOME_SCROLL_QUERY_STORAGE_KEY,
  HOME_SCROLL_Y_STORAGE_KEY,
  parseFiltersFromSearchParams,
  PRICE_OPTIONS,
  type SearchFilters,
} from "@/lib/domain/search";
import {
  CHIP_REVEAL_VARIANTS,
  MOTION_LAYOUT_TRANSITION,
  PRESSABLE_MOTION_PROPS,
  SURFACE_REVEAL_VARIANTS,
} from "@/lib/motion/animations";
import { AnimatePresence, motion } from "@/lib/motion/runtime";
import HomeSearchHero from "@/components/search/HomeSearchHero";
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
  const [draftFilters, setDraftFilters] = useState(urlFilters);
  const didRestoreScroll = useRef(false);

  useEffect(() => {
    setDraftFilters(urlFilters);
  }, [urlFilters]);

  const neighborhoodOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const listing of listings) {
      counts.set(
        listing.neighborhood,
        (counts.get(listing.neighborhood) ?? 0) + 1
      );
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (a.count !== b.count) return b.count - a.count;
        return a.name.localeCompare(b.name, "es");
      });
  }, [listings]);

  const filteredListings = useMemo(
    () => applyListingFilters(listings, urlFilters),
    [listings, urlFilters]
  );
  const draftCount = useMemo(
    () => applyListingFilters(listings, draftFilters).length,
    [listings, draftFilters]
  );

  const activeFilterCount = countActiveSearchFilters(urlFilters);
  const listingQueryString = useMemo(
    () => filtersToQueryString(urlFilters),
    [urlFilters]
  );
  const appliedQuery = useMemo(
    () => filtersToSearchParams(urlFilters).toString(),
    [urlFilters]
  );
  const hasDraftChanges = !areSearchFiltersEqual(draftFilters, urlFilters);

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

  function updateUrlWithFilters(nextFilters: SearchFilters) {
    const nextParams = filtersToSearchParams(nextFilters).toString();
    const currentParams = searchParams.toString();
    if (nextParams === currentParams) return;

    const href = nextParams ? `${pathname}?${nextParams}` : pathname;
    router.push(href, { scroll: false });
  }

  function applyFilters(nextFilters: SearchFilters) {
    setDraftFilters(nextFilters);
    updateUrlWithFilters(nextFilters);
  }

  function clearAllFilters() {
    applyFilters(DEFAULT_SEARCH_FILTERS);
  }

  function removeAppliedFilter(patch: Partial<SearchFilters>) {
    const nextFilters = { ...urlFilters, ...patch };
    applyFilters(nextFilters);
  }

  const resultsDescription =
    activeFilterCount > 0
      ? "Mostrando las publicaciones que coinciden con tu búsqueda actual."
      : "Explora el inventario activo de Renty y ajusta la búsqueda cuando quieras.";

  return (
    <div className="space-y-8 sm:space-y-10">
      <HomeSearchHero
        draftFilters={draftFilters}
        neighborhoodOptions={neighborhoodOptions}
        priceOptions={PRICE_OPTIONS}
        bedroomOptions={BEDROOM_OPTIONS}
        activeFilterCount={activeFilterCount}
        draftCount={draftCount}
        hasDraftChanges={hasDraftChanges}
        onDraftChange={(patch) =>
          setDraftFilters((current) => ({ ...current, ...patch }))
        }
        onSubmit={() => applyFilters(draftFilters)}
        onClear={clearAllFilters}
        onResetDraft={() => setDraftFilters(urlFilters)}
      />

      <section
        className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6"
        aria-labelledby="home-listings-heading"
      >
        <motion.div
          layout
          initial="initial"
          animate="animate"
          variants={SURFACE_REVEAL_VARIANTS}
          transition={MOTION_LAYOUT_TRANSITION}
          className="rounded-[28px] border border-bg-border bg-bg-surface px-5 py-5 shadow-card sm:px-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                <Icon name="home_work" size={16} className="text-accent" />
                Resultados
              </div>
              <div>
                <h2
                  id="home-listings-heading"
                  className="text-2xl font-bold tracking-tight text-t-primary"
                >
                  {filteredListings.length}{" "}
                  {filteredListings.length === 1
                    ? "arriendo disponible"
                    : "arriendos disponibles"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-t-secondary">
                  {resultsDescription}
                </p>
              </div>
            </div>

            <motion.div
              layout="position"
              className="flex flex-wrap items-center gap-2"
              transition={MOTION_LAYOUT_TRANSITION}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {urlFilters.neighborhood && (
                  <motion.button
                    layout="position"
                    key="chip-neighborhood"
                    type="button"
                    onClick={() => removeAppliedFilter({ neighborhood: "" })}
                    {...PRESSABLE_MOTION_PROPS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={CHIP_REVEAL_VARIANTS}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full border border-bg-border bg-bg-base px-3 text-sm text-t-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    {urlFilters.neighborhood}
                    <Icon name="close" size={14} />
                  </motion.button>
                )}
                {urlFilters.maxPriceCOP > 0 && (
                  <motion.button
                    layout="position"
                    key="chip-price"
                    type="button"
                    onClick={() => removeAppliedFilter({ maxPriceCOP: 0 })}
                    {...PRESSABLE_MOTION_PROPS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={CHIP_REVEAL_VARIANTS}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full border border-bg-border bg-bg-base px-3 text-sm text-t-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    {getPriceLabel(urlFilters.maxPriceCOP)}
                    <Icon name="close" size={14} />
                  </motion.button>
                )}
                {urlFilters.minBedrooms > 0 && (
                  <motion.button
                    layout="position"
                    key="chip-bedrooms"
                    type="button"
                    onClick={() => removeAppliedFilter({ minBedrooms: 0 })}
                    {...PRESSABLE_MOTION_PROPS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={CHIP_REVEAL_VARIANTS}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full border border-bg-border bg-bg-base px-3 text-sm text-t-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    {getBedroomsLabel(urlFilters.minBedrooms)}
                    <Icon name="close" size={14} />
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.a
                layout="position"
                href="#home-search"
                {...PRESSABLE_MOTION_PROPS}
                className="inline-flex min-h-10 items-center rounded-full border border-bg-border px-4 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated hover:text-t-primary"
              >
                Editar búsqueda
              </motion.a>

              <AnimatePresence initial={false} mode="popLayout">
                {activeFilterCount > 0 && (
                  <motion.button
                    layout="position"
                    key="clear-filters"
                    type="button"
                    onClick={clearAllFilters}
                    {...PRESSABLE_MOTION_PROPS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={CHIP_REVEAL_VARIANTS}
                    className="inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    Limpiar filtros
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>

        <ListingGrid
          listings={filteredListings}
          listingQueryString={listingQueryString}
          onClearFilters={activeFilterCount > 0 ? clearAllFilters : undefined}
        />
      </section>
    </div>
  );
}
