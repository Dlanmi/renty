import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import TrackEventOnMount from "@/components/analytics/TrackEventOnMount";
import StructuredData from "@/components/seo/StructuredData";
import BackToSearchLink from "@/components/listing/BackToSearchLink";
import ContactCTA from "@/components/listing/ContactCTA";
import ListingGallery from "@/components/listing/ListingGallery";
import ListingSpecs from "@/components/listing/ListingSpecs";
import ShareListingButton from "@/components/listing/ShareListingButton";
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
  isValidListingId,
  getListingPath,
} from "@/lib/domain/listing-paths";
import type { Listing } from "@/lib/domain/types";
import {
  SITE_NAME,
  toAbsoluteUrl,
} from "@/lib/domain/seo";
import { buildAnalyticsSearchContextFromRecord } from "@/lib/analytics/search-context";
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

function listingHeroChips(
  listing: Listing
): Array<{ icon: string; label: string }> {
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
    chips.push({ icon: "square_foot", label: `${listing.area_m2} m²` });
  }
  if (listing.furnished) {
    chips.push({ icon: "chair", label: "Amoblado" });
  }

  return chips;
}

function buildInlineSpecs(listing: Listing): string {
  const parts: string[] = [listing.property_type];
  if (listing.bedrooms > 0) parts.push(`${listing.bedrooms} hab`);
  if (listing.bathrooms > 0) parts.push(`${listing.bathrooms} baños`);
  if (listing.area_m2 != null) parts.push(`${listing.area_m2} m²`);
  if (listing.furnished) parts.push("Amoblado");
  return parts.join(" · ");
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
  const shareTitle = `${listing.title} | Renty`;
  const homeHref = buildHomeHref(resolvedSearchParams);
  const searchContext = buildAnalyticsSearchContextFromRecord(
    resolvedSearchParams
  );
  const heroChips = listingHeroChips(listing);
  const inlineSpecs = buildInlineSpecs(listing);
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
        addressRegion: listing.neighborhood + (listing.zone ? `, ${listing.zone}` : ""),
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
    <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6 lg:py-8">
      <TrackEventOnMount
        eventName="listing_detail_view"
        source="listing_detail_page"
        listingId={listing.id}
        pagePath={canonicalPath}
        searchContext={searchContext}
        dedupeKey={`${listing.id}:${JSON.stringify(searchContext ?? {})}`}
      />
      <StructuredData id="listing-structured-data" data={jsonLd} />

      {/* ── Breadcrumb (desktop only) ── */}
      <nav
        aria-label="Ruta de navegación"
        className="mb-4 hidden min-w-0 flex-wrap items-center gap-1 text-sm text-t-muted lg:flex"
      >
        <BackToSearchLink
          fallbackHref={homeHref}
          className="shrink-0 transition-colors hover:text-t-primary"
        >
          Inicio
        </BackToSearchLink>
        <Icon name="chevron_right" size={16} className="shrink-0" />
        <span className="truncate text-t-secondary">
          {listing.neighborhood}
        </span>
      </nav>

      {/* ── Hero: single h1 + gallery, reordered via CSS order ── */}
      <div className="flex flex-col">
        {/* Title group: order-2 on mobile (below gallery), order-1 on desktop */}
        <div className="order-2 mt-5 lg:order-1 lg:mt-0 lg:mb-5">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold leading-tight text-t-primary sm:text-2xl lg:text-3xl">
              {listing.title}
            </h1>
            <div className="hidden lg:block">
              <ShareListingButton
                url={listingUrl}
                title={shareTitle}
                description={shareDescription}
                compact
              />
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-t-muted">
            <Icon name="place" size={15} className="shrink-0" />
            <span className="break-words">
              {listing.neighborhood}
              {listing.zone ? `, ${listing.zone}` : ""} · {listing.city}
            </span>
          </div>
          <p className="mt-2 text-sm text-t-secondary lg:hidden">
            {inlineSpecs}
          </p>
        </div>

        {/* Gallery: order-1 on mobile (first), order-2 on desktop */}
        <div className="order-1 -mx-4 sm:-mx-6 lg:order-2 lg:mx-0">
          <ListingGallery
            listingId={listing.id}
            pagePath={canonicalPath}
            searchContext={searchContext}
            title={listing.title}
            photos={galleryPhotoAssets}
            backHref={homeHref}
            shareUrl={listingUrl}
            shareTitle={shareTitle}
          />
        </div>

        {/* Desktop hero chips */}
        <div className="stagger-list order-3 mt-4 hidden flex-wrap gap-2 lg:flex">
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

      {/* ── Content grid (unchanged structure) ── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <ListingSpecs listing={listing} pois={pois} />
        </div>

        <ContactCTA
          listing={listing}
          pagePath={canonicalPath}
          searchContext={searchContext}
          shareUrl={listingUrl}
          shareDescription={shareDescription}
        />
      </div>

      <div className="h-40 lg:hidden" />
    </div>
  );
}
