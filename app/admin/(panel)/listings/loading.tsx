import Skeleton from "@/components/ui/Skeleton";

export default function AdminListingsLoading() {
  return (
    <div className="space-y-5">
      <div className="rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-64 rounded-full" />
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>

      <section className="space-y-3 rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-bg-border bg-bg-elevated p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-24 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-56 rounded-full" />
                  <Skeleton className="h-3 w-36 rounded-full" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
