import Link from "next/link";
import { notFound } from "next/navigation";
import ListingForm from "@/components/admin/ListingForm";
import DeleteListingButton from "@/components/admin/DeleteListingButton";
import DuplicateListingButton from "@/components/admin/DuplicateListingButton";
import { updateListingAction } from "@/app/admin/(panel)/listings/actions";
import { createSupabaseServerClient, requireAdminContext } from "@/lib/admin/auth";
import { isValidListingId } from "@/lib/data/listings";
import type { Listing, ListingPhoto, ListingPoi } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

interface AdminListingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatSavedAtLabel(savedAt: number): string {
  return new Date(savedAt).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function AdminListingDetailPage({
  params,
  searchParams,
}: AdminListingDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  if (!isValidListingId(id)) notFound();

  const admin = await requireAdminContext();
  const client = createSupabaseServerClient(admin.accessToken);

  const [{ data: listing }, { data: photos }, { data: pois }] = await Promise.all([
    client.from("listings").select("*").eq("id", id).maybeSingle(),
    client
      .from("listing_photos")
      .select("*")
      .eq("listing_id", id)
      .order("sort_order", { ascending: true }),
    client
      .from("listing_pois")
      .select("*")
      .eq("listing_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!listing) notFound();

  const error = getSingleParam(resolvedSearchParams?.error).trim();
  const saved = getSingleParam(resolvedSearchParams?.saved) === "1";
  const savedAtRaw = getSingleParam(resolvedSearchParams?.savedAt).trim();
  const savedAt = Number(savedAtRaw);
  const hasSavedAt = Number.isFinite(savedAt) && savedAt > 0;

  return (
    <div className="space-y-4">
      <div className="lift-hover rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Editar inmueble</h1>
            <p className="text-sm text-muted">{listing.title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/listings"
              className="lift-hover inline-flex min-h-10 items-center rounded-full border border-stone-200 px-4 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Volver al listado
            </Link>
            <Link
              href={`/listing/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lift-hover inline-flex min-h-10 items-center rounded-full border border-stone-200 px-4 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Ver público
            </Link>
            <DuplicateListingButton
              listingId={listing.id}
              listingTitle={listing.title}
            />
            <DeleteListingButton
              listingId={listing.id}
              listingTitle={listing.title}
            />
          </div>
        </div>

        {saved && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Cambios guardados correctamente
            {hasSavedAt ? ` (${formatSavedAtLabel(savedAt)}).` : "."}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>

      <ListingForm
        mode="edit"
        action={updateListingAction}
        listing={listing as Listing}
        photos={(photos as ListingPhoto[]) ?? []}
        pois={(pois as ListingPoi[]) ?? []}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
