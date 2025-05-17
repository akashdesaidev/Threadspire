// Script to delete a draft thread by ID
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

async function getThreadInfo(token, threadId) {
  try {
    console.log(`Fetching thread info for ID: ${threadId}`);
    const response = await axios.get(`${API_URL}/threads/${threadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Thread info:");
    console.log("  Title:", response.data.thread.title);
    console.log("  Status:", response.data.thread.status);
    console.log("  Author ID:", response.data.thread.author._id);
    console.log("  Author Name:", response.data.thread.author.name);

    return response.data;
  } catch (error) {
    console.error(
      "Error getting thread:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function deleteThread(token, threadId) {
  try {
    console.log(`Deleting thread with ID: ${threadId}`);
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
    console.log("Usage: node delete-draft-by-id.js <thread-id>");
    process.exit(1);
  }

  try {
    // Login to get token
    const authData = await loginUser();
    const token = authData.token;

    // Get thread info for verification
    await getThreadInfo(token, threadId);

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
