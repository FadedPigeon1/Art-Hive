import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SearchProvider } from "./context/SearchContext";
import io from "socket.io-client";
import Navbar from "./components/Navbar";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Sketchbook from "./pages/SketchbookPro";
import Game from "./pages/Game";
import Favorites from "./pages/Favorites";
import LikedPosts from "./pages/LikedPosts";
import ColorPickerPage from "./pages/ColorPickerPage";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Settings from "./pages/Settings";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-primary-light dark:text-text-primary-dark">
          Loading...
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { isAuthenticated, user, updateUserStats } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const userIdRef = useRef(null);

  // Initialize Socket.IO connection (deferred and non-blocking)
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      // Clean up socket if user logged out
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
      userIdRef.current = null;
      return;
    }

    // Prevent duplicate connections for same user
    if (userIdRef.current === user._id && socketRef.current?.connected) {
      return;
    }

    // Close old socket if user changed
    if (socketRef.current && userIdRef.current !== user._id) {
      socketRef.current.close();
      socketRef.current = null;
    }

    userIdRef.current = user._id;

    // Defer socket connection to not block initial render
    const timer = setTimeout(() => {
      const newSocket = io(API_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        newSocket.emit("register-user", user._id);
      });

      newSocket.on("reconnect", () => {
        console.log("Socket reconnected");
        newSocket.emit("register-user", user._id);
      });

      newSocket.on("xp-update", (data) => {
        console.log("XP Update:", data);

        updateUserStats({
          level: data.newLevel,
          xp: data.currentXP,
          totalXP: data.totalXP,
          newAchievements: data.newAchievements,
        });

        if (data.leveledUp) {
          toast.success(`🎉 Level Up! You are now level ${data.newLevel}!`);
        } else if (data.xpAwarded > 0) {
          toast.info(`+${data.xpAwarded} XP: ${data.reason}`, {
            autoClose: 2000,
            hideProgressBar: true,
            position: "bottom-left",
          });
        }

        if (data.newAchievements && data.newAchievements.length > 0) {
          data.newAchievements.forEach((achievement) => {
            toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`);
          });
        }
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }, 300); // 300ms delay to not block initial page render

    return () => {
      clearTimeout(timer);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user?._id]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      <Router>
        <Navbar socket={socket} />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/game" element={<Game />} />
          <Route path="/sketchbook" element={<Sketchbook />} />
          <Route path="/color-picker" element={<ColorPickerPage />} />
          <Route path="/collections/:userId" element={<Collections />} />
          <Route
            path="/collections/:userId/:collectionId"
            element={<CollectionDetail />}
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/liked"
            element={
              <ProtectedRoute>
                <LikedPosts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <GroupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        toastClassName={(context) =>
          `relative flex p-4 min-h-10 rounded-xl justify-between overflow-hidden cursor-pointer shadow-2xl mb-4 
          bg-surface-light dark:bg-surface-dark 
          border border-border-light dark:border-border-dark
          ${context?.type === "success" ? "border-l-4 border-l-green-500" : ""}
          ${context?.type === "error" ? "border-l-4 border-l-red-500" : ""}
          ${context?.type === "info" ? "border-l-4 border-l-primary-light" : ""}
          ${context?.type === "warning" ? "border-l-4 border-l-yellow-500" : ""}
          `
        }
        bodyClassName={() =>
          "text-sm font-medium text-text-primary-light dark:text-text-primary-dark flex items-center"
        }
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SearchProvider>
          <AppContent />
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
