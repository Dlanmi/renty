import type { ListingStatus } from "@/lib/domain/types";

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

    if (!storagePath) {
      rows.push({
        listing_id: newListingId,
        storage_path: "",
        public_url: photo.public_url,
        caption: photo.caption,
        room_type: photo.room_type,
        sort_order: photo.sort_order,
        is_cover: photo.is_cover,
      });
      continue;
    }

    try {
      const download = await storage.download(storagePath);
      if (!download) {
        rows.push({
          listing_id: newListingId,
          storage_path: "",
          public_url: photo.public_url,
          caption: photo.caption,
          room_type: photo.room_type,
          sort_order: photo.sort_order,
          is_cover: photo.is_cover,
        });
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
        rows.push({
          listing_id: newListingId,
          storage_path: "",
          public_url: photo.public_url,
          caption: photo.caption,
          room_type: photo.room_type,
          sort_order: photo.sort_order,
          is_cover: photo.is_cover,
        });
        continue;
      }

      rows.push({
        listing_id: newListingId,
        storage_path: newStoragePath,
        public_url: storage.getPublicUrl(newStoragePath),
        caption: photo.caption,
        room_type: photo.room_type,
        sort_order: photo.sort_order,
        is_cover: photo.is_cover,
      });
    } catch {
      rows.push({
        listing_id: newListingId,
        storage_path: "",
        public_url: photo.public_url,
        caption: photo.caption,
        room_type: photo.room_type,
        sort_order: photo.sort_order,
        is_cover: photo.is_cover,
      });
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
