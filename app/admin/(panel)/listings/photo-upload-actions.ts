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
import { createSupabaseServerClient, requireAdminContext } from "@/lib/admin/auth";
import { isValidListingId } from "@/lib/domain/listing-paths";

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
  token: string;
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

  const admin = await requireAdminContext();
  const client = createSupabaseServerClient(admin.accessToken);
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
    const { data, error } = await client.storage
      .from("listing-images")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      toError(
        `No pudimos preparar la subida de "${file.name}". Intenta de nuevo.`
      );
    }

    const publicUrl = client.storage
      .from("listing-images")
      .getPublicUrl(storagePath).data.publicUrl;

    uploads.push({
      storagePath,
      publicUrl,
      token: data.token,
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

  const admin = await requireAdminContext();
  const client = createSupabaseServerClient(admin.accessToken);
  const { error } = await client.storage.from("listing-images").remove(uniquePaths);

  if (error) {
    throw new Error("No pudimos limpiar las fotos temporales del borrador.");
  }
}
