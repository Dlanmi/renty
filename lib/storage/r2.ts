import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSiteOrigin } from "@/lib/domain/seo";

// ─── Configuration ──────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "renty-listing-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";
const R2_CACHE_CONTROL =
  process.env.R2_CACHE_CONTROL || "public, max-age=31536000, immutable";
const R2_CORS_MAX_AGE_SECONDS = 86400;

const DEFAULT_R2_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3100",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
  "http://127.0.0.1:3100",
] as const;

function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

function splitOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[\n,]/g)
    .map((item) => normalizeOrigin(item))
    .filter((item): item is string => Boolean(item));
}

function dedupeOrigins(origins: string[]): string[] {
  return Array.from(new Set(origins));
}

export function resolveR2AllowedOrigins(): string[] {
  const configuredOrigins = splitOrigins(process.env.R2_ALLOWED_ORIGINS);
  if (configuredOrigins.length > 0) {
    return dedupeOrigins(configuredOrigins);
  }

  const appOrigins = dedupeOrigins([
    ...splitOrigins(process.env.NEXT_PUBLIC_SITE_URL),
    ...splitOrigins(process.env.SITE_URL),
    ...splitOrigins(process.env.NEXT_PUBLIC_APP_URL),
  ]);

  return dedupeOrigins([
    ...appOrigins,
    getSiteOrigin(),
    ...DEFAULT_R2_DEV_ORIGINS,
  ]);
}

// ─── Client ─────────────────────────────────────────────────────────

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      // Disable SDK auto-checksum — R2 presigned URLs don't need it and
      // the empty-body CRC32 baked into the signed URL would mismatch
      // the actual upload body.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return _client;
}

// ─── Public URL ─────────────────────────────────────────────────────

export function getR2PublicUrl(storagePath: string): string {
  const base = R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${storagePath}`;
}

export function buildR2UploadHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Cache-Control": R2_CACHE_CONTROL,
  };
}

// ─── Upload ─────────────────────────────────────────────────────────

export async function uploadToR2(
  storagePath: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      Body: body,
      ContentType: contentType,
      CacheControl: R2_CACHE_CONTROL,
    })
  );
}

// ─── Download ───────────────────────────────────────────────────────

export async function downloadFromR2(
  storagePath: string
): Promise<{ bytes: Buffer; contentType: string } | null> {
  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
      })
    );
    if (!response.Body) return null;
    const bytes = Buffer.from(await response.Body.transformToByteArray());
    return {
      bytes,
      contentType: response.ContentType || "image/jpeg",
    };
  } catch {
    return null;
  }
}

export async function headR2Object(storagePath: string): Promise<{
  contentType: string | null;
  cacheControl: string | null;
  contentLength: number | null;
} | null> {
  try {
    const response = await getClient().send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
      })
    );

    return {
      contentType: response.ContentType ?? null,
      cacheControl: response.CacheControl ?? null,
      contentLength:
        typeof response.ContentLength === "number"
          ? response.ContentLength
          : null,
    };
  } catch {
    return null;
  }
}

// ─── Delete ─────────────────────────────────────────────────────────

export async function deleteFromR2(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  await getClient().send(
    new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: storagePaths.map((key) => ({ Key: key })),
        Quiet: true,
      },
    })
  );
}

// ─── Presigned URL (for browser-direct uploads) ─────────────────────

export async function createPresignedUploadUrl(
  storagePath: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storagePath,
    ContentType: contentType,
    CacheControl: R2_CACHE_CONTROL,
  });
  return getSignedUrl(getClient(), command, { expiresIn: 3600 });
}

// ─── CORS setup (run once during migration) ─────────────────────────

export async function configureR2Cors(
  allowedOrigins: string[] = resolveR2AllowedOrigins()
): Promise<void> {
  await getClient().send(
    new PutBucketCorsCommand({
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedOrigins: dedupeOrigins(allowedOrigins),
            MaxAgeSeconds: R2_CORS_MAX_AGE_SECONDS,
          },
        ],
      },
    })
  );
}
