"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, X, Save, ArrowRight } from "lucide-react";
import Link from "next/link";

import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/lib/auth-context";
import { threadAPI } from "@/lib/api";
import { toast } from "sonner";

interface Segment {
  id: string;
  title: string;
  content: string;
}

export default function EditThreadPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [thread, setThread] = useState<any>(null);

  // Load the thread data
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchThread = async () => {
      try {
        setInitialLoading(true);
        const response = await threadAPI.getThreadById(params.id);
        const threadData = response.data.thread;

        // Check if user is the author
        if (user && user._id !== threadData.author._id) {
          toast.error("You don't have permission to edit this thread");
          router.push("/dashboard");
          return;
        }

        // Check if thread is a draft
        if (threadData.status !== "draft") {
          toast.error("Only draft threads can be edited");
          router.push("/dashboard");
          return;
        }

        setThread(threadData);
        setTitle(threadData.title);
        setStatus(threadData.status);
        setTags(threadData.tags || []);

        const formattedSegments = threadData.segments.map((segment: any) => ({
          id: segment._id,
          title: segment.title || "",
          content: segment.content,
        }));

        setSegments(
          formattedSegments.length
            ? formattedSegments
            : [{ id: Date.now().toString(), title: "", content: "" }]
        );
      } catch (err: any) {
        console.error("Failed to fetch thread", err);
        setError(err.response?.data?.message || "Failed to load thread");
        toast.error("Failed to load thread", {
          description: "Please try again or contact support",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    if (user) {
      fetchThread();
    }
  }, [params.id, user, authLoading, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const addSegment = () => {
    setSegments([
      ...segments,
      { id: Date.now().toString(), title: "", content: "" },
    ]);
  };

  const removeSegment = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter((segment) => segment.id !== id));
    }
  };

  const updateSegment = (
    id: string,
    field: "title" | "content",
    value: string
  ) => {
    setSegments(
      segments.map((segment) =>
        segment.id === id ? { ...segment, [field]: value } : segment
      )
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    saveStatus: "draft" | "published"
  ) => {
    e.preventDefault();

    // Basic validation
    if (!title.trim()) {
      setError("Please enter a title for your thread");
      return;
    }

    const validSegments = segments.filter((s) => s.content.trim());
    if (validSegments.length === 0) {
      setError("Please add at least one segment with content");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const threadData = {
        title: title.trim(),
        segments: segments.map((s) => ({
          title: s.title.trim() || undefined,
          content: s.content.trim(),
        })),
        tags: tags.length > 0 ? tags : undefined,
        status: saveStatus,
      };

      const response = await threadAPI.updateThread(params.id, threadData);

      if (saveStatus === "published") {
        toast.success("Thread published successfully", {
          description: "Your thread is now available for others to read",
        });
      } else {
        toast.success("Draft updated successfully");
      }

      // If published, go to the published thread page, otherwise back to dashboard
      if (saveStatus === "published") {
        // The backend may return a different ID if publishing created a new thread
        const threadId = response.data.thread._id;
        router.push(`/threads/${threadId}`);
      } else {
        router.push(`/dashboard?tab=drafts`);
      }
    } catch (err: any) {
      console.error("Failed to update thread", err);
      setError(err.response?.data?.message || "Failed to update thread");
      setLoading(false);
    }
  };

  if (authLoading || initialLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-10 bg-secondary rounded mb-4"></div>
            <div className="h-80 bg-secondary rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Edit Draft Thread</h1>
            <Link href="/dashboard?tab=drafts" className="text-primary">
              Cancel
            </Link>
          </div>

          {error && (
            <div className="bg-destructive/20 text-destructive p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Thread Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter an engaging title for your thread"
                className="w-full p-3 border rounded-md bg-background"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 p-3 border rounded-l-md bg-background"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-r-md hover:bg-secondary/80"
                  disabled={loading || !tagInput.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Thread Segments
              </label>
              <div className="space-y-4">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="border rounded-lg p-4 bg-card"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Segment {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeSegment(segment.id)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={loading || segments.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mb-3">
                      <input
                        type="text"
                        value={segment.title}
                        onChange={(e) =>
                          updateSegment(segment.id, "title", e.target.value)
                        }
                        placeholder="Segment title (optional)"
                        className="w-full p-2 border rounded-md bg-background"
                        disabled={loading}
                      />
                    </div>

                    <textarea
                      value={segment.content}
                      onChange={(e) =>
                        updateSegment(segment.id, "content", e.target.value)
                      }
                      placeholder="Write your segment content here..."
                      className="w-full p-3 border rounded-md min-h-[120px] bg-background"
                      disabled={loading}
                      required
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSegment}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg text-muted-foreground hover:text-foreground hover:border-primary w-full justify-center"
                  disabled={loading}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Another Segment
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "draft")}
                className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-secondary"
                disabled={loading}
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, "published")}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                disabled={loading}
              >
                Publish
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
