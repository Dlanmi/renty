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

  return (
    <div className="space-y-4">
      <div className="lift-hover rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Crear inmueble</h1>
            <p className="text-sm text-muted">
              Completa la información del arriendo y carga las fotos.
            </p>
          </div>
          <Link
            href="/admin/listings"
            className="lift-hover inline-flex min-h-10 items-center rounded-full border border-stone-200 px-4 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Volver al listado
          </Link>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>

      <ListingForm mode="create" action={createListingAction} submitLabel="Crear inmueble" />
    </div>
  );
}
