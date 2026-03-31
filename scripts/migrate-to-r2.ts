/**
 * Migration script: Supabase Storage → Cloudflare R2
 *
 * Downloads all listing photos from Supabase Storage and re-uploads them
 * to R2, then updates public_url in listing_photos and cover_photo_url
 * in listings.
 *
 * Usage:
 *   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
 *   R2_BUCKET_NAME=renty-listing-images R2_PUBLIC_URL=https://pub-xxx.r2.dev \
 *   npx tsx scripts/migrate-to-r2.ts
 *
 * The script also configures CORS on the R2 bucket for browser-direct uploads.
 */

import {
  S3Client,
  PutObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { resolveR2AllowedOrigins } from "../lib/storage/r2";

// ─── Config ─────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "renty-listing-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY ||
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_PUBLIC_URL
) {
  console.error("Missing required environment variables.");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,",
    "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL"
  );
  process.exit(1);
}

// ─── Clients ────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function r2PublicUrl(storagePath: string): string {
  return `${R2_PUBLIC_URL!.replace(/\/+$/, "")}/${storagePath}`;
}

// ─── CORS Setup ─────────────────────────────────────────────────────

async function setupCors() {
  console.log("\n[1/3] Configuring CORS on R2 bucket...");
  await r2.send(
    new PutBucketCorsCommand({
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedOrigins: resolveR2AllowedOrigins(),
            MaxAgeSeconds: 86400,
          },
        ],
      },
    })
  );
  console.log("  CORS configured.");
}

// ─── Migration ──────────────────────────────────────────────────────

interface PhotoRow {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url: string;
  is_cover: boolean;
}

async function migratePhotos() {
  console.log("\n[2/3] Migrating photos from Supabase Storage to R2...");

  // Fetch all photos that have a storage_path (i.e., stored in Supabase)
  const { data: photos, error } = await supabase
    .from("listing_photos")
    .select("id, listing_id, storage_path, public_url, is_cover")
    .neq("storage_path", "")
    .order("listing_id")
    .order("sort_order");

  if (error) {
    console.error("  Failed to fetch photos:", error.message);
    process.exit(1);
  }

  if (!photos || photos.length === 0) {
    console.log("  No photos to migrate.");
    return;
  }

  console.log(`  Found ${photos.length} photos to migrate.`);

  let migrated = 0;
  let failed = 0;

  for (const photo of photos as PhotoRow[]) {
    const { storage_path, public_url } = photo;

    try {
      // Download from Supabase public URL
      const response = await fetch(public_url);
      if (!response.ok) {
        console.error(`  FAIL [${storage_path}]: HTTP ${response.status}`);
        failed++;
        continue;
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "image/jpeg";

      // Upload to R2
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: storage_path,
          Body: bytes,
          ContentType: contentType,
        })
      );

      // Update DB row with new public URL
      const newPublicUrl = r2PublicUrl(storage_path);
      const { error: updateError } = await supabase
        .from("listing_photos")
        .update({ public_url: newPublicUrl })
        .eq("id", photo.id);

      if (updateError) {
        console.error(`  FAIL [${storage_path}]: DB update failed - ${updateError.message}`);
        failed++;
        continue;
      }

      // If this is a cover photo, also update listings.cover_photo_url
      if (photo.is_cover) {
        await supabase
          .from("listings")
          .update({ cover_photo_url: newPublicUrl })
          .eq("id", photo.listing_id);
      }

      migrated++;
      console.log(`  OK   [${migrated}/${photos.length}] ${storage_path}`);
    } catch (err) {
      console.error(
        `  FAIL [${storage_path}]:`,
        err instanceof Error ? err.message : err
      );
      failed++;
    }
  }

  console.log(`\n  Migration complete: ${migrated} OK, ${failed} failed.`);
}

// ─── Update cover URLs that reference Supabase ──────────────────────

async function updateRemainingCoverUrls() {
  console.log("\n[3/3] Updating any remaining cover_photo_url referencing Supabase Storage...");

  const supabaseStoragePrefix = `${SUPABASE_URL}/storage/v1/object/public/listing-images/`;

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, cover_photo_url")
    .like("cover_photo_url", `${supabaseStoragePrefix}%`);

  if (error) {
    console.error("  Failed to query listings:", error.message);
    return;
  }

  if (!listings || listings.length === 0) {
    console.log("  No remaining cover URLs to update.");
    return;
  }

  for (const listing of listings) {
    const storagePath = listing.cover_photo_url.replace(supabaseStoragePrefix, "");
    const newUrl = r2PublicUrl(storagePath);

    const { error: updateError } = await supabase
      .from("listings")
      .update({ cover_photo_url: newUrl })
      .eq("id", listing.id);

    if (updateError) {
      console.error(`  FAIL listing ${listing.id}: ${updateError.message}`);
    } else {
      console.log(`  OK   listing ${listing.id}: cover updated`);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("=== Supabase Storage → Cloudflare R2 Migration ===");
  console.log(`Bucket: ${R2_BUCKET_NAME}`);
  console.log(`R2 Public URL: ${R2_PUBLIC_URL}`);

  await setupCors();
  await migratePhotos();
  await updateRemainingCoverUrls();

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
