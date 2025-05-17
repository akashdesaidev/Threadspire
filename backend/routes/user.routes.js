const express = require("express");
const { body } = require("express-validator");
const {
  getUserProfile,
  updateProfile,
  getUserThreads,
  getUserAnalytics,
  createCollection,
  addToCollection,
  getCollections,
  removeFromCollection,
} = require("../controllers/user.controller");
const { isAuthenticated } = require("../middleware/auth.middleware");

const router = express.Router();

// Get user profile
router.get("/:id", getUserProfile);

// Update profile
router.put(
  "/profile",
  isAuthenticated,
  [
    body("name")
      .optional()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long"),
  ],
  updateProfile
);

// Get user's threads
router.get("/:id/threads", isAuthenticated, getUserThreads);

// Get user analytics
router.get("/:id/analytics", isAuthenticated, getUserAnalytics);

// Create collection
router.post(
  "/collections",
  isAuthenticated,
  [body("name").notEmpty().withMessage("Collection name is required")],
  createCollection
);

// Add thread to collection
router.post(
  "/collections/:collectionName/threads/:threadId",
  isAuthenticated,
  addToCollection
);

// Remove thread from collection
router.delete(
  "/collections/:collectionName/threads/:threadId",
  isAuthenticated,
  removeFromCollection
);

// Get user collections
router.get("/:id/collections", isAuthenticated, getCollections);

module.exports = router;
