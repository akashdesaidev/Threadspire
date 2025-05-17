const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth.middleware");
const Thread = require("../models/thread.model");

// GET /api/analytics/thread-activity
router.get("/thread-activity", isAuthenticated, async (req, res) => {
  try {
    const { threadId, reactionType, timeRange = 30 } = req.query;
    const userId = req.user.id;

    // Calculate the start date based on the time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Base query to find the user's threads
    const query = {
      author: userId,
      createdAt: { $gte: startDate },
    };

    // Add threadId filter if provided
    if (threadId) {
      query._id = threadId;
    }

    // Find user's threads with segments that have reactions
    const threads = await Thread.find(query);

    // Initialize results object to store date-based aggregations
    const reactionsByDate = {};

    // Loop through each thread and calculate daily reactions
    threads.forEach((thread) => {
      thread.segments.forEach((segment) => {
        // Calculate total reactions for the segment
        let segmentReactions = 0;

        // Filter by specific reaction type or count all
        if (reactionType) {
          segmentReactions = segment.reactions[reactionType]?.count || 0;
        } else {
          // Count all reaction types
          Object.values(segment.reactions).forEach((reaction) => {
            segmentReactions += reaction.count || 0;
          });
        }

        if (segmentReactions > 0) {
          // Format date as YYYY-MM-DD
          const date = new Date(segment.createdAt);
          const dateStr = date.toISOString().split("T")[0];

          // Add to daily count
          if (reactionsByDate[dateStr]) {
            reactionsByDate[dateStr] += segmentReactions;
          } else {
            reactionsByDate[dateStr] = segmentReactions;
          }
        }
      });
    });

    // Convert to array format for frontend
    const result = Object.keys(reactionsByDate).map((date) => ({
      date,
      totalReactions: reactionsByDate[date],
    }));

    // Sort by date
    result.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(result);
  } catch (error) {
    console.error("Error in thread activity analytics:", error);
    res.status(500).json({ error: "Failed to fetch thread activity data" });
  }
});

module.exports = router;
