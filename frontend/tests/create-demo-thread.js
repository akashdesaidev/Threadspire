// Script to create a demo thread
const axios = require("axios");

const API_URL = "http://localhost:5000/api";

// Demo user credentials
const demoUser = {
  name: "Akash",
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

async function createDemoThread() {
  const threadData = {
    status: "draft",
    title: "The Art of Strategic Pauses",
    tags: ["Leadership", "Reflection", "Decision-Making"],
    segments: [
      {
        title: "Action is Overrated Without Insight",
        content:
          "We glorify speed and hustle, but not every decision benefits from urgency. Pausing creates the space where wisdom can speak.",
      },
      {
        title: "Momentum vs. Mindlessness",
        content:
          "Sometimes we confuse motion with progress. A pause helps you ask: Am I climbing the right ladder, or just climbing fast?",
      },
      {
        title: "Strategic Silence in Conversations",
        content:
          "In leadership, a pause before responding can change the dynamic of a conversation. It signals presence, respect, and thoughtfulness.",
      },
      {
        title: "When to Pause",
        content:
          "Before you reply. Before you quit. Before you pivot. Before you scale. The right pause at the right moment prevents avoidable chaos.",
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

    const response = await axios.post(`${API_URL}/threads`, threadData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Thread created successfully!");
    console.log("Thread ID:", response.data.thread._id);
    console.log(
      "You can view it at: http://localhost:3000/threads/" +
        response.data.thread._id
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating thread:",
      error.response?.data || error.message
    );
  }
}

createDemoThread();
