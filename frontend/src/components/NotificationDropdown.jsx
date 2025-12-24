import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { notificationsAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  FiBell,
  FiHeart,
  FiMessageCircle,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { FaGamepad } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getProfilePicture } from "../utils/imageHelpers";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = ({ socket }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch unread count only (lightweight)
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Register for real-time notifications (no duplicate socket registration)
  useEffect(() => {
    if (socket && user) {
      socket.on("new-notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast notification
        toast.info(`${notification.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      });

      return () => {
        socket.off("new-notification");
      };
    }
  }, [socket, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getAll();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      // Fetch notifications only when opening dropdown (lazy load)
      if (notifications.length === 0) {
        fetchNotifications();
      }

      // Mark all as read when opening
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <FiHeart className="text-red-500" />;
      case "comment":
        return <FiMessageCircle className="text-blue-500" />;
      case "follow":
        return <FiUserPlus className="text-green-500" />;
      case "game_invite":
        return <FaGamepad className="text-purple-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.type === "follow") {
      return `/profile/${notification.sender._id}`;
    } else if (notification.post) {
      return `/`; // Will need to open post modal
    } else if (notification.gameCode) {
      return `/game?code=${notification.gameCode}`;
    }
    return "#";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2.5 rounded-full transition-all duration-200 hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 max-h-[500px] overflow-y-auto bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="sticky top-0 bg-background-light dark:bg-background-dark px-4 py-3 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-light hover:text-primary-dark transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-border-light dark:divide-border-dark">
            {loading ? (
              <div className="p-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                <FiBell size={48} className="mx-auto mb-3 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors ${
                    !notification.read ? "bg-primary-light/5" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Link to={`/profile/${notification.sender._id}`}>
                      <img
                        src={getProfilePicture(notification.sender.profilePic)}
                        alt={notification.sender.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <Link
                            to={getNotificationLink(notification)}
                            className="text-sm text-text-primary-light dark:text-text-primary-dark hover:text-primary-light"
                          >
                            <span className="font-semibold">
                              {notification.sender.username}
                            </span>{" "}
                            {notification.type === "like" && "liked your post"}
                            {notification.type === "comment" &&
                              "commented on your post"}
                            {notification.type === "follow" &&
                              "started following you"}
                            {notification.type === "game_invite" &&
                              "invited you to a game"}
                          </Link>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      </div>

                      {notification.post && (
                        <div className="mt-2">
                          <img
                            src={notification.post.imageUrl}
                            alt="Post"
                            className="w-12 h-12 rounded object-cover"
                          />
                        </div>
                      )}

                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
