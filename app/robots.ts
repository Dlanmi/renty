import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/domain/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const origin = siteUrl.origin;
  const isPreviewDeployment = process.env.VERCEL_ENV === "preview";

  if (isPreviewDeployment) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      host: origin,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
