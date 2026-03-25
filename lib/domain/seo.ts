import type { Metadata } from "next";

export const PRODUCTION_SITE_URL = "https://renty-seven.vercel.app";

export const SITE_NAME = "Renty";
export const SITE_LOCALE = "es_CO";
export const DEFAULT_SITE_TITLE =
  "Arriendos en Bogota con contacto directo por WhatsApp";
export const DEFAULT_SITE_DESCRIPTION =
  "Encuentra apartamentos, habitaciones y casas en arriendo en Bogota con contacto directo por WhatsApp, filtros rapidos y fichas optimizadas para SEO.";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/opengraph-image";
export const DEFAULT_SOCIAL_IMAGE_ALT =
  "Renty, plataforma de arriendos en Bogota";

export function getSiteUrl(): URL {
  return new URL(PRODUCTION_SITE_URL);
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
}: BuildPageMetadataOptions): Metadata {
  const canonicalUrl = toAbsoluteUrl(path);
  const socialImageUrl = toAbsoluteUrl(imagePath);
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
