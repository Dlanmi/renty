import type { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/domain/seo";

export default function robots(): MetadataRoute.Robots {
  const isPreviewDeployment = process.env.VERCEL_ENV === "preview";

  if (isPreviewDeployment) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      host: PRODUCTION_SITE_URL,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/admin/login", "/api/", "/_next/"],
      },
    ],
    sitemap: `${PRODUCTION_SITE_URL}/sitemap.xml`,
    host: PRODUCTION_SITE_URL,
  };
}
