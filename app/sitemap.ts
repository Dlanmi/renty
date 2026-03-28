import type { MetadataRoute } from "next";
import { getActiveListingSitemapEntries } from "@/lib/data/listings";
import { buildPublicSitemap } from "@/lib/domain/public-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getActiveListingSitemapEntries();
  return buildPublicSitemap(listings);
}
