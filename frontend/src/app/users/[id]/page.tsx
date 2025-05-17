"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/main-layout";
import { ThreadCard } from "@/components/thread/thread-card";
import { useAuth } from "@/lib/auth-context";
import { userAPI, threadAPI } from "@/lib/api";
import {
  Edit,
  Bookmark,
  FolderClosed,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState("threads");

  // Pagination states
  const [threadPage, setThreadPage] = useState(1);
  const [threadPagination, setThreadPagination] = useState<any>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  const [bookmarkPage, setBookmarkPage] = useState(1);
  const [bookmarkPagination, setBookmarkPagination] = useState<any>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const isOwnProfile = currentUser && currentUser._id === id;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userResponse = await userAPI.getUserProfile(id as string);
        if (userResponse?.data?.user) {
          setUser(userResponse.data.user);
        } else {
          console.error("Invalid user data structure:", userResponse);
          setError("Failed to load user profile data");
        }

        await fetchThreads(1);

        // Fetch user's collections
        if (isOwnProfile) {
          const collectionsResponse = await userAPI.getCollections(
            id as string
          );
          if (collectionsResponse?.data?.collections) {
            setCollections(collectionsResponse.data.collections);
          } else {
            console.error(
              "Invalid collections data structure:",
              collectionsResponse
            );
            setCollections([]);
          }

          // Initial bookmarks fetch
          await fetchBookmarks(1);
        }
      } catch (err: any) {
        console.error("Failed to fetch user profile", err);
        setError(err.response?.data?.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id, isOwnProfile]);

  const fetchThreads = async (page: number) => {
    try {
      setThreadsLoading(true);
      // Fetch user's threads with pagination
      const threadsResponse = await userAPI.getUserThreads(id as string, {
        status: "published",
        page,
        limit: 10,
      });
      if (threadsResponse?.data?.threads) {
        setThreads(threadsResponse.data.threads);
        setThreadPagination(
          threadsResponse.data.pagination || {
            total: 0,
            page: 1,
            pages: 1,
            limit: 10,
          }
        );
        setThreadPage(page);
      } else {
        console.error("Invalid threads data structure:", threadsResponse);
        setThreads([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch threads", err);
    } finally {
      setThreadsLoading(false);
    }
  };

  const fetchBookmarks = async (page: number) => {
    if (!isOwnProfile) return;

    try {
      setBookmarksLoading(true);
      const bookmarksResponse = await threadAPI.getBookmarkedThreads({
        page,
        limit: 10,
      });
      if (bookmarksResponse?.data?.threads) {
        setBookmarks(bookmarksResponse.data.threads);
        setBookmarkPagination(
          bookmarksResponse.data.pagination || {
            total: 0,
            page: 1,
            pages: 1,
            limit: 10,
          }
        );
        setBookmarkPage(page);
      } else {
        console.error("Invalid bookmarks data structure:", bookmarksResponse);
        setBookmarks([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch bookmarks", err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    const name = prompt("Enter a name for your new collection:");
    if (!name || !name.trim()) return;

    try {
      await userAPI.createCollection({ name: name.trim() });

      // Refresh collections
      const collectionsResponse = await userAPI.getCollections(id as string);
      setCollections(collectionsResponse.data.collections);
    } catch (err: any) {
      console.error("Failed to create collection", err);
      alert(err.response?.data?.message || "Failed to create collection");
    }
  };

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    isLoading: boolean
  ) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2 rounded-md hover:bg-secondary disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-sm">
          Page {currentPage} of {totalPages}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="p-2 rounded-md hover:bg-secondary disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-20 bg-secondary rounded-lg mb-6"></div>
            <div className="h-10 bg-secondary rounded mb-4 w-1/3"></div>
            <div className="h-80 bg-secondary rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !user) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="bg-destructive/20 text-destructive p-4 rounded-lg">
            {error || "User not found"}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {isOwnProfile && (
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-secondary"
                >
                  <Edit className="h-3 w-3" />
                  Edit Profile
                </Link>
              )}
            </div>
            {user.bio && (
              <p className="text-muted-foreground mb-4">{user.bio}</p>
            )}
          </div>

          <Tabs
            defaultValue="threads"
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="mb-8"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="threads">Threads</TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="collections">Collections</TabsTrigger>
                  <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="threads" className="space-y-4">
              {threadsLoading && threadPage === 1 ? (
                <div className="bg-card p-8 rounded-lg">
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-secondary rounded w-3/4"></div>
                    <div className="h-20 bg-secondary rounded"></div>
                    <div className="h-20 bg-secondary rounded"></div>
                  </div>
                </div>
              ) : threads.length === 0 ? (
                <div className="bg-secondary/30 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "You haven't published any threads yet."
                      : `${user.name} hasn't published any threads yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/threads/create"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Thread
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {threads.map((thread) => (
                      <ThreadCard key={thread._id} thread={thread} />
                    ))}
                  </div>

                  {threadsLoading && threadPage > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="animate-pulse h-6 w-24 bg-secondary rounded"></div>
                    </div>
                  )}

                  {renderPagination(
                    threadPage,
                    threadPagination.pages,
                    (page) => fetchThreads(page),
                    threadsLoading
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="collections" className="space-y-4">
              {collections.length === 0 ? (
                <div className="bg-secondary/30 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "You haven't created any collections yet."
                      : `${user.name} hasn't created any collections yet.`}
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={handleCreateCollection}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Collection
                    </button>
                  )}
                </div>
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
                              .map((thread: any) => (
                                <li key={thread._id} className="truncate">
                                  <Link
                                    href={`/threads/${thread._id}`}
                                    className="text-sm text-primary hover:underline"
                                  >
                                    {thread.title || "View thread"}
                                  </Link>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="bookmarks" className="space-y-4">
                {bookmarksLoading && bookmarkPage === 1 ? (
                  <div className="bg-card p-8 rounded-lg">
                    <div className="animate-pulse space-y-4">
                      <div className="h-10 bg-secondary rounded w-3/4"></div>
                      <div className="h-20 bg-secondary rounded"></div>
                      <div className="h-20 bg-secondary rounded"></div>
                    </div>
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="bg-secondary/30 p-8 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      You haven't bookmarked any threads yet.
                    </p>
                    <Link
                      href="/explore"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Explore Threads
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      {bookmarks.map((thread) => (
                        <ThreadCard key={thread._id} thread={thread} />
                      ))}
                    </div>

                    {bookmarksLoading && bookmarkPage > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="animate-pulse h-6 w-24 bg-secondary rounded"></div>
                      </div>
                    )}

                    {renderPagination(
                      bookmarkPage,
                      bookmarkPagination.pages,
                      (page) => fetchBookmarks(page),
                      bookmarksLoading
                    )}
                  </>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
