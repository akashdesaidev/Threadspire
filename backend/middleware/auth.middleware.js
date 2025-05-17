const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Cookie name constant - must match frontend and jwt.utils.js
const TOKEN_COOKIE_NAME = "threadspire_token";

// Middleware to check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  try {
    console.log("===== Auth Middleware =====");
    console.log("Headers:", JSON.stringify(req.headers));

    // Get token from cookie or authorization header
    const token =
      req.cookies[TOKEN_COOKIE_NAME] ||
      (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : null);

    console.log("Token extracted:", token ? "Found" : "Not found");

    // Check if token exists
    if (!token) {
      console.log("No token found in request");
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    // Verify token
    console.log("Verifying token...");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production"
    );
    console.log("Token verified, user ID:", decoded.id);

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log("User not found with ID:", decoded.id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User found:", user.name, user._id);

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};
