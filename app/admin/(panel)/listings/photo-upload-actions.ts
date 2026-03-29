"use server";

import {
  buildPhotoStoragePath,
  fileExtension,
  isAllowedImageMime,
  MAX_NEW_PHOTOS_PER_REQUEST,
  MAX_PHOTO_SIZE_BYTES,
  MIME_BY_EXTENSION,
  normalizeImageMimeType,
} from "@/lib/admin/listings/photo-rules";
import { requireAdminContext } from "@/lib/admin/auth";
import { isValidListingId } from "@/lib/domain/listing-paths";
import {
  createPresignedUploadUrl,
  deleteFromR2,
  getR2PublicUrl,
} from "@/lib/storage/r2";

interface RequestedPhotoUpload {
  name: string;
  size: number;
  type: string;
}

interface CreatePhotoUploadPlanInput {
  listingId: string;
  files: RequestedPhotoUpload[];
}

export interface PhotoUploadTarget {
  storagePath: string;
  publicUrl: string;
  uploadUrl: string;
  contentType: string;
}

function toError(message: string): never {
  throw new Error(message);
}

function validateRequestedPhoto(file: RequestedPhotoUpload) {
  if (!file.name.trim()) {
    toError("No pudimos identificar el nombre de una de las fotos.");
  }

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
    const extension = fileExtension(file.name);
    const contentType = MIME_BY_EXTENSION[extension];

    if (!contentType) {
      toError(`"${file.name}" tiene un formato no permitido.`);
    }

    const storagePath = buildPhotoStoragePath(listingId, file.name, index, batchId);
    const uploadUrl = await createPresignedUploadUrl(storagePath, contentType);
    const publicUrl = getR2PublicUrl(storagePath);

    uploads.push({
      storagePath,
      publicUrl,
      uploadUrl,
      contentType,
    });
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
