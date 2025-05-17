const express = require("express");
const { body } = require("express-validator");
const {
  createThread,
  getThreads,
  getThreadById,
  updateThread,
  deleteThread,
  addReaction,
  bookmarkThread,
  getBookmarkedThreads,
  getThreadForks,
} = require("../controllers/thread.controller");
const { isAuthenticated } = require("../middleware/auth.middleware");
const Thread = require("../models/thread.model");

const router = express.Router();

// Get all threads (public or authenticated)
router.get("/", getThreads);

// Get thread by ID (public for published, authenticated for drafts)
router.get("/:id", isAuthenticated, getThreadById);

// Get forks of a thread
router.get("/:id/forks", getThreadForks);

// Create a new thread (authenticated)
router.post(
  "/",
  isAuthenticated,
  [body("title").notEmpty().withMessage("Title is required")],
  createThread
);

// Update thread (authenticated)
router.put("/:id", isAuthenticated, updateThread);

// Delete thread (authenticated)
router.delete("/:id", isAuthenticated, deleteThread);

// Add reaction to a segment (authenticated)
router.post(
  "/:threadId/segments/:segmentId/react/:reaction",
  isAuthenticated,
  addReaction
);

// Bookmark a thread (authenticated)
router.post("/:id/bookmark", isAuthenticated, bookmarkThread);

// Get bookmarked threads (authenticated)
router.get("/bookmarks/list", isAuthenticated, getBookmarkedThreads);

// Debug endpoint to test draft creation
router.post("/test-draft", isAuthenticated, async (req, res) => {
  try {
    console.log("Received debug request for draft creation");

    // Create a test draft thread
    const newThread = await Thread.create({
      title: "Test Draft Thread",
      author: req.user._id,
      segments: [
        { title: "Test Segment", content: "This is a test segment content" },
      ],
      tags: ["test", "debug"],
      status: "draft",
    });

    console.log("Debug draft thread created:", {
      id: newThread._id,
      status: newThread.status,
    });

    res.status(201).json({
      success: true,
      message: "Test draft created successfully",
      thread: newThread,
    });
  } catch (error) {
    console.error("Error in test-draft endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test draft",
      error: error.message,
    });
  }
});

module.exports = router;
