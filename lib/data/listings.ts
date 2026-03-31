import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingPhoto, ListingPoi } from "@/lib/domain/types";
import { isValidListingId } from "@/lib/domain/listing-paths";

interface ListingCoverThumbRow {
  listing_id: string;
  public_url_thumb: string | null;
}

async function attachCoverThumbUrls(listings: Listing[]): Promise<Listing[]> {
  if (listings.length === 0) return listings;

  const listingIds = listings.map((listing) => listing.id.trim()).filter(Boolean);
  if (listingIds.length === 0) return listings;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("listing_photos")
    .select("listing_id, public_url_thumb")
    .in("listing_id", listingIds)
    .eq("is_cover", true);

  if (error) {
    console.error("[attachCoverThumbUrls]", error.message);
    return listings;
  }

  const coverThumbByListingId = new Map<string, string>();

  for (const row of (data as ListingCoverThumbRow[] | null) ?? []) {
    const thumbUrl = row.public_url_thumb?.trim();
    if (!thumbUrl) continue;
    coverThumbByListingId.set(row.listing_id, thumbUrl);
  }

  return listings.map((listing) => ({
    ...listing,
    cover_photo_thumb_url: coverThumbByListingId.get(listing.id) ?? null,
  }));
}

const getActiveListingsRaw = async (): Promise<Listing[]> => {
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

  return attachCoverThumbUrls((data as Listing[]) ?? []);
};

/**
 * Fetch all active listings, newest first.
 */
export const getActiveListings = cache(getActiveListingsRaw);

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
const getListingPoisRaw = async (
  listingId: string
): Promise<ListingPoi[]> => {
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
};

export const getListingPois = cache(getListingPoisRaw);

/**
 * Fetch ordered gallery photos for a listing.
 */
const getListingPhotosRaw = async (
  listingId: string
): Promise<ListingPhoto[]> => {
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
};

export const getListingPhotos = cache(getListingPhotosRaw);

interface ActiveListingRouteEntry {
  id: string;
  slug?: string | null;
  title: string;
  neighborhood: string;
  city: string;
  published_at: string | null;
  updated_at: string;
}

/**
 * Fetch active listings for sitemap generation and static params.
 */
const getActiveListingRouteEntriesRaw = async (): Promise<
  ActiveListingRouteEntry[]
> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, slug, title, neighborhood, city, published_at, updated_at")
    .eq("status", "active")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getActiveListingRouteEntries]", error.message);
    return [];
  }

  return (data as ActiveListingRouteEntry[]) ?? [];
};

export const getActiveListingRouteEntries = cache(getActiveListingRouteEntriesRaw);

export const getActiveListingSitemapEntries = getActiveListingRouteEntries;

export const getListingBySlug = cache(async (slug: string): Promise<Listing | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug.trim())
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[getListingBySlug]", error.message);
    return null;
  }

  return (data as Listing) ?? null;
});

export async function getListingByIdentifier(
  identifier: string
): Promise<Listing | null> {
  const trimmed = identifier.trim();

  if (isValidListingId(trimmed)) {
    return getListingById(trimmed);
  }

  return getListingBySlug(trimmed);
}
