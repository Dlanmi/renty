"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
  Listing,
  ListingKind,
  ListingPhoto,
  ListingPoi,
  ListingStatus,
  ResidentialContext,
} from "@/lib/domain/types";
import {
  INCLUDES_SUGGESTIONS,
  REQUIREMENTS_SUGGESTIONS,
} from "@/lib/domain/admin-suggestions";
import {
  cleanupUploadedPhotosAction,
  createPhotoUploadPlanAction,
} from "@/app/admin/(panel)/listings/photo-upload-actions";
import FormSubmitButton from "@/components/admin/FormSubmitButton";
import PhotoManager from "@/components/admin/PhotoManager";
import PhotoUploadPreview from "@/components/admin/PhotoUploadPreview";
import TagInput from "@/components/admin/TagInput";
import PoiEditor from "@/components/admin/PoiEditor";
import {
  detectImageMimeType,
  fileExtension,
  formatBytes,
  isAllowedImageMime,
  LARGE_UPLOAD_WARNING_BYTES,
  MAX_NEW_PHOTOS_PER_REQUEST,
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTOS_PER_LISTING,
  MIME_BY_EXTENSION,
  normalizeImageMimeType,
  type UploadedPhotoReference,
} from "@/lib/admin/listings/photo-rules";
import { createBrowserClient } from "@/lib/supabase/browser";

type FormAction = (formData: FormData) => void | Promise<void>;

interface ListingFormProps {
  mode: "create" | "edit";
  action: FormAction;
  listing?: Listing | null;
  photos?: ListingPhoto[];
  pois?: ListingPoi[];
  draftListingId?: string;
  submitLabel: string;
}

interface UploadDialogState {
  title: string;
  message: string;
}

const UPLOAD_DRAFT_STORAGE_PREFIX = "renty:uploaded-photos:";

const STATUS_OPTIONS: Array<{ value: ListingStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "pending_review", label: "Pendiente de revision" },
  { value: "active", label: "Activo" },
  { value: "rented", label: "Arrendado" },
  { value: "inactive", label: "Inactivo" },
  { value: "rejected", label: "Rechazado" },
];

const LISTING_KIND_OPTIONS: Array<{ value: ListingKind; label: string }> = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "studio", label: "Apartaestudio" },
  { value: "room_private", label: "Habitacion privada" },
  { value: "room_shared", label: "Habitacion compartida" },
];

const CONTEXT_OPTIONS: Array<{ value: ResidentialContext; label: string }> = [
  { value: "barrio", label: "Barrio" },
  { value: "conjunto", label: "Conjunto" },
  { value: "edificio", label: "Edificio" },
  { value: "casa_familiar", label: "Casa familiar" },
];

function optionalBooleanToValue(value: boolean | null | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function isRoomKind(kind: ListingKind): boolean {
  return kind === "room_private" || kind === "room_shared";
}

function isAreaRequiredKind(kind: ListingKind): boolean {
  return kind === "apartment" || kind === "house" || kind === "studio";
}

function statusHint(status: ListingStatus): {
  tone: "neutral" | "success" | "warning";
  text: string;
} {
  if (status === "active") {
    return {
      tone: "success",
      text: "Activo: se mostrara en home, detalle y sitemap publico.",
    };
  }

  if (status === "rented") {
    return {
      tone: "warning",
      text: "Arrendado: no se mostrara en el sitio publico.",
    };
  }

  if (status === "inactive" || status === "rejected") {
    return {
      tone: "warning",
      text: "No visible al publico. Puedes activarlo cuando este listo.",
    };
  }

  return {
    tone: "neutral",
    text: "Borrador/Pendiente: util para editar sin publicar.",
  };
}

function statusHintClasses(tone: "neutral" | "success" | "warning"): string {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-stone-200 bg-stone-50 text-stone-700";
}

/* Style constants to reduce duplication */
const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none";
const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none";
const TEXTAREA_CLASS =
  "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-accent focus:outline-none";
const LABEL_CLASS = "text-sm font-medium text-stone-700";
const SECTION_CLASS =
  "rounded-card border border-stone-200 bg-white p-4 shadow-card";

function uploadedPhotoDraftKey(listingId: string): string {
  return `${UPLOAD_DRAFT_STORAGE_PREFIX}${listingId}`;
}

function dedupeUploadedPhotos(
  photos: UploadedPhotoReference[]
): UploadedPhotoReference[] {
  const seen = new Set<string>();

  return photos.filter((photo) => {
    const storagePath = photo.storagePath.trim();
    const publicUrl = photo.publicUrl.trim();

    if (!storagePath || !publicUrl || seen.has(storagePath)) {
      return false;
    }

    seen.add(storagePath);
    return true;
  });
}

function parseManualGalleryUrlsClient(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/g)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

async function validateSelectedFiles(files: File[]): Promise<UploadDialogState | null> {
  if (files.length > MAX_NEW_PHOTOS_PER_REQUEST) {
    const overflow = files.length - MAX_NEW_PHOTOS_PER_REQUEST;
    return {
      title: "Demasiadas fotos seleccionadas",
      message: `Lo máximo son ${MAX_NEW_PHOTOS_PER_REQUEST} fotos por inmueble y seleccionaste ${files.length}. Debes borrar ${overflow} ${
        overflow === 1 ? "foto" : "fotos"
      } antes de continuar.`,
    };
  }

  for (const file of files) {
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return {
        title: "Una foto pesa demasiado",
        message: `"${file.name}" supera el máximo de ${formatBytes(
          MAX_PHOTO_SIZE_BYTES
        )}. Comprime esa imagen o elige otra versión antes de continuar.`,
      };
    }

    const extension = fileExtension(file.name);
    const expectedMime = MIME_BY_EXTENSION[extension];
    if (!expectedMime) {
      return {
        title: "Formato no permitido",
        message: `"${file.name}" no es un formato válido. Usa solo JPG, PNG, WEBP o AVIF.`,
      };
    }

    const normalizedMime = normalizeImageMimeType(file.type);
    if (!isAllowedImageMime(normalizedMime) || normalizedMime !== expectedMime) {
      return {
        title: "La foto no coincide con su formato",
        message: `"${file.name}" no coincide con el tipo esperado para su extensión. Verifica el archivo antes de continuar.`,
      };
    }

    const headBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const detectedMime = detectImageMimeType(headBytes);
    if (detectedMime && detectedMime !== expectedMime) {
      return {
        title: "La foto parece dañada o mal renombrada",
        message: `La firma binaria de "${file.name}" no coincide con el formato declarado. Prueba con el archivo original.`,
      };
    }
  }

  return null;
}

export default function ListingForm({
  mode,
  action,
  listing,
  photos = [],
  pois = [],
  draftListingId,
  submitLabel,
}: ListingFormProps) {
  const effectiveListingId = listing?.id ?? draftListingId ?? "";
  const manualGalleryUrlsValue = photos
    .filter((photo) => !photo.storage_path.trim())
    .map((photo) => photo.public_url)
    .join("\n");

  const initialListingKind = listing?.listing_kind ?? "apartment";
  const initialStatus = listing?.status ?? "draft";

  const [listingKind, setListingKind] =
    useState<ListingKind>(initialListingKind);
  const [status, setStatus] = useState<ListingStatus>(initialStatus);
  const [uploadedPhotoRefs, setUploadedPhotoRefs] = useState<
    UploadedPhotoReference[]
  >([]);
  const [uploadDialog, setUploadDialog] = useState<UploadDialogState | null>(
    null
  );
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const submitBypassRef = useRef(false);

  const roomKind = isRoomKind(listingKind);
  const sharedRoom = listingKind === "room_shared";
  const areaKind = isAreaRequiredKind(listingKind);

  const movingIntoAreaKind =
    mode === "edit" &&
    !isAreaRequiredKind(initialListingKind) &&
    isAreaRequiredKind(listingKind);
  const movingIntoRoomKind =
    mode === "edit" && !isRoomKind(initialListingKind) && isRoomKind(listingKind);
  const movingIntoSharedRoom =
    mode === "edit" && initialListingKind !== "room_shared" && sharedRoom;

  const areaRequiredInClient = mode === "create" || movingIntoAreaKind;
  const roomFieldsRequiredInClient = mode === "create" || movingIntoRoomKind;
  const sharedRoomRequiredInClient = mode === "create" || movingIntoSharedRoom;

  const hint = useMemo(() => statusHint(status), [status]);
  const uploadedPhotosDraftStorageKey = effectiveListingId
    ? uploadedPhotoDraftKey(effectiveListingId)
    : "";

  useEffect(() => {
    if (!uploadedPhotosDraftStorageKey || typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("saved") === "1") {
      window.sessionStorage.removeItem(uploadedPhotosDraftStorageKey);
      setUploadedPhotoRefs([]);
      return;
    }

    const raw = window.sessionStorage.getItem(uploadedPhotosDraftStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as UploadedPhotoReference[];
      setUploadedPhotoRefs(dedupeUploadedPhotos(parsed));
    } catch {
      window.sessionStorage.removeItem(uploadedPhotosDraftStorageKey);
    }
  }, [uploadedPhotosDraftStorageKey]);

  useEffect(() => {
    if (!uploadedPhotosDraftStorageKey || typeof window === "undefined") return;

    if (uploadedPhotoRefs.length === 0) {
      window.sessionStorage.removeItem(uploadedPhotosDraftStorageKey);
      return;
    }

    window.sessionStorage.setItem(
      uploadedPhotosDraftStorageKey,
      JSON.stringify(uploadedPhotoRefs)
    );
  }, [uploadedPhotoRefs, uploadedPhotosDraftStorageKey]);

  async function handleFormSubmitCapture(event: FormEvent<HTMLFormElement>) {
    if (submitBypassRef.current) {
      submitBypassRef.current = false;
      return;
    }

    if (uploadingPhotos) {
      event.preventDefault();
      return;
    }

    const selectedFiles = Array.from(fileInputRef.current?.files ?? []);
    if (selectedFiles.length === 0) return;

    const fileValidationError = await validateSelectedFiles(selectedFiles);
    if (fileValidationError) {
      event.preventDefault();
      setUploadDialog(fileValidationError);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const deleteIds = new Set(
      formData
        .getAll("delete_photo_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    );
    const activeExistingPhotos = photos.filter((photo) => !deleteIds.has(photo.id));
    const activeExternalUrls = new Set(
      activeExistingPhotos
        .filter((photo) => !photo.storage_path.trim())
        .map((photo) => photo.public_url.trim())
        .filter(Boolean)
    );
    const additionalManualUrls = parseManualGalleryUrlsClient(
      String(formData.get("manual_gallery_urls") ?? "")
    ).filter((url) => !activeExternalUrls.has(url));
    const nextPhotoCount =
      activeExistingPhotos.length +
      uploadedPhotoRefs.length +
      selectedFiles.length +
      additionalManualUrls.length;

    if (
      nextPhotoCount > MAX_PHOTOS_PER_LISTING &&
      nextPhotoCount > photos.length
    ) {
      event.preventDefault();
      const overflow = nextPhotoCount - MAX_PHOTOS_PER_LISTING;
      setUploadDialog({
        title: "Se pasó el máximo de fotos",
        message: `Lo máximo son ${MAX_PHOTOS_PER_LISTING} fotos por inmueble y con esta carga quedarías con ${nextPhotoCount}. Debes borrar ${overflow} ${
          overflow === 1 ? "foto" : "fotos"
        } o quitar alguna URL de galería antes de continuar.`,
      });
      return;
    }

    event.preventDefault();
    setUploadDialog(null);
    setUploadingPhotos(true);

    const uploadedInThisAttempt: UploadedPhotoReference[] = [];

    try {
      const { uploads } = await createPhotoUploadPlanAction({
        listingId: effectiveListingId,
        files: selectedFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      });

      if (uploads.length !== selectedFiles.length) {
        throw new Error("No pudimos preparar todas las fotos para la subida.");
      }

      const supabase = createBrowserClient();

      for (let index = 0; index < uploads.length; index += 1) {
        const target = uploads[index];
        const file = selectedFiles[index];

        const { error } = await supabase.storage
          .from("listing-images")
          .uploadToSignedUrl(target.storagePath, target.token, file, {
            contentType: target.contentType,
            upsert: false,
          });

        if (error) {
          throw new Error(
            `No pudimos subir "${file.name}". Revisa tu conexión e intenta de nuevo.`
          );
        }

        uploadedInThisAttempt.push({
          storagePath: target.storagePath,
          publicUrl: target.publicUrl,
        });
      }

      setUploadedPhotoRefs((prev) =>
        dedupeUploadedPhotos([...prev, ...uploadedInThisAttempt])
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }

      submitBypassRef.current = true;
      requestAnimationFrame(() => event.currentTarget.requestSubmit());
    } catch (error) {
      if (uploadedInThisAttempt.length > 0) {
        try {
          await cleanupUploadedPhotosAction(
            uploadedInThisAttempt.map((photo) => photo.storagePath)
          );
        } catch {
          // Best effort cleanup. If this fails, the next save or manual retry
          // should still be able to continue without blocking the user.
        }
      }

      setUploadDialog({
        title: "No pudimos preparar la galería",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado mientras subíamos las fotos.",
      });
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function handleClearUploadedPhotos() {
    if (uploadedPhotoRefs.length === 0 || uploadingPhotos) return;

    setUploadingPhotos(true);
    try {
      await cleanupUploadedPhotosAction(
        uploadedPhotoRefs.map((photo) => photo.storagePath)
      );
      setUploadedPhotoRefs([]);
    } catch (error) {
      setUploadDialog({
        title: "No pudimos limpiar las fotos listas",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado limpiando las fotos del borrador.",
      });
    } finally {
      setUploadingPhotos(false);
    }
  }

  return (
    <form
      action={action}
      onSubmitCapture={handleFormSubmitCapture}
      className="space-y-6"
    >
      {effectiveListingId && (
        <input type="hidden" name="listing_id" value={effectiveListingId} />
      )}
      {uploadedPhotoRefs.map((photo) => (
        <input
          key={photo.storagePath}
          type="hidden"
          name="uploaded_photo_refs"
          value={JSON.stringify(photo)}
        />
      ))}

      {/* ── Publicación ────────────────────────────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">Publicacion</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Estado</span>
            <select
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ListingStatus)
              }
              className={SELECT_CLASS}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Disponible desde</span>
            <input
              type="date"
              name="available_from"
              defaultValue={listing?.available_from ?? ""}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-xs ${statusHintClasses(
            hint.tone
          )}`}
        >
          {hint.text}
        </p>
      </section>

      {/* ── Datos principales ──────────────────────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">
          Datos principales
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 sm:col-span-2">
            <span className={LABEL_CLASS}>Titulo</span>
            <input
              type="text"
              name="title"
              required
              defaultValue={listing?.title ?? ""}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Tipo de arriendo</span>
            <select
              name="listing_kind"
              value={listingKind}
              onChange={(event) =>
                setListingKind(event.target.value as ListingKind)
              }
              className={SELECT_CLASS}
            >
              {LISTING_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">
              El formulario se adapta por tipo para evitar errores de carga.
            </p>
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Etiqueta comercial</span>
            <input
              type="text"
              name="property_type"
              required
              defaultValue={listing?.property_type ?? ""}
              placeholder="Ej. Apartamento, Casa, Habitacion"
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className={LABEL_CLASS}>Descripcion</span>
            <textarea
              name="description"
              rows={5}
              defaultValue={listing?.description ?? ""}
              className={TEXTAREA_CLASS}
            />
          </label>
        </div>
      </section>

      {/* ── Ubicación y contexto ───────────────────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">
          Ubicacion y contexto
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Ciudad</span>
            <input
              type="text"
              name="city"
              required
              defaultValue={listing?.city ?? "Bogota"}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Zona</span>
            <input
              type="text"
              name="zone"
              defaultValue={listing?.zone ?? ""}
              placeholder="Norte, Centro, Sur..."
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Barrio</span>
            <input
              type="text"
              name="neighborhood"
              required
              defaultValue={listing?.neighborhood ?? ""}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Ubicacion aproximada</span>
            <input
              type="text"
              name="approx_location"
              required
              defaultValue={listing?.approx_location ?? ""}
              placeholder="Cerca a..."
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Contexto residencial</span>
            <select
              name="residential_context"
              defaultValue={listing?.residential_context ?? "barrio"}
              className={SELECT_CLASS}
            >
              {CONTEXT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Nombre conjunto/edificio</span>
            <input
              type="text"
              name="residential_name"
              defaultValue={listing?.residential_name ?? ""}
              placeholder="Opcional"
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </section>

      {/* ── Precio y costos ────────────────────────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">
          Precio y costos
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Canon (COP)</span>
            <input
              type="number"
              name="price_cop"
              min={0}
              required
              defaultValue={listing?.price_cop ?? 0}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Periodo</span>
            <select
              name="billing_period"
              defaultValue={listing?.billing_period ?? "month"}
              className={SELECT_CLASS}
            >
              <option value="month">Mensual</option>
              <option value="biweekly">Quincenal</option>
              <option value="weekly">Semanal</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Administracion (COP)</span>
            <input
              type="number"
              name="admin_fee_cop"
              min={0}
              defaultValue={listing?.admin_fee_cop ?? 0}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Estadia minima (meses)</span>
            <input
              type="number"
              name="min_stay_months"
              min={0}
              defaultValue={listing?.min_stay_months ?? ""}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Servicios min (COP)</span>
            <input
              type="number"
              name="utilities_cop_min"
              min={0}
              defaultValue={listing?.utilities_cop_min ?? ""}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Servicios max (COP)</span>
            <input
              type="number"
              name="utilities_cop_max"
              min={0}
              defaultValue={listing?.utilities_cop_max ?? ""}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </section>

      {/* ── Características ────────────────────────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">
          Caracteristicas
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Habitaciones</span>
            <input
              type="number"
              name="bedrooms"
              min={0}
              required
              defaultValue={listing?.bedrooms ?? 0}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Banos</span>
            <input
              type="number"
              name="bathrooms"
              min={0}
              required
              defaultValue={listing?.bathrooms ?? 0}
              className={INPUT_CLASS}
            />
          </label>

          {areaKind && (
            <label className="block space-y-1">
              <span className={LABEL_CLASS}>Area m2</span>
              <input
                type="number"
                name="area_m2"
                min={0}
                step="0.01"
                required={areaRequiredInClient}
                defaultValue={listing?.area_m2 ?? ""}
                className={INPUT_CLASS}
              />
              <span className="text-xs text-muted">
                {areaRequiredInClient
                  ? "Obligatorio para este tipo de inmueble."
                  : "Recomendado para completar ficha tecnica."}
              </span>
            </label>
          )}

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Independiente</span>
            <select
              name="independent"
              defaultValue={listing?.independent ? "true" : "false"}
              className={SELECT_CLASS}
            >
              <option value="true">Si</option>
              <option value="false">No</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Amoblado</span>
            <select
              name="furnished"
              defaultValue={listing?.furnished ? "true" : "false"}
              className={SELECT_CLASS}
            >
              <option value="true">Si</option>
              <option value="false">No</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Mascotas</span>
            <select
              name="pets_allowed"
              defaultValue={optionalBooleanToValue(listing?.pets_allowed)}
              className={SELECT_CLASS}
            >
              <option value="">No definido</option>
              <option value="true">Permitidas</option>
              <option value="false">No permitidas</option>
            </select>
          </label>

          {!roomKind && (
            <>
              <label className="block space-y-1">
                <span className={LABEL_CLASS}>Piso</span>
                <input
                  type="number"
                  name="floor_number"
                  min={0}
                  defaultValue={listing?.floor_number ?? ""}
                  className={INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLASS}>Ascensor</span>
                <select
                  name="has_elevator"
                  defaultValue={optionalBooleanToValue(listing?.has_elevator)}
                  className={SELECT_CLASS}
                >
                  <option value="">No definido</option>
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLASS}>Parqueadero carro</span>
                <input
                  type="number"
                  name="parking_car_count"
                  min={0}
                  defaultValue={listing?.parking_car_count ?? 0}
                  className={INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLASS}>Parqueadero moto</span>
                <input
                  type="number"
                  name="parking_motorcycle_count"
                  min={0}
                  defaultValue={listing?.parking_motorcycle_count ?? 0}
                  className={INPUT_CLASS}
                />
              </label>
            </>
          )}

          {roomKind && (
            <>
              <label className="block space-y-1">
                <span className={LABEL_CLASS}>Bano privado</span>
                <select
                  name="room_bathroom_private"
                  defaultValue={optionalBooleanToValue(
                    listing?.room_bathroom_private
                  )}
                  required={roomFieldsRequiredInClient}
                  className={SELECT_CLASS}
                >
                  <option value="">Selecciona</option>
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className={LABEL_CLASS}>Acceso cocina</span>
                <select
                  name="kitchen_access"
                  defaultValue={optionalBooleanToValue(
                    listing?.kitchen_access
                  )}
                  required={roomFieldsRequiredInClient}
                  className={SELECT_CLASS}
                >
                  <option value="">Selecciona</option>
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </label>

              {sharedRoom && (
                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Convivientes</span>
                  <input
                    type="number"
                    name="cohabitants_count"
                    min={0}
                    required={sharedRoomRequiredInClient}
                    defaultValue={listing?.cohabitants_count ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Servicios, requisitos y contacto ───────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">
          Servicios, requisitos y contacto
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-1">
          <TagInput
            name="includes_csv"
            label="¿Qué incluye el arriendo?"
            initialTags={listing?.includes ?? []}
            suggestions={INCLUDES_SUGGESTIONS}
            placeholder="Escribe y presiona Enter"
          />

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Nota de servicios</span>
            <textarea
              name="utilities_notes"
              rows={3}
              defaultValue={listing?.utilities_notes ?? ""}
              className={TEXTAREA_CLASS}
            />
          </label>

          <TagInput
            name="requirements_csv"
            label="Requisitos para arrendar"
            initialTags={listing?.requirements ?? []}
            suggestions={REQUIREMENTS_SUGGESTIONS}
            placeholder="Escribe y presiona Enter"
          />

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Nota de requisitos</span>
            <textarea
              name="requirements_notes"
              rows={3}
              defaultValue={listing?.requirements_notes ?? ""}
              className={TEXTAREA_CLASS}
            />
          </label>

          <label className="block space-y-1">
            <span className={LABEL_CLASS}>WhatsApp (E.164)</span>
            <input
              type="text"
              name="whatsapp_e164"
              required
              defaultValue={listing?.whatsapp_e164 ?? "57"}
              placeholder="573001234567"
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </section>

      {/* ── Entorno y puntos cercanos ──────────────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">
          Entorno y puntos cercanos
        </h2>
        <div className="mt-3">
          <PoiEditor pois={pois} />
        </div>
      </section>

      {/* ── Fotos y portada ────────────────────────────────────────── */}
      <section className={SECTION_CLASS}>
        <h2 className="text-lg font-semibold text-stone-900">
          Fotos y portada
        </h2>

        <label className="mt-3 block space-y-1">
          <span className={LABEL_CLASS}>URL portada externa (opcional)</span>
          <input
            type="text"
            name="manual_cover_photo_url"
            defaultValue=""
            placeholder="https://..."
            className={INPUT_CLASS}
          />
          <p className="text-xs text-muted">
            Si lo dejas vacio, se usara como portada una foto de la galeria.
          </p>
        </label>

        <label className="mt-3 block space-y-1">
          <span className={LABEL_CLASS}>
            URLs de galería externa (opcional)
          </span>
          <textarea
            name="manual_gallery_urls"
            rows={4}
            defaultValue={manualGalleryUrlsValue}
            placeholder={"https://...\nhttps://..."}
            className={TEXTAREA_CLASS}
          />
          <p className="text-xs text-muted">
            Una URL por línea. Ideal cuando aún no subes archivos y quieres
            varias fotos en la galería del detalle.
          </p>
        </label>

        <label className="mt-3 block space-y-1">
          <span className={LABEL_CLASS}>Subir fotos nuevas</span>
          <input
            ref={fileInputRef}
            type="file"
            name="new_photos"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={() => setUploadDialog(null)}
            className="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 file:mr-3 file:rounded-lg file:border-0 file:bg-accent/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
          />
          <p className="text-xs text-muted">
            Máximo {MAX_PHOTOS_PER_LISTING} fotos por inmueble. Cada foto puede
            pesar hasta {formatBytes(MAX_PHOTO_SIZE_BYTES)}. Formatos: JPG, PNG,
            WEBP y AVIF.
          </p>
          <p className="text-xs text-muted">
            La subida pesada va directo al storage para que no se reviente el
            formulario al guardar.
          </p>
        </label>

        <PhotoUploadPreview inputName="new_photos" />

        {uploadedPhotoRefs.length > 0 && (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {uploadedPhotoRefs.length}{" "}
                  {uploadedPhotoRefs.length === 1
                    ? "foto lista para guardar"
                    : "fotos listas para guardar"}
                </p>
                <p className="text-xs text-emerald-700">
                  Si la página falla o recarga, este borrador intenta
                  restaurarlas para que no pierdas el trabajo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleClearUploadedPhotos()}
                disabled={uploadingPhotos}
                className="inline-flex min-h-10 items-center rounded-xl border border-emerald-300 bg-white px-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Vaciar fotos listas
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {uploadedPhotoRefs.map((photo) => (
                <div
                  key={photo.storagePath}
                  className="overflow-hidden rounded-xl border border-emerald-200 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.publicUrl}
                    alt="Foto lista para guardar"
                    className="aspect-square h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
            uploadedPhotoRefs.length > 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-stone-200 bg-stone-50 text-stone-600"
          }`}
        >
          {uploadedPhotoRefs.length > 0
            ? "Las fotos ya quedaron subidas al storage y el siguiente paso es guardar el inmueble."
            : "Cuando des guardar, las fotos nuevas se validan primero y luego se suben antes de enviar el formulario."}
        </div>

        {uploadDialog && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <p className="font-semibold">{uploadDialog.title}</p>
            <p className="mt-1">{uploadDialog.message}</p>
          </div>
        )}

        {photos.length > 0 && <PhotoManager photos={photos} />}
      </section>

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="text-xs text-muted">
          El formulario valida por tipo de inmueble y estado para evitar cargas
          inconsistentes.
        </p>
        <FormSubmitButton
          idleLabel={submitLabel}
          busy={uploadingPhotos}
          busyLabel="Subiendo fotos..."
          pendingLabel="Guardando cambios..."
        />
      </div>

      {uploadDialog &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4"
            onClick={() => !uploadingPhotos && setUploadDialog(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-upload-modal-title"
          >
            <div
              className="w-full max-w-lg animate-[fadeScaleIn_0.2s_ease-out] rounded-3xl border border-bg-border bg-bg-surface p-6 shadow-[0_20px_60px_rgba(15,17,23,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM10 6a1 1 0 100 2 1 1 0 000-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <h3
                id="photo-upload-modal-title"
                className="text-xl font-semibold text-t-primary"
              >
                {uploadDialog.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-t-secondary">
                {uploadDialog.message}
              </p>

              <div className="mt-4 rounded-2xl border border-bg-border bg-bg-elevated px-4 py-3 text-xs text-t-muted">
                Máximo {MAX_PHOTOS_PER_LISTING} fotos por inmueble, hasta{" "}
                {formatBytes(MAX_PHOTO_SIZE_BYTES)} por archivo. Si la selección
                supera {formatBytes(LARGE_UPLOAD_WARNING_BYTES)}, la carga puede
                tardar bastante más según tu conexión.
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setUploadDialog(null)}
                  className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </form>
  );
}
