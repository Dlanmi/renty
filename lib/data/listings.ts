import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingPhoto, ListingPoi } from "@/lib/domain/types";

const UUID_V4_OR_VX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidListingId(id: string): boolean {
  return UUID_V4_OR_VX.test(id.trim());
}

/**
 * Fetch all active listings, newest first.
 */
export async function getActiveListings(): Promise<Listing[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getActiveListings]", error.message);
    return [];
  }

  return (data as Listing[]) ?? [];
}

/**
 * Fetch a single listing by ID regardless of status.
 */
async function getListingByIdAnyStatusRaw(id: string): Promise<Listing | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id.trim())
    .maybeSingle();

  if (error) {
    console.error("[getListingByIdAnyStatus]", error.message);
    return null;
  }

  return (data as Listing) ?? null;
}

export const getListingByIdAnyStatus = cache(getListingByIdAnyStatusRaw);

/**
 * Fetch an active listing by ID.
 */
const getListingByIdRaw = cache(async (id: string): Promise<Listing | null> => {
  const listing = await getListingByIdAnyStatus(id);
  if (!listing || listing.status !== "active") return null;
  return listing;
});

export const getListingById = getListingByIdRaw;

/**
 * Fetch nearby points of interest for a listing.
 */
export async function getListingPois(listingId: string): Promise<ListingPoi[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listing_pois")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getListingPois]", error.message);
    return [];
  }

  return (data as ListingPoi[]) ?? [];
}

/**
 * Fetch ordered gallery photos for a listing.
 */
export async function getListingPhotos(
  listingId: string
): Promise<ListingPhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listing_photos")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getListingPhotos]", error.message);
    return [];
  }

  return (data as ListingPhoto[]) ?? [];
}

interface ListingSitemapEntry {
  id: string;
  updated_at: string;
}

/**
 * Fetch active listing IDs for sitemap generation.
 */
export async function getActiveListingSitemapEntries(): Promise<
  ListingSitemapEntry[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getActiveListingSitemapEntries]", error.message);
    return [];
  }

  return (data as ListingSitemapEntry[]) ?? [];
}
