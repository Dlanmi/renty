import type { Metadata, MetadataRoute } from "next";
import { formatBillingPeriod, formatCOP } from "@/lib/domain/format";
import { getListingPath } from "@/lib/domain/listing-paths";
import {
  PRODUCTION_SITE_URL,
  SITE_LOCALE,
  SITE_NAME,
  getSiteUrl,
  toAbsoluteUrl,
  truncateMetaText,
} from "@/lib/domain/seo";
import type { Listing, ListingPhoto } from "@/lib/domain/types";

const HOME_FILTER_QUERY_KEYS = ["q", "max", "beds"] as const;

export function buildListingSeoDescription(listing: Listing): string {
  const bathroomsLabel = `${listing.bathrooms} baño${
    listing.bathrooms === 1 ? "" : "s"
  }`;
  const summary = `${listing.property_type} de ${listing.bedrooms} hab y ${bathroomsLabel} en ${listing.neighborhood}, ${listing.city}. ${formatCOP(
    listing.price_cop
  )}${formatBillingPeriod(listing.billing_period)}.`;

  return truncateMetaText(`${summary} ${listing.description ?? ""}`, 158);
}

export function getListingSchemaType(
  propertyType: string
): "Apartment" | "House" | "Room" | "Accommodation" {
  const normalized = propertyType.toLowerCase();
  if (normalized.includes("apart")) return "Apartment";
  if (normalized.includes("casa")) return "House";
  if (normalized.includes("habit")) return "Room";
  return "Accommodation";
}

function getSingleSearchParamValue(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function buildHomeHref(
  searchParams?: Record<string, string | string[] | undefined>
): string {
  if (!searchParams) return "/";

  const params = new URLSearchParams();
  for (const key of HOME_FILTER_QUERY_KEYS) {
    const value = getSingleSearchParamValue(searchParams[key]).trim();
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function buildGalleryPhotoUrls(
  listing: Listing,
  photos: ListingPhoto[]
): string[] {
  const candidates = [
    listing.cover_photo_url,
    ...photos.map((photo) => photo.public_url),
  ];
  const seen = new Set<string>();
  const uniqueUrls: string[] = [];

  for (const candidate of candidates) {
    const value = candidate.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    uniqueUrls.push(value);
  }

  return uniqueUrls.length > 0 ? uniqueUrls : [listing.cover_photo_url];
}

export function buildListingMetadata(listing: Listing | null): Metadata {
  if (!listing) {
    return {
      title: "Propiedad no encontrada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isActive = listing.status === "active";
  const canonicalPath = getListingPath(listing);
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const socialImageUrl = toAbsoluteUrl(`${canonicalPath}/opengraph-image`);
  const title = `${listing.title} en ${listing.neighborhood}, ${listing.city}`;
  const description = buildListingSeoDescription(listing);

  return {
    title,
    description,
    keywords: [
      `${listing.property_type} en arriendo en ${listing.neighborhood}`,
      `arriendo en ${listing.neighborhood} ${listing.city}`,
      `${listing.bedrooms} habitaciones en arriendo`,
      `contacto WhatsApp ${listing.neighborhood}`,
    ],
    alternates: isActive
      ? {
          canonical: canonicalPath,
        }
      : undefined,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: `${listing.title} - ${SITE_NAME}`,
        },
      ],
      locale: SITE_LOCALE,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [socialImageUrl],
    },
    robots: isActive
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
        },
  };
}

interface SitemapListingEntry {
  id: string;
  slug?: string | null;
  published_at: string | null;
  updated_at: string;
}

export function buildPublicSitemap(
  listings: SitemapListingEntry[],
  now = new Date(),
  siteUrl = getSiteUrl()
): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl.toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: new URL("/publicar", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: new URL("/nosotros", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...listings.map((listing) => ({
      url: new URL(getListingPath(listing), siteUrl).toString(),
      lastModified: new Date(listing.published_at ?? listing.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}

export function buildRobotsMetadata(
  isPreviewDeployment: boolean,
  siteUrl = PRODUCTION_SITE_URL
): MetadataRoute.Robots {
  if (isPreviewDeployment) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      host: siteUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/admin/login", "/api/", "/_next/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
