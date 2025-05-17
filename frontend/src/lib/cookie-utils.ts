/**
 * Cookie utility functions for ThreadSpire
 * This provides direct methods that bypass the js-cookie library for more reliable cookie handling
 */

import Cookies from "js-cookie";

/**
 * Set a cookie with multiple fallback techniques for compatibility
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    expires?: number; // Days
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {}
) {
  // Default options
  const defaultOptions = {
    path: "/",
    sameSite: "lax" as const,
    // Disable secure for local development to help with cookie issues
    secure: false,
    // Don't set domain for better compatibility
    domain: undefined,
  };

  const opts = { ...defaultOptions, ...options };

  // Try multiple cookie-setting approaches for redundancy

  // 1. Try direct document.cookie setting (most compatible)
  try {
    // Build cookie string
    let cookieStr = `${name}=${encodeURIComponent(value)}; path=${opts.path}`;

    // Add expiration if specified
    if (opts.expires) {
      const date = new Date();
      date.setTime(date.getTime() + opts.expires * 24 * 60 * 60 * 1000);
      cookieStr += `; expires=${date.toUTCString()}`;
    }

    // Add other options
    if (opts.domain) cookieStr += `; domain=${opts.domain}`;
    if (opts.secure) cookieStr += "; secure";
    if (opts.sameSite) cookieStr += `; SameSite=${opts.sameSite}`;

    document.cookie = cookieStr;
  } catch (error) {
    console.error("Error with direct cookie setting:", error);
  }

  // 2. Try js-cookie as a secondary approach
  try {
    Cookies.set(name, value, opts as Cookies.CookieAttributes);
  } catch (err) {
    console.error("Error with js-cookie setting:", err);
  }

  // 3. New approach: Try with minimal attributes for compatibility
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
  } catch (e) {
    console.error("Error with minimal cookie setting:", e);
  }

  // 4. Try with max-age instead of expires
  try {
    if (!checkCookieExists(name) && opts.expires) {
      const maxAge = opts.expires * 24 * 60 * 60;
      document.cookie = `${name}=${encodeURIComponent(
        value
      )}; path=/; max-age=${maxAge}`;
    }
  } catch (e) {
    console.error("Error with max-age cookie setting:", e);
  }

  // Verify success
  const success = checkCookieExists(name);
  return success;
}

/**
 * Get a cookie value with improved fallback methods
 */
export function getCookie(name: string): string | null {
  // 1. Try direct cookie access first (most reliable)
  try {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.indexOf(name + "=") === 0) {
        const value = decodeURIComponent(cookie.substring(name.length + 1));
        return value;
      }
    }
  } catch (error) {
    console.error("Error accessing raw cookies:", error);
  }

  // 2. Try js-cookie as fallback
  try {
    const value = Cookies.get(name);
    if (value) {
      return value;
    }
  } catch (error) {
    console.error("Error with js-cookie get:", error);
  }

  // 3. Try regex pattern match as another fallback
  try {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    if (match) {
      return decodeURIComponent(match[2]);
    }
  } catch (error) {
    console.error("Error with regex cookie access:", error);
  }

  return null;
}

/**
 * Check if a cookie exists
 */
export function checkCookieExists(name: string): boolean {
  const result = getCookie(name) !== null;
  return result;
}

/**
 * Remove a cookie with multiple approaches for reliability
 */
export function removeCookie(
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {}
) {
  const opts = {
    path: "/",
    domain: undefined,
    ...options,
  };

  let success = true;

  // 1. Try direct document.cookie removal (most compatible)
  try {
    // Standard approach
    document.cookie = `${name}=; path=${opts.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    // Also try without path
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    // Add domain if specified
    if (opts.domain) {
      document.cookie = `${name}=; path=${opts.path}; domain=${opts.domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch (error) {
    console.error("Error with direct cookie removal:", error);
    success = false;
  }

  // 2. Try js-cookie removal as backup
  try {
    Cookies.remove(name, opts as Cookies.CookieAttributes);
  } catch (error) {
    console.error("Error with js-cookie removal:", error);
    success = false;
  }

  const stillExists = checkCookieExists(name);
  if (stillExists) {
    success = false;
  }

  return success;
}

/**
 * Cookie-localStorage hybrid storage for auth tokens
 */
export const tokenStorage = {
  TOKEN_KEY: "threadspire_token",
  USER_KEY: "threadspire_user",

  /**
   * Store token in both cookie and localStorage
   */
  setToken(token: string, rememberMe: boolean = false) {
    // First store in localStorage for redundancy
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (err) {
      console.warn("Could not store token in localStorage:", err);
    }

    // Then set the cookie with appropriate expiration
    const success = setCookie(this.TOKEN_KEY, token, {
      expires: rememberMe ? 30 : 7, // Use 7 days instead of session for better persistence
      sameSite: "lax", // Try "lax" for better compatibility
      secure: false, // Disable secure for troubleshooting
    });

    return success;
  },

  /**
   * Get token from cookie or localStorage
   */
  getToken(): string | null {
    // Try cookie first
    const cookieToken = getCookie(this.TOKEN_KEY);
    if (cookieToken) {
      return cookieToken;
    }

    // Fall back to localStorage
    try {
      const localToken = localStorage.getItem(this.TOKEN_KEY);
      if (localToken) {
        // Try to restore cookie from localStorage
        // Try multiple approaches:
        // 1. Standard approach
        setCookie(this.TOKEN_KEY, localToken, { expires: 7 });

        // 2. Try with minimal options if first approach failed
        if (!getCookie(this.TOKEN_KEY)) {
          document.cookie = `${this.TOKEN_KEY}=${encodeURIComponent(
            localToken
          )}; path=/`;
        }

        // 3. Try with max-age if still failed
        if (!getCookie(this.TOKEN_KEY)) {
          document.cookie = `${this.TOKEN_KEY}=${encodeURIComponent(
            localToken
          )}; path=/; max-age=${7 * 24 * 60 * 60}`;
        }

        return localToken;
      }
    } catch (err) {
      console.warn("Could not access localStorage:", err);
    }

    return null;
  },

  /**
   * Remove token from all storage locations
   */
  removeToken() {
    removeCookie(this.TOKEN_KEY);

    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (err) {
      console.warn("Could not remove from localStorage:", err);
    }
  },

  /**
   * Store user data in localStorage
   */
  setUser(user: any, rememberMe: boolean = false) {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn("Could not store user in localStorage:", err);
    }
    const success = setCookie(this.USER_KEY, JSON.stringify(user), {
      expires: rememberMe ? 30 : 7, // Use 7 days instead of session for better persistence
      sameSite: "lax", // Try "lax" for better compatibility
      secure: false, // Disable secure for troubleshooting
    });

    return success;
  },

  /**
   * Get user data from localStorage
   */
  getUser(): any {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (err) {
      console.warn("Could not retrieve user from localStorage:", err);
    }
    return null;
  },
};
