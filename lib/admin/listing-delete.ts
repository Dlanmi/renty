import { createSupabaseServerClient } from "@/lib/admin/auth";

export interface DeleteListingResult {
  storageCleanupError: string | null;
}

export async function deleteListingAndCleanup(
  accessToken: string,
  listingId: string
): Promise<DeleteListingResult> {
  const client = createSupabaseServerClient(accessToken);

  const { data: photos, error: photosError } = await client
    .from("listing_photos")
    .select("storage_path")
    .eq("listing_id", listingId);

  if (photosError) {
    throw new Error(photosError.message);
  }

  const storagePaths = (photos ?? [])
    .map((photo) => photo.storage_path)
    .filter((path): path is string => Boolean(path));

  const { error: deleteError } = await client
    .from("listings")
    .delete()
    .eq("id", listingId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (storagePaths.length === 0) {
    return { storageCleanupError: null };
  }

  const { error: storageDeleteError } = await client.storage
    .from("listing-images")
    .remove(storagePaths);

  return {
    storageCleanupError: storageDeleteError?.message ?? null,
  };
}
