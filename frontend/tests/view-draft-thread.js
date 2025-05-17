// Script to view a draft thread by ID
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

async function viewThread(token, threadId) {
  try {
    console.log(`Viewing thread with ID: ${threadId}`);

    const response = await axios.get(`${API_URL}/threads/${threadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Thread details:");
    console.log("  Title:", response.data.thread.title);
    console.log("  Status:", response.data.thread.status);
    console.log("  Author:", response.data.thread.author.name);
    console.log("  Segments:", response.data.thread.segments.length);

    return response.data;
  } catch (error) {
    console.error(
      "Error viewing thread:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function main() {
  try {
    // Get thread ID from command line arguments
    const threadId = process.argv[2];

    if (!threadId) {
      console.error("Please provide a thread ID as a command line argument");
      process.exit(1);
    }

    // Login to get auth token
    const { token, user } = await loginUser();
    console.log("User ID:", user._id);

    // View the thread
    await viewThread(token, threadId);

    console.log("Thread viewed successfully!");
  } catch (error) {
    console.error("Operation failed:", error);
    process.exit(1);
  }
}

main();
