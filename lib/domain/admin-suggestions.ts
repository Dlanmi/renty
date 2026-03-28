/**
 * Sugerencias predefinidas para campos del formulario admin.
 * Centralizado aquí para modificar fácilmente sin tocar componentes.
 */

/** Qué incluye el arriendo */
export const INCLUDES_SUGGESTIONS = [
  "Agua",
  "Luz",
  "Gas",
  "WiFi",
  "Parqueadero",
  "Lavadero",
  "Administración",
  "Aseo zonas comunes",
  "TV cable",
  "Vigilancia",
] as const;

/** Requisitos para arrendar */
export const REQUIREMENTS_SUGGESTIONS = [
  "Fiador",
  "Depósito",
  "Carta laboral",
  "Referencias personales",
  "Codeudor",
  "Certificado de ingresos",
  "Contrato mínimo 12 meses",
  "Pago anticipado",
] as const;

/** Labels legibles para tipos de POI */
export const POI_KIND_LABELS: Record<string, string> = {
  park: "Parque",
  transport: "Transporte",
  supermarket: "Supermercado",
  pharmacy: "Farmacia",
  school: "Colegio/Universidad",
  hospital: "Hospital/Clínica",
  other: "Otro",
} as const;
