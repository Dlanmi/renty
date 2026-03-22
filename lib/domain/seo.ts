const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * Resolve canonical site URL from environment with safe fallbacks.
 */
export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  const normalized = raw
    ? /^https?:\/\//i.test(raw)
      ? raw
      : `https://${raw}`
    : LOCAL_SITE_URL;

  try {
    return new URL(normalized);
  } catch {
    return new URL(LOCAL_SITE_URL);
  }
}

/**
 * Build an absolute URL from an app-relative path.
 */
export function toAbsoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

/**
 * Normalize and trim text for metadata.
 */
export function truncateMetaText(text: string, maxLength = 158): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
