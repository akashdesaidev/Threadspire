"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, GitFork, ExternalLink } from "lucide-react";
import { MostForkedThreadSkeleton } from "./most-forked-thread-skeleton";

interface MostForkedThread {
  threadId: string;
  title: string;
  forkCount: number;
  publishDate: string;
}

interface MostForkedThreadProps {
  mostForkedThread: MostForkedThread | null;
  loading?: boolean;
}

export function MostForkedThread({
  mostForkedThread,
  loading = false,
}: MostForkedThreadProps) {
  if (loading) {
    return <MostForkedThreadSkeleton />;
  }

  if (!mostForkedThread) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Most Forked Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <GitFork className="h-10 w-10 mb-2 text-muted-foreground/50" />
            <p>No forks yet</p>
            <p className="mt-2 text-sm">
              When your threads get forked, the most popular one will appear
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = new Date(
    mostForkedThread.publishDate
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Most Forked Thread</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium text-lg">{mostForkedThread.title}</h3>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-base flex gap-1.5 py-1.5"
            >
              <GitFork className="h-4 w-4" />
              <span>
                {mostForkedThread.forkCount} fork
                {mostForkedThread.forkCount !== 1 ? "s" : ""}
              </span>
            </Badge>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href={`/threads/${mostForkedThread.threadId}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View thread
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
