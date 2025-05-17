import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface BookmarkButtonSkeletonProps {
  className?: string;
}

export function BookmarkButtonSkeleton({
  className,
}: BookmarkButtonSkeletonProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-6 rounded" />
    </div>
  );
}
