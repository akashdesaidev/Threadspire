"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit, FolderIcon, Loader2, Plus, Trash } from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { ThreadCard } from "@/components/thread/thread-card";
import { ThreadCardSkeleton } from "@/components/thread/thread-card-skeleton";
import { useAuth } from "@/lib/auth-context";
import { threadAPI, userAPI } from "@/lib/api";

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export default function BookmarksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [bookmarkedThreads, setBookmarkedThreads] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 8, // Adjust the limit as needed
  });

  // Get active collection from URL params instead of component state
  const activeCollection = searchParams.get("collection");

  // Get page from URL params
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam && !isNaN(Number(pageParam))) {
      const page = Number(pageParam);
      if (page > 0) {
        setPagination((prev) => ({ ...prev, page }));
      }
    } else {
      // Reset to page 1 when no page param
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [searchParams]);

  // Reset pagination when collection changes
  useEffect(() => {
    // Reset to page 1 when collection changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [activeCollection]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      // Only fetch bookmarked threads when in All Bookmarks view
      // or when fetching for the first time (for collections)
      if (!activeCollection || bookmarkedThreads.length === 0) {
        fetchBookmarkedThreads();
      }
      fetchCollections();
    }
  }, [user, authLoading, router, pagination.page, activeCollection]);

  const fetchBookmarkedThreads = async () => {
    try {
      setLoading(true);
      const response = await threadAPI.getBookmarkedThreads({
        page: pagination.page,
        limit: pagination.limit,
      });
      setBookmarkedThreads(response.data.threads || []);

      // Update pagination from response
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load bookmarked threads"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    if (!user) return;

    try {
      const response = await userAPI.getCollections(user._id);
      setCollections(response.data.collections || []);
    } catch (err: any) {
      console.error("Failed to load collections:", err);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !user) return;

    try {
      await userAPI.createCollection({ name: newCollectionName.trim() });
      setNewCollectionName("");
      setShowNewCollectionForm(false);
      await fetchCollections();
    } catch (err: any) {
      console.error("Failed to create collection:", err);
    }
  };

  const handleRemoveFromCollection = async (
    threadId: string,
    collectionName: string
  ) => {
    if (!user) return;

    try {
      await userAPI.removeFromCollection(collectionName, threadId);
      await fetchCollections();
    } catch (err: any) {
      console.error("Failed to remove thread from collection:", err);
    }
  };

  // Find which collection a thread belongs to (if any)
  const getThreadCollection = (threadId: string) => {
    for (const collection of collections) {
      if (collection.threads.some((t: any) => t._id === threadId)) {
        return collection.name;
      }
    }
    return null;
  };

  // Get displayed threads, possibly adding pagination for collections
  const getDisplayedThreads = () => {
    if (!activeCollection) {
      return bookmarkedThreads.map((thread) => ({
        ...thread,
        isBookmarked: true,
        collectionName: getThreadCollection(thread._id),
      }));
    }

    const collection = collections.find((c) => c.name === activeCollection);
    if (!collection) return [];

    // Apply manual pagination for collection threads if needed
    const threads = collection.threads;
    // Set a page size to match the API pagination
    const pageSize = pagination.limit;
    const startIndex = (pagination.page - 1) * pageSize;
    const paginatedThreads = threads.slice(startIndex, startIndex + pageSize);

    // Update pagination state for collection view
    if (pagination.total !== threads.length) {
      setPagination((prev) => ({
        ...prev,
        total: threads.length,
        pages: Math.ceil(threads.length / pageSize),
      }));
    }

    return paginatedThreads.map((thread: any) => {
      // Ensure thread has all necessary properties, including a valid date
      return {
        ...thread,
        isBookmarked: true,
        collectionName: activeCollection,
        createdAt: thread.createdAt || new Date().toISOString(), // Provide current date if missing
      };
    });
  };

  // Update URL with the selected collection
  const setCollection = (collectionName: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (collectionName) {
      params.set("collection", collectionName);
    } else {
      params.delete("collection");
    }

    // Reset page when changing collections
    params.delete("page");

    router.push(`/bookmarks?${params.toString()}`, { scroll: false });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }

    // Preserve the collection param if it exists
    if (activeCollection) {
      params.set("collection", activeCollection);
    }

    router.push(`/bookmarks?${params.toString()}`, { scroll: false });
  };

  // Debug logging to check pagination values
  useEffect(() => {
    if (pagination) {
      console.log("Pagination state:", {
        total: pagination.total,
        page: pagination.page,
        pages: pagination.pages,
        limit: pagination.limit,
        hasMultiplePages: pagination.pages > 1,
      });
    }
  }, [pagination]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="container py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Your Library</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-card rounded-lg border p-4 sticky top-20">
              <h2 className="font-semibold mb-3">Collections</h2>

              <p className="text-xs text-muted-foreground mb-3">
                Each thread can only be in one collection at a time.
              </p>

              <div className="space-y-1 mb-4">
                <button
                  onClick={() => setCollection(null)}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors ${
                    !activeCollection ? "bg-secondary text-primary" : ""
                  }`}
                >
                  All Bookmarks
                </button>

                {collections.map((collection) => (
                  <button
                    key={collection.name}
                    onClick={() => setCollection(collection.name)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors ${
                      activeCollection === collection.name
                        ? "bg-secondary text-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4" />
                      <span className="truncate">{collection.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {collection.threads.length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {showNewCollectionForm ? (
                <form onSubmit={handleCreateCollection} className="mb-2">
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Collection name"
                      className="w-full px-3 py-2 text-sm rounded-md border bg-background"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground"
                        disabled={!newCollectionName.trim()}
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCollectionForm(false);
                          setNewCollectionName("");
                        }}
                        className="flex-1 px-3 py-1 text-sm rounded-md bg-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewCollectionForm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Collection
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ThreadCardSkeleton key={index} />
                ))}
              </div>
            ) : error ? (
              <div className="bg-destructive/20 text-destructive p-4 rounded-lg">
                {error}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {activeCollection ?? "All Bookmarks"}
                </h2>

                {getDisplayedThreads().length === 0 ? (
                  <div className="bg-card border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      {activeCollection
                        ? "No threads in this collection yet"
                        : "You haven't bookmarked any threads yet"}
                    </p>
                    {!activeCollection && (
                      <button
                        onClick={() => router.push("/explore")}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                      >
                        Explore Threads
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {getDisplayedThreads().map((thread: any) => (
                        <div key={thread._id} className="relative group">
                          <ThreadCard
                            thread={{ ...thread, isBookmarked: true }}
                          />

                          {/* Only show remove button when in a specific collection view */}
                          {activeCollection && (
                            <button
                              onClick={() =>
                                handleRemoveFromCollection(
                                  thread._id,
                                  activeCollection
                                )
                              }
                              className="absolute bottom-3 right-3 px-3 py-1 text-xs font-medium bg-card/90 hover:bg-destructive/20 rounded-md text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove from collection"
                            >
                              Remove
                            </button>
                          )}

                          {/* Show collection badge in All Bookmarks view */}
                          {!activeCollection && thread.collectionName && (
                            <div className="absolute bottom-3 left-3 px-2 py-1 bg-secondary/80 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              In: {thread.collectionName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pagination - show for both All Bookmarks and Collections when needed */}
                    {pagination.pages > 1 && (
                      <div className="flex justify-center mt-8">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handlePageChange(pagination.page - 1)
                            }
                            disabled={pagination.page === 1}
                            className="px-3 py-1 border rounded-md disabled:opacity-50"
                          >
                            Previous
                          </button>

                          {/* Only show up to 5 page buttons with navigation for larger page sets */}
                          {pagination.pages <= 5 ? (
                            // Show all pages if 5 or fewer
                            Array.from({ length: pagination.pages }, (_, i) => (
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
                            ))
                          ) : (
                            // Show limited pages with ellipsis for large sets
                            <>
                              {/* First page */}
                              <button
                                onClick={() => handlePageChange(1)}
                                className={`px-3 py-1 border rounded-md ${
                                  pagination.page === 1
                                    ? "bg-primary text-primary-foreground"
                                    : ""
                                }`}
                              >
                                1
                              </button>

                              {/* Ellipsis or Page 2 */}
                              {pagination.page > 3 && (
                                <span className="px-3 py-1">...</span>
                              )}

                              {/* Current page and surrounding */}
                              {Array.from(
                                { length: Math.min(3, pagination.pages) },
                                (_, i) => {
                                  let pageNum;
                                  if (pagination.page <= 2) {
                                    // Near beginning
                                    pageNum = i + 2; // 2,3,4
                                  } else if (
                                    pagination.page >=
                                    pagination.pages - 1
                                  ) {
                                    // Near end
                                    pageNum = pagination.pages - 3 + i; // n-2, n-1, n
                                  } else {
                                    // Middle
                                    pageNum = pagination.page - 1 + i; // current-1, current, current+1
                                  }

                                  if (
                                    pageNum <= 1 ||
                                    pageNum >= pagination.pages
                                  ) {
                                    return null;
                                  }

                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => handlePageChange(pageNum)}
                                      className={`px-3 py-1 border rounded-md ${
                                        pagination.page === pageNum
                                          ? "bg-primary text-primary-foreground"
                                          : ""
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                }
                              )}

                              {/* Ellipsis or second-to-last page */}
                              {pagination.page < pagination.pages - 2 && (
                                <span className="px-3 py-1">...</span>
                              )}

                              {/* Last page */}
                              {pagination.pages > 1 && (
                                <button
                                  onClick={() =>
                                    handlePageChange(pagination.pages)
                                  }
                                  className={`px-3 py-1 border rounded-md ${
                                    pagination.page === pagination.pages
                                      ? "bg-primary text-primary-foreground"
                                      : ""
                                  }`}
                                >
                                  {pagination.pages}
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() =>
                              handlePageChange(pagination.page + 1)
                            }
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
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
