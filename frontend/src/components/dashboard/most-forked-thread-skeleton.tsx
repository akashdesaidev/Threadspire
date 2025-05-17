import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MostForkedThreadSkeleton() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Forked Threads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* First thread skeleton */}
        <div className="border-b pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <div className="mt-1">
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </div>
          <div className="pt-2">
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        {/* Second thread skeleton */}
        <div className="border-b pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <div className="mt-1">
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </div>
          <div className="pt-2">
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
