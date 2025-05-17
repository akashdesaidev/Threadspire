// Extract user ID from JWT token
const token =
  process.env.TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MjdjZTBkN2E0NDc2YzE3ZWNhODI5YiIsImlhdCI6MTc0NzQ2MDk1MCwiZXhwIjoxNzUwMDUyOTUwfQ.vgoSKhNBZFTKE__NJpelJFibUZn9dQKd4pQWE60ohGQ";

function extractUserIdFromToken(token) {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT token format");
    }

    // The second part contains the payload
    const payload = parts[1];

    // Base64 decode the payload
    const decodedPayload = Buffer.from(payload, "base64").toString();

    // Parse the JSON
    const parsedPayload = JSON.parse(decodedPayload);

    // Extract the user ID
    if (!parsedPayload.id) {
      throw new Error("No user ID found in token payload");
    }

    return parsedPayload.id;
  } catch (error) {
    console.error("Error extracting user ID:", error);
    return null;
  }
}

const userId = extractUserIdFromToken(token);

console.log("\n===== USER INFORMATION =====");
console.log("User ID:", userId);
console.log("\nYou can use these values to run the test scripts:");
console.log("\nFor add-test-reactions.js:");
console.log(`node add-test-reactions.js THREAD_ID=your_thread_id`);
console.log("\nFor verify-reactions.js:");
console.log(`node verify-reactions.js THREAD_ID=your_thread_id`);

// You can automatically update the files with the proper user ID
const fs = require("fs");

const files = ["add-test-reactions.js", "verify-reactions.js"];

files.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    // Replace the USER_ID placeholder with the actual user ID
    content = content.replace(
      /const userId = process\.env\.USER_ID \|\| "YOUR_USER_ID";/,
      `const userId = process.env.USER_ID || "${userId}";`
    );
    fs.writeFileSync(file, content);
    console.log(`\nUpdated ${file} with your user ID`);
  }
});
