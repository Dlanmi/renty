import type { ReactNode } from "react";
import type { Listing, ListingPoi, ListingPoiKind } from "@/lib/domain/types";
import {
  formatCOP,
  formatBillingPeriod,
  formatDateCO,
  humanizeTag,
} from "@/lib/domain/format";
import { iconForInclude, iconForRequirement, SPEC_ICON } from "@/lib/domain/icons";
import Icon from "@/components/ui/Icon";

interface ListingSpecsProps {
  listing: Listing;
  pois?: ListingPoi[];
}

interface SpecItem {
  icon: string;
  label: string;
  value: string;
}

const POI_META: Record<ListingPoiKind, { label: string; icon: string }> = {
  park: { label: "Parque", icon: "park" },
  transport: { label: "Transporte", icon: "directions_bus" },
  supermarket: { label: "Supermercado", icon: "local_grocery_store" },
  pharmacy: { label: "Farmacia", icon: "local_pharmacy" },
  school: { label: "Colegio", icon: "school" },
  hospital: { label: "Hospital", icon: "local_hospital" },
  other: { label: "Punto cercano", icon: "place" },
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="lift-hover rounded-2xl border border-bg-border bg-bg-surface p-4 sm:p-5">
      <h2 className="text-base font-semibold text-t-primary">{title}</h2>
      {description && <p className="mt-1 text-xs text-t-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SpecRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-bg-border bg-bg-elevated px-4 py-3 min-w-0 max-w-full overflow-hidden">
      <Icon name={icon} size={21} className="shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-t-muted">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-t-primary" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

function isRoomKind(kind: Listing["listing_kind"]): boolean {
  return kind === "room_private" || kind === "room_shared";
}

function formatSquareMeters(value: number): string {
  if (Number.isInteger(value)) return `${value} m2`;
  return `${value.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} m2`;
}

function formatPoiDistance(poi: ListingPoi): string {
  const chunks: string[] = [];
  if (poi.distance_m != null) chunks.push(`${poi.distance_m} m`);
  if (poi.walk_minutes != null) chunks.push(`${poi.walk_minutes} min a pie`);
  return chunks.join(" · ");
}

function residentialContextLabel(context: Listing["residential_context"]): string {
  if (context === "conjunto") return "Conjunto";
  if (context === "edificio") return "Edificio";
  if (context === "casa_familiar") return "Casa familiar";
  return "Barrio";
}

export default function ListingSpecs({ listing, pois = [] }: ListingSpecsProps) {
  const roomKind = isRoomKind(listing.listing_kind);

  const specItems: SpecItem[] = [
    { icon: SPEC_ICON.type, label: "Tipo", value: listing.property_type },
  ];

  if (listing.bedrooms > 0) {
    specItems.push({ icon: SPEC_ICON.bedrooms, label: "Habitaciones", value: String(listing.bedrooms) });
  }

  if (listing.bathrooms > 0) {
    specItems.push({ icon: SPEC_ICON.bathrooms, label: "Banos", value: String(listing.bathrooms) });
  }

  if (listing.area_m2 != null) {
    specItems.push({ icon: "square_foot", label: "Area", value: formatSquareMeters(listing.area_m2) });
  }

  if (!roomKind && listing.floor_number != null) {
    specItems.push({ icon: "stairs", label: "Piso", value: String(listing.floor_number) });
  }

  if (!roomKind && listing.has_elevator != null) {
    specItems.push({ icon: "elevator", label: "Ascensor", value: listing.has_elevator ? "Si" : "No" });
  }

  if (!roomKind && listing.parking_car_count > 0) {
    specItems.push({ icon: "local_parking", label: "Parq. carro", value: String(listing.parking_car_count) });
  }

  if (!roomKind && listing.parking_motorcycle_count > 0) {
    specItems.push({ icon: "two_wheeler", label: "Parq. moto", value: String(listing.parking_motorcycle_count) });
  }

  if (roomKind && listing.room_bathroom_private != null) {
    specItems.push({ icon: "bathtub", label: "Bano privado", value: listing.room_bathroom_private ? "Si" : "No" });
  }

  if (roomKind && listing.kitchen_access != null) {
    specItems.push({ icon: "countertops", label: "Acceso cocina", value: listing.kitchen_access ? "Si" : "No" });
  }

  if (listing.listing_kind === "room_shared" && listing.cohabitants_count != null) {
    specItems.push({ icon: "groups", label: "Convivientes", value: String(listing.cohabitants_count) });
  }

  specItems.push({ icon: SPEC_ICON.independent, label: "Independiente", value: listing.independent ? "Si" : "No" });
  specItems.push({ icon: SPEC_ICON.furnished, label: "Amoblado", value: listing.furnished ? "Si" : "No" });

  if (listing.pets_allowed != null) {
    specItems.push({
      icon: "pets",
      label: "Mascotas",
      value: listing.pets_allowed ? "Permitidas" : "No permitidas",
    });
  }

  specItems.push({ icon: SPEC_ICON.available, label: "Disponible", value: formatDateCO(listing.available_from) });

  if (listing.min_stay_months != null) {
    specItems.push({
      icon: SPEC_ICON.minStay,
      label: "Estadia min.",
      value: `${listing.min_stay_months} mes${listing.min_stay_months > 1 ? "es" : ""}`,
    });
  }

  const hasAdminFee = listing.admin_fee_cop > 0;
  const hasUtilitiesRange = listing.utilities_cop_min != null || listing.utilities_cop_max != null;
  const hasCostBreakdown = hasAdminFee || hasUtilitiesRange;

  const utilitiesMin = listing.utilities_cop_min ?? 0;
  const utilitiesMax = listing.utilities_cop_max ?? listing.utilities_cop_min ?? 0;
  const totalMin = listing.price_cop + listing.admin_fee_cop + utilitiesMin;
  const totalMax = listing.price_cop + listing.admin_fee_cop + utilitiesMax;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-4 lg:hidden">
        <p className="text-2xl font-bold text-accent">
          {formatCOP(listing.price_cop)}
          <span className="text-base font-normal text-t-muted">
            {formatBillingPeriod(listing.billing_period)}
          </span>
        </p>
      </div>

      <SectionCard title="Resumen del inmueble" description="Datos clave para decidir rapido.">
        <div className="stagger-list grid grid-cols-2 gap-3 sm:grid-cols-3">
          {specItems.map((item) => (
            <SpecRow key={`${item.label}-${item.value}`} icon={item.icon} label={item.label} value={item.value} />
          ))}
        </div>
      </SectionCard>

      {hasCostBreakdown && (
        <SectionCard title="Costo mensual estimado" description="Transparencia de canon y costos adicionales.">
          <ul className="space-y-2 text-sm text-t-secondary">
            <li className="flex items-center justify-between gap-3">
              <span>Canon</span>
              <strong>{formatCOP(listing.price_cop)}</strong>
            </li>
            {hasAdminFee && (
              <li className="flex items-center justify-between gap-3">
                <span>Administracion</span>
                <strong>{formatCOP(listing.admin_fee_cop)}</strong>
              </li>
            )}
            {hasUtilitiesRange && (
              <li className="flex items-center justify-between gap-3">
                <span>Servicios estimados</span>
                <strong>
                  {formatCOP(utilitiesMin)} - {formatCOP(utilitiesMax)}
                </strong>
              </li>
            )}
            <li className="mt-2 flex items-center justify-between gap-3 border-t border-bg-border pt-2 text-t-primary">
              <span>Total aprox.</span>
              <strong>
                {formatCOP(totalMin)}
                {totalMax !== totalMin ? ` - ${formatCOP(totalMax)}` : ""}
              </strong>
            </li>
          </ul>
        </SectionCard>
      )}

      {listing.description && (
        <SectionCard title="Acerca de este lugar">
          <p className="whitespace-pre-line text-sm leading-relaxed text-t-secondary">{listing.description}</p>
        </SectionCard>
      )}

      {listing.includes.length > 0 && (
        <SectionCard title="Lo que incluye">
          <ul className="grid gap-2 sm:grid-cols-2">
            {listing.includes.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-t-secondary min-w-0">
                <Icon name={iconForInclude(item)} size={20} className="shrink-0 text-success" />
                <span className="truncate">{humanizeTag(item)}</span>
              </li>
            ))}
          </ul>
          {listing.utilities_notes && (
            <p className="mt-2 text-xs text-t-muted">{listing.utilities_notes}</p>
          )}
        </SectionCard>
      )}

      {listing.requirements.length > 0 && (
        <SectionCard title="Requisitos">
          <ul className="grid gap-2 sm:grid-cols-2">
            {listing.requirements.map((req) => (
              <li key={req} className="flex items-center gap-2.5 text-sm text-t-secondary min-w-0">
                <Icon name={iconForRequirement(req)} size={20} className="shrink-0 text-warning" />
                <span className="truncate">{humanizeTag(req)}</span>
              </li>
            ))}
          </ul>
          {listing.requirements_notes && (
            <p className="mt-2 text-xs text-t-muted">{listing.requirements_notes}</p>
          )}
        </SectionCard>
      )}

      <SectionCard title="Ubicacion" description="Ubicacion aproximada para proteger privacidad.">
        <div className="flex items-start gap-2.5 text-sm text-t-secondary">
          <Icon name="location_on" size={20} className="mt-0.5 text-accent" />
          <div>
            <p className="font-medium text-t-primary">
              {listing.neighborhood}
              {listing.zone ? `, ${listing.zone}` : ""}
            </p>
            <p>{listing.city}</p>
            {listing.residential_name && (
              <p className="mt-0.5 text-xs text-t-muted">
                {residentialContextLabel(listing.residential_context)}: {listing.residential_name}
              </p>
            )}
            <p className="mt-0.5 text-xs text-t-muted">{listing.approx_location}</p>
          </div>
        </div>
      </SectionCard>

      {pois.length > 0 && (
        <SectionCard title="Cerca de" description="Puntos de interes para vida diaria y movilidad.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {pois.map((poi) => {
              const meta = POI_META[poi.kind] ?? POI_META.other;
              const distance = formatPoiDistance(poi);

              return (
                <li
                  key={poi.id}
                  className="flex items-start gap-2.5 rounded-xl border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-t-secondary"
                >
                  <Icon name={meta.icon} size={18} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-t-primary">
                      {meta.label}: {poi.name}
                    </p>
                    {distance && <p className="text-xs text-t-muted">{distance}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
