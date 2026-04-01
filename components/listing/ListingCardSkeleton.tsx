import Skeleton from "@/components/ui/Skeleton";

interface ListingCardSkeletonProps {
  count?: number;
}

export default function ListingCardSkeleton({ count = 6 }: ListingCardSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-card border border-bg-border bg-bg-surface shadow-card"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3 w-40 rounded-full" />
            </div>
            <Skeleton className="h-4 w-[78%] rounded-lg" />
            <Skeleton className="h-4 w-[58%] rounded-lg" />
            <div className="flex items-end gap-2 pt-0.5">
              <Skeleton className="h-6 w-28 rounded-lg" />
              <Skeleton className="h-3.5 w-16 rounded-full" />
            </div>
            <div className="flex gap-1.5 overflow-hidden pt-1">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-[4.5rem] rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
