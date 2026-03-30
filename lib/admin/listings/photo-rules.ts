export type AllowedImageMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif";

export interface UploadedPhotoReference {
  storagePath: string;
  publicUrl: string;
  thumbStoragePath?: string;
  thumbPublicUrl?: string;
}

export interface PhotoLike {
  name: string;
  size: number;
  type: string;
}

export const MAX_PHOTOS_PER_LISTING = 20;
export const MAX_NEW_PHOTOS_PER_REQUEST = MAX_PHOTOS_PER_LISTING;
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
export const LARGE_UPLOAD_WARNING_BYTES = 60 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set<AllowedImageMime>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const MIME_BY_EXTENSION: Record<string, AllowedImageMime> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function asciiFromBytes(
  bytes: ArrayLike<number>,
  start: number,
  end: number
): string {
  let output = "";

  for (let index = start; index < end && index < bytes.length; index += 1) {
    output += String.fromCharCode(bytes[index] ?? 0);
  }

  return output;
}

export function fileExtension(filename: string): string {
  const pieces = filename.split(".");
  const ext = pieces.length > 1 ? pieces[pieces.length - 1] : "jpg";
  const normalized = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized || "jpg";
}

export function normalizeImageMimeType(value: string): string {
  const normalized = value.toLowerCase().trim();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

export function isAllowedImageMime(value: string): value is AllowedImageMime {
  return ALLOWED_IMAGE_MIME_TYPES.has(value as AllowedImageMime);
}

export function detectImageMimeType(
  bytes: ArrayLike<number>
): AllowedImageMime | null {
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
    asciiFromBytes(bytes, 0, 4) === "RIFF" &&
    asciiFromBytes(bytes, 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (bytes.length >= 16 && asciiFromBytes(bytes, 4, 8) === "ftyp") {
    const ftypChunk = asciiFromBytes(bytes, 8, 16).toLowerCase();
    if (ftypChunk.includes("avif")) return "image/avif";
  }

  return null;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

export function buildPhotoStoragePath(
  listingId: string,
  filename: string,
  index: number,
  batchId = Date.now()
): string {
  const extension = fileExtension(filename);
  const uniqueSuffix = crypto.randomUUID().slice(0, 8);
  return `${listingId}/${batchId}-${index}-${uniqueSuffix}.${extension}`;
}

/**
 * Build a base path (without variant suffix or extension) for processed
 * variants. The caller appends `-lg.webp` / `-th.webp` via
 * `buildVariantPath`.
 */
export function buildVariantBasePath(
  listingId: string,
  index: number,
  batchId = Date.now()
): string {
  const uniqueSuffix = crypto.randomUUID().slice(0, 8);
  return `${listingId}/${batchId}-${index}-${uniqueSuffix}`;
}
