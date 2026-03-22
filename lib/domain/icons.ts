/**
 * Centralised icon-name map for Material Symbols Outlined.
 * Keeps icon names out of presentation components.
 */

/** Property-type → icon */
export const PROPERTY_ICON: Record<string, string> = {
  Apartamento: "apartment",
  Apartaestudio: "apartment",
  Casa: "house",
  Habitación: "bed",
  Finca: "landscape",
  Local: "storefront",
};

/** Include/utility tag → icon */
export const INCLUDE_ICON: Record<string, string> = {
  agua: "water_drop",
  luz: "bolt",
  gas: "local_fire_department",
  wifi: "wifi",
  internet: "wifi",
  parqueadero: "local_parking",
  lavadero: "local_laundry_service",
  administracion: "apartment",
};

/** Requirement tag → icon */
export const REQUIREMENT_ICON: Record<string, string> = {
  cedula: "badge",
  fiador: "person_check",
  codeudor: "verified_user",
  deposito: "account_balance_wallet",
  carta_laboral: "description",
  certificado_laboral: "assignment",
  referencias: "contact_page",
};

/** Spec label → icon */
export const SPEC_ICON = {
  bedrooms: "bed",
  bathrooms: "shower",
  type: "home",
  independent: "door_front",
  furnished: "chair",
  available: "calendar_month",
  minStay: "schedule",
  price: "payments",
  location: "location_on",
  calendar: "calendar_month",
} as const;

/* ── Helpers ── */

export function iconForInclude(tag: string): string {
  return INCLUDE_ICON[tag] ?? "check_circle";
}

export function iconForRequirement(tag: string): string {
  return REQUIREMENT_ICON[tag] ?? "task_alt";
}

export function iconForPropertyType(type: string): string {
  return PROPERTY_ICON[type] ?? "home";
}
