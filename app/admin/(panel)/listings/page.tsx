import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient, requireAdminContext } from "@/lib/admin/auth";
import DeleteListingButton from "@/components/admin/DeleteListingButton";
import DuplicateListingButton from "@/components/admin/DuplicateListingButton";
import QuickStatusChanger from "@/components/admin/QuickStatusChanger";
import type { ListingStatus } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

interface ListingsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_OPTIONS: Array<{ value: "all" | ListingStatus; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "draft", label: "Borradores" },
  { value: "pending_review", label: "Pendientes" },
  { value: "rented", label: "Arrendados" },
  { value: "inactive", label: "Inactivos" },
  { value: "rejected", label: "Rechazados" },
];

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function isValidStatus(value: string): value is ListingStatus {
  return (
    value === "active" ||
    value === "draft" ||
    value === "pending_review" ||
    value === "rented" ||
    value === "inactive" ||
    value === "rejected"
  );
}

function statusChipClasses(status: ListingStatus): string {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rented") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (status === "pending_review") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-stone-200 bg-white text-stone-700";
}

function visibilityLabel(status: ListingStatus): string {
  return status === "active" ? "Visible publico" : "No visible publico";
}

export default async function AdminListingsPage({ searchParams }: ListingsPageProps) {
  const admin = await requireAdminContext();
  const client = createSupabaseServerClient(admin.accessToken);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const q = getSingleParam(resolvedSearchParams?.q).trim();
  const statusRaw = getSingleParam(resolvedSearchParams?.status).trim();
  const statusFilter = statusRaw === "all" ? "all" : statusRaw;
  const deleted = getSingleParam(resolvedSearchParams?.deleted).trim() === "1";

  let query = client
    .from("listings")
    .select(
      "id, title, status, listing_kind, neighborhood, price_cop, bedrooms, bathrooms, area_m2, cover_photo_url, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (statusFilter && statusFilter !== "all" && isValidStatus(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  if (q) {
    const safe = q.replace(/%/g, "").replace(/,/g, " ");
    query = query.or(
      `title.ilike.%${safe}%,neighborhood.ilike.%${safe}%,city.ilike.%${safe}%`
    );
  }

  const { data } = await query;
  const listings = data ?? [];

  return (
    <div className="space-y-5">
      <div className="lift-hover rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Inmuebles</h1>
            <p className="text-sm text-muted">
              Administra estados, detalles, fotos y puntos cercanos.
            </p>
          </div>

          <Link
            href="/admin/listings/new"
            className="lift-hover inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Crear inmueble
          </Link>
        </div>

        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por título, barrio o ciudad"
            className="h-11 rounded-xl border border-stone-200 px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
          />

          <select
            name="status"
            defaultValue={isValidStatus(statusFilter) ? statusFilter : "all"}
            className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-accent focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 px-4 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Filtrar
          </button>
        </form>

        {deleted && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            El inmueble se eliminó correctamente.
          </p>
        )}
      </div>

      <section className="rounded-card border border-stone-200 bg-white p-4 shadow-card">
        {listings.length === 0 ? (
          <p className="text-sm text-muted">No hay inmuebles que coincidan con el filtro.</p>
        ) : (
          <ul className="stagger-list space-y-3">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="lift-hover rounded-xl border border-stone-100 bg-stone-50 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-stone-100">
                      <Image
                        src={listing.cover_photo_url}
                        alt={listing.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-stone-900">{listing.title}</p>
                      <p className="text-xs text-muted">
                        {listing.neighborhood} · {listing.listing_kind}
                      </p>
                      <p className="text-xs text-muted">
                        {listing.bedrooms} hab · {listing.bathrooms} baños
                        {listing.area_m2 != null ? ` · ${listing.area_m2} m²` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <QuickStatusChanger 
                      listingId={listing.id}
                      currentStatus={listing.status}
                    />
                    <span className="inline-flex min-h-8 items-center rounded-full border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700">
                      {visibilityLabel(listing.status)}
                    </span>
                    <span className="inline-flex min-h-8 items-center rounded-full border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700">
                      ${listing.price_cop.toLocaleString("es-CO")}
                    </span>
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="lift-hover inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-dark"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                      </svg>
                      Editar
                    </Link>
                    <DuplicateListingButton
                      listingId={listing.id}
                      listingTitle={listing.title}
                      compact
                    />
                    <DeleteListingButton
                      listingId={listing.id}
                      listingTitle={listing.title}
                      compact
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
