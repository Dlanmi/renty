"use server";

import {
  buildPhotoStoragePath,
  buildVariantBasePath,
  fileExtension,
  isAllowedImageMime,
  MAX_NEW_PHOTOS_PER_REQUEST,
  MAX_PHOTO_SIZE_BYTES,
  MIME_BY_EXTENSION,
  normalizeImageMimeType,
} from "@/lib/admin/listings/photo-rules";
import { buildVariantPath } from "@/lib/client/image-variants";
import { requireAdminContext } from "@/lib/admin/auth";
import { isValidListingId } from "@/lib/domain/listing-paths";
import {
  buildR2UploadHeaders,
  createPresignedUploadUrl,
  deleteFromR2,
  getR2PublicUrl,
} from "@/lib/storage/r2";

// ─── Interfaces ─────────────────────────────────────────────────────

interface RequestedVariant {
  name: "lg" | "th";
  size: number;
  type: string; // e.g. "image/webp"
}

interface RequestedPhotoUpload {
  name: string;
  size: number;
  type: string;
  /** Present when images were processed client-side. */
  variants?: RequestedVariant[];
}

interface CreatePhotoUploadPlanInput {
  listingId: string;
  files: RequestedPhotoUpload[];
}

export interface PhotoUploadThumbTarget {
  storagePath: string;
  publicUrl: string;
  uploadUrl: string;
  contentType: string;
  headers: Record<string, string>;
}

export interface PhotoUploadTarget {
  storagePath: string;
  publicUrl: string;
  uploadUrl: string;
  contentType: string;
  headers: Record<string, string>;
  /** Present when client sent processed variants. */
  thumb?: PhotoUploadThumbTarget;
}

// ─── Helpers ────────────────────────────────────────────────────────

function toError(message: string): never {
  throw new Error(message);
}

function validateRequestedPhoto(file: RequestedPhotoUpload) {
  if (!file.name.trim()) {
    toError("No pudimos identificar el nombre de una de las fotos.");
  }

  // Variant mode — validate each variant independently
  if (file.variants && file.variants.length > 0) {
    for (const variant of file.variants) {
      if (!Number.isFinite(variant.size) || variant.size <= 0) {
        toError(
          `La variante "${variant.name}" de "${file.name}" no tiene un tamaño válido.`
        );
      }
      if (variant.size > MAX_PHOTO_SIZE_BYTES) {
        toError(
          `La variante "${variant.name}" de "${file.name}" supera el máximo por archivo.`
        );
      }
      const normalizedMime = normalizeImageMimeType(variant.type);
      if (!isAllowedImageMime(normalizedMime)) {
        toError(
          `La variante "${variant.name}" de "${file.name}" tiene un formato no permitido.`
        );
      }
    }
    return;
  }

  // Original mode — existing validation
  if (!Number.isFinite(file.size) || file.size <= 0) {
    toError(`La foto "${file.name}" no tiene un tamaño válido.`);
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    toError(`"${file.name}" supera el máximo de 8 MB por foto.`);
  }

  const extension = fileExtension(file.name);
  const expectedMime = MIME_BY_EXTENSION[extension];
  if (!expectedMime) {
    toError(`"${file.name}" tiene un formato no permitido.`);
  }

  const normalizedMime = normalizeImageMimeType(file.type);
  if (!isAllowedImageMime(normalizedMime) || normalizedMime !== expectedMime) {
    toError(`"${file.name}" no coincide con un formato permitido.`);
  }
}

// ─── Presigned URL generation helpers ───────────────────────────────

function mimeToExtension(mime: string): string {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/avif") return "avif";
  return "jpg";
}

async function buildVariantTarget(
  basePath: string,
  variant: RequestedVariant
): Promise<{
  storagePath: string;
  publicUrl: string;
  uploadUrl: string;
  contentType: string;
  headers: Record<string, string>;
}> {
  const ext = mimeToExtension(variant.type);
  const storagePath = buildVariantPath(basePath, variant.name, ext);
  const uploadUrl = await createPresignedUploadUrl(storagePath, variant.type);
  const publicUrl = getR2PublicUrl(storagePath);
  return {
    storagePath,
    publicUrl,
    uploadUrl,
    contentType: variant.type,
    headers: buildR2UploadHeaders(variant.type),
  };
}

// ─── Main action ────────────────────────────────────────────────────

export async function createPhotoUploadPlanAction(
  input: CreatePhotoUploadPlanInput
): Promise<{ uploads: PhotoUploadTarget[] }> {
  const listingId = input.listingId.trim();
  const files = input.files ?? [];

  if (!isValidListingId(listingId)) {
    toError("No recibimos un ID de inmueble válido para preparar las fotos.");
  }

  if (files.length === 0) {
    return { uploads: [] };
  }

  if (files.length > MAX_NEW_PHOTOS_PER_REQUEST) {
    toError(
      `Cada inmueble admite máximo ${MAX_NEW_PHOTOS_PER_REQUEST} fotos en total.`
    );
  }

  files.forEach(validateRequestedPhoto);

  await requireAdminContext();
  const batchId = Date.now();
  const uploads: PhotoUploadTarget[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];

    if (file.variants && file.variants.length > 0) {
      // ─── Variant mode ─────────────────────────────────────────
      const basePath = buildVariantBasePath(listingId, index, batchId);

      const lgVariant = file.variants.find((v) => v.name === "lg");
      const thVariant = file.variants.find((v) => v.name === "th");

      if (!lgVariant) {
        toError(`Falta la variante "lg" para "${file.name}".`);
      }

      const lgTarget = await buildVariantTarget(basePath, lgVariant);

      const target: PhotoUploadTarget = {
        storagePath: lgTarget.storagePath,
        publicUrl: lgTarget.publicUrl,
        uploadUrl: lgTarget.uploadUrl,
        contentType: lgTarget.contentType,
        headers: lgTarget.headers,
      };

      if (thVariant) {
        target.thumb = await buildVariantTarget(basePath, thVariant);
      }

      uploads.push(target);
    } else {
      // ─── Original mode (backward compat) ──────────────────────
      const extension = fileExtension(file.name);
      const contentType = MIME_BY_EXTENSION[extension];
      if (!contentType) {
        toError(`"${file.name}" tiene un formato no permitido.`);
      }

      const storagePath = buildPhotoStoragePath(
        listingId,
        file.name,
        index,
        batchId
      );
      const uploadUrl = await createPresignedUploadUrl(storagePath, contentType);
      const publicUrl = getR2PublicUrl(storagePath);
      const headers = buildR2UploadHeaders(contentType);

      uploads.push({ storagePath, publicUrl, uploadUrl, contentType, headers });
    }
  }

  return { uploads };
}

export async function cleanupUploadedPhotosAction(storagePaths: string[]) {
  const uniquePaths = Array.from(
    new Set(storagePaths.map((path) => path.trim()).filter(Boolean))
  );

  if (uniquePaths.length === 0) return;

  await requireAdminContext();
  await deleteFromR2(uniquePaths);
}
