import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCAL_DEVELOPMENT_SITE_URL,
  buildPageMetadata,
  getSiteOrigin,
  getSiteUrl,
  toAbsoluteUrl,
} from "@/lib/domain/seo";

type SeoEnvKey =
  | "NEXT_PUBLIC_SITE_URL"
  | "SITE_URL"
  | "VERCEL_PROJECT_PRODUCTION_URL"
  | "VERCEL_ENV"
  | "VERCEL_URL"
  | "NODE_ENV";

function withEnv<T>(
  nextEnv: Partial<Record<SeoEnvKey, string | undefined>>,
  run: () => T
): T {
  const previous: Partial<Record<SeoEnvKey, string | undefined>> = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SITE_URL: process.env.SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  for (const [key, value] of Object.entries(nextEnv)) {
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }

  try {
    return run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === "string") {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    }
  }
}

test("getSiteUrl prioriza NEXT_PUBLIC_SITE_URL y normaliza dominios sin protocolo", () => {
  const resolved = withEnv(
    {
      NEXT_PUBLIC_SITE_URL: "rentyco.app/path-que-no-debe-quedar",
      SITE_URL: "https://fallback.example.com",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.example.vercel.app",
      VERCEL_ENV: "production",
      VERCEL_URL: "preview.example.vercel.app",
      NODE_ENV: "production",
    },
    () => ({
      siteUrl: getSiteUrl(),
      siteOrigin: getSiteOrigin(),
    })
  );

  assert.equal(resolved.siteUrl.toString(), "https://rentyco.app/");
  assert.equal(resolved.siteOrigin, "https://rentyco.app");
});

test("getSiteUrl usa SITE_URL cuando NEXT_PUBLIC_SITE_URL no está definido", () => {
  const siteUrl = withEnv(
    {
      NEXT_PUBLIC_SITE_URL: undefined,
      SITE_URL: "https://seo.rentyco.app/",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.example.vercel.app",
      VERCEL_ENV: "production",
      VERCEL_URL: "preview.example.vercel.app",
      NODE_ENV: "production",
    },
    () => getSiteUrl()
  );

  assert.equal(siteUrl.toString(), "https://seo.rentyco.app/");
});

test("getSiteUrl usa el dominio productivo de Vercel cuando no hay override explícito", () => {
  const siteUrl = withEnv(
    {
      NEXT_PUBLIC_SITE_URL: undefined,
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: "rentyco.app",
      VERCEL_ENV: "preview",
      VERCEL_URL: "rentyco-git-feature.vercel.app",
      NODE_ENV: "production",
    },
    () => getSiteUrl()
  );

  assert.equal(siteUrl.toString(), "https://rentyco.app/");
});

test("getSiteUrl cae a localhost solo fuera de producción", () => {
  const siteUrl = withEnv(
    {
      NEXT_PUBLIC_SITE_URL: undefined,
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_ENV: undefined,
      VERCEL_URL: undefined,
      NODE_ENV: "development",
    },
    () => getSiteUrl()
  );

  assert.equal(siteUrl.toString(), `${LOCAL_DEVELOPMENT_SITE_URL}/`);
});

test("buildPageMetadata compone canonical y social absolutos desde el siteUrl resuelto", () => {
  const siteUrl = new URL("https://rentyco.app");
  const metadata = buildPageMetadata(
    {
      title: "Arriendos en Bogotá",
      description: "Explora inmuebles en arriendo con contacto directo.",
      path: "/",
      imagePath: "/opengraph-image",
    },
    siteUrl
  );

  assert.equal(metadata.alternates?.canonical, "/");
  assert.equal(metadata.openGraph?.url, "https://rentyco.app/");
  assert.deepEqual(metadata.twitter?.images, [
    "https://rentyco.app/opengraph-image",
  ]);
  assert.equal(toAbsoluteUrl("/publicar", siteUrl), "https://rentyco.app/publicar");
});
