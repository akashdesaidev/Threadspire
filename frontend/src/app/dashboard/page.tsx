"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/lib/auth-context";
import { userAPI, threadAPI } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThreadCard } from "@/components/thread/thread-card";
import Link from "next/link";
import {
  PenSquare,
  FolderClosed,
  Archive,
  Bookmark,
  Trash2,
  Share2,
  Edit,
  BarChart,
} from "lucide-react";
import { toast } from "sonner";
import { ReactionsPerThread } from "@/components/dashboard/reactions-per-thread";
import { ForkedThreadsList } from "@/components/dashboard/most-forked-thread";
import { ThreadActivityGraph } from "@/components/dashboard/thread-activity-graph";

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [draftThreads, setDraftThreads] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalThreads: 0,
    totalBookmarks: 0,
    totalCollections: 0,
    totalReactions: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<any>({
    threadsWithReactions: [],
    mostForkedThread: null,
  });
  const [loading, setLoading] = useState(true);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [publishingThreadId, setPublishingThreadId] = useState<string | null>(
    null
  );
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 6, // Adjust the limit as needed
  });

  // Draft pagination state
  const [draftPagination, setDraftPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 6, // Adjust the limit as needed
  });

  // Get active tab from URL params or default to "published"
  const activeTab = searchParams.get("tab") || "published";

  // Get page info from URL
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam && !isNaN(Number(pageParam))) {
      const page = Number(pageParam);
      if (page > 0) {
        if (activeTab === "drafts") {
          setDraftPagination((prev) => ({ ...prev, page }));
        } else {
          setPagination((prev) => ({ ...prev, page }));
        }
      }
    } else {
      // Reset to page 1 when no param
      if (activeTab === "drafts") {
        setDraftPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [
    user,
    authLoading,
    router,
    refreshCounter,
    pagination.page,
    draftPagination.page,
    activeTab,
  ]);

  const forceRefresh = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("Fetching dashboard data...");

      // Determine which pagination to use based on activeTab
      const currentPage =
        activeTab === "drafts" ? draftPagination.page : pagination.page;
      const currentLimit =
        activeTab === "drafts" ? draftPagination.limit : pagination.limit;

      // Fetch all data in parallel
      const [
        publishedResponse,
        draftResponse,
        collectionsResponse,
        bookmarksResponse,
        analyticsResponse,
      ] = await Promise.all([
        userAPI.getUserThreads(user._id, {
          status: "published",
          page: activeTab === "published" ? currentPage : 1,
          limit: pagination.limit,
        }),
        userAPI.getUserThreads(user._id, {
          status: "draft",
          page: activeTab === "drafts" ? currentPage : 1,
          limit: draftPagination.limit,
        }),
        userAPI.getCollections(user._id),
        threadAPI.getBookmarkedThreads(),
        userAPI.getUserAnalytics(user._id).catch((err) => {
          console.error("Analytics fetch error:", err);
          return { data: { analytics: null } };
        }),
      ]);

      // Process published threads
      setThreads(publishedResponse?.data?.threads || []);

      // Update published threads pagination
      if (publishedResponse?.data?.pagination) {
        setPagination(publishedResponse.data.pagination);
      }

      // Process draft threads
      const drafts = draftResponse?.data?.threads || [];
      console.log(`Found ${drafts.length} draft threads`);
      setDraftThreads(drafts);

      // Update draft threads pagination
      if (draftResponse?.data?.pagination) {
        setDraftPagination(draftResponse.data.pagination);
      }

      // Process collections
      setCollections(collectionsResponse?.data?.collections || []);

      // Process bookmarks - make sure we have accurate count
      const bookmarksList = bookmarksResponse?.data?.threads || [];
      setBookmarks(bookmarksList);
      const bookmarkCount =
        bookmarksResponse?.data?.pagination?.total || bookmarksList.length || 0;

      // Set analytics data
      if (analyticsResponse?.data?.analytics) {
        const analytics = analyticsResponse.data.analytics;

        // Set stats with analytics data and accurate bookmark count
        setStats({
          totalThreads: analytics.publishedThreads || 0,
          totalBookmarks: bookmarkCount, // Use bookmarks response for accurate count
          totalCollections: collectionsResponse?.data?.collections?.length || 0,
          totalReactions: analytics.reactionCounts
            ? Object.values(analytics.reactionCounts).reduce(
                (a: number, b: any) => a + (typeof b === "number" ? b : 0),
                0
              )
            : 0,
        });

        // Set advanced analytics data
        setAnalyticsData({
          threadsWithReactions: analytics.threadsWithReactions || [],
          mostForkedThread: analytics.mostForkedThread || null,
          forksByThread: analytics.forksByThread || {},
        });

        // Enhanced logging for reaction analytics debugging
        console.log("User analytics detail:", {
          bookmarks: analytics.totalBookmarks,
          bookmarksReceived: analytics.totalBookmarksReceived,
          threadsWithReactions: analytics.threadsWithReactions?.length || 0,
          threadsWithReactionsData: analytics.threadsWithReactions?.map(
            (thread: {
              threadId: string;
              title: string;
              segments?: Array<any>;
              topReactedSegment: any;
            }) => ({
              threadId: thread.threadId,
              title: thread.title,
              segmentsCount: thread.segments?.length || 0,
              hasTopReactedSegment: !!thread.topReactedSegment,
            })
          ),
          mostForkedThread: analytics.mostForkedThread ? "found" : "none",
        });

        // Add specific error checking for reaction data
        if (analytics.threadsWithReactions?.length > 0) {
          const allSegmentsHaveReactions = analytics.threadsWithReactions.every(
            (thread: { segments?: Array<any> }) =>
              thread.segments && thread.segments.length > 0
          );

          if (!allSegmentsHaveReactions) {
            console.warn(
              "Some threads are missing segment data in threadsWithReactions"
            );
          }
        }
      } else {
        // Fallback stats from fetched data
        setStats({
          totalThreads:
            publishedResponse?.data?.pagination?.total ||
            publishedResponse?.data?.threads?.length ||
            0,
          totalBookmarks:
            bookmarksResponse?.data?.pagination?.total ||
            bookmarksResponse?.data?.threads?.length ||
            0,
          totalCollections: collectionsResponse?.data?.collections?.length || 0,
          totalReactions: 0,
        });

        // Reset analytics data
        setAnalyticsData({
          threadsWithReactions: [],
          mostForkedThread: null,
          forksByThread: {},
        });
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data", err);
      toast.error(
        err.response?.data?.message || "Failed to load dashboard data",
        {
          description: "Please refresh the page or try again later",
        }
      );
    } finally {
      setLoading(false);
    }
  }, [
    user,
    pagination.page,
    pagination.limit,
    draftPagination.page,
    draftPagination.limit,
    activeTab,
  ]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    params.delete("page"); // Reset to page 1 when changing tabs
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }

    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleDeleteDraft = async (threadId: string) => {
    try {
      // First check if the thread exists
      const threadResponse = await threadAPI.getDraftThreadById(threadId);
      const { thread, relatedVersions } = threadResponse.data;

      const confirmMsg = relatedVersions?.publishedVersion
        ? "This draft has a published version. The published version will remain accessible but will no longer be linked to this draft. Continue with deletion?"
        : "Are you sure you want to delete this draft?";

      if (!confirm(confirmMsg)) return;

      setDeletingThreadId(threadId);

      // Log the deletion attempt for debugging
      console.log(`Attempting to delete draft thread: ${threadId}`);

      // Delete the thread
      const deleteResponse = await threadAPI.deleteThread(threadId);

      // If successful, remove the thread from local state immediately
      setDraftThreads((prev) => prev.filter((t) => t._id !== threadId));

      // Update the stats
      setStats((prev) => ({
        ...prev,
        totalThreads:
          thread.status === "published"
            ? prev.totalThreads - 1
            : prev.totalThreads,
      }));

      toast.success(`Draft "${thread.title}" deleted successfully`, {
        description: "The draft has been permanently removed",
      });

      // Force a complete refresh to ensure UI is in sync with backend
      setTimeout(() => {
        forceRefresh();
      }, 500);
    } catch (err: any) {
      console.error("Failed to delete draft:", err);

      // Show more detailed error information
      const errorMessage =
        err.response?.data?.message || "Failed to delete draft";
      const errorDetails =
        err.response?.status === 404
          ? "The draft may have already been deleted or doesn't exist."
          : err.response?.status === 403
          ? "You don't have permission to delete this draft."
          : "Please try again or contact support if the issue persists";

      toast.error(errorMessage, {
        description: errorDetails,
      });
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handlePublishDraft = async (threadId: string) => {
    try {
      setPublishingThreadId(threadId);

      // First check if the thread still exists and is a draft
      try {
        const checkResponse = await threadAPI.getDraftThreadById(threadId);
        const threadData = checkResponse.data.thread;

        if (threadData.status !== "draft") {
          // Thread already published or status changed
          toast.info("This draft has already been published", {
            description: "Refreshing your dashboard to show the latest status",
          });
          forceRefresh();
          setPublishingThreadId(null);
          return;
        }

        console.log(`Attempting to publish draft thread: ${threadId}`);

        // Update the thread to published status
        const updateResponse = await threadAPI.updateThread(threadId, {
          title: threadData.title,
          segments: threadData.segments,
          tags: threadData.tags,
          status: "published",
        });

        if (updateResponse.data.thread) {
          const publishedThread = updateResponse.data.thread;

          // Add to published threads and remove from drafts
          setThreads((prev) => [publishedThread, ...prev]);
          setDraftThreads((prev) => prev.filter((t) => t._id !== threadId));

          toast.success(`"${publishedThread.title}" published successfully`, {
            description: "Your thread is now available for others to read",
          });
        }

        // Force a refresh after a short delay to get updated lists
        setTimeout(() => {
          forceRefresh();
        }, 500);
      } catch (err) {
        // Thread not found or other error
        console.error("Error publishing thread:", err);
        toast.error("Error accessing the draft", {
          description:
            "The draft may have been deleted or is no longer accessible",
        });
        forceRefresh();
      }
    } catch (err: any) {
      console.error("Failed to publish draft:", err);
      toast.error(err.response?.data?.message || "Failed to publish draft", {
        description:
          "Please try again or contact support if the issue persists",
      });
    } finally {
      setPublishingThreadId(null);
    }
  };

  const handleDeletePublished = async (threadId: string) => {
    try {
      const threadResponse = await threadAPI.getThreadById(threadId);
      const { thread, relatedVersions } = threadResponse.data;

      const confirmMsg = relatedVersions?.draftVersion
        ? "This published thread is linked to a draft version. The draft will remain in your dashboard but will no longer be linked to this published thread. Continue with deletion?"
        : "Are you sure you want to delete this published thread?";

      if (!confirm(confirmMsg)) return;

      setDeletingThreadId(threadId);

      console.log(`Attempting to delete published thread: ${threadId}`);

      // Delete the thread
      const deleteResponse = await threadAPI.deleteThread(threadId);
      console.log("Delete response:", deleteResponse);

      // If successful, remove the thread from local state immediately
      setThreads((prev) => prev.filter((t) => t._id !== threadId));

      // Check if this thread was bookmarked and update bookmarks as well
      const wasBookmarked = bookmarks.some(
        (bookmark) => bookmark._id === threadId
      );
      if (wasBookmarked) {
        // Remove from bookmarks if present
        setBookmarks((prev) => prev.filter((b) => b._id !== threadId));

        // Update the bookmark count in stats
        setStats((prev) => ({
          ...prev,
          totalThreads: prev.totalThreads - 1,
          totalBookmarks: prev.totalBookmarks - 1,
        }));
      } else {
        // Just update thread count
        setStats((prev) => ({
          ...prev,
          totalThreads: prev.totalThreads - 1,
        }));
      }

      toast.success(`Thread "${thread.title}" deleted successfully`, {
        description: "The published thread has been permanently removed",
      });

      // Force a complete refresh to ensure UI is in sync with backend
      setTimeout(() => {
        forceRefresh();
      }, 500);
    } catch (err: any) {
      console.error("Failed to delete published thread:", err);

      // Show more detailed error information
      const errorMessage =
        err.response?.data?.message || "Failed to delete published thread";
      const errorDetails =
        err.response?.status === 404
          ? "The thread may have already been deleted or doesn't exist."
          : err.response?.status === 403
          ? "You don't have permission to delete this thread."
          : "Please try again or contact support if the issue persists";

      toast.error(errorMessage, {
        description: errorDetails,
      });
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleCreateCollection = async () => {
    const name = prompt("Enter a name for your new collection:");
    if (!name?.trim()) return;

    try {
      await userAPI.createCollection({ name: name.trim() });
      toast.success(`Collection "${name.trim()}" created successfully`, {
        description: "You can now add threads to this collection",
      });
      forceRefresh();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to create collection",
        {
          description:
            "Please try again or contact support if the issue persists",
        }
      );
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-10 bg-secondary rounded mb-4"></div>
            <div className="h-40 bg-secondary rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null; // Will redirect in the useEffect

  // Use the appropriate pagination for the active tab
  const currentPagination =
    activeTab === "drafts" ? draftPagination : pagination;

  return (
    <MainLayout>
      <div className="container max-w-7xl pb-12">
        <div className="flex items-center justify-between pb-6">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <div className="flex space-x-2">
            <Link
              href="/threads/create"
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PenSquare className="mr-2 h-4 w-4" />
              New Thread
            </Link>
          </div>
        </div>
        {/* Analytics Section */}
        <ThreadActivityGraph />

        {/* Other Analytics Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8 mt-8">
          <ReactionsPerThread
            threadsWithReactions={analyticsData.threadsWithReactions}
            loading={loading}
          />
          <ForkedThreadsList
            mostForkedThread={analyticsData.mostForkedThread}
            forksByThread={analyticsData.forksByThread}
            loading={loading}
          />
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<PenSquare className="h-4 w-4" />}
            title="Published Threads"
            value={stats.totalThreads}
          />
          <StatCard
            icon={<Archive className="h-4 w-4" />}
            title="Draft Threads"
            value={draftThreads.length || 0}
          />
          <StatCard
            icon={<Bookmark className="h-4 w-4" />}
            title="Bookmarks"
            value={stats.totalBookmarks}
          />
          <StatCard
            icon={<FolderClosed className="h-4 w-4" />}
            title="Collections"
            value={stats.totalCollections}
          />
        </div>
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 bg-secondary rounded-lg"></div>
              <div className="h-48 bg-secondary rounded-lg"></div>
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="mb-8"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
            </TabsList>

            <TabsContent value="published" className="space-y-4">
              {threads.length === 0 ? (
                <EmptyState
                  message="You haven't published any threads yet"
                  actionLabel="Create Thread"
                  actionHref="/threads/create"
                  actionIcon={<PenSquare className="h-4 w-4" />}
                />
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {threads.map((thread) => (
                      <ThreadCard
                        key={thread._id}
                        thread={thread}
                        actionButtons={
                          <button
                            className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded"
                            onClick={() => handleDeletePublished(thread._id)}
                            disabled={deletingThreadId === thread._id}
                            title="Delete published thread"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingThreadId === thread._id && (
                              <span className="sr-only">Deleting...</span>
                            )}
                          </button>
                        }
                      />
                    ))}
                  </div>

                  {/* Pagination for published threads */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 border rounded-md disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from({ length: pagination.pages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-3 py-1 border rounded-md ${
                              pagination.page === i + 1
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="px-3 py-1 border rounded-md disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
              {draftThreads.length === 0 ? (
                <EmptyState message="You don't have any draft threads" />
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {draftThreads.map((thread) => (
                      <ThreadCard
                        key={thread._id}
                        thread={thread}
                        actionButtons={
                          <>
                            <button
                              className="p-1.5 bg-secondary/80 text-primary hover:bg-secondary rounded"
                              onClick={() =>
                                router.push(`/threads/${thread._id}/edit`)
                              }
                              title="Edit draft"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded"
                              onClick={() => handlePublishDraft(thread._id)}
                              disabled={publishingThreadId === thread._id}
                              title="Publish draft"
                            >
                              <Share2 className="h-4 w-4" />
                              {publishingThreadId === thread._id && (
                                <span className="sr-only">Publishing...</span>
                              )}
                            </button>
                            <button
                              className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded"
                              onClick={() => handleDeleteDraft(thread._id)}
                              disabled={deletingThreadId === thread._id}
                              title="Delete draft"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingThreadId === thread._id && (
                                <span className="sr-only">Deleting...</span>
                              )}
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>

                  {/* Pagination for draft threads */}
                  {draftPagination.pages > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handlePageChange(draftPagination.page - 1)
                          }
                          disabled={draftPagination.page === 1}
                          className="px-3 py-1 border rounded-md disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from(
                          { length: draftPagination.pages },
                          (_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => handlePageChange(i + 1)}
                              className={`px-3 py-1 border rounded-md ${
                                draftPagination.page === i + 1
                                  ? "bg-primary text-primary-foreground"
                                  : ""
                              }`}
                            >
                              {i + 1}
                            </button>
                          )
                        )}
                        <button
                          onClick={() =>
                            handlePageChange(draftPagination.page + 1)
                          }
                          disabled={
                            draftPagination.page === draftPagination.pages
                          }
                          className="px-3 py-1 border rounded-md disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="collections" className="space-y-4">
              {collections.length === 0 ? (
                <EmptyState
                  message="You haven't created any collections yet"
                  actionLabel="Create Collection"
                  actionIcon={<FolderClosed className="h-4 w-4" />}
                  onAction={handleCreateCollection}
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {collections.map((collection) => (
                    <div
                      key={collection.name}
                      className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <FolderClosed className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">
                          {collection.name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {collection.threads.length} threads
                      </p>
                      {collection.threads.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium mb-2">
                            Recent threads:
                          </h4>
                          <ul className="space-y-1">
                            {collection.threads
                              .slice(0, 3)
                              .map((thread: { _id: string; title: string }) => (
                                <li key={thread._id} className="truncate">
                                  <Link
                                    href={`/threads/${thread._id}`}
                                    className="text-sm text-primary hover:underline"
                                  >
                                    {thread.title}
                                  </Link>
                                </li>
                              ))}
                          </ul>
                          {collection.threads.length > 3 && (
                            <div className="mt-2 text-right">
                              <button
                                className="text-xs text-primary hover:underline"
                                onClick={() =>
                                  router.push(
                                    `/bookmarks?collection=${encodeURIComponent(
                                      collection.name
                                    )}`
                                  )
                                }
                              >
                                View all {collection.threads.length} threads
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

// Reusable components for dashboard
const StatCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) => (
  <div className="bg-card border rounded-lg p-4">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h3 className="font-medium">{title}</h3>
    </div>
    <p className="text-2xl font-bold">{value || 0}</p>
  </div>
);

const EmptyState = ({
  message,
  actionLabel,
  actionHref,
  actionIcon,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}) => (
  <div className="bg-secondary/30 p-8 rounded-lg text-center">
    <p className="text-muted-foreground mb-4">{message}</p>
    {actionLabel &&
      (actionHref || onAction) &&
      (actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {actionIcon}
          {actionLabel}
        </Link>
      ) : (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {actionIcon}
          {actionLabel}
        </button>
      ))}
  </div>
);
