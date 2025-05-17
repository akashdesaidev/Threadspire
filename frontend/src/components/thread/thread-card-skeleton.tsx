import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkButtonSkeleton } from "./bookmark-button-skeleton";

interface ThreadCardSkeletonProps {
  className?: string;
}

export function ThreadCardSkeleton({ className }: ThreadCardSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg border p-5 transition-shadow",
        className
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-6" />
          <BookmarkButtonSkeleton />
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <Skeleton className="h-4 w-24" />
        <span className="mx-1">•</span>
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="space-y-3 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton variant="tag" />
        <Skeleton variant="tag" />
        <Skeleton variant="tag" />
      </div>
    </div>
  );
}
