import Link from "next/link";
import { createSupabaseServerClient, requireAdminContext } from "@/lib/admin/auth";
import { getAdminQualityOverview } from "@/lib/data/analytics";
import type { ListingStatus } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

interface StatusSummary {
  label: string;
  value: ListingStatus;
}

const STATUS_SUMMARY: StatusSummary[] = [
  { label: "Activos", value: "active" },
  { label: "Borradores", value: "draft" },
  { label: "Pendientes", value: "pending_review" },
  { label: "Arrendados", value: "rented" },
  { label: "Inactivos", value: "inactive" },
];

async function countByStatus(
  accessToken: string,
  status: ListingStatus
): Promise<number> {
  const client = createSupabaseServerClient(accessToken);
  const { count } = await client
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdminContext();
  const client = createSupabaseServerClient(admin.accessToken);

  const statusCounts = await Promise.all(
    STATUS_SUMMARY.map(async (item) => ({
      ...item,
      count: await countByStatus(admin.accessToken, item.value),
    }))
  );
  const qualityOverview = await getAdminQualityOverview(admin.accessToken);

  const { data: recentListings } = await client
    .from("listings")
    .select("id, title, status, neighborhood, updated_at")
    .order("updated_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-6">
      <section className="stagger-list grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statusCounts.map((item) => (
          <article
            key={item.value}
            className="lift-hover rounded-card border border-bg-border bg-bg-surface p-4 shadow-card"
          >
            <p className="text-xs uppercase tracking-wide text-muted">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-t-primary">{item.count}</p>
          </article>
        ))}
      </section>

      <section className="lift-hover rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-t-primary">Últimos cambios</h2>
          <Link
            href="/admin/listings"
            className="text-sm font-medium text-accent hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {!recentListings || recentListings.length === 0 ? (
          <p className="text-sm text-muted">No hay inmuebles registrados aún.</p>
        ) : (
          <ul className="stagger-list divide-y divide-bg-border">
            {recentListings.map((listing) => (
              <li key={listing.id} className="py-3">
                <Link
                  href={`/admin/listings/${listing.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-bg-elevated"
                >
                  <div>
                    <p className="font-medium text-t-primary">{listing.title}</p>
                    <p className="text-sm text-muted">
                      {listing.neighborhood} · {listing.status}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(listing.updated_at).toLocaleString("es-CO")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {qualityOverview && (
        <section className="lift-hover rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-t-primary">
              Calidad del inventario activo
            </h2>
            <p className="text-sm text-muted">
              Score derivado de contenido, fotos, claridad de costos, ubicación y frescura.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-card border border-bg-border bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Promedio</p>
              <p className="mt-1 text-2xl font-bold text-t-primary">
                {qualityOverview.averageQualityScore ?? 0}
                <span className="ml-1 text-sm font-medium text-muted">/ 100</span>
              </p>
            </article>
            <article className="rounded-card border border-bg-border bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Alto</p>
              <p className="mt-1 text-2xl font-bold text-t-primary">
                {qualityOverview.highQualityCount}
              </p>
            </article>
            <article className="rounded-card border border-bg-border bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Medio</p>
              <p className="mt-1 text-2xl font-bold text-t-primary">
                {qualityOverview.mediumQualityCount}
              </p>
            </article>
            <article className="rounded-card border border-bg-border bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Bajo</p>
              <p className="mt-1 text-2xl font-bold text-t-primary">
                {qualityOverview.lowQualityCount}
              </p>
            </article>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-t-primary">
                Listings a pulir primero
              </h3>
              <span className="text-xs text-muted">
                {qualityOverview.activeListingCount} activos evaluados
              </span>
            </div>

            {qualityOverview.listingsNeedingAttention.length === 0 ? (
              <p className="text-sm text-muted">
                Aún no hay suficientes datos para mostrar recomendaciones.
              </p>
            ) : (
              <ul className="space-y-3">
                {qualityOverview.listingsNeedingAttention.map((listing) => (
                  <li
                    key={listing.listing_id}
                    className="rounded-card border border-bg-border bg-bg-elevated p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/listings/${listing.listing_id}`}
                          className="font-medium text-t-primary hover:text-accent hover:underline"
                        >
                          {listing.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {listing.neighborhood} · {listing.city} · {listing.listing_kind}
                        </p>
                        {listing.improvement_notes && listing.improvement_notes.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {listing.improvement_notes.slice(0, 3).map((note) => (
                              <li key={note} className="text-sm text-t-secondary">
                                • {note}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="shrink-0 rounded-full border border-bg-border bg-bg-surface px-3 py-1.5 text-sm font-semibold text-t-primary">
                        {listing.quality_score}/100 · {listing.quality_band}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
