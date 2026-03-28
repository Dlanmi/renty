import test from "node:test";
import assert from "node:assert/strict";
import {
  parseListingInput,
  preparePhotoUploads,
  validateCreateListingMedia,
  validateRequiredFields,
  buildQuickStatusUpdatePayload,
} from "@/lib/admin/listings";
import type { ParsedListingInput } from "@/lib/admin/listings";

function createParsedListingInput(
  partial: Partial<ParsedListingInput> = {}
): ParsedListingInput {
  return {
    listingId: "listing-1",
    status: "draft",
    listingKind: "apartment",
    residentialContext: "barrio",
    city: "Bogotá",
    zone: "Norte",
    neighborhood: "Verbenal",
    approxLocation: "Cerca al parque",
    residentialName: null,
    priceCop: 900000,
    billingPeriod: "month",
    adminFeeCop: 0,
    utilitiesCopMin: null,
    utilitiesCopMax: null,
    propertyType: "Apartamento",
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 45,
    independent: true,
    furnished: false,
    parkingCarCount: 0,
    parkingMotorcycleCount: 0,
    petsAllowed: null,
    floorNumber: null,
    hasElevator: null,
    roomBathroomPrivate: null,
    kitchenAccess: null,
    cohabitantsCount: null,
    includes: [],
    utilitiesNotes: null,
    requirements: [],
    requirementsNotes: null,
    availableFrom: null,
    minStayMonths: null,
    whatsappE164: "573001112233",
    title: "Apartamento iluminado",
    description: null,
    coverPhotoUrl: null,
    manualGalleryUrls: [],
    pois: [],
    coverPhotoId: null,
    deletePhotoIds: [],
    photoOrderIds: [],
    newPhotos: [],
    ...partial,
  };
}

function createFile(
  name: string,
  type: string,
  bytes: number[]
): File {
  return new File([Uint8Array.from(bytes)], name, { type });
}

test("parseListingInput aplica defaults, deduplica URLs externas y parsea orden/fotos", () => {
  const formData = new FormData();
  formData.set("status", "estado-raro");
  formData.set("listing_kind", "desconocido");
  formData.set("residential_context", "otro");
  formData.set("city", "");
  formData.set("zone", " Norte ");
  formData.set("neighborhood", " Chapinero ");
  formData.set("approx_location", " Cerca al parque ");
  formData.set("price_cop", "1200000");
  formData.set("property_type", "Apartamento");
  formData.set("bedrooms", "2");
  formData.set("bathrooms", "1");
  formData.set(
    "manual_gallery_urls",
    "https://img.renty.co/a.jpg\nhttps://img.renty.co/a.jpg"
  );
  formData.set("includes_csv", "wifi, agua, wifi");
  formData.set("requirements_csv", "fiador, deposito");
  formData.set("pois_text", "transport|Portal Norte|400|5");
  formData.append("photo_order", "photo-1:0");
  formData.append(
    "new_photos",
    createFile("cover.jpg", "image/jpeg", [0xff, 0xd8, 0xff, 0xdb, 0x00])
  );

  const parsed = parseListingInput(formData);

  assert.equal(parsed.status, "draft");
  assert.equal(parsed.listingKind, "apartment");
  assert.equal(parsed.residentialContext, "barrio");
  assert.equal(parsed.city, "Bogotá");
  assert.equal(parsed.zone, "Norte");
  assert.deepEqual(parsed.manualGalleryUrls, ["https://img.renty.co/a.jpg"]);
  assert.deepEqual(parsed.includes, ["wifi", "agua", "wifi"]);
  assert.deepEqual(parsed.requirements, ["fiador", "deposito"]);
  assert.deepEqual(parsed.photoOrderIds, ["photo-1"]);
  assert.equal(parsed.pois.length, 1);
  assert.equal(parsed.pois[0]?.kind, "transport");
  assert.equal(parsed.newPhotos.length, 1);
});

test("validateRequiredFields alinea update con guards de SQL para inmuebles con área obligatoria", () => {
  const input = createParsedListingInput({
    listingKind: "house",
    areaM2: null,
  });

  assert.throws(
    () =>
      validateRequiredFields(input, {
        mode: "update",
        previousListingKind: "house",
      }),
    /área en m² es obligatoria/
  );
});

test("validateRequiredFields exige baño privado y cocina para habitaciones incluso en edición", () => {
  const input = createParsedListingInput({
    listingKind: "room_private",
    areaM2: null,
    roomBathroomPrivate: null,
    kitchenAccess: true,
  });

  assert.throws(
    () =>
      validateRequiredFields(input, {
        mode: "update",
        previousListingKind: "room_private",
      }),
    /baño privado y acceso a cocina/
  );
});

test("validateCreateListingMedia exige al menos una portada o foto al crear", () => {
  assert.throws(
    () => validateCreateListingMedia(null, [], 0),
    /al menos una foto/
  );

  assert.doesNotThrow(() =>
    validateCreateListingMedia("https://img.renty.co/cover.jpg", [], 0)
  );
  assert.doesNotThrow(() => validateCreateListingMedia(null, [], 1));
});

test("preparePhotoUploads acepta imágenes válidas y rechaza firmas binarias inconsistentes", async () => {
  const validJpeg = createFile("cover.jpg", "image/jpeg", [
    0xff,
    0xd8,
    0xff,
    0xdb,
    0x00,
  ]);
  const prepared = await preparePhotoUploads([validJpeg]);

  assert.equal(prepared.length, 1);
  assert.equal(prepared[0]?.contentType, "image/jpeg");
  assert.equal(prepared[0]?.extension, "jpg");

  const suspiciousPng = createFile("cover.png", "image/png", [
    0xff,
    0xd8,
    0xff,
    0xdb,
    0x00,
  ]);

  await assert.rejects(
    () => preparePhotoUploads([suspiciousPng]),
    /firma binaria/
  );
});

test("buildQuickStatusUpdatePayload marca published_at y rented_at solo cuando corresponde", () => {
  const nowIso = "2026-03-28T15:00:00.000Z";

  assert.deepEqual(
    buildQuickStatusUpdatePayload("draft", "active", nowIso),
    {
      status: "active",
      published_at: nowIso,
    }
  );

  assert.deepEqual(
    buildQuickStatusUpdatePayload("active", "rented", nowIso),
    {
      status: "rented",
      rented_at: nowIso,
    }
  );

  assert.deepEqual(
    buildQuickStatusUpdatePayload("active", "inactive", nowIso),
    {
      status: "inactive",
    }
  );
});
