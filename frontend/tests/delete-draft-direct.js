// Script to delete a thread directly by ID (bypassing initial GET)
const axios = require("axios");

const API_URL = "http://localhost:5000/api";

// Demo user credentials
const demoUser = {
  email: "abhishek1@gmail.com",
  password: "Abhishek@123",
};

async function loginUser() {
  try {
    console.log("Logging in as user...");
    const response = await axios.post(`${API_URL}/auth/login`, demoUser);
    console.log("Logged in successfully as:", response.data.user.name);
    console.log("User ID:", response.data.user._id);
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw error;
  }
}

async function deleteThread(token, threadId) {
  try {
    console.log(`Deleting thread with ID: ${threadId}`);
    console.log(`Using Authorization: Bearer ${token}`);

    const response = await axios.delete(`${API_URL}/threads/${threadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Delete response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting thread:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function main() {
  // Get thread ID from command line
  const threadId = process.argv[2];

  if (!threadId) {
    console.error("Please provide a thread ID as a command line argument");
    console.log("Usage: node delete-draft-direct.js <thread-id>");
    process.exit(1);
  }

  try {
    // Login to get token
    const authData = await loginUser();
    const token = authData.token;
    const userId = authData.user._id;

    console.log(`Attempting to delete thread ${threadId} as user ${userId}`);

    // Confirm deletion
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(
      "Are you sure you want to delete this thread? (yes/no): ",
      async (answer) => {
        if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
          try {
            await deleteThread(token, threadId);
            console.log("Thread deleted successfully!");
          } catch (err) {
            console.error("Failed to delete thread:", err);
          }
        } else {
          console.log("Deletion canceled.");
        }
        readline.close();
      }
    );
  } catch (error) {
    console.error("Operation failed:", error);
  }
}

main();
