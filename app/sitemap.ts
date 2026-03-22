import type { MetadataRoute } from "next";
import { getActiveListingSitemapEntries } from "@/lib/data/listings";
import { getSiteUrl } from "@/lib/domain/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const listings = await getActiveListingSitemapEntries();
  const now = new Date();

  return [
    {
      url: siteUrl.toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: new URL("/publicar", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: new URL("/nosotros", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...listings.map((listing) => ({
      url: new URL(`/listing/${listing.id}`, siteUrl).toString(),
      lastModified: new Date(listing.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
