import test from "node:test";
import assert from "node:assert/strict";
import { buildListingCostSummary } from "@/lib/domain/listing-insights";
import type { Listing } from "@/lib/domain/types";

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
    description: "Descripción",
    cover_photo_url: "https://images.example.com/cover.jpg",
    cover_photo_thumb_url: null,
    ...partial,
  };
}

test("buildListingCostSummary resume canon, extras y total aproximado", () => {
  const summary = buildListingCostSummary(
    createListing({
      price_cop: 3500000,
      admin_fee_cop: 0,
      utilities_cop_min: 100000,
      utilities_cop_max: 200000,
    })
  );

  assert.equal(summary.hasBreakdown, true);
  assert.equal(summary.totalMin, 3600000);
  assert.equal(summary.totalMax, 3700000);
  assert.equal(summary.totalLabel, "$ 3.600.000 - $ 3.700.000");
  assert.equal(summary.breakdownLabel, "Canon + servicios estimados");
  assert.equal(summary.insightLabel, "Ya ves el total con servicios estimados");
  assert.equal(summary.totalLineLabel, "Total mensual aprox.");
});

test("buildListingCostSummary adapta el copy cuando hay administración y servicios", () => {
  const summary = buildListingCostSummary(
    createListing({
      price_cop: 3500000,
      admin_fee_cop: 320000,
      utilities_cop_min: 100000,
      utilities_cop_max: 200000,
    })
  );

  assert.equal(
    summary.breakdownLabel,
    "Canon + administración del edificio y servicios estimados"
  );
  assert.equal(summary.insightLabel, "Ya ves el total mensual estimado");
});

test("buildListingCostSummary adapta el copy cuando solo hay administración", () => {
  const summary = buildListingCostSummary(
    createListing({
      price_cop: 3500000,
      admin_fee_cop: 320000,
      utilities_cop_min: null,
      utilities_cop_max: null,
    })
  );

  assert.equal(summary.breakdownLabel, "Canon + administración del edificio");
  assert.equal(summary.insightLabel, "Ya ves canon + administración");
  assert.equal(summary.adminLabel, "Administración del edificio");
});
