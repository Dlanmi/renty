import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGalleryPhotoUrls,
  buildHomeHref,
  buildListingMetadata,
  buildListingSeoDescription,
  buildPublicSitemap,
  buildRobotsMetadata,
} from "@/lib/domain/public-seo";
import type { Listing, ListingPhoto } from "@/lib/domain/types";

function createListing(partial: Partial<Listing> = {}): Listing {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-20T00:00:00Z",
    published_at: "2026-03-21T00:00:00Z",
    rented_at: null,
    city: "Bogotá",
    zone: "Norte",
    neighborhood: "Verbenal",
    approx_location: "Cerca al parque",
    residential_context: "barrio",
    residential_name: null,
    price_cop: 850000,
    billing_period: "month",
    admin_fee_cop: 0,
    utilities_cop_min: null,
    utilities_cop_max: null,
    listing_kind: "apartment",
    property_type: "Apartamento",
    bedrooms: 2,
    bathrooms: 1,
    area_m2: 48,
    independent: true,
    furnished: false,
    parking_car_count: 0,
    parking_motorcycle_count: 0,
    pets_allowed: null,
    floor_number: null,
    has_elevator: null,
    room_bathroom_private: null,
    kitchen_access: null,
    cohabitants_count: null,
    includes: [],
    utilities_notes: null,
    requirements: [],
    requirements_notes: null,
    available_from: null,
    min_stay_months: null,
    whatsapp_e164: "573001112233",
    title: "Apartamento cerca al parque",
    slug: "apartamento-cerca-al-parque-verbenal-bogota",
    description:
      "Con buena luz natural, cocina semiabierta y acceso rápido a transporte público.",
    cover_photo_url: "https://images.example.com/cover.jpg",
    ...partial,
  };
}

function createPhoto(
  partial: Partial<ListingPhoto> = {}
): ListingPhoto {
  return {
    id: "photo-1",
    listing_id: "00000000-0000-4000-8000-000000000001",
    storage_path: "listing-1/cover.jpg",
    public_url: "https://images.example.com/cover.jpg",
    caption: null,
    room_type: null,
    sort_order: 0,
    is_cover: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

test("buildListingMetadata publica canonical e index para listings activos", () => {
  const metadata = buildListingMetadata(createListing());

  assert.equal(
    metadata.alternates?.canonical,
    "/arriendos/apartamento-cerca-al-parque-verbenal-bogota"
  );
  assert.equal(metadata.robots?.index, true);
  assert.equal(
    metadata.openGraph?.url,
    "https://renty-seven.vercel.app/arriendos/apartamento-cerca-al-parque-verbenal-bogota"
  );
});

test("buildListingMetadata no expone canonical y aplica noindex a listings no públicos", () => {
  const metadata = buildListingMetadata(
    createListing({
      status: "draft",
    })
  );

  assert.equal(metadata.alternates, undefined);
  assert.equal(metadata.robots?.index, false);
  assert.equal(metadata.robots?.follow, false);
});

test("buildListingSeoDescription resume precio, tipología y trunca descripciones largas", () => {
  const description = buildListingSeoDescription(
    createListing({
      description: "Luminoso ".repeat(40),
    })
  );

  assert.match(description, /Apartamento de 2 hab/);
  assert.match(description, /\$\s850\.000/);
  assert.ok(description.length <= 158);
});

test("buildHomeHref preserva únicamente filtros públicos soportados", () => {
  assert.equal(
    buildHomeHref({
      q: "Suba",
      max: "800000",
      beds: "2",
      foo: "bar",
    }),
    "/?q=Suba&max=800000&beds=2"
  );
  assert.equal(buildHomeHref({ foo: "bar" }), "/");
});

test("buildGalleryPhotoUrls deduplica portada y galería sin perder el orden", () => {
  const urls = buildGalleryPhotoUrls(createListing(), [
    createPhoto(),
    createPhoto({
      id: "photo-2",
      storage_path: "listing-1/room.jpg",
      public_url: "https://images.example.com/room.jpg",
      sort_order: 1,
      is_cover: false,
    }),
  ]);

  assert.deepEqual(urls, [
    "https://images.example.com/cover.jpg",
    "https://images.example.com/room.jpg",
  ]);
});

test("buildPublicSitemap incluye estáticas y listings activos con published_at como prioridad temporal", () => {
  const now = new Date("2026-03-28T15:00:00.000Z");
  const sitemap = buildPublicSitemap(
    [
      {
        id: "listing-1",
        slug: "listing-1",
        published_at: "2026-03-25T00:00:00.000Z",
        updated_at: "2026-03-24T00:00:00.000Z",
      },
    ],
    now
  );

  assert.equal(sitemap.length, 4);
  assert.equal(sitemap[0]?.url, "https://renty-seven.vercel.app/");
  assert.equal(
    sitemap[3]?.url,
    "https://renty-seven.vercel.app/arriendos/listing-1"
  );
  assert.equal(
    new Date(sitemap[3]?.lastModified ?? 0).toISOString(),
    "2026-03-25T00:00:00.000Z"
  );
});

test("buildRobotsMetadata bloquea previews y expone sitemap en producción", () => {
  const previewRobots = buildRobotsMetadata(true);
  assert.deepEqual(previewRobots.rules, [
    {
      userAgent: "*",
      disallow: "/",
    },
  ]);

  const productionRobots = buildRobotsMetadata(false);
  assert.equal(
    productionRobots.sitemap,
    "https://renty-seven.vercel.app/sitemap.xml"
  );
  assert.deepEqual(productionRobots.rules?.[0]?.disallow, [
    "/admin",
    "/admin/",
    "/admin/login",
    "/api/",
    "/_next/",
  ]);
});
