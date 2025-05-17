// Script to verify reactions data for a specific thread
const fetch = require("cross-fetch");

// Replace with actual values
const userId = process.env.USER_ID || "6827ce0d7a4476c17eca829b";
const token =
  process.env.TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MjdjZTBkN2E0NDc2YzE3ZWNhODI5YiIsImlhdCI6MTc0NzQ2MDk1MCwiZXhwIjoxNzUwMDUyOTUwfQ.vgoSKhNBZFTKE__NJpelJFibUZn9dQKd4pQWE60ohGQ";
const threadId = process.env.THREAD_ID || "6827ced87a4476c17eca8336"; // The thread ID from the error

async function checkThreadReactions() {
  try {
    console.log("Checking analytics data for thread reactions...");

    // First get the user analytics to see threadsWithReactions data
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
      throw new Error(
        `Analytics API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Find the specific thread we're interested in
    const targetThread = data.analytics?.threadsWithReactions?.find(
      (t) => t.threadId === threadId
    );

    if (targetThread) {
      console.log("\n==== TARGET THREAD FOUND ====");
      console.log(`Title: ${targetThread.title}`);
      console.log(`Segments count: ${targetThread.segments.length}`);
      console.log(`Has topReactedSegment: ${!!targetThread.topReactedSegment}`);

      if (targetThread.topReactedSegment) {
        console.log("\n== Top Reacted Segment ==");
        console.log(`Position: ${targetThread.topReactedSegment.position}`);
        console.log(`Content: ${targetThread.topReactedSegment.content}`);
        console.log(
          `Total Reactions: ${targetThread.topReactedSegment.totalReactions}`
        );
      } else {
        console.log("\n== Segment Reactions ==");
        targetThread.segments.forEach((segment, i) => {
          console.log(`\nSegment ${i}:`);
          console.log(`Content: ${segment.content}`);
          console.log(`Total reactions: ${segment.totalReactions}`);
          console.log("Reaction counts:", segment.reactionCounts);
        });
      }
    } else {
      console.log(`\nTarget thread ${threadId} not found in analytics data`);

      // Check if there are any threads with reactions
      if (data.analytics?.threadsWithReactions?.length > 0) {
        console.log(
          `\nFound ${data.analytics.threadsWithReactions.length} other threads with reactions`
        );
        data.analytics.threadsWithReactions.forEach((t, i) => {
          console.log(`\n${i + 1}. Thread ${t.threadId}: ${t.title}`);
          console.log(
            `   Segments: ${
              t.segments.length
            }, Has top segment: ${!!t.topReactedSegment}`
          );
        });
      } else {
        console.log("No threads with reactions found at all");
      }
    }

    // Now get the direct thread data to see the raw reactions
    const threadResponse = await fetch(
      `http://localhost:5000/api/threads/${threadId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (threadResponse.ok) {
      const threadData = await threadResponse.json();

      console.log("\n==== RAW THREAD DATA ====");
      console.log(`Title: ${threadData.thread.title}`);
      console.log(`Number of segments: ${threadData.thread.segments.length}`);

      // Check for reactions in each segment
      threadData.thread.segments.forEach((segment, i) => {
        console.log(`\nSegment ${i} reaction data:`);
        if (segment.reactions) {
          let totalReactions = 0;
          Object.entries(segment.reactions).forEach(([emoji, data]) => {
            if (data && data.count > 0) {
              console.log(`  ${emoji}: ${data.count}`);
              totalReactions += data.count;
            }
          });
          console.log(`  Total reactions: ${totalReactions}`);
        } else {
          console.log("  No reactions data found");
        }
      });
    } else {
      console.log(
        `Failed to fetch thread data: ${threadResponse.status} ${threadResponse.statusText}`
      );
    }
  } catch (error) {
    console.error("Error checking thread reactions:", error);
  }
}

checkThreadReactions();
