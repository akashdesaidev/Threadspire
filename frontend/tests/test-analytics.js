// Simple test script to check analytics endpoint response
const fetch = require("node-fetch");

// Replace these values with actual ones from your authentication flow
const userId = process.env.USER_ID || "YOUR_USER_ID"; // Replace with a real user ID
const token = process.env.TOKEN || "YOUR_AUTH_TOKEN"; // Replace with a valid token

async function testAnalyticsEndpoint() {
  try {
    console.log(`Fetching analytics for user ${userId}...`);

    const response = await fetch(
      `http://localhost:5000/api/users/${userId}/analytics`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("Analytics API response successful:", data.success);

    if (data.analytics) {
      console.log("Total published threads:", data.analytics.publishedThreads);
      console.log(
        "Threads with reactions:",
        data.analytics.threadsWithReactions?.length || 0
      );

      if (
        data.analytics.threadsWithReactions &&
        data.analytics.threadsWithReactions.length > 0
      ) {
        console.log("\nFirst thread with reactions:");
        const firstThread = data.analytics.threadsWithReactions[0];
        console.log("- Thread ID:", firstThread.threadId);
        console.log("- Title:", firstThread.title);
        console.log("- Segments count:", firstThread.segments?.length || 0);
        console.log(
          "- Has top reacted segment:",
          !!firstThread.topReactedSegment
        );

        if (firstThread.segments && firstThread.segments.length > 0) {
          console.log("\nFirst segment reactions:");
          console.log(firstThread.segments[0].reactionCounts);
        } else {
          console.log("\nNo segments found in this thread");
        }
      } else {
        console.log("No threads with reactions found");
      }
    } else {
      console.log("No analytics data returned");
    }
  } catch (error) {
    console.error("Error testing analytics endpoint:", error);
  }
}

testAnalyticsEndpoint();
