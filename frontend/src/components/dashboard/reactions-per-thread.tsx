"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ReactionsPerThreadSkeleton } from "./reactions-per-thread-skeleton";

interface ReactionData {
  emoji: string;
  count: number;
}

interface SegmentData {
  segmentId: string;
  position: number;
  content: string;
  reactionCounts: Record<string, number>;
  totalReactions: number;
}

interface ThreadWithReactions {
  threadId: string;
  title: string;
  segments: SegmentData[];
  topReactedSegment: {
    segmentId: string;
    position: number;
    content: string;
    totalReactions: number;
  } | null;
}

interface ReactionsPerThreadProps {
  threadsWithReactions: ThreadWithReactions[];
  loading?: boolean;
}

export function ReactionsPerThread({
  threadsWithReactions,
  loading = false,
}: ReactionsPerThreadProps) {
  const [isPending, startTransition] = useTransition();
  const [localData, setLocalData] = useState<ThreadWithReactions[]>([]);
  const [selectedThread, setSelectedThread] = useState<string>("");

  // Use transition to update local data when props change
  useEffect(() => {
    if (!loading && threadsWithReactions) {
      startTransition(() => {
        setLocalData(threadsWithReactions);
        // Update selected thread if needed
        if (threadsWithReactions.length > 0 && !selectedThread) {
          setSelectedThread(threadsWithReactions[0].threadId);
        }
      });
    }
  }, [threadsWithReactions, loading, selectedThread]);

  if (loading || isPending || !localData || localData.length === 0) {
    return <ReactionsPerThreadSkeleton />;
  }

  // Add more detailed debugging logs
  console.log("ReactionsPerThread component", {
    threadCount: localData?.length || 0,
    threadsData: localData?.map((t) => ({
      threadId: t.threadId,
      title: t.title,
      segmentsCount: t.segments?.length || 0,
      hasTopSegment: !!t.topReactedSegment,
    })),
  });

  // More defensive check for empty or undefined data
  if (!localData || localData.length === 0) {
    console.log("No reaction data available - rendering empty state");
    return (
      <Card className="col-span-full lg:col-span-4">
        <CardHeader>
          <CardTitle>Reactions Per Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p>No reaction data available yet.</p>
            <p className="mt-2 text-sm">
              Create and share more threads to get reactions!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safely find current thread and guard against null
  const currentThread =
    localData.find((t) => t.threadId === selectedThread) || localData[0]; // Fallback to first thread if selected thread not found

  console.log(
    "Selected thread data:",
    currentThread
      ? {
          threadId: currentThread.threadId,
          title: currentThread.title,
          segmentsCount: currentThread.segments?.length || 0,
          topReactedSegment: currentThread.topReactedSegment
            ? "present"
            : "missing",
        }
      : "No thread found"
  );

  // Defensive check for current thread
  if (!currentThread) {
    console.log("Current thread is undefined - rendering fallback message");
    return (
      <Card className="col-span-full lg:col-span-4">
        <CardHeader>
          <CardTitle>Reactions Per Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p>Could not load thread reaction data.</p>
            <p className="mt-2 text-sm">Please try refreshing the page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure segments is always an array and never undefined
  const segments = currentThread.segments || [];

  // Format data for chart - with defensive checking
  const chartData = segments.map((segment) => {
    const data: any = {
      name: `Segment ${segment.position + 1}`,
      total: segment.totalReactions || 0,
    };

    // Add individual emoji counts with safety checks
    if (segment.reactionCounts) {
      Object.entries(segment.reactionCounts).forEach(([emoji, count]) => {
        data[emoji] = count || 0;
      });
    }

    return data;
  });

  console.log(
    "Chart data prepared:",
    chartData.length > 0 ? "data available" : "no data"
  );

  // Log first chart data item to inspect which emojis are present
  if (chartData.length > 0) {
    console.log("Sample chart data item:", chartData[0]);
  }

  const emojis = ["🤯", "💡", "😌", "🔥", "🫶"] as const;
  type EmojiType = (typeof emojis)[number];

  const emojiColors: Record<EmojiType, string> = {
    "🤯": "#FF5733", // Mind blown - orange/red
    "💡": "#FFC300", // Light bulb - yellow
    "😌": "#36A2EB", // Relieved - blue
    "🔥": "#FF6384", // Fire - pink/red
    "🫶": "#4BC0C0", // Heart hands - teal
  };

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle>Reactions Per Thread</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <div className="mb-4">
            <select
              className="w-full p-2 border rounded-md bg-background"
              value={selectedThread}
              onChange={(e) => setSelectedThread(e.target.value)}
            >
              {localData.map((thread) => (
                <option key={thread.threadId} value={thread.threadId}>
                  {thread.title}
                </option>
              ))}
            </select>
          </div>

          {currentThread.topReactedSegment && (
            <div className="p-3 mb-4 border rounded-md bg-muted/50">
              <h4 className="font-medium">Top Reacted Segment</h4>
              <p className="text-sm text-muted-foreground mb-1">
                Segment {currentThread.topReactedSegment.position + 1} •{" "}
                {currentThread.topReactedSegment.totalReactions} reactions
              </p>
              <p className="text-sm italic">
                {currentThread.topReactedSegment.content}
              </p>
            </div>
          )}

          <TabsContent value="chart" className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2} barSize={20}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value, name) => {
                      const nameStr = String(name);
                      if (emojis.some((emoji) => emoji === nameStr)) {
                        return [`${value} ${nameStr}`, ""];
                      }
                      return [value, nameStr];
                    }}
                  />
                  {emojis.map((emoji) => {
                    // Check if this emoji appears in any segment
                    const hasData = chartData.some(
                      (item) =>
                        typeof item[emoji] === "number" && item[emoji] > 0
                    );

                    return hasData ? (
                      <Bar
                        key={emoji}
                        dataKey={emoji}
                        stackId="reactions"
                        fill={emojiColors[emoji]}
                        name={emoji}
                      />
                    ) : null;
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-2">
              {segments.map((segment) => (
                <div key={segment.segmentId} className="p-3 border rounded-md">
                  <h4 className="font-medium">
                    Segment {segment.position + 1}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    {segment.content}
                  </p>
                  <div className="flex gap-3 mt-2">
                    {Object.entries(segment.reactionCounts)
                      .filter(([_, count]) => count > 0)
                      .map(([emoji, count]) => (
                        <div key={emoji} className="flex items-center gap-1">
                          <span>{emoji}</span>
                          <span className="text-sm">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
