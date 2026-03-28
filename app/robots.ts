import type { MetadataRoute } from "next";
import { buildRobotsMetadata } from "@/lib/domain/public-seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsMetadata(process.env.VERCEL_ENV === "preview");
}
