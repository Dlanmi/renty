import Link from "next/link";
import ListingForm from "@/components/admin/ListingForm";
import { createListingAction } from "@/app/admin/(panel)/listings/actions";
import { requireAdminContext } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

interface NewListingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function NewListingPage({ searchParams }: NewListingPageProps) {
  await requireAdminContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = getSingleParam(resolvedSearchParams?.error).trim();
  const draftListingId =
    getSingleParam(resolvedSearchParams?.listingId).trim() || crypto.randomUUID();

  return (
    <div className="space-y-4">
      <div className="lift-hover rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-t-primary">Crear inmueble</h1>
            <p className="text-sm text-muted">
              Completa la información del arriendo y carga las fotos.
            </p>
          </div>
          <Link
            href="/admin/listings"
            className="lift-hover inline-flex min-h-10 items-center rounded-full border border-bg-border px-4 text-sm font-medium text-t-secondary hover:bg-bg-elevated"
          >
            Volver al listado
          </Link>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-600/20 bg-rose-600/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>

      <ListingForm
        mode="create"
        action={createListingAction}
        draftListingId={draftListingId}
        submitLabel="Crear inmueble"
      />
    </div>
  );
}
