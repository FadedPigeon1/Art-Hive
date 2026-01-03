import React, { createContext, useState, useContext, useEffect } from "react";
import client from "../utils/api/client";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Load user when token changes
  useEffect(() => {
    if (token && token !== "null" && token !== "undefined") {
      loadUser();
    } else {
      // Clear invalid token
      if (token) {
        localStorage.removeItem("token");
        setToken(null);
      }
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const { data } = await client.get("/api/auth/me");
      setUser(data);
    } catch (error) {
      console.error("Failed to load user:", error);
      // Don't immediately logout on error - might be temporary network issue
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await client.post("/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await client.post("/api/auth/register", {
        username,
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await client.put("/api/auth/profile", profileData);
      // Update token if new one is provided
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      }
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };
  const updateUserStats = (stats) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updates = { ...stats };

      // Handle achievements special case
      if (updates.newAchievements) {
        updates.achievements = [
          ...(prev.achievements || []),
          ...updates.newAchievements,
        ];
        delete updates.newAchievements;
      }

      return { ...prev, ...updates };
    });
  };
  const followUser = async (userId) => {
    try {
      await client.put(`/api/auth/follow/${userId}`);
      // Reload user data to get updated following list
      await loadUser();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to follow user",
      };
    }
  };

  const unfollowUser = async (userId) => {
    try {
      await client.put(`/api/auth/unfollow/${userId}`);
      // Reload user data to get updated following list
      await loadUser();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to unfollow user",
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateUserStats,
    followUser,
    unfollowUser,
    loadUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
