import type { ListingStatus } from "@/lib/domain/types";
import {
  deriveThumbStoragePath,
  isVariantPath,
} from "@/lib/client/image-variants";

export interface DuplicateableListing {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  rented_at: string | null;
  status: ListingStatus;
  [key: string]: unknown;
}

export interface DuplicateablePhoto {
  storage_path: string;
  public_url: string;
  caption: string | null;
  room_type: string | null;
  sort_order: number;
  is_cover: boolean;
}

export interface DuplicatedPhotoRow {
  listing_id: string;
  storage_path: string;
  public_url: string;
  public_url_thumb: string | null;
  caption: string | null;
  room_type: string | null;
  sort_order: number;
  is_cover: boolean;
}

export interface PhotoCopyStorageAdapter {
  now(): number;
  download(
    storagePath: string
  ): Promise<{ bytes: Buffer; contentType: string } | null>;
  upload(
    storagePath: string,
    bytes: Buffer,
    contentType: string
  ): Promise<boolean>;
  getPublicUrl(storagePath: string): string;
}

export function buildDuplicatedListingRecord(
  original: DuplicateableListing,
  newId: string,
  nowIso: string
) {
  const {
    id: currentId,
    created_at: createdAt,
    updated_at: updatedAt,
    published_at: publishedAt,
    rented_at: rentedAt,
    status: currentStatus,
    ...rest
  } = original;
  void currentId;
  void createdAt;
  void updatedAt;
  void publishedAt;
  void rentedAt;
  void currentStatus;

  return {
    id: newId,
    ...rest,
    title: `${original.title} (copia)`,
    status: "draft" as const,
    published_at: null,
    rented_at: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

export function buildDuplicatedPhotoStoragePath(
  newListingId: string,
  index: number,
  originalStoragePath: string,
  nowMs: number
): string {
  const extension = originalStoragePath.split(".").pop() || "jpg";
  return `${newListingId}/${nowMs}-${index}.${extension}`;
}

export async function duplicateListingPhotoRows(
  photos: DuplicateablePhoto[],
  newListingId: string,
  storage: PhotoCopyStorageAdapter
): Promise<DuplicatedPhotoRow[]> {
  const rows: DuplicatedPhotoRow[] = [];

  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    const storagePath = photo.storage_path.trim();

    const fallbackRow: DuplicatedPhotoRow = {
      listing_id: newListingId,
      storage_path: "",
      public_url: photo.public_url,
      public_url_thumb: null,
      caption: photo.caption,
      room_type: photo.room_type,
      sort_order: photo.sort_order,
      is_cover: photo.is_cover,
    };

    if (!storagePath) {
      rows.push(fallbackRow);
      continue;
    }

    try {
      const download = await storage.download(storagePath);
      if (!download) {
        rows.push(fallbackRow);
        continue;
      }

      const newStoragePath = buildDuplicatedPhotoStoragePath(
        newListingId,
        index,
        storagePath,
        storage.now()
      );

      const uploaded = await storage.upload(
        newStoragePath,
        download.bytes,
        download.contentType
      );

      if (!uploaded) {
        rows.push(fallbackRow);
        continue;
      }

      // Best-effort copy of thumb variant if the original uses the
      // new naming convention (-lg.webp / -lg.jpg).
      let thumbPublicUrl: string | null = null;

      if (isVariantPath(storagePath)) {
        const originalThumbPath = deriveThumbStoragePath(storagePath);
        const newThumbPath = deriveThumbStoragePath(newStoragePath);

        try {
          const thumbDownload = await storage.download(originalThumbPath);
          if (thumbDownload) {
            const thumbUploaded = await storage.upload(
              newThumbPath,
              thumbDownload.bytes,
              thumbDownload.contentType
            );
            if (thumbUploaded) {
              thumbPublicUrl = storage.getPublicUrl(newThumbPath);
            }
          }
        } catch {
          // Thumb copy is best-effort — continue without it
        }
      }

      rows.push({
        listing_id: newListingId,
        storage_path: newStoragePath,
        public_url: storage.getPublicUrl(newStoragePath),
        public_url_thumb: thumbPublicUrl,
        caption: photo.caption,
        room_type: photo.room_type,
        sort_order: photo.sort_order,
        is_cover: photo.is_cover,
      });
    } catch {
      rows.push(fallbackRow);
    }
  }

  return rows;
}

export function selectDuplicatedCoverUrl(
  rows: DuplicatedPhotoRow[]
): string | null {
  const selected = rows.find((row) => row.is_cover) ?? rows[0];
  return selected?.public_url ?? null;
}
