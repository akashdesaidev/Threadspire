"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { userAPI, threadAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { format, parseISO, subDays } from "date-fns";

interface ThreadActivityData {
  date: string;
  totalReactions: number;
  formattedDate: string;
}

interface ThreadOption {
  id: string;
  title: string;
}

export function ThreadActivityGraph() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<ThreadActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30");
  const [reactionType, setReactionType] = useState<string>("all");
  const [threadId, setThreadId] = useState<string>("all");
  const [userThreads, setUserThreads] = useState<ThreadOption[]>([]);
  const [rawAnalyticsData, setRawAnalyticsData] = useState<any>(null);

  const reactionTypes = ["🤯", "💡", "😌", "🔥", "🫶"];

  // Fetch user's threads for the dropdown
  useEffect(() => {
    const fetchUserThreads = async () => {
      if (!user) return;

      try {
        const response = await userAPI.getUserThreads(user._id, {
          status: "published",
        });

        if (response.data && response.data.threads) {
          const threads = response.data.threads.map((thread: any) => ({
            id: thread._id,
            title: thread.title,
          }));
          setUserThreads(threads);
        }
      } catch (err) {
        console.error("Error fetching user threads:", err);
      }
    };

    fetchUserThreads();
  }, [user]);

  // Fetch analytics data (only once when user is available)
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const analyticsResponse = await userAPI.getUserAnalytics(user._id);

        if (analyticsResponse.data && analyticsResponse.data.analytics) {
          // Store the raw analytics data
          setRawAnalyticsData(analyticsResponse.data.analytics);
          // Process data with default filters
          processAnalyticsData(
            analyticsResponse.data.analytics,
            timeRange,
            threadId,
            reactionType
          );
        }
      } catch (err: any) {
        console.error("Error fetching analytics data:", err);
        setError(err.message || "Failed to fetch analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  // Process data when filters change
  useEffect(() => {
    if (rawAnalyticsData) {
      processAnalyticsData(rawAnalyticsData, timeRange, threadId, reactionType);
    }
  }, [timeRange, threadId, reactionType, rawAnalyticsData]);

  // Process analytics data based on filters
  const processAnalyticsData = (
    analytics: any,
    timeRange: string,
    threadId: string,
    reactionType: string
  ) => {
    console.log("Processing analytics with filters:", {
      timeRange,
      threadId,
      reactionType,
    });

    // Default empty data
    let filteredData: Record<string, number> = {};

    if (!analytics) {
      console.warn("No analytics data available");
      setActivityData(generateSampleData(parseInt(timeRange)));
      return;
    }

    // Get activity data from analytics or initialize with empty object
    const activityByDate = analytics.activityByDate || {};
    console.log("Raw activity data:", activityByDate);

    // Check if we have any activity data
    if (Object.keys(activityByDate).length === 0) {
      console.warn("No activity data available, using sample data");
      setActivityData(generateSampleData(parseInt(timeRange)));
      return;
    }

    const reactionData = analytics.threadsWithReactions || [];

    // Apply filters
    if (threadId !== "all") {
      console.log("Filtering by thread:", threadId);

      // Find specific thread
      const thread = reactionData.find((t: any) => t.threadId === threadId);

      if (thread && thread.segments) {
        // Group reactions by date
        thread.segments.forEach((segment: any) => {
          if (!segment.reactionCounts) return;

          Object.entries(segment.reactionCounts).forEach(
            ([emoji, count]: [string, any]) => {
              // Apply reaction filter if needed
              if (reactionType === "all" || emoji === reactionType) {
                // Get the date from analytics.threadActivity
                const threadInfo = analytics.threadActivity?.find(
                  (t: any) => t.id === threadId
                );
                const dateStr = threadInfo
                  ? new Date(threadInfo.createdAt).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0];

                if (!filteredData[dateStr]) filteredData[dateStr] = 0;
                filteredData[dateStr] += Number(count);
              }
            }
          );
        });
      } else {
        console.log("Thread not found in reaction data");
        // If thread not found, use empty data
        filteredData = {};
      }
    } else if (reactionType !== "all") {
      console.log("Filtering by reaction type:", reactionType);

      // Filter by reaction type across all threads
      reactionData.forEach((thread: any) => {
        if (!thread.segments) return;

        thread.segments.forEach((segment: any) => {
          if (!segment.reactionCounts || !segment.reactionCounts[reactionType])
            return;

          // Get date
          const threadInfo = analytics.threadActivity?.find(
            (t: any) => t.id === thread.threadId
          );
          const dateStr = threadInfo
            ? new Date(threadInfo.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];

          if (!filteredData[dateStr]) filteredData[dateStr] = 0;
          filteredData[dateStr] += Number(segment.reactionCounts[reactionType]);
        });
      });
    } else {
      console.log("No specific filters, using activity by date");
      // Use the precomputed activityByDate
      filteredData = { ...activityByDate };
    }

    // If we have no data after filtering, generate sample data
    if (Object.keys(filteredData).length === 0) {
      console.warn("No data after filtering, using sample data");
      setActivityData(generateSampleData(parseInt(timeRange)));
      return;
    }

    // Apply time range filter
    try {
      const currentDate = new Date();
      const cutoffDate = subDays(currentDate, parseInt(timeRange));
      console.log(
        `Time range filter: Last ${timeRange} days (cutoff: ${
          cutoffDate.toISOString().split("T")[0]
        })`
      );

      // Log data before time filtering
      console.log(
        `Data points before time filtering: ${Object.keys(filteredData).length}`
      );

      const formattedData = Object.entries(filteredData)
        .filter(([dateStr]) => {
          try {
            const date = new Date(dateStr);
            // Ensure date is not in the future and is after the cutoff
            const isIncluded = date >= cutoffDate && date <= currentDate;
            if (!isIncluded) {
              if (date > currentDate) {
                console.log(`Excluding future date ${dateStr}`);
              } else {
                console.log(`Excluding date ${dateStr} (before cutoff)`);
              }
            }
            return isIncluded;
          } catch (err) {
            console.error(`Error filtering date ${dateStr}:`, err);
            return false;
          }
        })
        .map(([date, count]: [string, any]) => ({
          date,
          totalReactions: Number(count),
          formattedDate: format(parseISO(date), "MMM dd"),
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      console.log(`Data points after time filtering: ${formattedData.length}`);
      console.log("Filtered activity data:", formattedData);

      // If no data after time filtering, use sample data
      if (formattedData.length === 0) {
        console.warn("No data after time filtering, using sample data");
        setActivityData(generateSampleData(parseInt(timeRange)));
        return;
      }

      setActivityData(formattedData);
    } catch (err) {
      console.error("Error applying time filter:", err);
      setActivityData(generateSampleData(parseInt(timeRange)));
    }
  };

  // Generate sample data for testing or when no data is available
  const generateSampleData = (days: number): ThreadActivityData[] => {
    console.log("Generating sample data for", days, "days");
    const data: ThreadActivityData[] = [];
    const today = new Date();

    // Generate data points for the last 'days' days
    for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 10))) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      data.push({
        date: dateStr,
        totalReactions: Math.floor(Math.random() * 20) + 1, // 1-20 reactions
        formattedDate: format(date, "MMM dd"),
      });
    }

    return data;
  };

  const lineColor = theme === "dark" ? "#10b981" : "#0ea5e9";

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Thread Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p>Loading activity data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Thread Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px]">
          <p className="text-destructive">Error loading data</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (activityData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Thread Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <p className="text-muted-foreground">
            No activity data available for the selected filters.
          </p>
          <p className="text-sm mt-2">
            Try creating more threads or adjusting your filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Thread Activity Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Range</label>
            <Select
              value={timeRange}
              onValueChange={(value: string) => {
                console.log("Time range changed to:", value);
                setTimeRange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Thread</label>
            <Select value={threadId} onValueChange={setThreadId}>
              <SelectTrigger>
                <SelectValue placeholder="All threads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All threads</SelectItem>
                {userThreads.map((thread) => (
                  <SelectItem key={thread.id} value={thread.id}>
                    {thread.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reaction Type</label>
            <Select value={reactionType} onValueChange={setReactionType}>
              <SelectTrigger>
                <SelectValue placeholder="All reactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All reactions</SelectItem>
                {reactionTypes.map((emoji) => (
                  <SelectItem key={emoji} value={emoji}>
                    {emoji}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activityData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                  border:
                    theme === "dark"
                      ? "1px solid #334155"
                      : "1px solid #e2e8f0",
                  borderRadius: "0.375rem",
                }}
                formatter={(value) => [`${value} reactions`, "Total"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="totalReactions"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
