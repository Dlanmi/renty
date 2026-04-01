import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGalleryPhotoAssets,
  buildGalleryPhotoUrls,
  buildHomeHref,
  buildListingCardImageAsset,
  buildListingMetadata,
  buildListingSeoDescription,
  buildPublicSitemap,
  buildRobotsMetadata,
} from "@/lib/domain/public-seo";
import type { Listing, ListingPhoto } from "@/lib/domain/types";

const TEST_SITE_URL = new URL("https://rentyco.app");
const TEST_SITE_ORIGIN = TEST_SITE_URL.origin;

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
    cover_photo_thumb_url: null,
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
    public_url_thumb: null,
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
  const metadata = buildListingMetadata(createListing(), TEST_SITE_URL);

  assert.equal(
    metadata.alternates?.canonical,
    "/arriendos/apartamento-cerca-al-parque-verbenal-bogota"
  );
  assert.equal(metadata.robots?.index, true);
  assert.equal(
    metadata.openGraph?.url,
    "https://rentyco.app/arriendos/apartamento-cerca-al-parque-verbenal-bogota"
  );
});

test("buildListingMetadata no expone canonical y aplica noindex a listings no públicos", () => {
  const metadata = buildListingMetadata(
    createListing({
      status: "draft",
    }),
    TEST_SITE_URL
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

test("buildGalleryPhotoAssets usa thumbs cuando existen y deduplica por src", () => {
  const assets = buildGalleryPhotoAssets(createListing(), [
    createPhoto({
      public_url_thumb: "https://images.example.com/cover-thumb.jpg",
    }),
    createPhoto({
      id: "photo-2",
      storage_path: "listing-1/room-lg.webp",
      public_url: "https://images.example.com/room-lg.webp",
      public_url_thumb: "https://images.example.com/room-th.webp",
      sort_order: 1,
      is_cover: false,
    }),
  ]);

  assert.deepEqual(assets, [
    {
      src: "https://images.example.com/cover.jpg",
      thumbSrc: "https://images.example.com/cover-thumb.jpg",
    },
    {
      src: "https://images.example.com/room-lg.webp",
      thumbSrc: "https://images.example.com/room-th.webp",
    },
  ]);
});

test("buildListingCardImageAsset publica srcSet cuando existe thumb de portada", () => {
  const asset = buildListingCardImageAsset(
    createListing({
      cover_photo_url: "https://images.example.com/cover-lg.webp",
      cover_photo_thumb_url: "https://images.example.com/cover-th.webp",
    })
  );

  assert.deepEqual(asset, {
    src: "https://images.example.com/cover-lg.webp",
    srcSet:
      "https://images.example.com/cover-th.webp 400w, https://images.example.com/cover-lg.webp 1600w",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  });
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
    now,
    TEST_SITE_URL
  );

  assert.equal(sitemap.length, 4);
  assert.equal(sitemap[0]?.url, "https://rentyco.app/");
  assert.equal(
    sitemap[3]?.url,
    "https://rentyco.app/arriendos/listing-1"
  );
  assert.equal(
    new Date(sitemap[3]?.lastModified ?? 0).toISOString(),
    "2026-03-25T00:00:00.000Z"
  );
});

test("buildRobotsMetadata bloquea previews y expone sitemap en producción", () => {
  const previewRobots = buildRobotsMetadata(true, TEST_SITE_ORIGIN);
  assert.deepEqual(previewRobots.rules, [
    {
      userAgent: "*",
      disallow: "/",
    },
  ]);

  const productionRobots = buildRobotsMetadata(false, TEST_SITE_ORIGIN);
  assert.equal(
    productionRobots.sitemap,
    "https://rentyco.app/sitemap.xml"
  );
  assert.deepEqual(productionRobots.rules?.[0]?.disallow, [
    "/admin",
    "/admin/",
    "/admin/login",
    "/api/",
    "/_next/",
  ]);
});
