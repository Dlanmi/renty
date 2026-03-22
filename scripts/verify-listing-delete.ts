import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { deleteListingAndCleanup } from "@/lib/admin/listing-delete";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
] as const;

function readEnv(name: (typeof requiredEnv)[number]): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const email = readEnv("ADMIN_EMAIL");
  const password = readEnv("ADMIN_PASSWORD");

  const publicClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: signInData, error: signInError } =
    await publicClient.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.session || !signInData.user) {
    throw new Error(signInError?.message ?? "Could not sign in as admin user.");
  }

  const authedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${signInData.session.access_token}`,
      },
    },
  });

  const { data: profile, error: profileError } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", signInData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not load admin profile: ${profileError.message}`);
  }

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    throw new Error("Configured user is not an admin/editor.");
  }

  const listingId = randomUUID();
  const listingTitle = `Codex delete verification ${new Date().toISOString()}`;

  const { error: createListingError } = await authedClient.from("listings").insert({
    id: listingId,
    status: "draft",
    city: "Bogotá",
    neighborhood: "Verbenal",
    approx_location: "Prueba automatizada",
    price_cop: 1234567,
    billing_period: "month",
    property_type: "Apartamento",
    bedrooms: 1,
    bathrooms: 1,
    independent: true,
    furnished: false,
    includes: ["wifi"],
    requirements: ["documentos"],
    whatsapp_e164: "+573001112233",
    title: listingTitle,
    description: "Inmueble temporal para verificar borrado.",
    cover_photo_url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80",
    listing_kind: "apartment",
    residential_context: "barrio",
    area_m2: 45,
    admin_fee_cop: 0,
    parking_car_count: 0,
    parking_motorcycle_count: 0,
  });

  if (createListingError) {
    throw new Error(`Could not create test listing: ${createListingError.message}`);
  }

  const { error: createPhotoError } = await authedClient.from("listing_photos").insert({
    listing_id: listingId,
    storage_path: "",
    public_url:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80",
    sort_order: 0,
    is_cover: true,
  });

  if (createPhotoError) {
    throw new Error(`Could not create test photo row: ${createPhotoError.message}`);
  }

  console.log(`Created test listing: ${listingId}`);

  const deleteResult = await deleteListingAndCleanup(
    signInData.session.access_token,
    listingId
  );

  const { data: deletedListing, error: deletedListingError } = await authedClient
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .maybeSingle();

  if (deletedListingError) {
    throw new Error(
      `Could not verify listing deletion: ${deletedListingError.message}`
    );
  }

  if (deletedListing) {
    throw new Error("Delete verification failed: listing still exists.");
  }

  const { data: leftoverPhotos, error: leftoverPhotosError } = await authedClient
    .from("listing_photos")
    .select("id")
    .eq("listing_id", listingId);

  if (leftoverPhotosError) {
    throw new Error(
      `Could not verify photo cascade deletion: ${leftoverPhotosError.message}`
    );
  }

  if ((leftoverPhotos ?? []).length > 0) {
    throw new Error("Delete verification failed: child photos still exist.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        listingId,
        storageCleanupError: deleteResult.storageCleanupError,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
