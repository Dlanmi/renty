import Link from "next/link";
import { createSupabaseServerClient, requireAdminContext } from "@/lib/admin/auth";
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
            className="lift-hover rounded-card border border-stone-200 bg-white p-4 shadow-card"
          >
            <p className="text-xs uppercase tracking-wide text-muted">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">{item.count}</p>
          </article>
        ))}
      </section>

      <section className="lift-hover rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-stone-900">Últimos cambios</h2>
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
          <ul className="stagger-list divide-y divide-stone-100">
            {recentListings.map((listing) => (
              <li key={listing.id} className="py-3">
                <Link
                  href={`/admin/listings/${listing.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-stone-50"
                >
                  <div>
                    <p className="font-medium text-stone-900">{listing.title}</p>
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
    </div>
  );
}
