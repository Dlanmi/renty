import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import {
  getListingById,
  getListingByIdAnyStatus,
  getListingPhotos,
  getListingPois,
  isValidListingId,
} from "@/lib/data/listings";
import type { Listing, ListingPhoto } from "@/lib/domain/types";
import { formatCOP, formatBillingPeriod, formatDateCO } from "@/lib/domain/format";
import { toAbsoluteUrl, truncateMetaText } from "@/lib/domain/seo";
import ListingGallery from "@/components/listing/ListingGallery";
import ListingSpecs from "@/components/listing/ListingSpecs";
import ContactCTA from "@/components/listing/ContactCTA";
import Icon from "@/components/ui/Icon";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function buildListingSeoDescription(listing: Listing): string {
  const bathroomsLabel = `${listing.bathrooms} baño${
    listing.bathrooms === 1 ? "" : "s"
  }`;
  const summary = `${listing.property_type} de ${listing.bedrooms} hab y ${bathroomsLabel} en ${listing.neighborhood}, ${listing.city}. ${formatCOP(
    listing.price_cop
  )}${formatBillingPeriod(listing.billing_period)}.`;

  return truncateMetaText(`${summary} ${listing.description ?? ""}`, 158);
}

function toSafeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function getListingSchemaType(propertyType: string): "Apartment" | "Accommodation" {
  return propertyType.toLowerCase().includes("apart")
    ? "Apartment"
    : "Accommodation";
}

const HOME_FILTER_QUERY_KEYS = ["q", "max", "beds"] as const;

function getSingleSearchParamValue(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildHomeHref(
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

function listingHeroChips(listing: Listing): Array<{ icon: string; label: string }> {
  const chips: Array<{ icon: string; label: string }> = [
    { icon: "home", label: listing.property_type },
  ];

  if (listing.bedrooms > 0) {
    chips.push({ icon: "bed", label: `${listing.bedrooms} hab` });
  }
  if (listing.bathrooms > 0) {
    chips.push({ icon: "shower", label: `${listing.bathrooms} banos` });
  }
  if (listing.area_m2 != null) {
    chips.push({ icon: "square_foot", label: `${listing.area_m2} m2` });
  }
  if (listing.furnished) {
    chips.push({ icon: "chair", label: "Amoblado" });
  }

  return chips;
}

function buildGalleryPhotoUrls(
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (!isValidListingId(id)) {
    return {
      title: "Propiedad no encontrada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const listing = await getListingByIdAnyStatus(id);
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
  const title = `${listing.title} en ${listing.neighborhood}`;
  const description = buildListingSeoDescription(listing);
  const canonicalUrl = toAbsoluteUrl(`/listing/${listing.id}`);
  const socialImageUrl = toAbsoluteUrl(
    `/listing/${listing.id}/opengraph-image`
  );

  return {
    title,
    description,
    alternates: isActive
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: {
      title: `${title} | Renty`,
      description,
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: `${listing.title} - Renty`,
        },
      ],
      locale: "es_CO",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Renty`,
      description,
      images: [socialImageUrl],
    },
    robots: isActive
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
  };
}

export const revalidate = 60;

export default async function ListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  if (!isValidListingId(id)) notFound();

  const [listing, pois, photos] = await Promise.all([
    getListingById(id),
    getListingPois(id),
    getListingPhotos(id),
  ]);
  if (!listing) notFound();

  const listingUrl = toAbsoluteUrl(`/listing/${listing.id}`);
  const shareDescription = buildListingSeoDescription(listing);
  const homeHref = buildHomeHref(resolvedSearchParams);
  const heroChips = listingHeroChips(listing);
  const galleryPhotoUrls = buildGalleryPhotoUrls(listing, photos);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": getListingSchemaType(listing.property_type),
    name: listing.title,
    description: listing.description ?? buildListingSeoDescription(listing),
    image: galleryPhotoUrls,
    url: listingUrl,
    offers: {
      "@type": "Offer",
      price: listing.price_cop,
      priceCurrency: "COP",
      availability: "https://schema.org/InStock",
      url: listingUrl,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toSafeJsonLd(jsonLd),
        }}
      />

      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted min-w-0">
        <Link
          href={homeHref}
          className="shrink-0 transition-colors hover:text-stone-900"
        >
          Inicio
        </Link>
        <Icon name="chevron_right" size={16} className="shrink-0" />
        <span className="truncate text-stone-700">{listing.neighborhood}</span>
      </nav>

      <section className="lift-hover rounded-[28px] border border-stone-200 bg-white p-4 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-stone-900 sm:text-3xl">
              {listing.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted min-w-0">
              <Icon name="location_on" size={16} className="shrink-0" />
              <span className="break-words">
                {listing.neighborhood}
                {listing.zone ? `, ${listing.zone}` : ""} — {listing.city}
              </span>
            </div>
            <div className="stagger-list mt-3 flex flex-wrap gap-2">
              {heroChips.map((chip) => (
                <span
                  key={`${chip.icon}-${chip.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700"
                >
                  <Icon name={chip.icon} size={15} />
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
            <p className="font-semibold uppercase tracking-wide text-stone-500">Actualizado</p>
            <p className="mt-1 text-sm font-medium text-stone-800">{formatDateCO(listing.updated_at)}</p>
          </div>
        </div>

        <div className="mt-5">
          <ListingGallery title={listing.title} photos={galleryPhotoUrls} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <ListingSpecs listing={listing} pois={pois} />
        </div>

        <ContactCTA
          price={listing.price_cop}
          billingPeriod={listing.billing_period}
          phone={listing.whatsapp_e164}
          title={listing.title}
          shareUrl={listingUrl}
          shareDescription={shareDescription}
        />
      </div>

      <div className="h-24 lg:hidden" />
    </div>
  );
}
