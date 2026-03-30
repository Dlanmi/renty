import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─── Configuration ──────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "renty-listing-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";
const R2_CACHE_CONTROL =
  process.env.R2_CACHE_CONTROL || "public, max-age=31536000, immutable";

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
    });
  }
  return _client;
}

// ─── Public URL ─────────────────────────────────────────────────────

export function getR2PublicUrl(storagePath: string): string {
  const base = R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${storagePath}`;
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
  allowedOrigins: string[]
): Promise<void> {
  await getClient().send(
    new PutBucketCorsCommand({
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "GET"],
            AllowedOrigins: allowedOrigins,
            MaxAgeSeconds: 86400,
          },
        ],
      },
    })
  );
}
