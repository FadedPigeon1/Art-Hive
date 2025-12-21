import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SearchProvider } from "./context/SearchContext";
import io from "socket.io-client";
import Navbar from "./components/Navbar";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Sketchbook from "./pages/SketchbookPro";
import Game from "./pages/Game";
import Favorites from "./pages/Favorites";
import LikedPosts from "./pages/LikedPosts";
import ColorPickerPage from "./pages/ColorPickerPage";

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
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(API_URL, {
        transports: ["websocket", "polling"],
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      <Router>
        <Navbar socket={socket} />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/game" element={<Game />} />
          <Route path="/sketchbook" element={<Sketchbook />} />
          <Route path="/color-picker" element={<ColorPickerPage />} />
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
