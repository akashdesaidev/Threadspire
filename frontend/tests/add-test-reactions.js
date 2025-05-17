// Script to add sample reactions to a thread for testing
// Use cross-fetch as a polyfill that works in CommonJS
const fetch = require("cross-fetch");

// Replace with actual values
const userId = process.env.USER_ID || "6827ce0d7a4476c17eca829b";
const token =
  process.env.TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MjdjZTBkN2E0NDc2YzE3ZWNhODI5YiIsImlhdCI6MTc0NzQ2MDk1MCwiZXhwIjoxNzUwMDUyOTUwfQ.vgoSKhNBZFTKE__NJpelJFibUZn9dQKd4pQWE60ohGQ";
const threadId = process.env.THREAD_ID || "6827ced87a4476c17eca8336"; // Replace with your thread ID

const API_URL = "http://localhost:5000/api";

// Get segments for a thread
async function getThreadSegments() {
  const response = await fetch(`${API_URL}/threads/${threadId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get thread: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.thread.segments.map((segment) => segment._id);
}

// Add reactions to segments
async function addReactions(segmentIds) {
  if (!segmentIds || segmentIds.length === 0) {
    console.log("No segments found in thread");
    return;
  }

  console.log(`Found ${segmentIds.length} segments in thread ${threadId}`);

  const emojis = ["🤯", "💡", "😌", "🔥", "🫶"];
  const promises = [];

  // For each segment, add random reactions
  for (const segmentId of segmentIds) {
    // Select 1-3 random emojis for this segment
    const numEmojis = Math.floor(Math.random() * 3) + 1;
    const segmentEmojis = [...emojis]
      .sort(() => 0.5 - Math.random())
      .slice(0, numEmojis);

    console.log(
      `Adding ${segmentEmojis.join(", ")} reactions to segment ${segmentId}`
    );

    // Add 1-5 reactions of each selected emoji
    for (const emoji of segmentEmojis) {
      const count = Math.floor(Math.random() * 5) + 1;

      // Add reactions one by one (to simulate multiple users)
      for (let i = 0; i < count; i++) {
        promises.push(
          fetch(
            `${API_URL}/threads/${threadId}/segments/${segmentId}/react/${encodeURIComponent(
              emoji
            )}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to add reaction: ${response.status} ${response.statusText}`
                );
              }
              return response.json();
            })
            .then(() => {
              process.stdout.write(".");
            })
            .catch((error) => {
              console.error(
                `\nError adding reaction ${emoji} to segment ${segmentId}:`,
                error.message
              );
            })
        );
      }
    }
  }

  await Promise.all(promises);
  console.log("\nAll reactions added successfully!");
}

async function run() {
  try {
    console.log(`Adding test reactions to thread ${threadId}...`);
    const segmentIds = await getThreadSegments();
    await addReactions(segmentIds);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
