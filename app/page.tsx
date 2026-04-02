import { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveListings } from "@/lib/data/listings";
import SearchAndResults from "@/components/search/SearchAndResults";
import StructuredData from "@/components/seo/StructuredData";
import HomePageSkeleton from "@/components/search/HomePageSkeleton";
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

async function HomePageContent() {
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
    <>
      <StructuredData id="home-structured-data" data={collectionJsonLd} />
      <SearchAndResults listings={listings} />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="pb-14">
      {/* Server-rendered H1 for SEO crawlers — visually hidden */}
      <h1 className="sr-only">
        Arriendos en Bogotá sin intermediarios — Apartamentos, habitaciones y
        casas con contacto directo por WhatsApp
      </h1>

      <section>
        <Suspense fallback={<HomePageSkeleton />}>
          <HomePageContent />
        </Suspense>
      </section>
    </div>
  );
}
