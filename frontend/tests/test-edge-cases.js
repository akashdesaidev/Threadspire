// Script to test edge cases in the API specifically focusing on thread segments and reactions
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
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw error;
  }
}

async function createEdgeCaseThread(token, type) {
  try {
    console.log(`Creating ${type} thread...`);

    let threadData = {
      title: `Test ${type} - ${new Date().toISOString()}`,
      tags: ["Test", "EdgeCase"],
      status: "published",
    };

    // Different types of edge cases
    switch (type) {
      case "emptySegments":
        threadData.segments = [];
        break;
      case "undefinedSegments":
        // Don't include segments property at all
        break;
      case "nullReactions":
        threadData.segments = [
          {
            title: "Test Segment",
            content: "This is a segment with null reactions",
          },
        ];
        break;
      case "emptyReactions":
        threadData.segments = [
          {
            title: "Test Segment",
            content: "This is a segment with empty reactions",
            reactions: {},
          },
        ];
        break;
      default:
        threadData.segments = [
          {
            title: "Normal Segment",
            content: "This is a normal test segment",
          },
        ];
    }

    const response = await axios.post(`${API_URL}/threads`, threadData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`Thread created: ${response.data.thread._id}`);
    return response.data.thread;
  } catch (error) {
    console.error(
      `Error creating ${type} thread:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testGetThread(token, threadId) {
  try {
    console.log(`Testing get thread for ${threadId}...`);

    const response = await axios.get(`${API_URL}/threads/${threadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Thread details:");
    console.log(`  Title: ${response.data.thread.title}`);
    console.log(`  Status: ${response.data.thread.status}`);
    console.log(`  Segments: ${response.data.thread.segments?.length || 0}`);
    console.log(
      `  Total Reactions: ${response.data.thread.totalReactions || 0}`
    );

    return response.data.thread;
  } catch (error) {
    console.error(
      "Error getting thread:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testExplore(token) {
  try {
    console.log("Testing explore endpoint...");

    const response = await axios.get(`${API_URL}/threads`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`Explore found ${response.data.threads.length} threads`);
    console.log(`Total: ${response.data.pagination.total}`);

    // Check if totalReactions property exists on all threads
    const missingReactions = response.data.threads.filter(
      (t) => t.totalReactions === undefined
    );
    console.log(`Threads missing totalReactions: ${missingReactions.length}`);

    if (missingReactions.length > 0) {
      console.log(
        "Example thread with missing reactions:",
        missingReactions[0]._id
      );
    }

    return response.data;
  } catch (error) {
    console.error(
      "Error testing explore:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function main() {
  try {
    // Get auth token
    const { token } = await loginUser();

    // Test explore first to check previous threads
    await testExplore(token);

    // Create and test threads with edge cases
    const edgeCases = [
      "emptySegments",
      "undefinedSegments",
      "nullReactions",
      "emptyReactions",
    ];

    for (const edgeCase of edgeCases) {
      // Create the edge case thread
      const thread = await createEdgeCaseThread(token, edgeCase);

      // Test retrieving the specific thread
      await testGetThread(token, thread._id);
    }

    // Test explore again with new threads
    await testExplore(token);

    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
