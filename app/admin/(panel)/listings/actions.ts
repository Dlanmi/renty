"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ListingKind,
  ListingPhoto,
  ListingPoiKind,
  ListingStatus,
  ResidentialContext,
} from "@/lib/domain/types";
import { createSupabaseServerClient, requireAdminContext } from "@/lib/admin/auth";

const FALLBACK_COVER_PHOTO =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80";

const ALLOWED_STATUS = new Set<ListingStatus>([
  "draft",
  "pending_review",
  "active",
  "rented",
  "inactive",
  "rejected",
]);

const ALLOWED_LISTING_KIND = new Set<ListingKind>([
  "apartment",
  "house",
  "studio",
  "room_private",
  "room_shared",
]);

const ALLOWED_CONTEXT = new Set<ResidentialContext>([
  "barrio",
  "conjunto",
  "edificio",
  "casa_familiar",
]);

const ALLOWED_POI_KIND = new Set<ListingPoiKind>([
  "park",
  "transport",
  "supermarket",
  "pharmacy",
  "school",
  "hospital",
  "other",
]);

const MAX_NEW_PHOTOS_PER_REQUEST = 10;
const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;

type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

const ALLOWED_IMAGE_MIME_TYPES = new Set<AllowedImageMime>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MIME_BY_EXTENSION: Record<string, AllowedImageMime> =
  {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };

interface PreparedPhotoUpload {
  bytes: Buffer;
  contentType: AllowedImageMime;
  extension: string;
}

interface ParsedPoiInput {
  kind: ListingPoiKind;
  name: string;
  distance_m: number | null;
  walk_minutes: number | null;
}

interface ParsedListingInput {
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
}

interface ValidationOptions {
  mode: "create" | "update";
  previousListingKind?: ListingKind;
}

function parseSingle(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseNullableText(
  formData: FormData,
  key: string,
  fallback = ""
): string | null {
  const value = parseSingle(formData, key);
  if (!value) return fallback ? fallback : null;
  return value;
}

function parseIntStrict(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parseNullableInt(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseNullableFloat(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
}

function parseBoolean(value: string, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return value === "true" || value === "1" || value === "on";
}

function parseOptionalBoolean(value: string): boolean | null {
  if (!value) return null;
  if (value === "true" || value === "1" || value === "on") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

function parseCsvList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseExternalPhotoUrls(value: string): string[] {
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

function parsePoiLines(value: string): ParsedPoiInput[] {
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

function parseUploads(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((item): item is File => item instanceof File && item.size > 0);
}

function isRoomKind(kind: ListingKind): boolean {
  return kind === "room_private" || kind === "room_shared";
}

function isAreaRequiredKind(kind: ListingKind): boolean {
  return kind === "apartment" || kind === "house" || kind === "studio";
}

function parsePhotoOrderIds(formData: FormData): string[] {
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

function parseListingInput(formData: FormData): ParsedListingInput {
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
  };
}

function toError(message: string): never {
  throw new Error(message);
}

function isRedirectLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeDigest = (error as { digest?: unknown }).digest;
  return typeof maybeDigest === "string" && maybeDigest.startsWith("NEXT_REDIRECT");
}

async function getListingPhotos(
  accessToken: string,
  listingId: string
): Promise<ListingPhoto[]> {
  const client = createSupabaseServerClient(accessToken);
  const { data } = await client
    .from("listing_photos")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });
  return (data as ListingPhoto[]) ?? [];
}

async function replacePois(
  accessToken: string,
  listingId: string,
  pois: ParsedPoiInput[]
) {
  const client = createSupabaseServerClient(accessToken);
  const { error: deleteError } = await client
    .from("listing_pois")
    .delete()
    .eq("listing_id", listingId);

  if (deleteError) toError(deleteError.message);

  if (pois.length === 0) return;

  const { error: insertError } = await client.from("listing_pois").insert(
    pois.map((poi) => ({
      listing_id: listingId,
      kind: poi.kind,
      name: poi.name,
      distance_m: poi.distance_m,
      walk_minutes: poi.walk_minutes,
    }))
  );

  if (insertError) toError(insertError.message);
}

function fileExtension(filename: string): string {
  const pieces = filename.split(".");
  const ext = pieces.length > 1 ? pieces[pieces.length - 1] : "jpg";
  const normalized = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized || "jpg";
}

function isAllowedImageMime(value: string): value is AllowedImageMime {
  return ALLOWED_IMAGE_MIME_TYPES.has(value as AllowedImageMime);
}

function detectImageMimeType(bytes: Buffer): AllowedImageMime | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (bytes.length >= 16 && bytes.toString("ascii", 4, 8) === "ftyp") {
    const ftypChunk = bytes.toString("ascii", 8, 16).toLowerCase();
    if (ftypChunk.includes("avif")) return "image/avif";
  }

  return null;
}

async function preparePhotoUploads(files: File[]): Promise<PreparedPhotoUpload[]> {
  if (files.length === 0) return [];

  if (files.length > MAX_NEW_PHOTOS_PER_REQUEST) {
    toError(
      `Puedes subir máximo ${MAX_NEW_PHOTOS_PER_REQUEST} fotos por publicación.`
    );
  }

  const prepared: PreparedPhotoUpload[] = [];

  for (const file of files) {
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toError(
        `Cada foto debe pesar máximo ${Math.floor(
          MAX_PHOTO_SIZE_BYTES / (1024 * 1024)
        )} MB.`
      );
    }

    const extension = fileExtension(file.name);
    const expectedMime = MIME_BY_EXTENSION[extension];
    if (!expectedMime) {
      toError(
        "Formato no permitido. Usa solo JPG, PNG, WEBP o AVIF (SVG no permitido)."
      );
    }

    const rawMimeType = file.type.toLowerCase().trim();
    const normalizedMimeType =
      rawMimeType === "image/jpg" ? "image/jpeg" : rawMimeType;
    if (!isAllowedImageMime(normalizedMimeType)) {
      toError(
        "Tipo de archivo no permitido. Usa solo JPG, PNG, WEBP o AVIF (SVG no permitido)."
      );
    }

    if (normalizedMimeType !== expectedMime) {
      toError(
        "El tipo de archivo no coincide con su extensión. Verifica la imagen antes de subirla."
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectImageMimeType(bytes);
    if (detectedMime && detectedMime !== expectedMime) {
      toError(
        "La firma binaria del archivo no coincide con el formato declarado."
      );
    }

    prepared.push({
      bytes,
      contentType: expectedMime,
      extension,
    });
  }

  return prepared;
}

async function uploadPhotos(
  accessToken: string,
  listingId: string,
  files: PreparedPhotoUpload[],
  startSortOrder: number
) {
  if (files.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const photoRows: Array<{
    listing_id: string;
    storage_path: string;
    public_url: string;
    sort_order: number;
    is_cover: boolean;
  }> = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const storagePath = `${listingId}/${Date.now()}-${index}.${file.extension}`;

    const { error: uploadError } = await client.storage
      .from("listing-images")
      .upload(storagePath, file.bytes, {
        contentType: file.contentType,
        upsert: false,
      });

    if (uploadError) toError(uploadError.message);

    const publicUrl = client.storage
      .from("listing-images")
      .getPublicUrl(storagePath).data.publicUrl;

    photoRows.push({
      listing_id: listingId,
      storage_path: storagePath,
      public_url: publicUrl,
      sort_order: startSortOrder + index + 1,
      is_cover: false,
    });
  }

  const { error: insertError } = await client.from("listing_photos").insert(photoRows);
  if (insertError) toError(insertError.message);
}

async function insertExternalPhotoUrls(
  accessToken: string,
  listingId: string,
  urls: string[],
  startSortOrder: number
) {
  if (urls.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const existingPhotos = await getListingPhotos(accessToken, listingId);
  const existingUrlSet = new Set(
    existingPhotos.map((photo) => photo.public_url.trim())
  );

  let sortOrder = startSortOrder;
  const rows: Array<{
    listing_id: string;
    storage_path: string;
    public_url: string;
    sort_order: number;
    is_cover: boolean;
  }> = [];

  for (const url of urls) {
    const normalized = url.trim();
    if (!normalized || existingUrlSet.has(normalized)) continue;

    sortOrder += 1;
    rows.push({
      listing_id: listingId,
      storage_path: "",
      public_url: normalized,
      sort_order: sortOrder,
      is_cover: false,
    });
    existingUrlSet.add(normalized);
  }

  if (rows.length === 0) return;
  const { error } = await client.from("listing_photos").insert(rows);
  if (error) toError(error.message);
}

async function deletePhotos(
  accessToken: string,
  listingId: string,
  deletePhotoIds: string[]
) {
  if (deletePhotoIds.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const uniqueIds = Array.from(new Set(deletePhotoIds));
  const { data: toDeleteRows } = await client
    .from("listing_photos")
    .select("id, storage_path")
    .eq("listing_id", listingId)
    .in("id", uniqueIds);

  const rows = toDeleteRows ?? [];
  if (rows.length === 0) return;

  const paths = rows
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await client.storage
      .from("listing-images")
      .remove(paths);
    if (storageError) toError(storageError.message);
  }

  const { error: deleteError } = await client
    .from("listing_photos")
    .delete()
    .eq("listing_id", listingId)
    .in("id", uniqueIds);

  if (deleteError) toError(deleteError.message);
}

async function reorderExistingPhotos(
  accessToken: string,
  listingId: string,
  orderedPhotoIds: string[]
) {
  if (orderedPhotoIds.length === 0) return;

  const client = createSupabaseServerClient(accessToken);
  const uniqueIds = Array.from(new Set(orderedPhotoIds));

  const { data: currentPhotos } = await client
    .from("listing_photos")
    .select("id")
    .eq("listing_id", listingId)
    .in("id", uniqueIds);

  const validIdSet = new Set((currentPhotos ?? []).map((row) => row.id as string));
  const filteredIds = uniqueIds.filter((id) => validIdSet.has(id));
  if (filteredIds.length === 0) return;

  for (let sortOrder = 0; sortOrder < filteredIds.length; sortOrder += 1) {
    const photoId = filteredIds[sortOrder];
    const { error } = await client
      .from("listing_photos")
      .update({ sort_order: sortOrder })
      .eq("id", photoId)
      .eq("listing_id", listingId);

    if (error) toError(error.message);
  }
}

async function applyCover(
  accessToken: string,
  listingId: string,
  coverPhotoId: string | null,
  manualCoverUrl: string | null
) {
  const client = createSupabaseServerClient(accessToken);
  const photos = await getListingPhotos(accessToken, listingId);

  if (manualCoverUrl) {
    if (photos.length > 0) {
      await client
        .from("listing_photos")
        .update({ is_cover: false })
        .eq("listing_id", listingId);
    }
    await client
      .from("listings")
      .update({ cover_photo_url: manualCoverUrl })
      .eq("id", listingId);
    return;
  }

  if (photos.length === 0) return;

  const selectedCover =
    photos.find((photo) => photo.id === coverPhotoId) ??
    photos.find((photo) => photo.is_cover) ??
    photos[0];

  await client
    .from("listing_photos")
    .update({ is_cover: false })
    .eq("listing_id", listingId);

  await client
    .from("listing_photos")
    .update({ is_cover: true })
    .eq("id", selectedCover.id);

  await client
    .from("listings")
    .update({ cover_photo_url: selectedCover.public_url })
    .eq("id", listingId);
}

function queryString(params: Record<string, string>): string {
  const qs = new URLSearchParams(params);
  return qs.toString();
}

function listingPayload(input: ParsedListingInput) {
  return {
    status: input.status,
    listing_kind: input.listingKind,
    residential_context: input.residentialContext,
    city: input.city,
    zone: input.zone,
    neighborhood: input.neighborhood,
    approx_location: input.approxLocation,
    residential_name: input.residentialName,
    price_cop: input.priceCop,
    billing_period: input.billingPeriod,
    admin_fee_cop: input.adminFeeCop,
    utilities_cop_min: input.utilitiesCopMin,
    utilities_cop_max: input.utilitiesCopMax,
    property_type: input.propertyType,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area_m2: input.areaM2,
    independent: input.independent,
    furnished: input.furnished,
    parking_car_count: input.parkingCarCount,
    parking_motorcycle_count: input.parkingMotorcycleCount,
    pets_allowed: input.petsAllowed,
    floor_number: input.floorNumber,
    has_elevator: input.hasElevator,
    room_bathroom_private: input.roomBathroomPrivate,
    kitchen_access: input.kitchenAccess,
    cohabitants_count: input.cohabitantsCount,
    includes: input.includes,
    utilities_notes: input.utilitiesNotes,
    requirements: input.requirements,
    requirements_notes: input.requirementsNotes,
    available_from: input.availableFrom,
    min_stay_months: input.minStayMonths,
    whatsapp_e164: input.whatsappE164,
    title: input.title,
    description: input.description,
  };
}

function validateRequiredFields(input: ParsedListingInput, options: ValidationOptions) {
  if (!input.title) toError("El título es obligatorio.");
  if (!input.neighborhood) toError("El barrio es obligatorio.");
  if (!input.approxLocation) toError("La ubicación aproximada es obligatoria.");
  if (!input.whatsappE164) toError("El WhatsApp es obligatorio.");
  if (input.priceCop < 0) toError("El precio no puede ser negativo.");
  if (
    input.utilitiesCopMin != null &&
    input.utilitiesCopMax != null &&
    input.utilitiesCopMin > input.utilitiesCopMax
  ) {
    toError("Servicios mínimos no puede ser mayor que servicios máximos.");
  }

  const movingIntoAreaRequired =
    options.mode === "update" &&
    options.previousListingKind != null &&
    !isAreaRequiredKind(options.previousListingKind) &&
    isAreaRequiredKind(input.listingKind);

  if (isAreaRequiredKind(input.listingKind) && input.areaM2 == null) {
    if (options.mode === "create" || movingIntoAreaRequired) {
      toError("Para apartamento/casa/apartaestudio, el área en m² es obligatoria.");
    }
  }

  const movingIntoRoomKind =
    options.mode === "update" &&
    options.previousListingKind != null &&
    !isRoomKind(options.previousListingKind) &&
    isRoomKind(input.listingKind);

  if (
    isRoomKind(input.listingKind) &&
    (input.roomBathroomPrivate == null || input.kitchenAccess == null)
  ) {
    if (options.mode === "create" || movingIntoRoomKind) {
      toError(
        "Para habitaciones debes indicar si tiene baño privado y acceso a cocina."
      );
    }
  }

  if (input.listingKind === "room_shared" && input.cohabitantsCount == null) {
    const movingIntoSharedRoom =
      options.mode === "update" && options.previousListingKind !== "room_shared";
    if (options.mode === "create" || movingIntoSharedRoom) {
      toError("Para habitación compartida debes indicar número de convivientes.");
    }
  }
}

function redirectCreateError(errorMessage: string): never {
  redirect(`/admin/listings/new?${queryString({ error: errorMessage })}`);
}

function redirectUpdateError(listingId: string, errorMessage: string): never {
  redirect(
    `/admin/listings/${listingId}?${queryString({
      error: errorMessage,
    })}`
  );
}

export async function createListingAction(formData: FormData) {
  let listingId = "";

  try {
    const admin = await requireAdminContext();
    const input = parseListingInput(formData);
    const preparedNewPhotos = await preparePhotoUploads(input.newPhotos);
    validateRequiredFields(input, { mode: "create" });

    if (
      !input.coverPhotoUrl &&
      preparedNewPhotos.length === 0 &&
      input.manualGalleryUrls.length === 0
    ) {
      toError("Debes subir al menos una foto o definir URL de portada.");
    }

    listingId = crypto.randomUUID();
    const client = createSupabaseServerClient(admin.accessToken);
    const payload = listingPayload(input);

    const { error: createError } = await client.from("listings").insert({
      id: listingId,
      ...payload,
      cover_photo_url: input.coverPhotoUrl ?? FALLBACK_COVER_PHOTO,
    });
    if (createError) toError(createError.message);

    await replacePois(admin.accessToken, listingId, input.pois);

    const photosBeforeUpload = await getListingPhotos(admin.accessToken, listingId);
    const maxSortOrder = photosBeforeUpload.reduce(
      (max, photo) => Math.max(max, photo.sort_order),
      -1
    );

    await uploadPhotos(
      admin.accessToken,
      listingId,
      preparedNewPhotos,
      maxSortOrder
    );
    await insertExternalPhotoUrls(
      admin.accessToken,
      listingId,
      input.manualGalleryUrls,
      maxSortOrder + preparedNewPhotos.length
    );
    await applyCover(
      admin.accessToken,
      listingId,
      input.coverPhotoId,
      input.coverPhotoUrl
    );

    await client.from("listing_audit_logs").insert({
      listing_id: listingId,
      actor_user_id: admin.userId,
      action: "create",
      payload: {
        status: input.status,
        listing_kind: input.listingKind,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/listings");
    revalidatePath("/sitemap.xml");
    redirect(
      `/admin/listings/${listingId}?${queryString({
        saved: "1",
        savedAt: String(Date.now()),
      })}`
    );
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "No se pudo crear el inmueble.";
    if (listingId) {
      redirectUpdateError(listingId, message);
    }
    redirectCreateError(message);
  }
}

export async function updateListingAction(formData: FormData) {
  const input = parseListingInput(formData);
  const listingId = input.listingId;
  if (!listingId) {
    redirectCreateError("No se recibió el ID del inmueble.");
  }

  try {
    const admin = await requireAdminContext();
    const preparedNewPhotos = await preparePhotoUploads(input.newPhotos);
    const client = createSupabaseServerClient(admin.accessToken);
    const { data: existingListing, error: existingError } = await client
      .from("listings")
      .select("listing_kind")
      .eq("id", listingId)
      .maybeSingle();

    if (existingError || !existingListing) {
      toError("No encontramos el inmueble para actualizar.");
    }

    validateRequiredFields(input, {
      mode: "update",
      previousListingKind: existingListing.listing_kind as ListingKind,
    });

    const payload = listingPayload(input);

    if (input.coverPhotoUrl) {
      Object.assign(payload, {
        cover_photo_url: input.coverPhotoUrl,
      });
    }

    const { error: updateError } = await client
      .from("listings")
      .update(payload)
      .eq("id", listingId);
    if (updateError) toError(updateError.message);

    await replacePois(admin.accessToken, listingId, input.pois);
    await deletePhotos(admin.accessToken, listingId, input.deletePhotoIds);
    await reorderExistingPhotos(admin.accessToken, listingId, input.photoOrderIds);

    const photosAfterDelete = await getListingPhotos(admin.accessToken, listingId);
    const maxSortOrder = photosAfterDelete.reduce(
      (max, photo) => Math.max(max, photo.sort_order),
      -1
    );

    await uploadPhotos(
      admin.accessToken,
      listingId,
      preparedNewPhotos,
      maxSortOrder
    );
    await insertExternalPhotoUrls(
      admin.accessToken,
      listingId,
      input.manualGalleryUrls,
      maxSortOrder + preparedNewPhotos.length
    );
    await applyCover(
      admin.accessToken,
      listingId,
      input.coverPhotoId,
      input.coverPhotoUrl
    );

    await client.from("listing_audit_logs").insert({
      listing_id: listingId,
      actor_user_id: admin.userId,
      action: "update",
      payload: {
        status: input.status,
      },
    });

    revalidatePath("/");
    revalidatePath(`/listing/${listingId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/listings");
    revalidatePath(`/admin/listings/${listingId}`);
    revalidatePath("/sitemap.xml");
    redirect(
      `/admin/listings/${listingId}?${queryString({
        saved: "1",
        savedAt: String(Date.now()),
      })}`
    );
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el inmueble.";
    redirectUpdateError(listingId, message);
  }
}

export async function deleteListingAction(
  listingId: string
): Promise<{ success: true; title: string } | { success: false; error: string }> {
  try {
    if (!listingId || !listingId.trim()) {
      return { success: false, error: "No se recibió el ID del inmueble." };
    }

    const admin = await requireAdminContext();
    const client = createSupabaseServerClient(admin.accessToken);

    const { data: listing, error: fetchError } = await client
      .from("listings")
      .select("id, title")
      .eq("id", listingId)
      .maybeSingle();

    if (fetchError || !listing) {
      return {
        success: false,
        error: "No se encontró el inmueble para eliminar.",
      };
    }

    const deletedTitle = listing.title;

    // Fetch photos with storage paths to clean up Storage bucket
    const { data: photos } = await client
      .from("listing_photos")
      .select("storage_path")
      .eq("listing_id", listingId);

    const storagePaths = (photos ?? [])
      .map((p) => p.storage_path)
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      await client.storage.from("listing-images").remove(storagePaths);
    }

    // Delete the listing — CASCADE handles photos, pois, audit_logs
    const { error: deleteError } = await client
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message || "No se pudo eliminar el inmueble.",
      };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/listings");
    revalidatePath("/sitemap.xml");

    return { success: true, title: deletedTitle };
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al eliminar el inmueble.";
    return { success: false, error: message };
  }
}

export async function quickStatusChangeAction(
  listingId: string,
  newStatus: string
): Promise<{ success: true; title: string; status: string } | { success: false; error: string }> {
  try {
    if (!listingId?.trim()) {
      return { success: false, error: "No se recibió el ID del inmueble." };
    }

    if (!ALLOWED_STATUS.has(newStatus as ListingStatus)) {
      return { success: false, error: "Estado no válido." };
    }

    const admin = await requireAdminContext();
    const client = createSupabaseServerClient(admin.accessToken);

    const { data: listing, error: fetchError } = await client
      .from("listings")
      .select("id, title, status")
      .eq("id", listingId)
      .maybeSingle();

    if (fetchError || !listing) {
      return { success: false, error: "No se encontró el inmueble." };
    }

    const previousStatus = listing.status;
    if (previousStatus === newStatus) {
      return { success: true, title: listing.title, status: newStatus };
    }

    const updatePayload: Record<string, unknown> = { status: newStatus };

    if (newStatus === "active" && previousStatus !== "active") {
      updatePayload.published_at = new Date().toISOString();
    }
    if (newStatus === "rented") {
      updatePayload.rented_at = new Date().toISOString();
    }

    const { error: updateError } = await client
      .from("listings")
      .update(updatePayload)
      .eq("id", listingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await client.from("listing_audit_logs").insert({
      listing_id: listingId,
      actor_user_id: admin.userId,
      action: "status_change",
      payload: { from: previousStatus, to: newStatus },
    });

    revalidatePath("/");
    revalidatePath(`/listing/${listingId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/listings");
    revalidatePath(`/admin/listings/${listingId}`);
    revalidatePath("/sitemap.xml");

    return { success: true, title: listing.title, status: newStatus };
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Error al cambiar el estado.";
    return { success: false, error: message };
  }
}

export async function duplicateListingAction(
  listingId: string
): Promise<{ success: true; newId: string; title: string } | { success: false; error: string }> {
  try {
    if (!listingId?.trim()) {
      return { success: false, error: "No se recibió el ID del inmueble." };
    }

    const admin = await requireAdminContext();
    const client = createSupabaseServerClient(admin.accessToken);

    const { data: original, error: fetchError } = await client
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .maybeSingle();

    if (fetchError || !original) {
      return { success: false, error: "No se encontró el inmueble a duplicar." };
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, published_at, rented_at, status, ...rest } = original;

    const { error: insertError } = await client.from("listings").insert({
      id: newId,
      ...rest,
      title: `${original.title} (copia)`,
      status: "draft",
      published_at: null,
      rented_at: null,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Duplicate photos
    const { data: photos } = await client
      .from("listing_photos")
      .select("*")
      .eq("listing_id", listingId)
      .order("sort_order", { ascending: true });

    if (photos && photos.length > 0) {
      const photoRows = photos.map((photo) => ({
        listing_id: newId,
        storage_path: photo.storage_path,
        public_url: photo.public_url,
        caption: photo.caption,
        room_type: photo.room_type,
        sort_order: photo.sort_order,
        is_cover: photo.is_cover,
      }));

      await client.from("listing_photos").insert(photoRows);
    }

    // Duplicate POIs
    const { data: pois } = await client
      .from("listing_pois")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true });

    if (pois && pois.length > 0) {
      const poiRows = pois.map((poi) => ({
        listing_id: newId,
        kind: poi.kind,
        name: poi.name,
        distance_m: poi.distance_m,
        walk_minutes: poi.walk_minutes,
      }));

      await client.from("listing_pois").insert(poiRows);
    }

    // Audit log
    await client.from("listing_audit_logs").insert({
      listing_id: newId,
      actor_user_id: admin.userId,
      action: "create",
      payload: { duplicated_from: listingId },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/listings");

    return { success: true, newId, title: original.title };
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Error al duplicar el inmueble.";
    return { success: false, error: message };
  }
}
