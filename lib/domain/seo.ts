import type { Metadata } from "next";

export const SITE_NAME = "Renty";
export const SITE_LOCALE = "es_CO";
export const DEFAULT_SITE_TITLE =
  "Arriendos en Bogota con contacto directo por WhatsApp";
export const DEFAULT_SITE_DESCRIPTION =
  "Encuentra apartamentos, habitaciones y casas en arriendo en Bogota con contacto directo por WhatsApp, filtros rapidos y fichas optimizadas para SEO.";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/opengraph-image";
export const DEFAULT_SOCIAL_IMAGE_ALT =
  "Renty, plataforma de arriendos en Bogota";
export const LOCAL_DEVELOPMENT_SITE_URL = "http://localhost:3000";

const SITE_URL_ENV_KEYS = ["NEXT_PUBLIC_SITE_URL", "SITE_URL"] as const;

function normalizeSiteUrl(value: string | undefined): URL | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return new URL(`${url.origin}/`);
  } catch {
    return null;
  }
}

export function getSiteUrl(): URL {
  const candidates = [
    ...SITE_URL_ENV_KEYS.map((key) => process.env[key]),
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_ENV === "production" ? process.env.VERCEL_URL : undefined,
    process.env.NODE_ENV === "production" ? undefined : LOCAL_DEVELOPMENT_SITE_URL,
  ];

  for (const candidate of candidates) {
    const resolvedUrl = normalizeSiteUrl(candidate);
    if (resolvedUrl) {
      return resolvedUrl;
    }
  }

  return new URL(LOCAL_DEVELOPMENT_SITE_URL);
}

export function getSiteOrigin(): string {
  return getSiteUrl().origin;
}

/**
 * Build an absolute URL from an app-relative path.
 */
export function toAbsoluteUrl(path: string, siteUrl = getSiteUrl()): string {
  return new URL(path, siteUrl).toString();
}

/**
 * Normalize and trim text for metadata.
 */
export function truncateMetaText(text: string, maxLength = 158): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

interface BuildPageMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  imagePath?: string;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  imagePath = DEFAULT_SOCIAL_IMAGE_PATH,
  imageAlt = title,
  type = "website",
  noIndex = false,
}: BuildPageMetadataOptions, siteUrl = getSiteUrl()): Metadata {
  const canonicalUrl = toAbsoluteUrl(path, siteUrl);
  const socialImageUrl = toAbsoluteUrl(imagePath, siteUrl);
  const normalizedDescription = truncateMetaText(description);
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description: normalizedDescription,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: socialTitle,
      description: normalizedDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type,
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: normalizedDescription,
      images: [socialImageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}
