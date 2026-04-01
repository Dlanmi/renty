import { whatsappLink } from "@/lib/domain/format";

const DEFAULT_RENTY_PUBLISH_WHATSAPP_E164 = "573144436688";
const RENTY_PUBLISH_WHATSAPP_ENV_KEYS = [
  "RENTY_PUBLISH_WHATSAPP_E164",
  "NEXT_PUBLIC_RENTY_PUBLISH_WHATSAPP_E164",
] as const;

export function normalizeWhatsAppE164(value: string | undefined): string | null {
  const normalized = value?.replace(/[^\d+]/g, "").trim();
  if (!normalized) return null;

  const digitsOnly = normalized.startsWith("+") ? normalized.slice(1) : normalized;
  return /^\d{10,15}$/.test(digitsOnly) ? digitsOnly : null;
}

export function getRentyPublishWhatsAppE164(): string {
  for (const key of RENTY_PUBLISH_WHATSAPP_ENV_KEYS) {
    const resolved = normalizeWhatsAppE164(process.env[key]);
    if (resolved) return resolved;
  }

  return DEFAULT_RENTY_PUBLISH_WHATSAPP_E164;
}

export function getRentyPublishWhatsAppUrl(message?: string): string {
  return whatsappLink(getRentyPublishWhatsAppE164(), message);
}
