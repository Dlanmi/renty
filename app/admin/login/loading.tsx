import Skeleton from "@/components/ui/Skeleton";

export default function AdminLoginLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-72 rounded-full" />

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
