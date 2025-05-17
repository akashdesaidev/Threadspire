import axios from "axios";
import { tokenStorage } from "./cookie-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // If we get a 401 error, the token might be invalid or expired
      // Remove the token from all storage locations
      tokenStorage.removeToken();

      // Redirect to login page if we're in the browser environment
      if (typeof window !== "undefined") {
        // Only redirect if not already on login/register page to avoid redirect loops
        const currentPath = window.location.pathname;
        if (!["/login", "/register"].includes(currentPath)) {
          // Use a timeout to allow the current request to complete
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.get("/auth/logout"),
  getCurrentUser: () => api.get("/auth/me"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
};

// Thread APIs
export const threadAPI = {
  getThreads: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    tags?: string;
    sort?: string;
    tagMode?: string;
  }) => api.get("/threads", { params }),
  getThreadById: (id: string) => api.get(`/threads/${id}`),
  getDraftThreadById: (id: string) => api.get(`/threads/${id}/edit`),
  createThread: (data: {
    title: string;
    segments: Array<{ title?: string; content: string }>;
    tags?: string[];
    status?: "draft" | "published";
    originalThread?: string;
  }) => api.post("/threads", data),
  updateThread: (
    id: string,
    data: {
      title?: string;
      segments?: Array<{ title?: string; content: string }>;
      tags?: string[];
      status?: "draft" | "published";
    }
  ) => api.put(`/threads/${id}`, data),
  deleteThread: (id: string) => api.delete(`/threads/${id}`),
  addReaction: (threadId: string, segmentId: string, reaction: string) =>
    api.post(`/threads/${threadId}/segments/${segmentId}/react/${reaction}`),
  bookmarkThread: (id: string) => api.post(`/threads/${id}/bookmark`),
  getBookmarkedThreads: (params?: { page?: number; limit?: number }) =>
    api.get("/threads/bookmarks/list", { params }),
  getThreadForks: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/threads/${id}/forks`, { params }),
  testDraftCreation: () => api.post("/threads/test-draft"),
};

// User APIs
export const userAPI = {
  getUserProfile: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) =>
    api.put("/users/profile", data),
  getUserThreads: (
    id: string,
    params?: { page?: number; limit?: number; status?: string }
  ) => api.get(`/users/${id}/threads`, { params }),
  getUserAnalytics: (id: string) => api.get(`/users/${id}/analytics`),
  createCollection: (data: { name: string }) =>
    api.post("/users/collections", data),
  addToCollection: (collectionName: string, threadId: string) =>
    api.post(`/users/collections/${collectionName}/threads/${threadId}`),
  removeFromCollection: (collectionName: string, threadId: string) =>
    api.delete(`/users/collections/${collectionName}/threads/${threadId}`),
  getCollections: (id: string) => api.get(`/users/${id}/collections`),
};

export default api;
