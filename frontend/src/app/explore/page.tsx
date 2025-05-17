"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ThreadCard } from "@/components/thread/thread-card";
import { useSearchParams, useRouter } from "next/navigation";
import { threadAPI } from "@/lib/api";
import { TagBadge } from "@/components/thread/tag-badge";
import { Search } from "lucide-react";

// Updated tags with categories
const TAG_CATEGORIES = {
  "Personal Growth": ["Career", "Productivity", "Mindset", "Health"],
  Interests: ["Technology", "Creativity", "Science", "Arts", "Travel"],
  Topics: ["Business", "Education", "Finance", "Politics", "Sports"],
};

// Flatten tags for backwards compatibility
const TAGS = Object.values(TAG_CATEGORIES).flat();

interface Thread {
  _id: string;
  title: string;
  author: {
    _id: string;
    name: string;
  };
  segments: Array<{
    _id: string;
    content: string;
    reactions: {
      [key: string]: {
        count: number;
        users: string[];
      };
    };
  }>;
  tags: string[];
  createdAt: string;
  bookmarkCount: number;
  forkCount: number;
  isBookmarked?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagFilterMode, setTagFilterMode] = useState<"ANY" | "ALL">("ANY");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(TAG_CATEGORIES)
  );

  useEffect(() => {
    const tagsParam = searchParams.get("tags");
    if (tagsParam) {
      setSelectedTags(tagsParam.split(","));
    }

    const sortParam = searchParams.get("sort");
    if (sortParam && ["newest", "bookmarks", "forks"].includes(sortParam)) {
      setSortBy(sortParam);
    }

    const pageParam = searchParams.get("page");
    if (pageParam && !isNaN(Number(pageParam))) {
      const page = Number(pageParam);
      if (page > 0) {
        setPagination((prev) => ({ ...prev, page }));
      }
    }

    const modeParam = searchParams.get("mode");
    if (modeParam === "ALL") {
      setTagFilterMode("ALL");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchThreads();
  }, [selectedTags, sortBy, pagination.page, tagFilterMode]);

  const fetchThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: {
        page: number;
        limit: number;
        tags?: string;
        sort?: string;
        tagMode?: string;
      } = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(",");
        params.tagMode = tagFilterMode.toLowerCase();
      }

      if (sortBy === "bookmarks") {
        params.sort = "bookmarks";
      } else if (sortBy === "forks") {
        params.sort = "forks";
      }

      const { data } = await threadAPI.getThreads(params);

      if (data?.threads) {
        setThreads(data.threads);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error("Invalid threads data structure:", data);
        setThreads([]);
        setError("Failed to load threads. Invalid data format.");
      }
    } catch (err) {
      console.error("Error fetching threads", err);
      setError("Failed to load threads. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    let newTags: string[];

    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter((t) => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }

    setSelectedTags(newTags);
    updateUrlParams(newTags);
  };

  const updateUrlParams = (tags: string[] = selectedTags) => {
    // Update URL
    const params = new URLSearchParams(searchParams.toString());

    if (tags.length > 0) {
      params.set("tags", tags.join(","));
    } else {
      params.delete("tags");
    }

    // Update sort param
    if (sortBy !== "newest") {
      params.set("sort", sortBy);
    } else {
      params.delete("sort");
    }

    // Update tag filter mode
    if (tagFilterMode === "ALL") {
      params.set("mode", "ALL");
    } else {
      params.delete("mode");
    }

    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }

    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (newSortValue: string) => {
    setSortBy(newSortValue);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newSortValue !== "newest") {
      params.set("sort", newSortValue);
    } else {
      params.delete("sort");
    }

    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setTagFilterMode("ANY");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tags");
    params.delete("mode");
    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter((c) => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  const filteredTagCategories = Object.entries(TAG_CATEGORIES).reduce(
    (acc, [category, tags]) => {
      const filteredTags = tagSearchQuery
        ? tags.filter((tag) =>
            tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
          )
        : tags;

      if (filteredTags.length > 0) {
        acc[category] = filteredTags;
      }

      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Explore Threads</h1>
            <p className="text-muted-foreground">
              Discover thought-provoking threads from the community
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="sort" className="text-sm">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="p-2 border rounded-md bg-background"
            >
              <option value="newest">Newest</option>
              <option value="bookmarks">Most Bookmarked</option>
              <option value="forks">Most Forked</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="bg-card border rounded-md p-4 sticky top-20">
              <h2 className="font-semibold mb-4">Filter by Tags</h2>

              {/* Tag search */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="pl-10 w-full p-2 border rounded-md text-sm"
                />
              </div>

              {/* Tag filter mode */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <span>Match threads with:</span>
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => {
                      setTagFilterMode("ANY");
                      updateUrlParams();
                    }}
                    className={`px-3 py-1 text-xs ${
                      tagFilterMode === "ANY"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                  >
                    ANY tag
                  </button>
                  <button
                    onClick={() => {
                      setTagFilterMode("ALL");
                      updateUrlParams();
                    }}
                    className={`px-3 py-1 text-xs ${
                      tagFilterMode === "ALL"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                  >
                    ALL tags
                  </button>
                </div>
              </div>

              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">
                    Selected ({selectedTags.length}):
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map((tag) => (
                      <div
                        key={`selected-${tag}`}
                        className="bg-primary/10 text-primary text-xs rounded-full px-3 py-1 flex items-center"
                      >
                        #{tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Tag categories */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(filteredTagCategories).map(
                  ([category, tags]) => (
                    <div key={category} className="border-b pb-2 last:border-0">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex justify-between items-center w-full text-sm font-medium mb-2"
                      >
                        {category}
                        <span className="text-xs">
                          {expandedCategories.includes(category) ? "−" : "+"}
                        </span>
                      </button>

                      {expandedCategories.includes(category) && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`tag-badge transition-colors text-xs ${
                                selectedTags.includes(tag)
                                  ? "bg-primary/10 text-primary"
                                  : ""
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}

                {Object.keys(filteredTagCategories).length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No matching tags found
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            {loading ? (
              <div className="text-center py-12">Loading threads...</div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                {error}
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-12 bg-card border rounded-md">
                <p className="text-xl mb-4">No threads found</p>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later for new content
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6">
                  {threads.map((thread) => (
                    <ThreadCard key={thread._id} thread={thread} />
                  ))}
                </div>

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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
