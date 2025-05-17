// Script to test draft editing functionality
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

async function createDraftThread(token) {
  try {
    console.log("Creating a new draft thread...");

    const threadData = {
      title: "Test Draft for Editing - " + new Date().toISOString(),
      segments: [
        { title: "Segment 1", content: "This is the first segment content" },
        { title: "Segment 2", content: "This is the second segment content" },
      ],
      tags: ["test", "draft", "editing"],
      status: "draft",
    };

    const response = await axios.post(`${API_URL}/threads`, threadData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Draft thread created successfully!");
    console.log("Thread ID:", response.data.thread._id);
    return response.data.thread;
  } catch (error) {
    console.error(
      "Error creating draft:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function updateDraftThread(token, threadId) {
  try {
    console.log(`Updating draft thread with ID: ${threadId}`);

    const updateData = {
      title: "Updated Draft - " + new Date().toISOString(),
      segments: [
        {
          title: "Updated Segment 1",
          content: "This content has been updated",
        },
        { title: "New Segment", content: "This is a brand new segment" },
      ],
      tags: ["updated", "testing"],
      status: "draft", // Keep as draft
    };

    const response = await axios.put(
      `${API_URL}/threads/${threadId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Draft thread updated successfully!");
    return response.data;
  } catch (error) {
    console.error(
      "Error updating draft:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function publishDraftThread(token, threadId) {
  try {
    console.log(`Publishing draft thread with ID: ${threadId}`);

    const updateData = {
      status: "published",
    };

    const response = await axios.put(
      `${API_URL}/threads/${threadId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Draft published successfully!");
    console.log("Published thread ID:", response.data.thread._id);
    return response.data;
  } catch (error) {
    console.error(
      "Error publishing draft:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function main() {
  try {
    // Get action from command line arguments
    const action = process.argv[2];
    const threadId = process.argv[3];

    if (!action || (action !== "create" && !threadId)) {
      console.error(
        "Usage: node test-edit-draft.js [create|update|publish] [threadId]"
      );
      process.exit(1);
    }

    // Login to get auth token
    const { token } = await loginUser();

    if (action === "create") {
      await createDraftThread(token);
    } else if (action === "update" && threadId) {
      await updateDraftThread(token, threadId);
    } else if (action === "publish" && threadId) {
      await publishDraftThread(token, threadId);
    } else {
      console.error("Invalid action");
      process.exit(1);
    }

    console.log("Operation completed successfully!");
  } catch (error) {
    console.error("Operation failed:", error);
    process.exit(1);
  }
}

main();
