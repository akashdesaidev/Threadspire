const Thread = require("../models/thread.model");
const User = require("../models/user.model");
const { validationResult } = require("express-validator");

// Create a new thread
exports.createThread = async (req, res) => {
  try {
    console.log("createThread request received:", {
      body: req.body,
      user: req.user?._id,
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, segments, tags, status, originalThread } = req.body;
    console.log("Thread data extracted:", {
      title,
      status,
      segmentsCount: segments?.length,
      tagsCount: tags?.length,
    });

    // Validate status is either "draft" or "published"
    if (status && !["draft", "published"].includes(status)) {
      console.log("Invalid status:", status);
      return res.status(400).json({
        success: false,
        message: "Status must be either 'draft' or 'published'",
      });
    }

    // Use explicit status value from request or default to "draft"
    const threadStatus = status || "draft";
    console.log("Using status:", threadStatus);

    // Handle forking logic - check if this is a fork and if the original thread exists
    let originalAuthorId = null;

    if (originalThread) {
      const sourceThread = await Thread.findById(originalThread);

      // Verify the original thread exists
      if (!sourceThread) {
        return res.status(404).json({
          success: false,
          message: "Original thread not found for forking",
        });
      }

      // Check if the original thread is a draft - only published threads can be forked
      if (sourceThread.status === "draft") {
        return res.status(403).json({
          success: false,
          message:
            "You cannot fork draft threads. Only published threads can be forked.",
        });
      }

      originalAuthorId = sourceThread.author;
    }

    // Create thread
    const newThread = await Thread.create({
      title,
      author: req.user._id,
      segments: segments || [],
      tags: tags || [],
      status: threadStatus,
      originalThread: originalThread || null,
      originalAuthor: originalAuthorId,
    });

    console.log("Thread created:", {
      id: newThread._id,
      title: newThread.title,
      status: newThread.status,
    });

    // If this is a fork of another thread, increment fork count on original
    if (originalThread) {
      await Thread.findByIdAndUpdate(originalThread, {
        $inc: { forkCount: 1 },
      });
    }

    res.status(201).json({
      success: true,
      thread: newThread,
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({
      success: false,
      message: "Could not create thread",
      error: error.message,
    });
  }
};

// Get all threads with pagination and filters
exports.getThreads = async (req, res) => {
  try {
    console.log("===== getThreads =====");
    console.log("Query params:", req.query);
    console.log(
      "User:",
      req.user ? { id: req.user._id, name: req.user.name } : "No user"
    );

    const { page = 1, limit = 10, status, tags, sort, tagMode } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Handle thread status filtering
    if (!req.user) {
      // Unauthenticated users can only see published threads
      filter.status = "published";
    } else if (status) {
      // Authenticated user with specific status request
      if (status === "draft") {
        // Only show user's own drafts
        filter.author = req.user._id;
        filter.status = "draft";
      } else if (status === "published") {
        // Show all published threads
        filter.status = "published";
      } else {
        // Invalid status filter
        return res.status(400).json({
          success: false,
          message: "Invalid status parameter. Use 'draft' or 'published'.",
        });
      }
    } else {
      // No status specified, show all published + user's drafts
      filter.$or = [
        { status: "published" },
        { author: req.user._id, status: "draft" },
      ];
    }

    // Filter by tags
    if (tags) {
      console.log("Filtering by tags:", tags);
      const tagArray = tags.split(",");

      // Handle tag mode (ALL or ANY, default to ANY)
      if (tagMode === "all") {
        console.log(
          "Using ALL tag mode - threads must have all specified tags"
        );
        // If ALL mode, thread must have all specified tags
        filter.tags = { $all: tagArray };
      } else {
        console.log(
          "Using ANY tag mode (default) - threads can have any of the specified tags"
        );
        // Default to ANY - thread must have at least one of the specified tags
        filter.tags = { $in: tagArray };
      }
    }

    console.log("Final filter:", JSON.stringify(filter));

    // Build sort object
    let sortOption = { createdAt: -1 }; // Default: newest first

    if (sort === "bookmarks") {
      sortOption = { bookmarkCount: -1 };
    } else if (sort === "forks") {
      sortOption = { forkCount: -1 };
    }

    console.log("Sort option:", sortOption);

    // Execute query with pagination
    const threads = await Thread.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "name")
      .populate("originalAuthor", "name")
      .populate("originalThread", "title status");

    console.log(`Found ${threads.length} threads`);

    // Get total count for pagination
    const total = await Thread.countDocuments(filter);

    console.log("Total threads matching filter:", total);

    res.status(200).json({
      success: true,
      threads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error in getThreads:", error);
    res.status(500).json({
      success: false,
      message: "Could not get threads",
      error: error.message,
    });
  }
};

// Get thread by ID
exports.getThreadById = async (req, res) => {
  try {
    console.log("===== getThreadById =====");
    console.log("Headers:", JSON.stringify(req.headers));
    console.log(
      "User:",
      req.user
        ? {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
          }
        : "No user in request"
    );
    console.log("Params:", req.params);

    const thread = await Thread.findById(req.params.id)
      .populate("author", "name email")
      .populate("originalAuthor", "name")
      .populate("originalThread", "title status");

    if (!thread) {
      console.log("Thread not found with ID:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    console.log("Thread found:", {
      id: thread._id,
      title: thread.title,
      status: thread.status,
      authorId: thread.author._id,
      authorIdType: typeof thread.author._id,
      authorName: thread.author.name,
      authorEmail: thread.author.email,
    });

    // Check if thread is a draft
    if (thread.status === "draft") {
      // If user is not authenticated, deny access to draft threads
      if (!req.user) {
        console.log(
          "Permission denied: Unauthenticated user cannot view drafts"
        );
        return res.status(403).json({
          success: false,
          message:
            "This thread is a draft and can only be viewed by its author",
        });
      }

      // Log the IDs for debugging
      const requestUserId = req.user._id.toString();
      const threadAuthorId = thread.author._id.toString();

      console.log("Draft permission check:", {
        requestUserId,
        threadAuthorId,
        isAuthor: requestUserId === threadAuthorId,
        userIdType: typeof req.user._id,
        authorIdType: typeof thread.author._id,
      });

      // Use a direct string comparison after converting both to strings
      if (requestUserId !== threadAuthorId) {
        console.log(
          "Permission denied: User not authorized to view this draft"
        );
        return res.status(403).json({
          success: false,
          message:
            "This thread is a draft and can only be viewed by its author",
        });
      }

      console.log("Permission granted: User is the author of this draft");
    }

    // For published threads, check if this thread is bookmarked by the current user
    let bookmarkedBy = [];
    if (thread.status === "published" && req.user) {
      const user = await User.findById(req.user._id).select("bookmarks");
      bookmarkedBy = user.bookmarks.map((bookmark) => bookmark.toString());
    }

    // Get related versions if they exist
    let relatedVersions = {};

    // If this is a published thread with an originalThread reference (draft)
    if (thread.status === "published" && thread.originalThread) {
      relatedVersions.draftVersion = {
        id: thread.originalThread._id,
        title: thread.originalThread.title,
      };
    }

    // If this is a draft, check for published versions
    if (thread.status === "draft") {
      const publishedVersion = await Thread.findOne({
        originalThread: thread._id,
        status: "published",
      }).select("_id title");

      if (publishedVersion) {
        relatedVersions.publishedVersion = {
          id: publishedVersion._id,
          title: publishedVersion.title,
        };
      }
    }

    res.status(200).json({
      success: true,
      thread,
      bookmarkedBy: bookmarkedBy.length > 0 ? bookmarkedBy : [],
      relatedVersions:
        Object.keys(relatedVersions).length > 0 ? relatedVersions : null,
    });
  } catch (error) {
    console.error("Error in getThreadById:", error);
    res.status(500).json({
      success: false,
      message: "Could not get thread",
      error: error.message,
    });
  }
};

// Update thread
exports.updateThread = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, segments, tags, status } = req.body;

    // Find thread
    const thread = await Thread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    // Check if user is the author
    if (req.user._id.toString() !== thread.author.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this thread",
      });
    }

    // Special handling for status changes from draft to published
    if (thread.status === "draft" && status === "published") {
      // Create a published copy of the thread, keeping the draft version
      const publishedThread = new Thread({
        title: title || thread.title,
        author: thread.author,
        segments: segments || thread.segments,
        tags: tags || thread.tags,
        status: "published",
        // Only set originalThread if this draft was forked from another thread
        originalThread: thread.originalThread ? thread.originalThread : null,
        originalAuthor: thread.originalAuthor || null,
      });

      await publishedThread.save();

      // Mark the original draft as published to prevent it from showing in drafts
      thread.status = "published";
      await thread.save();

      // Return both threads
      return res.status(200).json({
        success: true,
        message: "Thread published successfully while preserving draft",
        thread: publishedThread,
        draftThread: thread,
      });
    } else {
      // For other updates, update the thread directly
      thread.title = title || thread.title;
      if (segments) thread.segments = segments;
      if (tags) thread.tags = tags;
      if (status) thread.status = status;

      await thread.save();

      res.status(200).json({
        success: true,
        thread,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not update thread",
      error: error.message,
    });
  }
};

// Delete thread
exports.deleteThread = async (req, res) => {
  try {
    console.log("===== deleteThread =====");
    console.log("Headers:", JSON.stringify(req.headers));
    console.log(
      "User:",
      req.user
        ? {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
          }
        : "No user in request"
    );
    console.log("Params:", req.params);

    // Find thread
    const thread = await Thread.findById(req.params.id);

    if (!thread) {
      console.log("Thread not found with ID:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    console.log("Thread found for deletion:", {
      id: thread._id,
      title: thread.title,
      status: thread.status,
      authorId: thread.author,
    });

    // Convert IDs to strings for reliable comparison
    const requestUserId = req.user._id.toString();
    const threadAuthorId = thread.author.toString();

    console.log("Delete permission check:", {
      requestUserId,
      threadAuthorId,
      isAuthor: requestUserId === threadAuthorId,
    });

    // Check if user is the author
    if (requestUserId !== threadAuthorId) {
      console.log(
        "Permission denied: User not authorized to delete this thread"
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this thread",
      });
    }

    console.log("Permission granted: User is the author of this thread");

    // Check if this is a draft with a published version
    if (thread.status === "draft") {
      // Find any published threads that reference this draft as originalThread
      const publishedVersions = await Thread.find({
        originalThread: thread._id,
        status: "published",
      });

      // Update any published versions to remove the reference to this draft
      for (const publishedThread of publishedVersions) {
        publishedThread.originalThread = null;
        await publishedThread.save();
      }
    }

    // Check if this is a published thread with a draft original
    if (thread.status === "published" && thread.originalThread) {
      // Don't delete the draft version when deleting the published version
      // Just delete this published version
    }

    // Clean up bookmarks and collections that reference this thread
    // This is essential for accurate bookmark counts in the dashboard
    console.log("Cleaning up bookmarks and collections for deleted thread");

    // 1. Remove thread from users' bookmarks arrays
    const bookmarkUpdateResult = await User.updateMany(
      { bookmarks: thread._id },
      { $pull: { bookmarks: thread._id } }
    );

    console.log(
      `Removed from ${bookmarkUpdateResult.modifiedCount} users' bookmarks`
    );

    // 2. Remove thread from all collections
    const collectionUpdateResult = await User.updateMany(
      { "collections.threads": thread._id },
      { $pull: { "collections.$[].threads": thread._id } }
    );

    console.log(
      `Removed from ${collectionUpdateResult.modifiedCount} users' collections`
    );

    // Now delete the thread
    await thread.deleteOne();

    console.log(`Thread ${req.params.id} deleted successfully`);

    res.status(200).json({
      success: true,
      message: "Thread deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteThread:", error);
    res.status(500).json({
      success: false,
      message: "Could not delete thread",
      error: error.message,
    });
  }
};

// Add reaction to a segment
exports.addReaction = async (req, res) => {
  try {
    const { threadId, segmentId, reaction } = req.params;

    // Validate reaction type
    const validReactions = ["🤯", "💡", "😌", "🔥", "🫶"];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type",
      });
    }

    // Find thread
    const thread = await Thread.findById(threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    // Only published threads can be reacted to
    if (thread.status === "draft") {
      return res.status(403).json({
        success: false,
        message:
          "You cannot react to draft threads. Only published threads can be reacted to.",
      });
    }

    // Find segment
    const segment = thread.segments.id(segmentId);

    if (!segment) {
      return res.status(404).json({
        success: false,
        message: "Segment not found",
      });
    }

    // Check if user has already reacted to this segment
    const userHasReacted = validReactions.some((r) =>
      segment.reactions[r].users.includes(req.user._id)
    );

    if (userHasReacted) {
      // Remove previous reaction
      validReactions.forEach((r) => {
        segment.reactions[r].users = segment.reactions[r].users.filter(
          (userId) => userId.toString() !== req.user._id.toString()
        );
        segment.reactions[r].count = segment.reactions[r].users.length;
      });
    }

    // Add new reaction
    segment.reactions[reaction].users.push(req.user._id);
    segment.reactions[reaction].count =
      segment.reactions[reaction].users.length;

    await thread.save();

    res.status(200).json({
      success: true,
      thread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not add reaction",
      error: error.message,
    });
  }
};

// Bookmark thread
exports.bookmarkThread = async (req, res) => {
  try {
    const { id } = req.params;

    // Find thread
    const thread = await Thread.findById(id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    // Only published threads can be bookmarked
    if (thread.status === "draft") {
      return res.status(403).json({
        success: false,
        message:
          "You cannot bookmark draft threads. Only published threads can be bookmarked.",
      });
    }

    // Find user
    const user = await User.findById(req.user._id);

    // Check if thread is already bookmarked
    const isBookmarked = user.bookmarks.includes(id);

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks = user.bookmarks.filter(
        (threadId) => threadId.toString() !== id.toString()
      );

      // Also remove thread from any collections it might be in
      if (user.collections && user.collections.length > 0) {
        user.collections.forEach((collection) => {
          collection.threads = collection.threads.filter(
            (threadId) => threadId.toString() !== id.toString()
          );
        });
      }

      // Decrement bookmark count
      thread.bookmarkCount = Math.max(0, thread.bookmarkCount - 1);
    } else {
      // Add bookmark
      user.bookmarks.push(id);

      // Increment bookmark count
      thread.bookmarkCount += 1;
    }

    await user.save();
    await thread.save();

    res.status(200).json({
      success: true,
      isBookmarked: !isBookmarked,
      bookmarkCount: thread.bookmarkCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not bookmark thread",
      error: error.message,
    });
  }
};

// Get bookmarked threads
exports.getBookmarkedThreads = async (req, res) => {
  try {
    console.log("Getting bookmarked threads for user:", req.user._id);
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).populate({
      path: "bookmarks",
      options: {
        skip,
        limit: parseInt(limit),
        sort: { createdAt: -1 },
      },
      populate: { path: "author", select: "name" },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const bookmarkedThreads = user.bookmarks || [];
    const count = bookmarkedThreads.length;

    res.status(200).json({
      success: true,
      threads: bookmarkedThreads,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error getting bookmarked threads:", error);
    res.status(500).json({
      success: false,
      message: "Could not retrieve bookmarked threads",
      error: error.message,
    });
  }
};

// Get forks of a thread
exports.getThreadForks = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log(`Getting forks for thread: ${id}`);

    // First check if the thread exists
    const parentThread = await Thread.findById(id);
    if (!parentThread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    // Find all threads that have this thread as their originalThread
    const forks = await Thread.find({
      originalThread: id,
      status: "published", // Only return published forks
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "name")
      .select("_id title author createdAt segments");

    // Get total count for pagination
    const total = await Thread.countDocuments({
      originalThread: id,
      status: "published",
    });

    console.log(`Found ${forks.length} forks of thread ${id}`);

    res.status(200).json({
      success: true,
      forks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error getting thread forks:", error);
    res.status(500).json({
      success: false,
      message: "Could not retrieve thread forks",
      error: error.message,
    });
  }
};
