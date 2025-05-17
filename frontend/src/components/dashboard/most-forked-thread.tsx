"use client";

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, GitFork, ExternalLink } from "lucide-react";
import { MostForkedThreadSkeleton } from "./most-forked-thread-skeleton";

interface ForkedThread {
  threadId: string;
  title: string;
  forkCount: number;
  publishDate: string;
}

interface ForkedThreadsListProps {
  mostForkedThread: ForkedThread | null;
  forksByThread: Record<string, Array<any>>;
  loading?: boolean;
}

export function ForkedThreadsList({
  mostForkedThread,
  forksByThread,
  loading = false,
}: ForkedThreadsListProps) {
  const [isPending, startTransition] = useTransition();
  const [forkedThreads, setForkedThreads] = useState<ForkedThread[]>([]);

  // Use transition to process and sort threads data
  useEffect(() => {
    if (!loading) {
      startTransition(() => {
        // Start with the most forked thread if available
        const threads: ForkedThread[] = [];
        if (mostForkedThread) {
          threads.push(mostForkedThread);
        }

        // Process forksByThread to extract more threads with fork counts
        if (forksByThread) {
          Object.entries(forksByThread).forEach(([threadId, forks]) => {
            // Skip if this is the same as the most forked thread
            if (mostForkedThread && threadId === mostForkedThread.threadId) {
              return;
            }

            // Only add threads that have at least one fork
            if (forks && forks.length > 0) {
              // Get thread info from the first fork
              const firstFork = forks[0];
              threads.push({
                threadId,
                title: firstFork.originalThreadTitle || "Unknown Thread",
                forkCount: forks.length,
                publishDate: firstFork.createdAt || new Date().toISOString(),
              });
            }
          });
        }

        // Sort threads by fork count in descending order
        const sortedThreads = threads.sort((a, b) => b.forkCount - a.forkCount);
        setForkedThreads(sortedThreads);
      });
    }
  }, [mostForkedThread, forksByThread, loading]);

  if (loading || isPending) {
    return <MostForkedThreadSkeleton />;
  }

  if (forkedThreads.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Forked Threads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <GitFork className="h-10 w-10 mb-2 text-muted-foreground/50" />
            <p>No forks yet</p>
            <p className="mt-2 text-sm">
              When your threads get forked, they will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Forked Threads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {forkedThreads.map((thread) => (
          <div
            key={thread.threadId}
            className="border-b pb-4 last:border-b-0 last:pb-0"
          >
            <div className="space-y-2">
              <h3 className="font-medium text-lg">{thread.title}</h3>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(thread.publishDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className="text-base flex gap-1.5 py-1.5"
                >
                  <GitFork className="h-4 w-4" />
                  <span>
                    {thread.forkCount} fork
                    {thread.forkCount !== 1 ? "s" : ""}
                  </span>
                </Badge>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" asChild size="sm">
                <Link href={`/threads/${thread.threadId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View thread
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
