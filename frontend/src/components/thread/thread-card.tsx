"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Heart, FileText } from "lucide-react";
import { TagBadge } from "./tag-badge";
import { BookmarkButton } from "./bookmark-button";
import { AuthorLink } from "./author-link";

interface ThreadCardProps {
  thread: {
    _id: string;
    title: string;
    author: { _id: string; name: string };
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
    status?: "draft" | "published";
  };
  className?: string;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
}

export function ThreadCard({
  thread,
  className,
  requiresAuth = false,
  onAuthRequired,
}: ThreadCardProps) {
  const totalReactions = thread?.segments?.reduce((total, segment) => {
    return (
      total +
      Object.values(segment.reactions).reduce(
        (sum, reaction) => sum + reaction.count,
        0
      )
    );
  }, 0);

  const preview = thread?.segments?.slice(0, 2);
  const isDraft = thread.status === "draft";

  return (
    <div
      className={cn(
        "bg-card rounded-lg border p-5 transition-shadow hover:shadow-md",
        isDraft && "border-dashed border-secondary",
        className
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Link
            href={
              isDraft ? `/threads/${thread._id}/edit` : `/threads/${thread._id}`
            }
            className="text-xl font-semibold hover:text-primary line-clamp-2"
          >
            {thread.title}
          </Link>
          {isDraft && (
            <span className="bg-secondary/40 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Draft
            </span>
          )}
        </div>
        {!isDraft && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {totalReactions}
            </span>
            <BookmarkButton
              threadId={thread._id}
              isBookmarked={!!thread.isBookmarked}
              bookmarkCount={thread.bookmarkCount}
              requiresAuth={requiresAuth}
              onAuthRequired={onAuthRequired}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mb-3 text-muted-foreground">
        <AuthorLink author={thread.author} size="sm" />
        <span>•</span>
        <span className="text-xs">
          {(() => {
            if (!thread.createdAt) return "Date unavailable";
            try {
              return new Date(thread.createdAt).toLocaleDateString();
            } catch (e) {
              return "Invalid date";
            }
          })()}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {preview?.map((segment) => (
          <p
            key={segment._id}
            className="text-sm text-muted-foreground line-clamp-2"
          >
            {segment.content}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {thread?.tags?.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
    </div>
  );
}
