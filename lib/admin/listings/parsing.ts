import type {
  ListingKind,
  ListingPoiKind,
  ListingStatus,
  ResidentialContext,
} from "@/lib/domain/types";
import type { UploadedPhotoReference } from "./photo-rules";
import {
  ALLOWED_STATUS,
  ALLOWED_LISTING_KIND,
  ALLOWED_CONTEXT,
  ALLOWED_POI_KIND,
} from "./validation";

// ─── Interfaces ──────────────────────────────────────────────────────

export interface ParsedPoiInput {
  kind: ListingPoiKind;
  name: string;
  distance_m: number | null;
  walk_minutes: number | null;
}

export interface ParsedListingInput {
  listingId: string | null;
  status: ListingStatus;
  listingKind: ListingKind;
  residentialContext: ResidentialContext;
  city: string;
  zone: string | null;
  neighborhood: string;
  approxLocation: string;
  residentialName: string | null;
  priceCop: number;
  billingPeriod: string;
  adminFeeCop: number;
  utilitiesCopMin: number | null;
  utilitiesCopMax: number | null;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: number | null;
  independent: boolean;
  furnished: boolean;
  parkingCarCount: number;
  parkingMotorcycleCount: number;
  petsAllowed: boolean | null;
  floorNumber: number | null;
  hasElevator: boolean | null;
  roomBathroomPrivate: boolean | null;
  kitchenAccess: boolean | null;
  cohabitantsCount: number | null;
  includes: string[];
  utilitiesNotes: string | null;
  requirements: string[];
  requirementsNotes: string | null;
  availableFrom: string | null;
  minStayMonths: number | null;
  whatsappE164: string;
  title: string;
  description: string | null;
  coverPhotoUrl: string | null;
  manualGalleryUrls: string[];
  pois: ParsedPoiInput[];
  coverPhotoId: string | null;
  deletePhotoIds: string[];
  photoOrderIds: string[];
  newPhotos: File[];
  preUploadedPhotos: UploadedPhotoReference[];
}

// ─── Primitive parsers ───────────────────────────────────────────────

export function parseSingle(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function parseNullableText(
  formData: FormData,
  key: string,
  fallback = ""
): string | null {
  const value = parseSingle(formData, key);
  if (!value) return fallback ? fallback : null;
  return value;
}

export function parseIntStrict(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function parseNullableInt(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseNullableFloat(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
}

export function parseBoolean(value: string, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return value === "true" || value === "1" || value === "on";
}

export function parseOptionalBoolean(value: string): boolean | null {
  if (!value) return null;
  if (value === "true" || value === "1" || value === "on") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

// ─── Domain-specific parsers ─────────────────────────────────────────

export function parseCsvList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toError(message: string): never {
  throw new Error(message);
}

export function parseExternalPhotoUrls(value: string): string[] {
  if (!value.trim()) return [];

  const chunks = value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueUrls: string[] = [];
  const seen = new Set<string>();

  for (const raw of chunks) {
    let normalized = raw;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        toError(`URL de foto inválida: ${raw}`);
      }
      normalized = parsed.toString();
    } catch {
      toError(`URL de foto inválida: ${raw}`);
    }

    if (seen.has(normalized)) continue;
    seen.add(normalized);
    uniqueUrls.push(normalized);
  }

  return uniqueUrls;
}

export function parsePoiLines(value: string): ParsedPoiInput[] {
  if (!value.trim()) return [];

  const lines = value.split("\n");
  const parsed: ParsedPoiInput[] = [];

  for (const line of lines) {
    const raw = line.trim();
    if (!raw) continue;

    const [kindRaw, nameRaw, distanceRaw, minutesRaw] = raw
      .split("|")
      .map((piece) => piece.trim());

    if (!nameRaw) continue;

    const kind = ALLOWED_POI_KIND.has(kindRaw as ListingPoiKind)
      ? (kindRaw as ListingPoiKind)
      : "other";

    parsed.push({
      kind,
      name: nameRaw,
      distance_m: parseNullableInt(distanceRaw ?? ""),
      walk_minutes: parseNullableInt(minutesRaw ?? ""),
    });
  }

  return parsed;
}

export function parseUploads(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((item): item is File => item instanceof File && item.size > 0);
}

export function parsePhotoOrderIds(formData: FormData): string[] {
  return formData
    .getAll("photo_order")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map((value) => {
      const [id] = value.split(":");
      return id?.trim() ?? "";
    })
    .filter(Boolean);
}

export function parseUploadedPhotoRefs(
  formData: FormData,
  key: string
): UploadedPhotoReference[] {
  const parsed: UploadedPhotoReference[] = [];
  const seenStoragePaths = new Set<string>();

  for (const rawValue of formData.getAll(key)) {
    const value = String(rawValue ?? "").trim();
    if (!value) continue;

    try {
      const parsedValue = JSON.parse(value) as UploadedPhotoReference;
      const storagePath = String(parsedValue.storagePath ?? "").trim();
      const publicUrl = String(parsedValue.publicUrl ?? "").trim();

      if (!storagePath || !publicUrl || seenStoragePaths.has(storagePath)) {
        continue;
      }

      seenStoragePaths.add(storagePath);
      parsed.push({ storagePath, publicUrl });
    } catch {
      continue;
    }
  }

  return parsed;
}

// ─── Main composite parser ──────────────────────────────────────────

export function parseListingInput(formData: FormData): ParsedListingInput {
  const statusRaw = parseSingle(formData, "status");
  const listingKindRaw = parseSingle(formData, "listing_kind");
  const contextRaw = parseSingle(formData, "residential_context");

  const status = ALLOWED_STATUS.has(statusRaw as ListingStatus)
    ? (statusRaw as ListingStatus)
    : "draft";

  const listingKind = ALLOWED_LISTING_KIND.has(listingKindRaw as ListingKind)
    ? (listingKindRaw as ListingKind)
    : "apartment";

  const residentialContext = ALLOWED_CONTEXT.has(
    contextRaw as ResidentialContext
  )
    ? (contextRaw as ResidentialContext)
    : "barrio";

  return {
    listingId: parseSingle(formData, "listing_id") || null,
    status,
    listingKind,
    residentialContext,
    city: parseSingle(formData, "city") || "Bogotá",
    zone: parseNullableText(formData, "zone"),
    neighborhood: parseSingle(formData, "neighborhood"),
    approxLocation: parseSingle(formData, "approx_location"),
    residentialName: parseNullableText(formData, "residential_name"),
    priceCop: parseIntStrict(parseSingle(formData, "price_cop"), 0),
    billingPeriod: parseSingle(formData, "billing_period") || "month",
    adminFeeCop: parseIntStrict(parseSingle(formData, "admin_fee_cop"), 0),
    utilitiesCopMin: parseNullableInt(parseSingle(formData, "utilities_cop_min")),
    utilitiesCopMax: parseNullableInt(parseSingle(formData, "utilities_cop_max")),
    propertyType: parseSingle(formData, "property_type") || "Inmueble",
    bedrooms: parseIntStrict(parseSingle(formData, "bedrooms"), 0),
    bathrooms: parseIntStrict(parseSingle(formData, "bathrooms"), 0),
    areaM2: parseNullableFloat(parseSingle(formData, "area_m2")),
    independent: parseBoolean(parseSingle(formData, "independent")),
    furnished: parseBoolean(parseSingle(formData, "furnished")),
    parkingCarCount: parseIntStrict(parseSingle(formData, "parking_car_count"), 0),
    parkingMotorcycleCount: parseIntStrict(
      parseSingle(formData, "parking_motorcycle_count"),
      0
    ),
    petsAllowed: parseOptionalBoolean(parseSingle(formData, "pets_allowed")),
    floorNumber: parseNullableInt(parseSingle(formData, "floor_number")),
    hasElevator: parseOptionalBoolean(parseSingle(formData, "has_elevator")),
    roomBathroomPrivate: parseOptionalBoolean(
      parseSingle(formData, "room_bathroom_private")
    ),
    kitchenAccess: parseOptionalBoolean(parseSingle(formData, "kitchen_access")),
    cohabitantsCount: parseNullableInt(parseSingle(formData, "cohabitants_count")),
    includes: parseCsvList(parseSingle(formData, "includes_csv")),
    utilitiesNotes: parseNullableText(formData, "utilities_notes"),
    requirements: parseCsvList(parseSingle(formData, "requirements_csv")),
    requirementsNotes: parseNullableText(formData, "requirements_notes"),
    availableFrom: parseNullableText(formData, "available_from"),
    minStayMonths: parseNullableInt(parseSingle(formData, "min_stay_months")),
    whatsappE164: parseSingle(formData, "whatsapp_e164"),
    title: parseSingle(formData, "title"),
    description: parseNullableText(formData, "description"),
    coverPhotoUrl: parseNullableText(formData, "manual_cover_photo_url"),
    manualGalleryUrls: parseExternalPhotoUrls(
      parseSingle(formData, "manual_gallery_urls")
    ),
    pois: parsePoiLines(parseSingle(formData, "pois_text")),
    coverPhotoId: parseNullableText(formData, "cover_photo_id"),
    deletePhotoIds: formData
      .getAll("delete_photo_ids")
      .map((value) => String(value).trim())
      .filter(Boolean),
    photoOrderIds: parsePhotoOrderIds(formData),
    newPhotos: parseUploads(formData, "new_photos"),
    preUploadedPhotos: parseUploadedPhotoRefs(formData, "uploaded_photo_refs"),
  };
}
