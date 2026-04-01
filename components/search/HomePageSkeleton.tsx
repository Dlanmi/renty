import ListingCardSkeleton from "@/components/listing/ListingCardSkeleton";
import Skeleton from "@/components/ui/Skeleton";
import {
  HOME_SEARCH_HERO_CARD_POSITION_CLASS,
  HOME_SEARCH_HERO_MEDIA_HEIGHT_CLASS,
  HOME_SEARCH_HERO_OVERLAY_SHELL_CLASS,
} from "@/components/search/homeSearchHeroLayout";

function HomeSearchHeroSkeleton() {
  return (
    <div className="space-y-6">
      <div className="md:relative">
        <div
          className={`relative overflow-hidden rounded-none bg-bg-elevated md:rounded-none ${HOME_SEARCH_HERO_MEDIA_HEIGHT_CLASS}`}
        >
          <Skeleton className="h-full w-full rounded-none" />
        </div>

        <div className="pointer-events-none">
          <div className={HOME_SEARCH_HERO_OVERLAY_SHELL_CLASS}>
            <div className={HOME_SEARCH_HERO_CARD_POSITION_CLASS}>
              <div className="w-full rounded-[24px] border border-bg-border bg-bg-surface px-6 py-6 shadow-[0_8px_32px_rgba(15,23,42,0.10),0_32px_80px_rgba(15,23,42,0.14)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.28),0_32px_80px_rgba(0,0,0,0.40)] sm:px-7 sm:py-7 md:max-w-[460px] lg:max-w-[480px]">
                <div className="space-y-2.5">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-8 w-4/5 rounded-2xl sm:h-9" />
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-[16px] border border-transparent bg-bg-elevated px-4 py-3.5 dark:bg-bg-surface">
                    <Skeleton className="h-3 w-28 rounded-full" />
                    <Skeleton className="mt-3 h-6 w-2/3 rounded-lg" />
                  </div>

                  <div className="grid gap-3 min-[480px]:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-[16px] border border-transparent bg-bg-elevated px-4 py-3.5 dark:bg-bg-surface"
                      >
                        <Skeleton className="h-3 w-24 rounded-full" />
                        <Skeleton className="mt-3 h-6 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Skeleton className="h-[52px] w-full rounded-full" />
                    <div className="flex justify-end">
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6">
        <div className="rounded-[28px] border border-bg-border bg-bg-surface px-5 py-5 shadow-card sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-8 w-64 rounded-2xl" />
              <Skeleton className="h-4 w-[min(32rem,100%)] rounded-full" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        </div>

        <ListingCardSkeleton count={6} />
      </div>
    </div>
  );
}

export default function HomePageSkeleton() {
  return <HomeSearchHeroSkeleton />;
}
