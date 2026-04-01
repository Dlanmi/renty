"use client";

import type { Listing } from "@/lib/domain/types";
import {
  LIST_ITEM_REVEAL_VARIANTS,
  MOTION_LAYOUT_TRANSITION,
  SECTION_REVEAL_VARIANTS,
  STAGGER_FAST_VARIANTS,
  PRESSABLE_MOTION_PROPS,
} from "@/lib/motion/animations";
import { AnimatePresence, motion } from "@/lib/motion/runtime";
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
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={SECTION_REVEAL_VARIANTS}
        className="flex flex-col items-center px-4 py-20 text-center"
      >
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
          <motion.button
            type="button"
            onClick={onClearFilters}
            {...PRESSABLE_MOTION_PROPS}
            className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-bg-border bg-bg-surface px-5 py-2.5 text-sm font-medium text-t-secondary shadow-card transition-colors hover:bg-bg-elevated"
          >
            <Icon name="filter_alt_off" size={18} />
            Limpiar filtros
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial="initial"
      animate="animate"
      variants={STAGGER_FAST_VARIANTS}
      className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      transition={MOTION_LAYOUT_TRANSITION}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {listings.map((listing, index) => (
          <motion.div
            key={listing.id}
            layout
            initial="initial"
            animate="animate"
            exit="exit"
            variants={LIST_ITEM_REVEAL_VARIANTS}
            transition={MOTION_LAYOUT_TRANSITION}
            className="min-w-0"
          >
            <ListingCard
              listing={listing}
              href={getListingPath(listing)}
              listingQueryString={listingQueryString}
              priority={index < 3}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
