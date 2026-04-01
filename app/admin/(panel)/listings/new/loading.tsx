import Skeleton from "@/components/ui/Skeleton";

export default function AdminNewListingLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-72 rounded-full" />
      </div>

      <div className="rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-11 w-40 rounded-xl" />
      </div>
    </div>
  );
}
