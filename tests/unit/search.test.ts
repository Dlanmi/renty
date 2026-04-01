import test from "node:test";
import assert from "node:assert/strict";
import type { Listing } from "@/lib/domain/types";
import {
  applyListingFilters,
  DEFAULT_SEARCH_FILTERS,
  filtersToSearchParams,
  normalizeSearchText,
  parseFiltersFromSearchParams,
} from "@/lib/domain/search";

function createListing(partial: Partial<Listing>): Listing {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
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
    area_m2: null,
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
    published_at: null,
    rented_at: null,
    whatsapp_e164: "573001112233",
    title: "Apartamento prueba",
    description: null,
    cover_photo_url: "https://images.unsplash.com/photo-example",
    ...partial,
  };
}

test("parseFiltersFromSearchParams should parse URL query to filters", () => {
  const params = new URLSearchParams("q=Suba%20Portal&max=800000&beds=2");
  const parsed = parseFiltersFromSearchParams(params);

  assert.deepEqual(parsed, {
    neighborhood: "Suba Portal",
    maxPriceCOP: 800000,
    minBedrooms: 2,
  });
});

test("parseFiltersFromSearchParams should fallback to defaults on invalid params", () => {
  const params = new URLSearchParams("max=-100&beds=abc");
  const parsed = parseFiltersFromSearchParams(params);

  assert.deepEqual(parsed, DEFAULT_SEARCH_FILTERS);
});

test("filtersToSearchParams should omit default values", () => {
  const params = filtersToSearchParams(DEFAULT_SEARCH_FILTERS);
  assert.equal(params.toString(), "");
});

test("normalizeSearchText should ignore accents and casing", () => {
  assert.equal(normalizeSearchText("  TOBERÍN "), "toberin");
});

test("applyListingFilters should filter by neighborhood ignoring accents", () => {
  const listings: Listing[] = [
    createListing({
      id: "00000000-0000-4000-8000-000000000002",
      neighborhood: "Toberín",
      approx_location: "Estación de Toberín",
    }),
    createListing({
      id: "00000000-0000-4000-8000-000000000003",
      neighborhood: "Suba",
      approx_location: "Portal Suba",
    }),
  ];

  const filtered = applyListingFilters(listings, {
    neighborhood: "toberin",
    maxPriceCOP: 0,
    minBedrooms: 0,
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.neighborhood, "Toberín");
});

test("applyListingFilters should enforce price and bedrooms constraints", () => {
  const listings: Listing[] = [
    createListing({
      id: "00000000-0000-4000-8000-000000000004",
      bedrooms: 1,
      price_cop: 650000,
    }),
    createListing({
      id: "00000000-0000-4000-8000-000000000005",
      bedrooms: 3,
      price_cop: 1500000,
    }),
  ];

  const filtered = applyListingFilters(listings, {
    neighborhood: "",
    maxPriceCOP: 800000,
    minBedrooms: 1,
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.price_cop, 650000);
});
