// Script to create a demo draft thread
const axios = require("axios");

const API_URL = "http://localhost:5000/api";

// Demo user credentials
const demoUser = {
  name: "Abhishek Jain",
  email: "abhishek1@gmail.com",
  password: "Abhishek@123",
};

async function createDemoUser() {
  try {
    console.log("Creating demo user...");
    const response = await axios.post(`${API_URL}/auth/register`, demoUser);
    console.log("Demo user created successfully");
    return response.data;
  } catch (error) {
    if (error.response?.data?.message?.includes("already exists")) {
      console.log("Demo user already exists, logging in instead");
      return loginUser();
    }
    console.error(
      "Error creating demo user:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function loginUser() {
  try {
    console.log("Logging in as demo user...");
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: demoUser.email,
      password: demoUser.password,
    });
    console.log("Logged in successfully");
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw error;
  }
}

async function createDraftThread() {
  const threadData = {
    title: "Ideas for Future Project",
    tags: ["Planning", "Ideas", "Draft"],
    status: "draft",
    segments: [
      {
        title: "Project Overview",
        content:
          "This is a draft of my upcoming project. I'm still working on refining the concepts and details.",
      },
      {
        title: "Key Features",
        content:
          "1. Feature one - need to expand on this\n2. Feature two - research alternatives\n3. Feature three - validate with potential users",
      },
      {
        title: "Timeline & Resources",
        content:
          "Estimated timeline: 2-3 months\nBudget: TBD\nTeam: Looking for collaborators",
      },
    ],
  };

  try {
    // First try to login, if that fails, create a new user
    let authData;
    try {
      authData = await loginUser();
    } catch (error) {
      authData = await createDemoUser();
    }

    const token = authData.token;

    console.log(
      "Creating draft thread with data:",
      JSON.stringify(threadData, null, 2)
    );

    const response = await axios.post(`${API_URL}/threads`, threadData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Draft thread created successfully!");
    console.log("Thread ID:", response.data.thread._id);
    console.log("Thread status:", response.data.thread.status);
    console.log(
      "You can view it at: http://localhost:3000/dashboard?tab=drafts"
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating draft thread:",
      error.response?.data || error.message
    );
    if (error.response?.data?.error) {
      console.error("Detailed error:", error.response.data.error);
    }
  }
}

createDraftThread();
