import Skeleton from "@/components/ui/Skeleton";

export default function AdminRootLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Skeleton className="h-28 w-full rounded-card" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    </div>
  );
}
