// ─── Image variant definitions and naming helpers ───────────────────
//
// Centralizes variant specs, naming conventions, and path derivation
// so that upload, delete, and duplicate flows stay consistent.

export interface VariantSpec {
  name: "lg" | "th";
  maxWidth: number;
  quality: number;
}

export const VARIANT_LG: VariantSpec = {
  name: "lg",
  maxWidth: 1600,
  quality: 0.8,
} as const;

export const VARIANT_TH: VariantSpec = {
  name: "th",
  maxWidth: 400,
  quality: 0.75,
} as const;

export const IMAGE_VARIANTS: readonly VariantSpec[] = [VARIANT_LG, VARIANT_TH];

export type VariantName = "lg" | "th";

/** Preferred output format for processed images. */
export const PREFERRED_FORMAT = "image/webp" as const;

/** Fallback format when WebP encoding is not available. */
export const FALLBACK_FORMAT = "image/jpeg" as const;

/** Quality used when falling back to JPEG encoding. */
export const FALLBACK_QUALITY = 0.82;

/** Max number of images processed simultaneously in the worker queue. */
export const PROCESSING_CONCURRENCY = 3;

/** Max number of presigned-URL uploads running in parallel. */
export const UPLOAD_CONCURRENCY = 3;

// ─── Path helpers ───────────────────────────────────────────────────

const VARIANT_SUFFIX_RE = /-(?:lg|th)\.(webp|jpe?g)$/;

/**
 * Build the R2 storage path for a specific variant.
 *
 * @example buildVariantPath("abc/123-0-x1y2z3w4", "lg", "webp")
 *          → "abc/123-0-x1y2z3w4-lg.webp"
 */
export function buildVariantPath(
  basePath: string,
  variant: VariantName,
  ext: string
): string {
  return `${basePath}-${variant}.${ext}`;
}

/**
 * Derive the thumb storage path from a large-variant storage path.
 * Returns the input unchanged if it doesn't match the variant naming
 * convention (e.g. pre-migration photos).
 */
export function deriveThumbStoragePath(lgPath: string): string {
  return lgPath.replace(/-lg\.(webp|jpe?g)$/, "-th.$1");
}

/**
 * Check whether a storage path uses the new variant naming convention.
 */
export function isVariantPath(path: string): boolean {
  return VARIANT_SUFFIX_RE.test(path);
}

/**
 * Map a MIME type to the file extension used in R2 storage paths.
 */
export function formatToExtension(format: string): string {
  if (format === "image/webp") return "webp";
  if (format === "image/jpeg" || format === "image/jpg") return "jpg";
  if (format === "image/png") return "png";
  if (format === "image/avif") return "avif";
  return "jpg";
}
