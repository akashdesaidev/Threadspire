import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ReactionSkeletonProps {
  className?: string;
}

export function ReactionSkeleton({ className }: ReactionSkeletonProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {/* Generate 5 reaction skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8 rounded-full" />
      ))}
    </div>
  );
}
