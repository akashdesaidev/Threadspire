const jwt = require("jsonwebtoken");

// Cookie name constant - must match frontend
const TOKEN_COOKIE_NAME = "threadspire_token";

// Generate JWT token
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production",
    { expiresIn: "30d" }
  );
};

// Set cookie with token
exports.setCookieWithToken = (res, token) => {
  const isDevelopment = process.env.NODE_ENV !== "production";

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: !isDevelopment,
    sameSite: isDevelopment ? "lax" : "none",
    path: "/",
  };

  return res.cookie(TOKEN_COOKIE_NAME, token, cookieOptions);
};

// Clear cookie
exports.clearCookie = (res) => {
  const isDevelopment = process.env.NODE_ENV !== "production";

  return res.cookie(TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    secure: !isDevelopment,
    sameSite: isDevelopment ? "lax" : "none",
  });
};
