import { createSupabaseServerClient } from "@/lib/admin/auth";
import type { ParsedPoiInput } from "./parsing";

function toError(message: string): never {
  throw new Error(message);
}

export async function replacePois(
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
