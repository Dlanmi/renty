import { createSupabaseServerClient } from "@/lib/admin/auth";

interface ListingQualityScoreRow {
  listing_id: string;
  title: string;
  listing_kind: string;
  neighborhood: string;
  city: string;
  status: string;
  quality_score: number;
  quality_band: "alto" | "medio" | "bajo";
  improvement_notes: string[] | null;
}

export interface AdminQualityOverview {
  averageQualityScore: number | null;
  activeListingCount: number;
  highQualityCount: number;
  mediumQualityCount: number;
  lowQualityCount: number;
  listingsNeedingAttention: ListingQualityScoreRow[];
}

export async function getAdminQualityOverview(
  accessToken: string
): Promise<AdminQualityOverview | null> {
  const client = createSupabaseServerClient(accessToken);
  const { data, error } = await client
    .from("listing_quality_scores")
    .select(
      "listing_id, title, listing_kind, neighborhood, city, status, quality_score, quality_band, improvement_notes"
    )
    .eq("status", "active")
    .order("quality_score", { ascending: true });

  if (error) {
    console.error("[getAdminQualityOverview]", error.message);
    return null;
  }

  const rows = ((data as ListingQualityScoreRow[] | null) ?? []).filter(
    (row) => typeof row.quality_score === "number"
  );

  if (rows.length === 0) {
    return {
      averageQualityScore: null,
      activeListingCount: 0,
      highQualityCount: 0,
      mediumQualityCount: 0,
      lowQualityCount: 0,
      listingsNeedingAttention: [],
    };
  }

  const averageQualityScore =
    rows.reduce((sum, row) => sum + row.quality_score, 0) / rows.length;

  return {
    averageQualityScore: Number(averageQualityScore.toFixed(1)),
    activeListingCount: rows.length,
    highQualityCount: rows.filter((row) => row.quality_band === "alto").length,
    mediumQualityCount: rows.filter((row) => row.quality_band === "medio").length,
    lowQualityCount: rows.filter((row) => row.quality_band === "bajo").length,
    listingsNeedingAttention: rows.slice(0, 5),
  };
}
