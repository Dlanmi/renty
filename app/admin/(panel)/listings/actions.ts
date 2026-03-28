"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ListingKind } from "@/lib/domain/types";
import { createSupabaseServerClient, requireAdminContext } from "@/lib/admin/auth";
import {
  parseListingInput,
  type ParsedListingInput,
  type DuplicateableListing,
  validateRequiredFields,
  validateCreateListingMedia,
  ALLOWED_STATUS,
  preparePhotoUploads,
  uploadPhotos,
  insertExternalPhotoUrls,
  deletePhotos,
  reorderExistingPhotos,
  applyCover,
  getListingPhotos,
  filterExclusiveStoragePaths,
  replacePois,
  buildQuickStatusUpdatePayload,
  buildDuplicatedListingRecord,
  duplicateListingPhotoRows,
  selectDuplicatedCoverUrl,
} from "@/lib/admin/listings";
import type { ListingStatus } from "@/lib/domain/types";

const FALLBACK_COVER_PHOTO =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80";

// ─── Helpers ─────────────────────────────────────────────────────────

function toError(message: string): never {
  throw new Error(message);
}

function isRedirectLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeDigest = (error as { digest?: unknown }).digest;
  return typeof maybeDigest === "string" && maybeDigest.startsWith("NEXT_REDIRECT");
}

function queryString(params: Record<string, string>): string {
  const qs = new URLSearchParams(params);
  return qs.toString();
}

function redirectCreateError(errorMessage: string): never {
  redirect(`/admin/listings/new?${queryString({ error: errorMessage })}`);
}

function redirectUpdateError(listingId: string, errorMessage: string): never {
  redirect(
    `/admin/listings/${listingId}?${queryString({
      error: errorMessage,
    })}`
  );
}

function listingPayload(input: ParsedListingInput) {
  return {
    status: input.status,
    listing_kind: input.listingKind,
    residential_context: input.residentialContext,
    city: input.city,
    zone: input.zone,
    neighborhood: input.neighborhood,
    approx_location: input.approxLocation,
    residential_name: input.residentialName,
    price_cop: input.priceCop,
    billing_period: input.billingPeriod,
    admin_fee_cop: input.adminFeeCop,
    utilities_cop_min: input.utilitiesCopMin,
    utilities_cop_max: input.utilitiesCopMax,
    property_type: input.propertyType,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area_m2: input.areaM2,
    independent: input.independent,
    furnished: input.furnished,
    parking_car_count: input.parkingCarCount,
    parking_motorcycle_count: input.parkingMotorcycleCount,
    pets_allowed: input.petsAllowed,
    floor_number: input.floorNumber,
    has_elevator: input.hasElevator,
    room_bathroom_private: input.roomBathroomPrivate,
    kitchen_access: input.kitchenAccess,
    cohabitants_count: input.cohabitantsCount,
    includes: input.includes,
    utilities_notes: input.utilitiesNotes,
    requirements: input.requirements,
    requirements_notes: input.requirementsNotes,
    available_from: input.availableFrom,
    min_stay_months: input.minStayMonths,
    whatsapp_e164: input.whatsappE164,
    title: input.title,
    description: input.description,
  };
}

function revalidatePublicPaths() {
  revalidatePath("/");
  revalidatePath("/arriendos/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/sitemap.xml");
}

// ─── Photo orchestration helper ──────────────────────────────────────

async function orchestratePhotos(
  accessToken: string,
  listingId: string,
  input: ParsedListingInput,
  preparedNewPhotos: Awaited<ReturnType<typeof preparePhotoUploads>>,
  opts: { deleteFirst?: boolean } = {}
) {
  if (opts.deleteFirst) {
    await deletePhotos(accessToken, listingId, input.deletePhotoIds);
  }
  await reorderExistingPhotos(accessToken, listingId, input.photoOrderIds);

  const photosAfterOps = await getListingPhotos(accessToken, listingId);
  const maxSortOrder = photosAfterOps.reduce(
    (max, photo) => Math.max(max, photo.sort_order),
    -1
  );

  await uploadPhotos(accessToken, listingId, preparedNewPhotos, maxSortOrder);
  await insertExternalPhotoUrls(
    accessToken,
    listingId,
    input.manualGalleryUrls,
    maxSortOrder + preparedNewPhotos.length
  );
  await applyCover(accessToken, listingId, input.coverPhotoId, input.coverPhotoUrl);
}

// ─── Create ──────────────────────────────────────────────────────────

export async function createListingAction(formData: FormData) {
  let listingId = "";

  try {
    const admin = await requireAdminContext();
    const input = parseListingInput(formData);
    const preparedNewPhotos = await preparePhotoUploads(input.newPhotos);
    validateRequiredFields(input, { mode: "create" });
    validateCreateListingMedia(
      input.coverPhotoUrl,
      input.manualGalleryUrls,
      preparedNewPhotos.length
    );

    listingId = crypto.randomUUID();
    const client = createSupabaseServerClient(admin.accessToken);
    const payload = listingPayload(input);

    const { error: createError } = await client.from("listings").insert({
      id: listingId,
      ...payload,
      cover_photo_url: input.coverPhotoUrl ?? FALLBACK_COVER_PHOTO,
    });
    if (createError) toError(createError.message);

    await replacePois(admin.accessToken, listingId, input.pois);
    await orchestratePhotos(admin.accessToken, listingId, input, preparedNewPhotos);

    await client.from("listing_audit_logs").insert({
      listing_id: listingId,
      actor_user_id: admin.userId,
      action: "create",
      payload: {
        status: input.status,
        listing_kind: input.listingKind,
      },
    });

    revalidatePublicPaths();
    redirect(
      `/admin/listings/${listingId}?${queryString({
        saved: "1",
        savedAt: String(Date.now()),
      })}`
    );
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "No se pudo crear el inmueble.";
    if (listingId) {
      redirectUpdateError(listingId, message);
    }
    redirectCreateError(message);
  }
}

// ─── Update ──────────────────────────────────────────────────────────

export async function updateListingAction(formData: FormData) {
  const input = parseListingInput(formData);
  const listingId = input.listingId;
  if (!listingId) {
    redirectCreateError("No se recibió el ID del inmueble.");
  }

  try {
    const admin = await requireAdminContext();
    const preparedNewPhotos = await preparePhotoUploads(input.newPhotos);
    const client = createSupabaseServerClient(admin.accessToken);
    const { data: existingListing, error: existingError } = await client
      .from("listings")
      .select("listing_kind")
      .eq("id", listingId)
      .maybeSingle();

    if (existingError || !existingListing) {
      toError("No encontramos el inmueble para actualizar.");
    }

    validateRequiredFields(input, {
      mode: "update",
      previousListingKind: existingListing.listing_kind as ListingKind,
    });

    const payload = listingPayload(input);

    if (input.coverPhotoUrl) {
      Object.assign(payload, {
        cover_photo_url: input.coverPhotoUrl,
      });
    }

    const { error: updateError } = await client
      .from("listings")
      .update(payload)
      .eq("id", listingId);
    if (updateError) toError(updateError.message);

    await replacePois(admin.accessToken, listingId, input.pois);
    await orchestratePhotos(admin.accessToken, listingId, input, preparedNewPhotos, {
      deleteFirst: true,
    });

    await client.from("listing_audit_logs").insert({
      listing_id: listingId,
      actor_user_id: admin.userId,
      action: "update",
      payload: {
        status: input.status,
      },
    });

    revalidatePublicPaths();
    revalidatePath(`/admin/listings/${listingId}`);
    redirect(
      `/admin/listings/${listingId}?${queryString({
        saved: "1",
        savedAt: String(Date.now()),
      })}`
    );
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el inmueble.";
    redirectUpdateError(listingId, message);
  }
}

// ─── Delete ──────────────────────────────────────────────────────────

export async function deleteListingAction(
  listingId: string
): Promise<{ success: true; title: string } | { success: false; error: string }> {
  try {
    if (!listingId || !listingId.trim()) {
      return { success: false, error: "No se recibió el ID del inmueble." };
    }

    const admin = await requireAdminContext();
    const client = createSupabaseServerClient(admin.accessToken);

    const { data: listing, error: fetchError } = await client
      .from("listings")
      .select("id, title")
      .eq("id", listingId)
      .maybeSingle();

    if (fetchError || !listing) {
      return {
        success: false,
        error: "No se encontró el inmueble para eliminar.",
      };
    }

    const deletedTitle = listing.title;

    const { data: photos } = await client
      .from("listing_photos")
      .select("storage_path")
      .eq("listing_id", listingId);

    const allStoragePaths = (photos ?? [])
      .map((p) => p.storage_path)
      .filter((path): path is string => Boolean(path));

    const exclusivePaths = await filterExclusiveStoragePaths(
      client,
      allStoragePaths,
      listingId
    );

    if (exclusivePaths.length > 0) {
      await client.storage.from("listing-images").remove(exclusivePaths);
    }

    const { error: deleteError } = await client
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message || "No se pudo eliminar el inmueble.",
      };
    }

    revalidatePublicPaths();

    return { success: true, title: deletedTitle };
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al eliminar el inmueble.";
    return { success: false, error: message };
  }
}

// ─── Quick Status Change ─────────────────────────────────────────────

export async function quickStatusChangeAction(
  listingId: string,
  newStatus: string
): Promise<
  { success: true; title: string; status: string } | { success: false; error: string }
> {
  try {
    if (!listingId?.trim()) {
      return { success: false, error: "No se recibió el ID del inmueble." };
    }

    if (!ALLOWED_STATUS.has(newStatus as ListingStatus)) {
      return { success: false, error: "Estado no válido." };
    }

    const admin = await requireAdminContext();
    const client = createSupabaseServerClient(admin.accessToken);

    const { data: listing, error: fetchError } = await client
      .from("listings")
      .select("id, title, status")
      .eq("id", listingId)
      .maybeSingle();

    if (fetchError || !listing) {
      return { success: false, error: "No se encontró el inmueble." };
    }

    const previousStatus = listing.status;
    if (previousStatus === newStatus) {
      return { success: true, title: listing.title, status: newStatus };
    }

    const updatePayload = buildQuickStatusUpdatePayload(
      previousStatus,
      newStatus as ListingStatus
    );

    const { error: updateError } = await client
      .from("listings")
      .update(updatePayload)
      .eq("id", listingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await client.from("listing_audit_logs").insert({
      listing_id: listingId,
      actor_user_id: admin.userId,
      action: "status_change",
      payload: { from: previousStatus, to: newStatus },
    });

    revalidatePublicPaths();
    revalidatePath(`/admin/listings/${listingId}`);

    return { success: true, title: listing.title, status: newStatus };
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Error al cambiar el estado.";
    return { success: false, error: message };
  }
}

// ─── Duplicate ───────────────────────────────────────────────────────

export async function duplicateListingAction(
  listingId: string
): Promise<
  { success: true; newId: string; title: string } | { success: false; error: string }
> {
  try {
    if (!listingId?.trim()) {
      return { success: false, error: "No se recibió el ID del inmueble." };
    }

    const admin = await requireAdminContext();
    const client = createSupabaseServerClient(admin.accessToken);

    const { data: original, error: fetchError } = await client
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .maybeSingle();

    if (fetchError || !original) {
      return { success: false, error: "No se encontró el inmueble a duplicar." };
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const duplicatedListing = buildDuplicatedListingRecord(
      original as DuplicateableListing,
      newId,
      now
    );

    const { error: insertError } = await client
      .from("listings")
      .insert(duplicatedListing);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Duplicate photos — physically copy Storage files so each listing
    // owns its own assets and deleting one won't break the other.
    const { data: photos } = await client
      .from("listing_photos")
      .select("*")
      .eq("listing_id", listingId)
      .order("sort_order", { ascending: true });

    if (photos && photos.length > 0) {
      const photoRows = await duplicateListingPhotoRows(photos, newId, {
        now: () => Date.now(),
        download: async (storagePath) => {
          const { data: downloadData, error: downloadError } = await client.storage
            .from("listing-images")
            .download(storagePath);

          if (downloadError || !downloadData) {
            return null;
          }

          return {
            bytes: Buffer.from(await downloadData.arrayBuffer()),
            contentType: downloadData.type || "image/jpeg",
          };
        },
        upload: async (storagePath, bytes, contentType) => {
          const { error: uploadError } = await client.storage
            .from("listing-images")
            .upload(storagePath, bytes, {
              contentType,
              upsert: false,
            });

          return !uploadError;
        },
        getPublicUrl: (storagePath) =>
          client.storage.from("listing-images").getPublicUrl(storagePath).data
            .publicUrl,
      });

      if (photoRows.length > 0) {
        await client.from("listing_photos").insert(photoRows);
      }

      const coverUrl = selectDuplicatedCoverUrl(photoRows);
      if (coverUrl) {
        await client
          .from("listings")
          .update({ cover_photo_url: coverUrl })
          .eq("id", newId);
      }
    }

    // Duplicate POIs
    const { data: pois } = await client
      .from("listing_pois")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true });

    if (pois && pois.length > 0) {
      const poiRows = pois.map((poi) => ({
        listing_id: newId,
        kind: poi.kind,
        name: poi.name,
        distance_m: poi.distance_m,
        walk_minutes: poi.walk_minutes,
      }));

      await client.from("listing_pois").insert(poiRows);
    }

    // Audit log
    await client.from("listing_audit_logs").insert({
      listing_id: newId,
      actor_user_id: admin.userId,
      action: "create",
      payload: { duplicated_from: listingId },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/listings");

    return { success: true, newId, title: original.title };
  } catch (error) {
    if (isRedirectLikeError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Error al duplicar el inmueble.";
    return { success: false, error: message };
  }
}
