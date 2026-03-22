import { Suspense } from "react";
import { getActiveListings } from "@/lib/data/listings";
import SearchAndResults from "@/components/search/SearchAndResults";
import Skeleton from "@/components/ui/Skeleton";

export const revalidate = 60;

export default async function HomePage() {
  const listings = await getActiveListings();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-14 sm:px-6">
      {/* Hero */}
      <section className="stagger-list space-y-3 text-center">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl">
          Encuentra tu arriendo en{" "}
          <span className="text-accent">Bogotá</span>
        </h1>
        <p className="mx-auto max-w-md text-[15px] leading-relaxed text-muted">
          Apartamentos, habitaciones y casas con contacto directo.
          Sin intermediarios.
        </p>
      </section>

      {/* Search + filtered results (client component) */}
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="space-y-5">
              <Skeleton className="mx-auto h-16 w-full max-w-2xl rounded-2xl" />
              <Skeleton className="mx-auto h-11 w-full max-w-md rounded-full" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-card border border-stone-200 bg-white p-0 shadow-card"
                  >
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-3 w-40 rounded-full" />
                      <Skeleton className="h-4 w-52 rounded-full" />
                      <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <SearchAndResults listings={listings} />
        </Suspense>
      </div>
    </div>
  );
}
