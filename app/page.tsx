import { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveListings } from "@/lib/data/listings";
import SearchAndResults from "@/components/search/SearchAndResults";
import StructuredData from "@/components/seo/StructuredData";
import Skeleton from "@/components/ui/Skeleton";
import { getListingPath } from "@/lib/domain/listing-paths";
import { SITE_NAME, buildPageMetadata, toAbsoluteUrl } from "@/lib/domain/seo";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Arriendos en Bogotá",
  description:
    "Explora apartamentos, habitaciones y casas en arriendo en Bogotá con filtros por barrio, precio y habitaciones, más contacto directo por WhatsApp.",
  path: "/",
  keywords: [
    "arriendos en Bogota",
    "apartamentos en arriendo Bogota",
    "habitaciones en arriendo Bogota",
    "casas en arriendo Bogota",
    "arriendo por barrio en Bogota",
  ],
});

export default async function HomePage() {
  const listings = await getActiveListings();
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Arriendos en Bogotá | ${SITE_NAME}`,
    description:
      "Listado de apartamentos, habitaciones y casas en arriendo en Bogotá.",
    url: toAbsoluteUrl("/"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 12).map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: toAbsoluteUrl(getListingPath(listing)),
        name: listing.title,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-14 sm:px-6">
      <StructuredData id="home-structured-data" data={collectionJsonLd} />

      <section className="stagger-list space-y-3 text-center">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-t-primary sm:text-4xl">
          Encuentra tu{" "}
          <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
            arriendo en Bogotá
          </span>
        </h1>
        <p className="mx-auto max-w-md text-[15px] leading-relaxed text-t-secondary">
          Apartamentos, habitaciones y casas con contacto directo.
          Sin intermediarios.
        </p>
        <p className="mx-auto max-w-lg text-xs text-t-muted">
          {listings.length} inmuebles disponibles · Contacto directo · Sin intermediarios
        </p>
      </section>

      <section className="mt-8" aria-labelledby="home-listings-heading">
        <h2 id="home-listings-heading" className="sr-only">
          Arriendos disponibles en Bogotá
        </h2>
        <Suspense
          fallback={
            <div className="space-y-5">
              <Skeleton className="mx-auto h-16 w-full max-w-2xl rounded-2xl" />
              <Skeleton className="mx-auto h-11 w-full max-w-md rounded-full" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-card border border-bg-border bg-bg-surface p-0 shadow-card"
                  >
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-3 w-40 rounded-full" />
                      <Skeleton className="h-4 w-52 rounded-full" />
                      <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <SearchAndResults listings={listings} />
        </Suspense>
      </section>
    </div>
  );
}
