"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  RefreshCw,
  User,
  GitFork,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { TagBadge } from "@/components/thread/tag-badge";
import { useAuth } from "@/lib/auth-context";
import { threadAPI } from "@/lib/api";
import { ReactionButtons } from "@/components/thread/reaction-buttons";
import { BookmarkButton } from "@/components/thread/bookmark-button";
import { AuthorLink } from "@/components/thread/author-link";

export default function ThreadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [forkError, setForkError] = useState("");
  const [reactionLoading, setReactionLoading] = useState(false);
  const [forks, setForks] = useState<any[]>([]);
  const [forksLoading, setForksLoading] = useState(false);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        setLoading(true);
        const response = await threadAPI.getThreadById(id as string);

        if (response?.data?.thread) {
          setThread(response.data.thread);

          // Check if user has bookmarked this thread
          if (user && response.data.bookmarkedBy?.includes(user._id)) {
            setIsBookmarked(true);
          }

          // Fetch forks if this is a published thread
          if (response.data.thread.status === "published") {
            fetchForks();
          }
        } else {
          console.error("Invalid thread data structure:", response);
          setError("Failed to load thread data");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load thread");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchThread();
    }
  }, [id, user]);

  const fetchForks = async () => {
    try {
      setForksLoading(true);
      const response = await threadAPI.getThreadForks(id as string);

      if (response?.data?.forks) {
        setForks(response.data.forks);
      } else {
        console.error("Invalid forks data structure:", response);
        setForks([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch forks:", err);
      // We don't need to set an error state for forks, just keep them empty
      setForks([]);
    } finally {
      setForksLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      await threadAPI.bookmarkThread(id as string);
      setIsBookmarked(!isBookmarked);
      setThread((prev: any) => ({
        ...prev,
        bookmarkCount: isBookmarked
          ? prev.bookmarkCount - 1
          : prev.bookmarkCount + 1,
      }));
    } catch (err: any) {
      console.error("Failed to bookmark thread:", err);
    }
  };

  const handleFork = () => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if the thread is a draft
    if (thread.status === "draft") {
      setForkError(
        "You cannot fork draft threads. Only published threads can be forked."
      );
      // Clear the error after 3 seconds
      setTimeout(() => setForkError(""), 3000);
      return;
    }

    router.push(`/threads/create?fork=${id}`);
  };

  const handleReaction = async (segmentId: string, reaction: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Prevent multiple simultaneous reactions
    if (reactionLoading) return;

    try {
      setReactionLoading(true);
      await threadAPI.addReaction(thread._id, segmentId, reaction);

      // Update local state to reflect the reaction
      const updatedThread = { ...thread };
      const segment = updatedThread.segments.find(
        (s: any) => s._id === segmentId
      );

      if (segment) {
        const validReactions = ["🤯", "💡", "😌", "🔥", "🫶"];
        const userReacted = segment.reactions[reaction].users.includes(
          user._id
        );

        // First remove user from ALL reactions for this segment to ensure only one reaction at a time
        validReactions.forEach((emoji) => {
          if (segment.reactions[emoji]) {
            segment.reactions[emoji].users = segment.reactions[
              emoji
            ].users.filter((uid: string) => uid !== user._id);
            segment.reactions[emoji].count =
              segment.reactions[emoji].users.length;
          }
        });

        // If user wasn't previously reacting with this specific reaction, add the new reaction
        if (!userReacted) {
          segment.reactions[reaction].users.push(user._id);
          segment.reactions[reaction].count += 1;
        }
        // If user had the same reaction before, we've already removed it (acting as a toggle)

        setThread(updatedThread);
      }
    } catch (err: any) {
      console.error("Failed to add reaction:", err);
    } finally {
      setReactionLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 flex justify-center">
          <div className="animate-pulse w-full max-w-3xl">
            <div className="h-10 bg-secondary rounded mb-4"></div>
            <div className="h-4 bg-secondary rounded mb-2 w-1/3"></div>
            <div className="h-40 bg-secondary rounded mb-6"></div>
            <div className="h-40 bg-secondary rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !thread) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="bg-destructive/20 text-destructive p-4 rounded-lg mb-4">
            {error || "Thread not found"}
          </div>
          <Link
            href="/explore"
            className="text-primary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </Link>
        </div>
      </MainLayout>
    );
  }
  console.log(thread);
  return (
    <MainLayout>
      <div className="container py-8">
        <Link
          href="/explore"
          className="text-primary flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{thread.title}</h1>

          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground">
              by <AuthorLink author={thread.author} size="md" /> •{" "}
              {new Date(thread.createdAt).toLocaleDateString()}
              {thread.status === "draft" && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full text-xs">
                  Draft
                </span>
              )}
            </div>

            <div className="flex gap-3">
              {thread.status === "published" && (
                <>
                  <BookmarkButton
                    threadId={thread._id}
                    isBookmarked={isBookmarked}
                    bookmarkCount={thread.bookmarkCount}
                    className="text-sm"
                  />

                  <button
                    onClick={handleFork}
                    className="flex items-center gap-1 text-sm hover:text-primary"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>{thread.forkCount}</span>
                  </button>
                </>
              )}
              {thread.status === "draft" &&
                user &&
                user._id === thread.author._id && (
                  <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-md">
                    Only you can see this draft
                  </div>
                )}
            </div>
          </div>

          {forkError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
              {forkError}
            </div>
          )}

          {thread.originalThread && (
            <div className="bg-secondary/50 p-3 rounded-md mb-6 text-sm">
              Forked from{" "}
              <Link
                href={`/threads/${thread.originalThread?._id}`}
                className="text-primary"
              >
                another thread
              </Link>{" "}
              by{" "}
              {thread.originalAuthor ? (
                <AuthorLink
                  author={thread.originalAuthor}
                  size="sm"
                  showIcon={false}
                />
              ) : (
                "unknown author"
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {thread.tags.map((tag: string) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>

          <div className="space-y-8">
            {thread.segments.map((segment: any, index: number) => (
              <div key={segment._id} className="border rounded-lg p-5 bg-card">
                {segment.title && (
                  <h2 className="text-xl font-semibold mb-3">
                    {segment.title}
                  </h2>
                )}
                <div className="prose prose-neutral dark:prose-invert max-w-none mb-4">
                  {segment.content}
                </div>
                <div className="flex justify-between items-center">
                  {thread.status === "published" && (
                    <ReactionButtons
                      reactions={segment.reactions}
                      onReact={(reaction) =>
                        handleReaction(segment._id, reaction)
                      }
                      userId={user?._id}
                      disabled={reactionLoading}
                      className={
                        reactionLoading ? "opacity-70 pointer-events-none" : ""
                      }
                    />
                  )}
                  <div className="text-sm text-muted-foreground">
                    Part {index + 1} of {thread.segments.length}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Forks section */}
          {thread.status === "published" && (
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center gap-2 text-xl font-semibold mb-4">
                <GitFork className="h-5 w-5" />
                <h2>Forks</h2>
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {thread.forkCount} {thread.forkCount === 1 ? "fork" : "forks"}
                </span>
              </div>

              {forksLoading ? (
                <div className="bg-secondary/30 p-6 rounded-lg mb-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-secondary rounded w-1/3"></div>
                    <div className="h-5 bg-secondary rounded w-1/4"></div>
                    <div className="h-5 bg-secondary rounded w-1/2"></div>
                  </div>
                </div>
              ) : forks.length === 0 ? (
                <div className="bg-secondary/30 p-6 rounded-lg mb-6 text-center">
                  <p className="text-muted-foreground mb-2">No forks yet</p>
                  <p className="text-sm">
                    Be the first to create a remix of this thread!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {forks.map((fork) => (
                    <div
                      key={fork._id}
                      className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
                    >
                      <Link
                        href={`/threads/${fork._id}`}
                        className="text-lg font-semibold hover:text-primary"
                      >
                        {fork.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <AuthorLink author={fork.author} size="sm" />
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(fork.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {fork.segments && fork.segments.length > 0 && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {fork.segments[0].content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleFork}
                className="w-full flex items-center justify-center gap-2 py-2 bg-secondary/60 rounded-lg text-sm hover:bg-secondary transition-colors"
              >
                <GitFork className="h-4 w-4" />
                Create your own fork
              </button>
            </div>
          )}

          {/* Comment section - to be implemented later */}
          <div className="mt-8 border-t pt-6">
            <div className="flex items-center gap-2 text-xl font-semibold mb-4">
              <MessageSquare className="h-5 w-5" />
              <h2>Comments</h2>
            </div>
            <div className="bg-secondary/30 p-6 rounded-lg text-center">
              <p className="text-muted-foreground mb-2">
                Comments coming soon!
              </p>
              <p className="text-sm">
                We're working on adding comments to threads. Check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
