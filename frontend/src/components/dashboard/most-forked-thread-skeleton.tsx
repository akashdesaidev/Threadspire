import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MostForkedThreadSkeleton() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Most Forked Thread</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-4/5" />

          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        <div className="pt-4">
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
