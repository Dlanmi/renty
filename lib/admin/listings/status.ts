import type { ListingStatus } from "@/lib/domain/types";

export function buildQuickStatusUpdatePayload(
  previousStatus: ListingStatus,
  newStatus: ListingStatus,
  nowIso = new Date().toISOString()
): Record<string, unknown> {
  const payload: Record<string, unknown> = { status: newStatus };

  if (newStatus === "active" && previousStatus !== "active") {
    payload.published_at = nowIso;
  }

  if (newStatus === "rented") {
    payload.rented_at = nowIso;
  }

  return payload;
}
