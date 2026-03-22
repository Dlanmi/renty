"use client";

import { useMemo, useState } from "react";
import type {
  Listing,
  ListingKind,
  ListingPhoto,
  ListingPoi,
  ListingStatus,
  ResidentialContext,
} from "@/lib/domain/types";
import FormSubmitButton from "@/components/admin/FormSubmitButton";
import PhotoManager from "@/components/admin/PhotoManager";

type FormAction = (formData: FormData) => void | Promise<void>;

interface ListingFormProps {
  mode: "create" | "edit";
  action: FormAction;
  listing?: Listing | null;
  photos?: ListingPhoto[];
  pois?: ListingPoi[];
  submitLabel: string;
}

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

function toPoiTextareaValue(pois: ListingPoi[]): string {
  return pois
    .map((poi) =>
      [
        poi.kind,
        poi.name,
        poi.distance_m == null ? "" : String(poi.distance_m),
        poi.walk_minutes == null ? "" : String(poi.walk_minutes),
      ].join("|")
    )
    .join("\n");
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

export default function ListingForm({
  mode,
  action,
  listing,
  photos = [],
  pois = [],
  submitLabel,
}: ListingFormProps) {
  const includesCsv = listing?.includes?.join(", ") ?? "";
  const requirementsCsv = listing?.requirements?.join(", ") ?? "";
  const poisValue = toPoiTextareaValue(pois);
  const manualGalleryUrlsValue = photos
    .filter((photo) => !photo.storage_path.trim())
    .map((photo) => photo.public_url)
    .join("\n");

  const initialListingKind = listing?.listing_kind ?? "apartment";
  const initialStatus = listing?.status ?? "draft";

  const [listingKind, setListingKind] = useState<ListingKind>(initialListingKind);
  const [status, setStatus] = useState<ListingStatus>(initialStatus);

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

  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {listing?.id && <input type="hidden" name="listing_id" value={listing.id} />}

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Publicacion</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Estado</span>
            <select
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ListingStatus)}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Disponible desde</span>
            <input
              type="date"
              name="available_from"
              defaultValue={listing?.available_from ?? ""}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
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

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Datos principales</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-stone-700">Titulo</span>
            <input
              type="text"
              name="title"
              required
              defaultValue={listing?.title ?? ""}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Tipo de arriendo</span>
            <select
              name="listing_kind"
              value={listingKind}
              onChange={(event) => setListingKind(event.target.value as ListingKind)}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
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
            <span className="text-sm font-medium text-stone-700">Etiqueta comercial</span>
            <input
              type="text"
              name="property_type"
              required
              defaultValue={listing?.property_type ?? ""}
              placeholder="Ej. Apartamento, Casa, Habitacion"
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-stone-700">Descripcion</span>
            <textarea
              name="description"
              rows={5}
              defaultValue={listing?.description ?? ""}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Ubicacion y contexto</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Ciudad</span>
            <input
              type="text"
              name="city"
              required
              defaultValue={listing?.city ?? "Bogota"}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Zona</span>
            <input
              type="text"
              name="zone"
              defaultValue={listing?.zone ?? ""}
              placeholder="Norte, Centro, Sur..."
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Barrio</span>
            <input
              type="text"
              name="neighborhood"
              required
              defaultValue={listing?.neighborhood ?? ""}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Ubicacion aproximada</span>
            <input
              type="text"
              name="approx_location"
              required
              defaultValue={listing?.approx_location ?? ""}
              placeholder="Cerca a..."
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Contexto residencial</span>
            <select
              name="residential_context"
              defaultValue={listing?.residential_context ?? "barrio"}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            >
              {CONTEXT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Nombre conjunto/edificio</span>
            <input
              type="text"
              name="residential_name"
              defaultValue={listing?.residential_name ?? ""}
              placeholder="Opcional"
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Precio y costos</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Canon (COP)</span>
            <input
              type="number"
              name="price_cop"
              min={0}
              required
              defaultValue={listing?.price_cop ?? 0}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Periodo</span>
            <select
              name="billing_period"
              defaultValue={listing?.billing_period ?? "month"}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            >
              <option value="month">Mensual</option>
              <option value="biweekly">Quincenal</option>
              <option value="weekly">Semanal</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Administracion (COP)</span>
            <input
              type="number"
              name="admin_fee_cop"
              min={0}
              defaultValue={listing?.admin_fee_cop ?? 0}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Estadia minima (meses)</span>
            <input
              type="number"
              name="min_stay_months"
              min={0}
              defaultValue={listing?.min_stay_months ?? ""}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Servicios min (COP)</span>
            <input
              type="number"
              name="utilities_cop_min"
              min={0}
              defaultValue={listing?.utilities_cop_min ?? ""}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Servicios max (COP)</span>
            <input
              type="number"
              name="utilities_cop_max"
              min={0}
              defaultValue={listing?.utilities_cop_max ?? ""}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Caracteristicas</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Habitaciones</span>
            <input
              type="number"
              name="bedrooms"
              min={0}
              required
              defaultValue={listing?.bedrooms ?? 0}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Banos</span>
            <input
              type="number"
              name="bathrooms"
              min={0}
              required
              defaultValue={listing?.bathrooms ?? 0}
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          {areaKind && (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-stone-700">Area m2</span>
              <input
                type="number"
                name="area_m2"
                min={0}
                step="0.01"
                required={areaRequiredInClient}
                defaultValue={listing?.area_m2 ?? ""}
                className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
              />
              <span className="text-xs text-muted">
                {areaRequiredInClient
                  ? "Obligatorio para este tipo de inmueble."
                  : "Recomendado para completar ficha tecnica."}
              </span>
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Independiente</span>
            <select
              name="independent"
              defaultValue={listing?.independent ? "true" : "false"}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            >
              <option value="true">Si</option>
              <option value="false">No</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Amoblado</span>
            <select
              name="furnished"
              defaultValue={listing?.furnished ? "true" : "false"}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            >
              <option value="true">Si</option>
              <option value="false">No</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Mascotas</span>
            <select
              name="pets_allowed"
              defaultValue={optionalBooleanToValue(listing?.pets_allowed)}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            >
              <option value="">No definido</option>
              <option value="true">Permitidas</option>
              <option value="false">No permitidas</option>
            </select>
          </label>

          {!roomKind && (
            <>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">Piso</span>
                <input
                  type="number"
                  name="floor_number"
                  min={0}
                  defaultValue={listing?.floor_number ?? ""}
                  className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">Ascensor</span>
                <select
                  name="has_elevator"
                  defaultValue={optionalBooleanToValue(listing?.has_elevator)}
                  className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
                >
                  <option value="">No definido</option>
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">Parqueadero carro</span>
                <input
                  type="number"
                  name="parking_car_count"
                  min={0}
                  defaultValue={listing?.parking_car_count ?? 0}
                  className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">Parqueadero moto</span>
                <input
                  type="number"
                  name="parking_motorcycle_count"
                  min={0}
                  defaultValue={listing?.parking_motorcycle_count ?? 0}
                  className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
                />
              </label>
            </>
          )}

          {roomKind && (
            <>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">Bano privado</span>
                <select
                  name="room_bathroom_private"
                  defaultValue={optionalBooleanToValue(listing?.room_bathroom_private)}
                  required={roomFieldsRequiredInClient}
                  className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
                >
                  <option value="">Selecciona</option>
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-stone-700">Acceso cocina</span>
                <select
                  name="kitchen_access"
                  defaultValue={optionalBooleanToValue(listing?.kitchen_access)}
                  required={roomFieldsRequiredInClient}
                  className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
                >
                  <option value="">Selecciona</option>
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </label>

              {sharedRoom && (
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-stone-700">Convivientes</span>
                  <input
                    type="number"
                    name="cohabitants_count"
                    min={0}
                    required={sharedRoomRequiredInClient}
                    defaultValue={listing?.cohabitants_count ?? ""}
                    className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
                  />
                </label>
              )}
            </>
          )}
        </div>
      </section>

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Servicios, requisitos y contacto</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-stone-700">Incluye (coma separada)</span>
            <input
              type="text"
              name="includes_csv"
              defaultValue={includesCsv}
              placeholder="agua, luz, wifi, parqueadero"
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-stone-700">Nota de servicios</span>
            <textarea
              name="utilities_notes"
              rows={3}
              defaultValue={listing?.utilities_notes ?? ""}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-stone-700">Requisitos (coma separada)</span>
            <input
              type="text"
              name="requirements_csv"
              defaultValue={requirementsCsv}
              placeholder="fiador, deposito, carta_laboral"
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-stone-700">Nota de requisitos</span>
            <textarea
              name="requirements_notes"
              rows={3}
              defaultValue={listing?.requirements_notes ?? ""}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">WhatsApp (E.164)</span>
            <input
              type="text"
              name="whatsapp_e164"
              required
              defaultValue={listing?.whatsapp_e164 ?? "57"}
              placeholder="573001234567"
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Entorno y puntos cercanos</h2>
        <p className="mt-1 text-xs text-muted">
          Una linea por punto: <code>tipo|nombre|distancia_m|min_a_pie</code>. Tipos:
          park, transport, supermarket, pharmacy, school, hospital, other.
        </p>
        <textarea
          name="pois_text"
          rows={6}
          defaultValue={poisValue}
          className="mt-3 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-xs text-stone-900 focus:border-accent focus:outline-none"
        />
      </section>

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">Fotos y portada</h2>

        <label className="mt-3 block space-y-1">
          <span className="text-sm font-medium text-stone-700">URL portada externa (opcional)</span>
          <input
            type="text"
            name="manual_cover_photo_url"
            defaultValue=""
            placeholder="https://..."
            className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
          />
          <p className="text-xs text-muted">
            Si lo dejas vacio, se usara como portada una foto de la galeria.
          </p>
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-sm font-medium text-stone-700">
            URLs de galería externa (opcional)
          </span>
          <textarea
            name="manual_gallery_urls"
            rows={4}
            defaultValue={manualGalleryUrlsValue}
            placeholder={"https://...\nhttps://..."}
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-accent focus:outline-none"
          />
          <p className="text-xs text-muted">
            Una URL por línea. Ideal cuando aún no subes archivos y quieres varias
            fotos en la galería del detalle.
          </p>
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-sm font-medium text-stone-700">Subir fotos nuevas</span>
          <input
            type="file"
            name="new_photos"
            multiple
            accept="image/*"
            className="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
          />
          <p className="text-xs text-muted">
            Recomendado para publicacion activa: minimo 8 fotos con diferentes ambientes.
          </p>
        </label>

        {mode === "edit" && photos.length > 0 && <PhotoManager photos={photos} />}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="text-xs text-muted">
          El formulario valida por tipo de inmueble y estado para evitar cargas inconsistentes.
        </p>
        <FormSubmitButton idleLabel={submitLabel} pendingLabel="Guardando cambios..." />
      </div>
    </form>
  );
}
