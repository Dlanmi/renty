import Skeleton from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
      <section className="overflow-hidden rounded-[32px] border border-bg-border bg-gradient-to-br from-bg-base via-bg-surface to-bg-surface px-5 py-10 shadow-md sm:px-8 sm:py-12">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-8 w-40 rounded-full" />
          <Skeleton className="mx-auto h-12 w-72 rounded-2xl sm:w-[34rem]" />
          <Skeleton className="mx-auto h-5 w-72 rounded-full sm:w-96" />
          <Skeleton className="mx-auto h-11 w-44 rounded-full" />
          <Skeleton className="mx-auto h-4 w-80 rounded-full sm:w-[28rem]" />
        </div>
      </section>

      <div className="mt-10 space-y-6">
        <Skeleton className="h-16 w-full rounded-[28px]" />
        <Skeleton className="mx-auto h-11 w-full max-w-md rounded-full" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[22px] border border-bg-border bg-bg-surface p-0 shadow-md"
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
