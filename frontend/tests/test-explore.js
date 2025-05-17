// Script to test the explore endpoint with various tag combinations
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

async function testExplore(token, options = {}) {
  try {
    const params = new URLSearchParams();

    // Add options to params
    if (options.tags) params.append("tags", options.tags);
    if (options.tagMode) params.append("tagMode", options.tagMode);
    if (options.sort) params.append("sort", options.sort);
    if (options.page) params.append("page", options.page);
    if (options.limit) params.append("limit", options.limit);

    console.log(`Testing explore endpoint with params: ${params.toString()}`);

    const response = await axios.get(
      `${API_URL}/threads?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("API Response status:", response.status);
    console.log("Pagination:", response.data.pagination);
    console.log(`Found ${response.data.threads.length} threads`);

    // Show summary of each thread
    response.data.threads.forEach((thread, index) => {
      console.log(
        `Thread ${index + 1}: '${thread.title}' by ${thread.author.name}`
      );
      console.log(`  Tags: ${thread.tags.join(", ")}`);
      console.log(`  Status: ${thread.status}`);
    });

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

    // Test different scenarios
    console.log("\n==== 1. Testing default explore (no filters) ====");
    await testExplore(token);

    console.log("\n==== 2. Testing with single tag ====");
    await testExplore(token, { tags: "Technology" });

    console.log("\n==== 3. Testing with multiple tags (ANY mode) ====");
    await testExplore(token, { tags: "Technology,Science", tagMode: "any" });

    console.log("\n==== 4. Testing with multiple tags (ALL mode) ====");
    await testExplore(token, { tags: "Technology,Science", tagMode: "all" });

    console.log("\n==== 5. Testing sorting by bookmarks ====");
    await testExplore(token, { sort: "bookmarks" });

    console.log("\n==== 6. Testing with no results expected ====");
    await testExplore(token, { tags: "NonExistentTag" });

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
