const User = require("../models/user.model");
const Thread = require("../models/thread.model");
const { validationResult } = require("express-validator");

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not get user profile",
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, bio, avatar } = req.body;

    // Find and update user
    const user = await User.findById(req.user._id).select("-password");

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not update profile",
      error: error.message,
    });
  }
};

// Get user's threads
exports.getUserThreads = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    console.log("getUserThreads request params:", {
      userId: req.params.id,
      requestedStatus: status,
      requestUserId: req.user?._id,
    });

    // Build filter object
    const filter = { author: req.params.id };

    // Check if this is the user viewing their own threads
    const isOwnUser = req.user && req.user._id.toString() === req.params.id;

    // Status handling
    if (isOwnUser) {
      // User is viewing their own threads
      if (status) {
        // Validate the status parameter
        if (status === "draft" || status === "published") {
          filter.status = status;
          console.log(`User requested their own ${status} threads`);
        } else {
          console.log(
            `Invalid status parameter: ${status}, defaulting to showing all`
          );
        }
      } else {
        // No status specified, return both by default (no status filter)
        console.log("No status specified, returning all user threads");
      }
    } else {
      // Other users and unauthenticated users can only see published threads
      filter.status = "published";
      console.log(
        "User viewing other's threads or unauthenticated, restricting to published only"
      );
    }

    console.log("Final filter:", JSON.stringify(filter));

    // Execute query with pagination
    const threads = await Thread.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "name");

    console.log("Found threads count:", threads.length);
    console.log(
      "Thread statuses:",
      threads.map((t) => t.status)
    );

    // Get total count for pagination
    const total = await Thread.countDocuments(filter);

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
    console.error("Error in getUserThreads:", error);
    res.status(500).json({
      success: false,
      message: "Could not get user threads",
      error: error.message,
    });
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    // Only the user can see their own analytics
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this data",
      });
    }

    // Get all user's threads with populated originalThread info
    const userThreads = await Thread.find({ author: req.user._id })
      .populate("originalThread", "title")
      .populate("originalAuthor", "name");

    // Calculate metrics
    const totalThreads = userThreads.length;
    const publishedThreads = userThreads.filter(
      (t) => t.status === "published"
    ).length;
    const draftThreads = totalThreads - publishedThreads;

    // Get the user with bookmarks data
    const userWithBookmarks = await User.findById(req.user._id);

    // Total bookmarks received on user's threads
    const totalBookmarksReceived = userThreads.reduce(
      (sum, thread) => sum + thread.bookmarkCount,
      0
    );

    // Total bookmarks the user has made
    const totalBookmarks = userWithBookmarks.bookmarks.length;

    // Total forks received
    const totalForks = userThreads.reduce(
      (sum, thread) => sum + thread.forkCount,
      0
    );

    // Most forked thread
    let mostForkedThread = null;
    if (userThreads.length > 0) {
      mostForkedThread = userThreads.reduce((prev, current) =>
        prev.forkCount > current.forkCount ? prev : current
      );

      // Only include if it has been forked at least once
      if (mostForkedThread.forkCount === 0) {
        mostForkedThread = null;
      } else {
        // Format the most forked thread data
        mostForkedThread = {
          threadId: mostForkedThread._id,
          title: mostForkedThread.title,
          forkCount: mostForkedThread.forkCount,
          publishDate: mostForkedThread.createdAt,
        };
      }
    }

    // Find all threads that are forks of this user's threads
    const forkedThreads = await Thread.find({
      originalAuthor: req.user._id,
    }).populate("author", "name");

    // Count forks by thread
    const forksByThread = {};
    forkedThreads.forEach((fork) => {
      if (!fork.originalThread) return;

      const originalId = fork.originalThread.toString();
      if (!forksByThread[originalId]) {
        forksByThread[originalId] = [];
      }

      forksByThread[originalId].push({
        forkId: fork._id,
        title: fork.title,
        author: fork.author ? fork.author.name : "Anonymous",
        createdAt: fork.createdAt,
      });
    });

    // Reaction breakdown
    const reactionCounts = {
      "🤯": 0,
      "💡": 0,
      "😌": 0,
      "🔥": 0,
      "🫶": 0,
    };

    // Calculate reactions per thread and find top reacted segments
    const threadsWithReactions = userThreads
      .filter((thread) => thread.status === "published")
      .map((thread) => {
        let totalThreadReactions = 0;
        const segmentsData = [];
        let topSegment = null;
        let maxReactions = -1;

        thread.segments.forEach((segment, index) => {
          // Check if segment has valid reactions structure
          if (!segment.reactions) {
            console.warn(
              `Thread ${thread._id} has segment at index ${index} with missing reactions`
            );
            return; // Skip this segment
          }

          // Make sure we're handling reactions correctly
          const segmentReactions = segment.reactions || {};

          // Calculate total reactions for this segment
          const segmentTotalReactions = Object.values(segmentReactions).reduce(
            (sum, reaction) => sum + (reaction ? reaction.count || 0 : 0),
            0
          );

          totalThreadReactions += segmentTotalReactions;

          // Collect reaction counts for this segment with safer handling
          const reactionCounts = {};
          Object.entries(segmentReactions).forEach(([emoji, data]) => {
            // Make sure data is valid and has count
            if (data && typeof data.count === "number") {
              reactionCounts[emoji] = data.count;
            } else {
              reactionCounts[emoji] = 0;
            }
          });

          segmentsData.push({
            segmentId: segment._id,
            position: index,
            content:
              segment.content.substring(0, 50) +
              (segment.content.length > 50 ? "..." : ""),
            reactionCounts,
            totalReactions: segmentTotalReactions,
          });

          // Check if this is the top segment
          if (segmentTotalReactions > maxReactions) {
            maxReactions = segmentTotalReactions;
            topSegment = {
              segmentId: segment._id,
              position: index,
              content:
                segment.content.substring(0, 50) +
                (segment.content.length > 50 ? "..." : ""),
              totalReactions: segmentTotalReactions,
            };
          }
        });

        // Log detailed reaction info for this thread
        console.log(
          `Thread ${thread._id} (${
            thread.title
          }): totalReactions=${totalThreadReactions}, maxReactions=${maxReactions}, hasTopSegment=${!!topSegment}, segmentsCount=${
            segmentsData.length
          }`
        );

        // Ensure we always have a valid response structure
        return {
          threadId: thread._id,
          title: thread.title,
          segments: segmentsData,
          topReactedSegment: maxReactions > 0 ? topSegment : null,
        };
      })
      .filter((thread) => thread.segments.length > 0); // Only include threads with segments

    userThreads.forEach((thread) => {
      thread.segments.forEach((segment) => {
        Object.keys(reactionCounts).forEach((emoji) => {
          reactionCounts[emoji] += segment.reactions[emoji].count;
        });
      });
    });

    // Thread activity data truncated for response size
    const threadActivity = userThreads
      .filter((t) => t.status === "published")
      .map((thread) => {
        const totalReactions = thread.segments.reduce((sum, segment) => {
          return (
            sum +
            Object.values(segment.reactions).reduce(
              (r, reaction) => r + reaction.count,
              0
            )
          );
        }, 0);

        return {
          id: thread._id,
          title: thread.title,
          bookmarks: thread.bookmarkCount,
          forks: thread.forkCount,
          reactions: totalReactions,
          createdAt: thread.createdAt,
        };
      });

    // Calculate activity by date (for thread activity graph)
    const activityByDate = {};
    const now = new Date();
    userThreads
      .filter((t) => t.status === "published")
      .forEach((thread) => {
        thread.segments.forEach((segment) => {
          // Skip if no reactions
          if (!segment.reactions) return;

          // Calculate total reactions for this segment
          const segmentTotalReactions = Object.values(segment.reactions).reduce(
            (sum, reaction) => sum + (reaction ? reaction.count || 0 : 0),
            0
          );

          if (segmentTotalReactions > 0) {
            // Format date as YYYY-MM-DD
            // Use the segment's creation date, or thread creation date as fallback
            let dateToUse;

            if (segment.createdAt) {
              dateToUse = new Date(segment.createdAt);
            } else if (thread.createdAt) {
              dateToUse = new Date(thread.createdAt);
            } else {
              // If no valid dates, use current date
              dateToUse = new Date();
            }

            // Sanity check to avoid future dates
            if (dateToUse > now) {
              console.warn(
                `Future date detected in thread ${
                  thread._id
                } segment (${dateToUse.toISOString()}), using current date instead`
              );
              dateToUse = now;
            }

            const dateStr = dateToUse.toISOString().split("T")[0];

            // Add to daily count
            if (activityByDate[dateStr]) {
              activityByDate[dateStr] += segmentTotalReactions;
            } else {
              activityByDate[dateStr] = segmentTotalReactions;
            }
          }
        });
      });

    // Send the analytics response with both bookmarks made and received
    res.status(200).json({
      success: true,
      analytics: {
        totalThreads,
        publishedThreads,
        draftThreads,
        totalBookmarks,
        totalBookmarksReceived,
        totalForks,
        mostForkedThread,
        forksByThread,
        reactionCounts,
        threadsWithReactions,
        threadActivity,
        activityByDate,
      },
    });
  } catch (error) {
    console.error("Error in getUserAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Could not get user analytics",
      error: error.message,
    });
  }
};

// Create collection
exports.createCollection = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    // Check if collection with same name exists
    if (user.collections.some((c) => c.name === name)) {
      return res.status(400).json({
        success: false,
        message: "Collection with this name already exists",
      });
    }

    // Add collection
    user.collections.push({ name, threads: [] });

    await user.save();

    res.status(201).json({
      success: true,
      collections: user.collections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not create collection",
      error: error.message,
    });
  }
};

// Add thread to collection
exports.addToCollection = async (req, res) => {
  try {
    const { threadId, collectionName } = req.params;

    // Find user
    const user = await User.findById(req.user._id);

    // Find collection
    const collection = user.collections.find((c) => c.name === collectionName);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    // Check if thread exists
    const thread = await Thread.findById(threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    // Check if thread is already in collection
    if (collection.threads.includes(threadId)) {
      return res.status(400).json({
        success: false,
        message: "Thread already in collection",
      });
    }

    // Check if thread is in another collection
    const threadExistsInAnotherCollection = user.collections.some(
      (c) =>
        c.name !== collectionName &&
        c.threads.some((id) => id.toString() === threadId)
    );

    if (threadExistsInAnotherCollection) {
      return res.status(400).json({
        success: false,
        message:
          "Thread already exists in another collection. Please remove it from that collection first.",
      });
    }

    // Add thread to collection
    collection.threads.push(threadId);

    await user.save();

    res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not add to collection",
      error: error.message,
    });
  }
};

// Get user collections
exports.getCollections = async (req, res) => {
  try {
    // Check if user is requesting their own collections
    const isOwnProfile = req.user._id.toString() === req.params.id;

    // If not own profile, return empty collections array with 200 status
    if (!isOwnProfile) {
      return res.status(200).json({
        success: true,
        collections: [],
        message: "Collections are private to their owners",
      });
    }

    // Find user with populated collections
    const user = await User.findById(req.user._id).populate({
      path: "collections.threads",
      select: "_id title author",
      populate: {
        path: "author",
        select: "name",
      },
    });

    res.status(200).json({
      success: true,
      collections: user.collections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not get collections",
      error: error.message,
    });
  }
};

// Remove thread from collection
exports.removeFromCollection = async (req, res) => {
  try {
    const { threadId, collectionName } = req.params;

    // Find user
    const user = await User.findById(req.user._id);

    // Find collection
    const collection = user.collections.find((c) => c.name === collectionName);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    // Check if thread is in collection
    if (!collection.threads.includes(threadId)) {
      return res.status(400).json({
        success: false,
        message: "Thread not in collection",
      });
    }

    // Remove thread from collection
    collection.threads = collection.threads.filter(
      (id) => id.toString() !== threadId
    );

    await user.save();

    res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not remove from collection",
      error: error.message,
    });
  }
};
