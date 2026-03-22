/**
 * Format a number as Colombian Pesos.
 * Example: 850000 → "$850.000"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Translate billing period key to human label.
 */
export function formatBillingPeriod(period: string): string {
  const map: Record<string, string> = {
    month: "/mes",
    monthly: "/mes",
    biweekly: "/quincenal",
    weekly: "/semana",
  };
  return map[period] ?? `/${period}`;
}

/**
 * Compact Spanish date: "1 mar 2026".
 * Handles null/undefined/invalid with fallback.
 */
export function formatDateCO(
  dateStringOrISO: string | null | undefined
): string {
  if (!dateStringOrISO) return "Por confirmar";
  try {
    const raw = dateStringOrISO.includes("T")
      ? dateStringOrISO
      : dateStringOrISO + "T00:00:00";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "Por confirmar";
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Por confirmar";
  }
}

/**
 * Translate include/requirement keys to human-readable labels.
 */
export function humanizeTag(tag: string): string {
  const map: Record<string, string> = {
    agua: "Agua",
    luz: "Luz",
    gas: "Gas",
    wifi: "WiFi",
    internet: "Internet",
    parqueadero: "Parqueadero",
    lavadero: "Lavadero",
    fiador: "Fiador",
    deposito: "Depósito",
    carta_laboral: "Carta laboral",
    referencias: "Referencias",
  };
  return map[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
}

/**
 * Build a WhatsApp deep link.
 */
export function whatsappLink(phone: string, message?: string): string {
  const base = `https://wa.me/${phone.replace("+", "")}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
