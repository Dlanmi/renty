import Skeleton from "@/components/ui/Skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      {/* Hero card */}
      <section className="rounded-[28px] border border-bg-border bg-bg-surface p-4 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <Skeleton className="h-9 w-72 rounded-2xl sm:w-96" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-48 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-16 w-36 shrink-0 rounded-2xl" />
        </div>

        {/* Gallery skeleton — main image + thumbnail strip */}
        <div className="mt-5">
          <div className="overflow-hidden rounded-[26px] border border-bg-border bg-bg-elevated">
            <Skeleton className="aspect-[4/3] w-full rounded-none md:aspect-[16/9] md:min-h-[420px]" />
            <div className="flex gap-2 border-t border-bg-border bg-bg-surface p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-24 shrink-0 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Specs column */}
        <div className="space-y-5">
          {/* Mobile price */}
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-4 lg:hidden">
            <Skeleton className="h-8 w-44 rounded-lg" />
          </div>

          {/* Summary section */}
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-4 sm:p-5">
            <Skeleton className="h-5 w-48 rounded-full" />
            <Skeleton className="mt-1 h-3 w-56 rounded-full" />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-bg-border bg-bg-elevated px-4 py-3">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="mt-1.5 h-4 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Description section */}
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-4 sm:p-5">
            <Skeleton className="h-5 w-40 rounded-full" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
              <Skeleton className="h-4 w-3/4 rounded-full" />
            </div>
          </div>

          {/* Includes section */}
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-4 sm:p-5">
            <Skeleton className="h-5 w-36 rounded-full" />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="h-5 w-5 shrink-0 rounded" />
                  <Skeleton className="h-4 w-32 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Location section */}
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-4 sm:p-5">
            <Skeleton className="h-5 w-28 rounded-full" />
            <div className="mt-3 flex items-start gap-2.5">
              <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-3 w-56 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact sidebar (desktop) */}
        <div className="hidden lg:block">
          <div className="rounded-[24px] border border-bg-border bg-bg-surface shadow-card">
            <div className="border-b border-bg-border px-6 py-4">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="mt-2 h-7 w-44 rounded-lg" />
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-44 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="mx-auto h-3 w-48 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for mobile fixed CTA */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
