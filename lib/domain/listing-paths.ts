const UUID_V4_OR_VX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LISTING_BASE_PATH = "/arriendos";

type ListingPathInput = {
  id: string;
  slug?: string | null;
};

export function isValidListingId(id: string): boolean {
  return UUID_V4_OR_VX.test(id.trim());
}

export function slugifySegment(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "inmueble";
}

export function getListingPath(listing: ListingPathInput): string {
  if (!listing.slug) return `${LISTING_BASE_PATH}/${listing.id}`;
  return `${LISTING_BASE_PATH}/${listing.slug}`;
}
