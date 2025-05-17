"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "./api";
import { useRouter } from "next/navigation";
import { tokenStorage } from "./cookie-utils";
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to set user data both in state and storage
  const setUserData = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      tokenStorage.setUser(userData);
    }
  };

  // Function to load user data using the token
  const loadUser = async () => {
    try {
      // Try to get cached user data to show immediately
      const cachedUser = tokenStorage.getUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      const token = tokenStorage.getToken();

      if (token) {
        try {
          const { data } = await authAPI.getCurrentUser();
          if (data?.user) {
            setUserData(data.user);
          } else {
            tokenStorage.removeToken();
            setUserData(null);
          }
        } catch (fetchError) {
          tokenStorage.removeToken();
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
    } catch (err) {
      tokenStorage.removeToken();
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load user on initial mount
  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });

      if (data?.user && data?.token) {
        setUserData(data.user);
        tokenStorage.setToken(data.token, rememberMe);
        router.push("/explore");
      } else {
        toast.error("Invalid response from server");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email, password });

      if (data?.user && data?.token) {
        setUserData(data.user);
        tokenStorage.setToken(data.token, false);
        router.push("/explore");
      } else {
        toast.error("Invalid response from server");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      setUserData(null);
      tokenStorage.removeToken();
      router.push("/");
    } catch (err) {
      // Even if logout API fails, still remove the token and user state
      setUserData(null);
      tokenStorage.removeToken();
      toast.error("Error during logout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
