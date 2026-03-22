import Skeleton from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-14 sm:px-6">
      <section className="space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-72 rounded-2xl sm:w-96" />
        <Skeleton className="mx-auto h-4 w-64 rounded-full sm:w-80" />
        <Skeleton className="mx-auto h-4 w-56 rounded-full sm:w-72" />
      </section>

      <div className="mt-8 space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="mx-auto h-11 w-full max-w-md rounded-full" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-card border border-stone-200 bg-white p-0 shadow-card"
            >
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-40 rounded-full" />
                <Skeleton className="h-4 w-56 rounded-full" />
                <Skeleton className="h-6 w-36 rounded-full" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-6 rounded-full" />
                  <Skeleton className="h-6 rounded-full" />
                  <Skeleton className="h-6 rounded-full" />
                  <Skeleton className="h-6 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
