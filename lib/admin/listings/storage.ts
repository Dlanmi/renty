import type { ListingPhoto } from "@/lib/domain/types";
import { createSupabaseServerClient } from "@/lib/admin/auth";

// ─── Constants ───────────────────────────────────────────────────────

export const MAX_NEW_PHOTOS_PER_REQUEST = 10;
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;

type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

const ALLOWED_IMAGE_MIME_TYPES = new Set<AllowedImageMime>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MIME_BY_EXTENSION: Record<string, AllowedImageMime> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

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

function fileExtension(filename: string): string {
  const pieces = filename.split(".");
  const ext = pieces.length > 1 ? pieces[pieces.length - 1] : "jpg";
  const normalized = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized || "jpg";
}

function isAllowedImageMime(value: string): value is AllowedImageMime {
  return ALLOWED_IMAGE_MIME_TYPES.has(value as AllowedImageMime);
}

function detectImageMimeType(bytes: Buffer): AllowedImageMime | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (bytes.length >= 16 && bytes.toString("ascii", 4, 8) === "ftyp") {
    const ftypChunk = bytes.toString("ascii", 8, 16).toLowerCase();
    if (ftypChunk.includes("avif")) return "image/avif";
  }

  return null;
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

    const rawMimeType = file.type.toLowerCase().trim();
    const normalizedMimeType =
      rawMimeType === "image/jpg" ? "image/jpeg" : rawMimeType;
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

    const { error: uploadError } = await client.storage
      .from("listing-images")
      .upload(storagePath, file.bytes, {
        contentType: file.contentType,
        upsert: false,
      });

    if (uploadError) toError(uploadError.message);

    const publicUrl = client.storage
      .from("listing-images")
      .getPublicUrl(storagePath).data.publicUrl;

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
    const { error: storageError } = await client.storage
      .from("listing-images")
      .remove(exclusivePaths);
    if (storageError) toError(storageError.message);
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
