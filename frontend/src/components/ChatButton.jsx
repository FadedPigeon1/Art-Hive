import React, { useState, useEffect } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { messagesAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Chat from "./Chat";

const ChatButton = ({ socket }) => {
  const { isAuthenticated } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // Listen for real-time messages
  useEffect(() => {
    if (socket && isAuthenticated) {
      socket.on("new-message", () => {
        fetchUnreadCount();
      });

      return () => {
        socket.off("new-message");
      };
    }
  }, [socket, isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const data = await messagesAPI.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      // Reset unread count when opening
      setUnreadCount(0);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={handleToggleChat}
        className="fixed bottom-4 right-4 z-40 p-4 bg-gradient-to-r from-primary-light to-primary-dark text-white rounded-full shadow-2xl hover:shadow-primary-light/50 transition-all duration-300 transform hover:scale-110"
        title="Messages"
      >
        <FiMessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Chat
        socket={socket}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
};

export default ChatButton;
