import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveR2AllowedOrigins,
} from "@/lib/storage/r2";
import { getSiteOrigin } from "@/lib/domain/seo";

function withEnv<T>(
  nextEnv: Partial<Record<"R2_ALLOWED_ORIGINS" | "NEXT_PUBLIC_SITE_URL" | "NEXT_PUBLIC_APP_URL", string | undefined>>,
  run: () => T
): T {
  const previous = {
    R2_ALLOWED_ORIGINS: process.env.R2_ALLOWED_ORIGINS,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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

test("resolveR2AllowedOrigins usa R2_ALLOWED_ORIGINS cuando está definido", () => {
  const origins = withEnv(
    {
      R2_ALLOWED_ORIGINS:
        "https://admin.example.com, http://localhost:4555, https://admin.example.com",
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
    },
    () => resolveR2AllowedOrigins()
  );

  assert.deepEqual(origins, [
    "https://admin.example.com",
    "http://localhost:4555",
  ]);
});

test("resolveR2AllowedOrigins incluye defaults de producción y desarrollo", () => {
  const origins = withEnv(
    {
      R2_ALLOWED_ORIGINS: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
    },
    () => resolveR2AllowedOrigins()
  );

  assert.ok(origins.includes(getSiteOrigin()));
  assert.ok(origins.includes("http://localhost:3002"));
  assert.ok(origins.includes("http://127.0.0.1:3002"));
});
