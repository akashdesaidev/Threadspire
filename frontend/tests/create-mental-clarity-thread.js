// Script to create a demo thread
const axios = require("axios");

const API_URL = "http://localhost:5000/api";

// Demo user credentials
const demoUser = {
  name: "Abhishek",
  email: "abhishek1@gmail.com",
  password: "Abhishek@123",
};

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

async function createMentalClarityThread() {
  const threadData = {
    title: "Mental Clarity in the Age of Noise",
    tags: ["Focus", "Digital Minimalism", "Mental Health"],
    status: "published",
    segments: [
      {
        title: "The Cost of Constant Input",
        content:
          "Every scroll, ping, and notification chips away at your attention span. Information isn't the problem — overwhelm is. You can't think deeply if you're constantly reacting.",
      },
      {
        title: "Create Space for Thought",
        content:
          "Clarity emerges in silence. Block time to sit with your thoughts. No phone. No agenda. Just stillness. Your brain needs boredom to make breakthroughs.",
      },
      {
        title: "Guard Your Inputs",
        content:
          "Be ruthless about what you consume. Follow creators who uplift, mute those who drain. Curate your feed like your mental diet — because it is.",
      },
      {
        title: "The Power of a Reset Ritual",
        content:
          "Start and end your day tech-free. Journal. Walk. Meditate. Something small to signal your mind: it's time to think clearly again. Routines create mental reset points.",
      },
    ],
  };

  try {
    const authData = await loginUser();
    const token = authData.token;

    console.log("Creating mental clarity thread...");
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

createMentalClarityThread();
