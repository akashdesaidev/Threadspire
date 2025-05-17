const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
} = require("../controllers/auth.controller");
const { isAuthenticated } = require("../middleware/auth.middleware");

const router = express.Router();

// Register route - POST /api/auth/register
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  register
);

// Login route - POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

// Logout route - GET /api/auth/logout
router.get("/logout", logout);

// Get current user - GET /api/auth/me
router.get("/me", isAuthenticated, getCurrentUser);

// Change password - POST /api/auth/change-password
router.post(
  "/change-password",
  isAuthenticated,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  changePassword
);

module.exports = router;
