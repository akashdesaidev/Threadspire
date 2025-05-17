import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  BookmarkPlus,
  Plus,
  Check,
  AlertCircle,
  FolderIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { threadAPI, userAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface BookmarkButtonProps {
  threadId: string;
  isBookmarked: boolean;
  bookmarkCount: number;
  className?: string;
  showCount?: boolean;
}

export function BookmarkButton({
  threadId,
  isBookmarked,
  bookmarkCount,
  className,
  showCount = true,
}: BookmarkButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [count, setCount] = useState(bookmarkCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentCollection, setCurrentCollection] = useState<string | null>(
    null
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked);
    setCount(bookmarkCount);
  }, [isBookmarked, bookmarkCount]);

  useEffect(() => {
    if ((isOpen || isSelectionMode) && user) {
      loadCollections();
    }
  }, [isOpen, isSelectionMode, user]);

  const loadCollections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      const response = await userAPI.getCollections(user._id);
      const collectionsData = response.data.collections || [];
      setCollections(collectionsData);

      // Check which collection this thread belongs to (if any)
      let foundInCollection = null;
      for (const collection of collectionsData) {
        const found = collection.threads.some((t: any) => t._id === threadId);
        if (found) {
          foundInCollection = collection.name;
          break;
        }
      }
      setCurrentCollection(foundInCollection);
    } catch (error) {
      console.error("Failed to load collections:", error);
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (bookmarked) {
      // If already bookmarked, remove the bookmark
      try {
        // First check if this thread is in a collection and remove it from there
        if (currentCollection) {
          try {
            // First remove from collection
            await userAPI.removeFromCollection(currentCollection, threadId);
            setCurrentCollection(null);
          } catch (error) {
            console.error("Failed to remove from collection:", error);
            // Continue with bookmark removal even if collection removal fails
          }
        }

        // Then remove the bookmark
        await threadAPI.bookmarkThread(threadId);
        setBookmarked(false);
        setCount(Math.max(0, count - 1));
      } catch (error) {
        console.error("Failed to remove bookmark:", error);
      }
    } else {
      // If not bookmarked, show collection selection instead of bookmarking immediately
      setIsSelectionMode(true);
    }
  };

  const handleAddToCollection = async (collectionName: string) => {
    if (!user) return;

    setError("");
    try {
      // First, bookmark the thread if it's not already bookmarked
      if (!bookmarked) {
        await threadAPI.bookmarkThread(threadId);
        setBookmarked(true);
        setCount(count + 1);
      }

      // Then add to collection
      await userAPI.addToCollection(collectionName, threadId);
      await loadCollections(); // Reload to get updated data
      setCurrentCollection(collectionName);

      // Close selection mode and dropdown
      setIsSelectionMode(false);
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to bookmark and add to collection:", error);
      setError(error.response?.data?.message || "Failed to add to collection");
    }
  };

  const handleRemoveFromCollection = async (collectionName: string) => {
    if (!user) return;

    setError("");
    try {
      await userAPI.removeFromCollection(collectionName, threadId);
      setCurrentCollection(null);
      await loadCollections(); // Reload to get updated data
    } catch (error: any) {
      console.error("Failed to remove from collection:", error);
      setError(
        error.response?.data?.message || "Failed to remove from collection"
      );
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !user) return;

    setError("");
    try {
      await userAPI.createCollection({ name: newCollectionName.trim() });
      setNewCollectionName("");
      await loadCollections();
    } catch (error: any) {
      console.error("Failed to create collection:", error);
      setError(error.response?.data?.message || "Failed to create collection");
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setError("");
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          onClick={toggleBookmark}
          className={cn(
            "inline-flex items-center gap-1 hover:text-primary transition-colors",
            bookmarked && "text-primary",
            className
          )}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark thread"}
        >
          {bookmarked ? (
            <Bookmark className="h-4 w-4 fill-primary" />
          ) : (
            <BookmarkPlus className="h-4 w-4" />
          )}
          {showCount && <span className="text-sm">{count}</span>}
        </button>

        {bookmarked && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="ml-1 p-1 text-xs text-muted-foreground hover:text-primary"
            >
              Organize
            </button>
            {currentCollection && (
              <span className="ml-1 text-xs text-muted-foreground flex items-center">
                <FolderIcon className="h-3 w-3 mr-1" />
                {currentCollection}
              </span>
            )}
          </>
        )}
      </div>

      {/* Collection Selection Modal - appears when user tries to bookmark */}
      {isSelectionMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg border shadow-lg max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Collection</h3>
              <button
                onClick={cancelSelection}
                className="p-1 rounded-full hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 text-destructive flex items-center gap-1 text-sm bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">
              Thread will be bookmarked after you select a collection. Each
              thread can only be in one collection.
            </p>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading collections...
              </div>
            ) : (
              <>
                <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
                  {collections.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      No collections yet. Create your first collection below.
                    </div>
                  ) : (
                    collections.map((collection) => (
                      <button
                        key={collection.name}
                        onClick={() => handleAddToCollection(collection.name)}
                        className="w-full text-left p-3 flex items-center rounded-md hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center">
                          <FolderIcon className="h-4 w-4 mr-2 text-primary" />
                          <span>{collection.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({collection.threads.length} thread
                            {collection.threads.length !== 1 ? "s" : ""})
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t pt-4">
                  <form onSubmit={handleCreateCollection}>
                    <label className="block text-sm font-medium mb-2">
                      Create new collection
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Collection name"
                        className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                        disabled={!newCollectionName.trim()}
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dropdown for organizing already bookmarked threads */}
      {isOpen && bookmarked && (
        <div className="absolute z-10 right-0 mt-2 w-64 rounded-md shadow-lg bg-card border py-1 text-sm">
          <div className="px-3 py-2 font-medium border-b">
            Manage collection
          </div>

          {error && (
            <div className="px-3 py-2 text-destructive flex items-center gap-1 text-xs bg-destructive/10">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="px-3 py-2 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {currentCollection && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                  <p>
                    This thread is in collection:{" "}
                    <span className="font-medium">{currentCollection}</span>
                  </p>
                  <p className="mt-1 text-xs italic">
                    Each thread can only be in one collection at a time.
                  </p>
                  <button
                    onClick={() =>
                      handleRemoveFromCollection(currentCollection)
                    }
                    className="mt-2 text-primary text-xs hover:underline"
                  >
                    Remove from this collection
                  </button>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto">
                {collections.length === 0 ? (
                  <div className="px-3 py-2 text-muted-foreground">
                    No collections yet
                  </div>
                ) : (
                  collections.map((collection) => {
                    const isInCollection =
                      collection.name === currentCollection;

                    return (
                      <button
                        key={collection.name}
                        onClick={() =>
                          !isInCollection &&
                          handleAddToCollection(collection.name)
                        }
                        className={cn(
                          "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-secondary/50",
                          isInCollection && "text-primary",
                          currentCollection &&
                            !isInCollection &&
                            "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isInCollection || !!currentCollection}
                        title={
                          currentCollection && !isInCollection
                            ? `This thread is already in the "${currentCollection}" collection. Remove it first.`
                            : ""
                        }
                      >
                        <div className="flex items-center">
                          <FolderIcon className="h-4 w-4 mr-2" />
                          {collection.name}
                        </div>
                        {isInCollection && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })
                )}
              </div>

              {!currentCollection && (
                <form
                  onSubmit={handleCreateCollection}
                  className="mt-1 border-t pt-2 px-3 pb-2"
                >
                  <div className="text-xs font-medium mb-1">
                    Create new collection
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Collection name"
                      className="flex-1 px-2 py-1 text-xs rounded border bg-background"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded-full bg-primary text-primary-foreground"
                      disabled={!newCollectionName.trim()}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
