import Skeleton from "@/components/ui/Skeleton";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-bg-border bg-bg-surface shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-1">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-full" />
        </div>
        <Skeleton className="h-4 w-52 rounded-lg" />
        <Skeleton className="h-5 w-28 rounded-lg" />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-14 sm:px-6">
      <section className="space-y-3 text-center">
        <Skeleton className="mx-auto h-9 w-80 rounded-2xl sm:w-[26rem]" />
        <Skeleton className="mx-auto h-5 w-72 rounded-full sm:w-96" />
        <Skeleton className="mx-auto h-4 w-64 rounded-full" />
      </section>

      <div className="mt-8 space-y-5">
        <Skeleton className="mx-auto h-16 w-full max-w-2xl rounded-full" />
        <Skeleton className="mx-auto h-11 w-full max-w-md rounded-full" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
