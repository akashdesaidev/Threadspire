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
  LogIn,
} from "lucide-react";
import Link from "next/link";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState("threads");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
      const threadsResponse = await userAPI.getPublicUserThreads(id as string, {
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
    if (!currentUser) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

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

  const showLoginMessage = () => {
    setShowLoginPrompt(true);
    setTimeout(() => setShowLoginPrompt(false), 3000);
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
        {showLoginPrompt && (
          <div className="max-w-4xl mx-auto mb-4 bg-primary/10 text-primary p-3 rounded-md flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <span>
              Please{" "}
              <Link
                href="/login"
                className="text-primary font-medium underline"
              >
                log in
              </Link>{" "}
              to perform this action
            </span>
          </div>
        )}

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
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Link>
              )}
            </div>

            {user.bio && <p className="mb-4">{user.bio}</p>}
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-8 justify-start">
              <TabsTrigger value="threads">Threads</TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                  <TabsTrigger value="collections">Collections</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="threads">
              {threadsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-secondary rounded-lg border"
                    ></div>
                  ))}
                </div>
              ) : threads.length === 0 ? (
                <div className="border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile
                      ? "You haven't published any threads yet"
                      : `${user.name} hasn't published any threads yet`}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/threads/create"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                      Create a thread
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {threads.map((thread) => (
                      <ThreadCard
                        key={thread._id}
                        thread={thread}
                        requiresAuth={!currentUser}
                        onAuthRequired={showLoginMessage}
                      />
                    ))}
                  </div>
                  {renderPagination(
                    threadPage,
                    threadPagination.pages,
                    fetchThreads,
                    threadsLoading
                  )}
                </>
              )}
            </TabsContent>

            {isOwnProfile && (
              <>
                <TabsContent value="bookmarks">
                  {bookmarksLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-32 bg-secondary rounded-lg border"
                        ></div>
                      ))}
                    </div>
                  ) : bookmarks.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        You haven't bookmarked any threads yet
                      </p>
                      <Link
                        href="/explore"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                      >
                        Explore threads
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {bookmarks.map((thread) => (
                          <ThreadCard key={thread._id} thread={thread} />
                        ))}
                      </div>
                      {renderPagination(
                        bookmarkPage,
                        bookmarkPagination.pages,
                        fetchBookmarks,
                        bookmarksLoading
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="collections">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleCreateCollection}
                      className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-2 rounded"
                    >
                      <PlusCircle className="h-4 w-4" />
                      New Collection
                    </button>
                  </div>

                  {collections.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        You haven't created any collections yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {collections.map((collection) => (
                        <Link
                          key={collection.name}
                          href={`/bookmarks?collection=${encodeURIComponent(
                            collection.name
                          )}`}
                          className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <FolderClosed className="h-5 w-5 text-primary" />
                            <h3 className="font-medium truncate">
                              {collection.name}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {collection.threads.length}{" "}
                            {collection.threads.length === 1
                              ? "thread"
                              : "threads"}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
