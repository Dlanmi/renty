import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import StructuredData from "@/components/seo/StructuredData";
import BackToSearchLink from "@/components/listing/BackToSearchLink";
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
  formatDateCO,
} from "@/lib/domain/format";
import {
  getListingPath,
  isValidListingId,
} from "@/lib/domain/listing-paths";
import type { Listing } from "@/lib/domain/types";
import {
  SITE_NAME,
  toAbsoluteUrl,
} from "@/lib/domain/seo";
import {
  buildGalleryPhotoAssets,
  buildGalleryPhotoUrls,
  buildHomeHref,
  buildListingMetadata,
  buildListingSeoDescription,
  getListingSchemaType,
} from "@/lib/domain/public-seo";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 60;
export const dynamicParams = true;

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

  return buildListingMetadata(listing);
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
  const galleryPhotoAssets = buildGalleryPhotoAssets(listing, photos);
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

      <nav aria-label="Ruta de navegación" className="mb-4 flex min-w-0 flex-wrap items-center gap-1 text-sm text-t-muted">
        <BackToSearchLink
          fallbackHref={homeHref}
          className="shrink-0 transition-colors hover:text-t-primary"
        >
          Inicio
        </BackToSearchLink>
        <Icon name="chevron_right" size={16} className="shrink-0" />
        <span className="truncate text-t-secondary">{listing.neighborhood}</span>
      </nav>

      <section className="lift-hover rounded-card-lg border border-bg-border bg-bg-surface p-4 shadow-card sm:p-6">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-t-primary sm:text-3xl">
            {listing.title}
          </h1>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-t-muted">
            <Icon name="location_on" size={16} className="shrink-0" />
            <span className="break-words">
              {listing.neighborhood}
              {listing.zone ? `, ${listing.zone}` : ""} - {listing.city}
            </span>
            <span className="text-t-muted/50">·</span>
            <span>Actualizado {formatDateCO(listing.updated_at)}</span>
          </div>
          <div className="stagger-list mt-3 flex flex-wrap gap-2">
            {heroChips.map((chip) => (
              <span
                key={`${chip.icon}-${chip.label}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-bg-border bg-bg-elevated px-3 py-1 text-xs font-medium text-t-secondary"
              >
                <Icon name={chip.icon} size={15} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <ListingGallery title={listing.title} photos={galleryPhotoAssets} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <ListingSpecs listing={listing} pois={pois} />
        </div>

        <ContactCTA
          listing={listing}
          phone={listing.whatsapp_e164}
          shareUrl={listingUrl}
          shareDescription={shareDescription}
        />
      </div>

      <div className="h-40 lg:hidden" />
    </div>
  );
}
