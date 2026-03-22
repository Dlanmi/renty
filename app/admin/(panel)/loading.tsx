import Skeleton from "@/components/ui/Skeleton";

export default function AdminPanelLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Skeleton className="mb-6 h-24 w-full rounded-card" />
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    </div>
  );
}
