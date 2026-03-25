import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import StructuredData from "@/components/seo/StructuredData";
import ContactCTA from "@/components/listing/ContactCTA";
import ListingGallery from "@/components/listing/ListingGallery";
import ListingSpecs from "@/components/listing/ListingSpecs";
import Icon from "@/components/ui/Icon";
import {
  getActiveListingRouteEntries,
  getListingById,
  getListingByIdAnyStatus,
  getListingBySlug,
  getListingPhotos,
  getListingPois,
} from "@/lib/data/listings";
import {
  formatBillingPeriod,
  formatCOP,
  formatDateCO,
} from "@/lib/domain/format";
import {
  getListingPath,
  isValidListingId,
} from "@/lib/domain/listing-paths";
import type { Listing, ListingPhoto } from "@/lib/domain/types";
import {
  SITE_LOCALE,
  SITE_NAME,
  toAbsoluteUrl,
  truncateMetaText,
} from "@/lib/domain/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 60;
export const dynamicParams = true;

function buildListingSeoDescription(listing: Listing): string {
  const bathroomsLabel = `${listing.bathrooms} baño${
    listing.bathrooms === 1 ? "" : "s"
  }`;
  const summary = `${listing.property_type} de ${listing.bedrooms} hab y ${bathroomsLabel} en ${listing.neighborhood}, ${listing.city}. ${formatCOP(
    listing.price_cop
  )}${formatBillingPeriod(listing.billing_period)}.`;

  return truncateMetaText(`${summary} ${listing.description ?? ""}`, 158);
}

function getListingSchemaType(
  propertyType: string
): "Apartment" | "House" | "Room" | "Accommodation" {
  const normalized = propertyType.toLowerCase();
  if (normalized.includes("apart")) return "Apartment";
  if (normalized.includes("casa")) return "House";
  if (normalized.includes("habit")) return "Room";
  return "Accommodation";
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
    chips.push({ icon: "shower", label: `${listing.bathrooms} baños` });
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

export async function generateStaticParams() {
  const routeEntries = await getActiveListingRouteEntries();
  return routeEntries.map((listing) => ({
    slug: listing.slug || listing.id,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.trim();

  const listing = isValidListingId(normalizedSlug)
    ? await getListingByIdAnyStatus(normalizedSlug)
    : await getListingBySlug(normalizedSlug);

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

export default async function ListingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const listing = isValidListingId(normalizedSlug)
    ? await getListingById(normalizedSlug)
    : await getListingBySlug(normalizedSlug);

  if (!listing) notFound();

  const canonicalSlug = listing.slug || listing.id;
  const canonicalPath = getListingPath(listing);

  if (normalizedSlug !== canonicalSlug) {
    permanentRedirect(canonicalPath);
  }

  const [pois, photos] = await Promise.all([
    getListingPois(listing.id),
    getListingPhotos(listing.id),
  ]);

  const listingUrl = toAbsoluteUrl(canonicalPath);
  const shareDescription = buildListingSeoDescription(listing);
  const homeHref = buildHomeHref(resolvedSearchParams);
  const heroChips = listingHeroChips(listing);
  const galleryPhotoUrls = buildGalleryPhotoUrls(listing, photos);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": getListingSchemaType(listing.property_type),
      name: listing.title,
      description: listing.description ?? buildListingSeoDescription(listing),
      image: galleryPhotoUrls,
      url: listingUrl,
      mainEntityOfPage: listingUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: listing.city,
        addressRegion: listing.zone ?? listing.neighborhood,
        addressCountry: "CO",
      },
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        url: toAbsoluteUrl("/"),
      },
      offers: {
        "@type": "Offer",
        price: listing.price_cop,
        priceCurrency: "COP",
        availability: "https://schema.org/InStock",
        url: listingUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: toAbsoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: listing.neighborhood,
          item: listingUrl,
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <StructuredData id="listing-structured-data" data={jsonLd} />

      <nav className="mb-4 flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted">
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
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted">
              <Icon name="location_on" size={16} className="shrink-0" />
              <span className="break-words">
                {listing.neighborhood}
                {listing.zone ? `, ${listing.zone}` : ""} - {listing.city}
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
            <p className="font-semibold uppercase tracking-wide text-stone-500">
              Actualizado
            </p>
            <p className="mt-1 text-sm font-medium text-stone-800">
              {formatDateCO(listing.updated_at)}
            </p>
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
