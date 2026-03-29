import type { ListingPhoto } from "@/lib/domain/types";
import { createSupabaseServerClient } from "@/lib/admin/auth";
import type { ParsedListingInput } from "./parsing";
import {
  detectImageMimeType,
  fileExtension,
  isAllowedImageMime,
  MAX_NEW_PHOTOS_PER_REQUEST,
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTOS_PER_LISTING,
  MIME_BY_EXTENSION,
  normalizeImageMimeType,
  type AllowedImageMime,
  type UploadedPhotoReference,
} from "./photo-rules";
import {
  uploadToR2,
  deleteFromR2,
  getR2PublicUrl,
} from "@/lib/storage/r2";

// ─── Constants ───────────────────────────────────────────────────────

// ─── Interfaces ──────────────────────────────────────────────────────

export interface PreparedPhotoUpload {
  bytes: Buffer;
  contentType: AllowedImageMime;
  extension: string;
}

export interface StoragePathReferenceRow {
  listing_id: string;
  storage_path: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function toError(message: string): never {
  throw new Error(message);
}

// ─── Photo queries ───────────────────────────────────────────────────

export async function getListingPhotos(
  accessToken: string,
  listingId: string
): Promise<ListingPhoto[]> {
  const client = createSupabaseServerClient(accessToken);
  const { data } = await client
    .from("listing_photos")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });
  return (data as ListingPhoto[]) ?? [];
}

// ─── Preparation & validation ────────────────────────────────────────

export async function preparePhotoUploads(
  files: File[]
): Promise<PreparedPhotoUpload[]> {
  if (files.length === 0) return [];

  if (files.length > MAX_NEW_PHOTOS_PER_REQUEST) {
    toError(
      `Puedes subir máximo ${MAX_NEW_PHOTOS_PER_REQUEST} fotos por publicación.`
    );
  }

  const prepared: PreparedPhotoUpload[] = [];

  for (const file of files) {
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toError(
        `Cada foto debe pesar máximo ${Math.floor(
          MAX_PHOTO_SIZE_BYTES / (1024 * 1024)
        )} MB.`
      );
    }

    const extension = fileExtension(file.name);
    const expectedMime = MIME_BY_EXTENSION[extension];
    if (!expectedMime) {
      toError(
        "Formato no permitido. Usa solo JPG, PNG, WEBP o AVIF (SVG no permitido)."
      );
    }

    const normalizedMimeType = normalizeImageMimeType(file.type);
    if (!isAllowedImageMime(normalizedMimeType)) {
      toError(
        "Tipo de archivo no permitido. Usa solo JPG, PNG, WEBP o AVIF (SVG no permitido)."
      );
    }

    if (normalizedMimeType !== expectedMime) {
      toError(
        "El tipo de archivo no coincide con su extensión. Verifica la imagen antes de subirla."
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectImageMimeType(bytes);
    if (detectedMime && detectedMime !== expectedMime) {
      toError(
        "La firma binaria del archivo no coincide con el formato declarado."
      );
    }

    prepared.push({
      bytes,
      contentType: expectedMime,
      extension,
    });
  }

  return prepared;
}

// ─── Upload ──────────────────────────────────────────────────────────

export async function uploadPhotos(
  accessToken: string,
  listingId: string,
  files: PreparedPhotoUpload[],
  startSortOrder: number
) {
  if (files.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const photoRows: Array<{
    listing_id: string;
    storage_path: string;
    public_url: string;
    sort_order: number;
    is_cover: boolean;
  }> = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const storagePath = `${listingId}/${Date.now()}-${index}.${file.extension}`;

    await uploadToR2(storagePath, file.bytes, file.contentType);

    const publicUrl = getR2PublicUrl(storagePath);

    photoRows.push({
      listing_id: listingId,
      storage_path: storagePath,
      public_url: publicUrl,
      sort_order: startSortOrder + index + 1,
      is_cover: false,
    });
  }

  const { error: insertError } = await client
    .from("listing_photos")
    .insert(photoRows);
  if (insertError) toError(insertError.message);
}

export async function insertUploadedPhotoRefs(
  accessToken: string,
  listingId: string,
  uploads: UploadedPhotoReference[],
  startSortOrder: number
) {
  if (uploads.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const rows = uploads.map((upload, index) => ({
    listing_id: listingId,
    storage_path: upload.storagePath,
    public_url: upload.publicUrl,
    sort_order: startSortOrder + index + 1,
    is_cover: false,
  }));

  const { error } = await client.from("listing_photos").insert(rows);
  if (error) toError(error.message);
}

// ─── External URLs ───────────────────────────────────────────────────

export async function insertExternalPhotoUrls(
  accessToken: string,
  listingId: string,
  urls: string[],
  startSortOrder: number
) {
  if (urls.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const existingPhotos = await getListingPhotos(accessToken, listingId);
  const existingUrlSet = new Set(
    existingPhotos.map((photo) => photo.public_url.trim())
  );

  let sortOrder = startSortOrder;
  const rows: Array<{
    listing_id: string;
    storage_path: string;
    public_url: string;
    sort_order: number;
    is_cover: boolean;
  }> = [];

  for (const url of urls) {
    const normalized = url.trim();
    if (!normalized || existingUrlSet.has(normalized)) continue;

    sortOrder += 1;
    rows.push({
      listing_id: listingId,
      storage_path: "",
      public_url: normalized,
      sort_order: sortOrder,
      is_cover: false,
    });
    existingUrlSet.add(normalized);
  }

  if (rows.length === 0) return;
  const { error } = await client.from("listing_photos").insert(rows);
  if (error) toError(error.message);
}

export function validateListingPhotoLimit(
  existingPhotos: ListingPhoto[],
  input: Pick<ParsedListingInput, "deletePhotoIds" | "manualGalleryUrls">,
  incomingUploadCount: number
) {
  const deleteSet = new Set(input.deletePhotoIds);
  const remainingPhotos = existingPhotos.filter((photo) => !deleteSet.has(photo.id));
  const remainingExternalUrls = new Set(
    remainingPhotos
      .filter((photo) => !photo.storage_path.trim())
      .map((photo) => photo.public_url.trim())
      .filter(Boolean)
  );

  const additionalExternalUrlCount = input.manualGalleryUrls.filter(
    (url) => !remainingExternalUrls.has(url.trim())
  ).length;

  const currentCount = existingPhotos.length;
  const nextCount =
    remainingPhotos.length + incomingUploadCount + additionalExternalUrlCount;

  if (nextCount > MAX_PHOTOS_PER_LISTING && nextCount > currentCount) {
    toError(
      `Cada inmueble admite máximo ${MAX_PHOTOS_PER_LISTING} fotos. Borra ${
        nextCount - MAX_PHOTOS_PER_LISTING
      } antes de guardar.`
    );
  }
}

// ─── Cross-reference safety ─────────────────────────────────────────

export async function filterExclusiveStoragePaths(
  client: ReturnType<typeof createSupabaseServerClient>,
  storagePaths: string[],
  excludeListingId: string
): Promise<string[]> {
  const uniquePaths = Array.from(
    new Set(storagePaths.map((path) => path.trim()).filter(Boolean))
  );
  if (uniquePaths.length === 0) return [];

  const { data, error } = await client
    .from("listing_photos")
    .select("listing_id, storage_path")
    .in("storage_path", uniquePaths)
    .neq("listing_id", excludeListingId);

  if (error) toError(error.message);

  return filterExclusiveStoragePathsFromRows(
    uniquePaths,
    excludeListingId,
    (data as StoragePathReferenceRow[]) ?? []
  );
}

export function filterExclusiveStoragePathsFromRows(
  storagePaths: string[],
  excludeListingId: string,
  rows: StoragePathReferenceRow[]
): string[] {
  if (storagePaths.length === 0) return [];

  const referencedByOthers = new Set(
    rows
      .filter(
        (row) =>
          row.listing_id !== excludeListingId && row.storage_path.trim() !== ""
      )
      .map((row) => row.storage_path)
  );

  return storagePaths.filter((path) => !referencedByOthers.has(path));
}

// ─── Delete ──────────────────────────────────────────────────────────

export async function deletePhotos(
  accessToken: string,
  listingId: string,
  deletePhotoIds: string[]
) {
  if (deletePhotoIds.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const uniqueIds = Array.from(new Set(deletePhotoIds));
  const { data: toDeleteRows } = await client
    .from("listing_photos")
    .select("id, storage_path")
    .eq("listing_id", listingId)
    .in("id", uniqueIds);

  const rows = toDeleteRows ?? [];
  if (rows.length === 0) return;

  const allPaths = rows
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path));

  // Delete the DB rows first so the cross-reference check below
  // doesn't count the rows we're about to remove.
  const { error: deleteError } = await client
    .from("listing_photos")
    .delete()
    .eq("listing_id", listingId)
    .in("id", uniqueIds);

  if (deleteError) toError(deleteError.message);

  // Only remove files from Storage if no other listing references them.
  const exclusivePaths = await filterExclusiveStoragePaths(
    client,
    allPaths,
    listingId
  );

  if (exclusivePaths.length > 0) {
    await deleteFromR2(exclusivePaths);
  }
}

// ─── Reorder ─────────────────────────────────────────────────────────

export async function reorderExistingPhotos(
  accessToken: string,
  listingId: string,
  orderedPhotoIds: string[]
) {
  if (orderedPhotoIds.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const uniqueIds = Array.from(new Set(orderedPhotoIds));

  const { data: currentPhotos } = await client
    .from("listing_photos")
    .select("id")
    .eq("listing_id", listingId)
    .in("id", uniqueIds);

  const validIdSet = new Set(
    (currentPhotos ?? []).map((row) => row.id as string)
  );
  const filteredIds = uniqueIds.filter((id) => validIdSet.has(id));
  if (filteredIds.length === 0) return;

  for (let sortOrder = 0; sortOrder < filteredIds.length; sortOrder += 1) {
    const photoId = filteredIds[sortOrder];
    const { error } = await client
      .from("listing_photos")
      .update({ sort_order: sortOrder })
      .eq("id", photoId)
      .eq("listing_id", listingId);

    if (error) toError(error.message);
  }
}

// ─── Cover ───────────────────────────────────────────────────────────

export async function applyCover(
  accessToken: string,
  listingId: string,
  coverPhotoId: string | null,
  manualCoverUrl: string | null
) {
  const client = createSupabaseServerClient(accessToken);
  const photos = await getListingPhotos(accessToken, listingId);

  if (manualCoverUrl) {
    if (photos.length > 0) {
      await client
        .from("listing_photos")
        .update({ is_cover: false })
        .eq("listing_id", listingId);
    }
    await client
      .from("listings")
      .update({ cover_photo_url: manualCoverUrl })
      .eq("id", listingId);
    return;
  }

  if (photos.length === 0) return;

  const selectedCover =
    photos.find((photo) => photo.id === coverPhotoId) ??
    photos.find((photo) => photo.is_cover) ??
    photos[0];

  await client
    .from("listing_photos")
    .update({ is_cover: false })
    .eq("listing_id", listingId);

  await client
    .from("listing_photos")
    .update({ is_cover: true })
    .eq("id", selectedCover.id);

  await client
    .from("listings")
    .update({ cover_photo_url: selectedCover.public_url })
    .eq("id", listingId);
}
