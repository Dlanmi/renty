import type {
  ListingKind,
  ListingPoiKind,
  ListingStatus,
  ResidentialContext,
} from "@/lib/domain/types";
import type { ParsedListingInput } from "./parsing";

// ─── Domain constants ────────────────────────────────────────────────

export const ALLOWED_STATUS = new Set<ListingStatus>([
  "draft",
  "pending_review",
  "active",
  "rented",
  "inactive",
  "rejected",
]);

export const ALLOWED_LISTING_KIND = new Set<ListingKind>([
  "apartment",
  "house",
  "studio",
  "room_private",
  "room_shared",
]);

export const ALLOWED_CONTEXT = new Set<ResidentialContext>([
  "barrio",
  "conjunto",
  "edificio",
  "casa_familiar",
]);

export const ALLOWED_POI_KIND = new Set<ListingPoiKind>([
  "park",
  "transport",
  "supermarket",
  "pharmacy",
  "school",
  "hospital",
  "other",
]);

// ─── Helpers ─────────────────────────────────────────────────────────

export function isRoomKind(kind: ListingKind): boolean {
  return kind === "room_private" || kind === "room_shared";
}

export function isAreaRequiredKind(kind: ListingKind): boolean {
  return kind === "apartment" || kind === "house" || kind === "studio";
}

function toError(message: string): never {
  throw new Error(message);
}

// ─── Validation ──────────────────────────────────────────────────────

export interface ValidationOptions {
  mode: "create" | "update";
  previousListingKind?: ListingKind;
}

export function validateRequiredFields(
  input: ParsedListingInput,
  options: ValidationOptions
) {
  void options;

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

  if (isAreaRequiredKind(input.listingKind) && input.areaM2 == null) {
    toError("Para apartamento/casa/apartaestudio, el área en m² es obligatoria.");
  }

  if (
    isRoomKind(input.listingKind) &&
    (input.roomBathroomPrivate == null || input.kitchenAccess == null)
  ) {
    toError(
      "Para habitaciones debes indicar si tiene baño privado y acceso a cocina."
    );
  }

  if (input.listingKind === "room_shared" && input.cohabitantsCount == null) {
    toError("Para habitación compartida debes indicar número de convivientes.");
  }
}

export function validateCreateListingMedia(
  coverPhotoUrl: string | null,
  manualGalleryUrls: string[],
  preparedPhotoCount: number
) {
  if (!coverPhotoUrl && preparedPhotoCount === 0 && manualGalleryUrls.length === 0) {
    toError("Debes subir al menos una foto o definir URL de portada.");
  }
}
