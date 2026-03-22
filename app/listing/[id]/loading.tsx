import Skeleton from "@/components/ui/Skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <Skeleton className="mb-4 h-4 w-44 rounded-full" />

      <section className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <Skeleton className="h-9 w-72 rounded-2xl sm:w-96" />
            <Skeleton className="h-4 w-56 rounded-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>

          <Skeleton className="h-16 w-36 rounded-2xl" />
        </div>

        <div className="mt-5 grid gap-1.5 md:grid-cols-[2fr_1fr] md:grid-rows-2">
          <Skeleton className="aspect-[4/3] rounded-[24px] md:row-span-2 md:min-h-[420px]" />
          <Skeleton className="hidden rounded-[20px] md:block" />
          <Skeleton className="hidden rounded-[20px] md:block" />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Skeleton className="h-20 w-full rounded-2xl lg:hidden" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-stone-200 bg-white p-5"
            >
              <Skeleton className="h-6 w-40 rounded-full" />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-16 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-card">
            <Skeleton className="h-7 w-44 rounded-full" />
            <div className="mt-5 space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
