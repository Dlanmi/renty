import Skeleton from "@/components/ui/Skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6 lg:py-8">
      {/* ── Breadcrumb (desktop only) ── */}
      <div className="mb-4 hidden items-center gap-1 lg:flex">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      {/* ── Hero: title + gallery, reordered via CSS order ── */}
      <div className="flex flex-col">
        {/* Title group: order-2 mobile, order-1 desktop */}
        <div className="order-2 mt-5 space-y-2 text-center lg:order-1 lg:mt-0 lg:mb-5 lg:text-left">
          <div className="flex items-center justify-center gap-4 lg:justify-between">
            <Skeleton className="h-7 w-[min(22rem,90%)] rounded-2xl lg:h-9 lg:w-[28rem]" />
            <Skeleton className="hidden h-11 w-11 shrink-0 rounded-xl lg:block" />
          </div>
          <div className="flex items-center justify-center gap-1.5 lg:justify-start">
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-48 rounded-full" />
          </div>
          {/* Mobile inline specs */}
          <Skeleton className="mx-auto h-4 w-56 rounded-full lg:hidden" />
        </div>

        {/* Gallery: order-1 mobile, order-2 desktop */}
        <div className="order-1 -mx-4 sm:-mx-6 lg:order-2 lg:mx-0">
          {/* Mobile: full-bleed carousel skeleton */}
          <div className="lg:hidden">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
          </div>
          {/* Desktop: mosaic grid skeleton */}
          <div className="hidden lg:block">
            <div className="grid aspect-[16/9] grid-cols-4 grid-rows-2 gap-[3px] overflow-hidden rounded-xl">
              <Skeleton className="col-span-2 row-span-2 rounded-none" />
              <Skeleton className="rounded-none" />
              <Skeleton className="rounded-none" />
              <Skeleton className="rounded-none" />
              <Skeleton className="rounded-none" />
            </div>
          </div>
        </div>

        {/* Desktop chips */}
        <div className="order-3 mt-4 hidden gap-2 lg:flex">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Specs column */}
        <div className="space-y-5">
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
          <div className="space-y-3">
            <div className="rounded-2xl border border-accent/15 bg-bg-surface px-4 py-3 shadow-card">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="mt-2 h-4 w-56 rounded-full" />
            </div>

            <div className="rounded-card-lg border border-bg-border bg-bg-surface shadow-card">
              <div className="border-b border-bg-border bg-gradient-to-br from-accent-dark/20 via-bg-surface to-bg-elevated px-6 py-4">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="mt-2 h-8 w-40 rounded-lg" />
                <div className="mt-3 rounded-2xl border border-accent/15 bg-accent/10 px-4 py-3">
                  <Skeleton className="h-3 w-36 rounded-full" />
                  <Skeleton className="mt-2 h-5 w-28 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-44 rounded-full" />
                </div>
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
      </div>

      {/* Spacer for mobile fixed CTA */}
      <div className="h-40 lg:hidden" />
    </div>
  );
}
