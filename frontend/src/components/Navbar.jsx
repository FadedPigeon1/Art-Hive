import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSearch } from "../context/SearchContext";
import {
  FiHome,
  FiLogOut,
  FiSun,
  FiMoon,
  FiPlus,
  FiSettings,
  FiSearch,
  FiX,
  FiStar,
  FiHeart,
  FiMenu,
  FiMessageCircle,
} from "react-icons/fi";
import { FaPalette, FaGamepad, FaEyeDropper, FaUsers } from "react-icons/fa";
import { getProfilePicture } from "../utils/imageHelpers";
import NotificationDropdown from "./NotificationDropdown";
import { messagesAPI } from "../utils/api";
import Chat from "./Chat";

const Navbar = ({ socket }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery, isSearchOpen, openSearch, closeSearch } =
    useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const settingsRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch unread count with delay to avoid blocking initial load
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchUnreadCount();
      }, 500);
      return () => clearTimeout(timer);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeSearch]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchClick = () => {
    navigate("/explore");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link
      to={to}
      className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 group ${
        active
          ? "text-primary-light dark:text-primary-dark font-semibold bg-primary-light/5 dark:bg-primary-dark/10"
          : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark hover:text-primary-light dark:hover:text-primary-dark font-medium"
      }`}
    >
      <Icon
        size={18}
        className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
      />
      <span className="hidden lg:inline">{label}</span>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary-light dark:bg-primary-dark rounded-t-full" />
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-border-light/50 dark:border-border-dark/50 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-8 h-8 group-hover:-translate-y-0.5 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="ArtHive Logo"
                className="w-full h-full object-contain drop-shadow-md"
                onError={(e) => {
                  // Fallback in case the image hasn't been saved yet
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden absolute inset-0 bg-gradient-to-r from-primary-light via-secondary-light to-accent-light dark:from-primary-dark dark:via-secondary-dark dark:to-accent-dark rounded-xl shadow-md flex items-center justify-center">
                <FaPalette className="text-white text-xl" />
              </div>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-primary-light via-secondary-light to-accent-light dark:from-primary-dark dark:via-secondary-dark dark:to-accent-dark bg-clip-text text-transparent tracking-tight">
              ArtHive
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/"
              icon={FiHome}
              label="Home"
              active={location.pathname === "/"}
            />
            <NavLink
              to="/explore"
              icon={FiSearch}
              label="Explore"
              active={location.pathname === "/explore"}
            />
            <NavLink
              to="/game"
              icon={FaGamepad}
              label="Game"
              active={location.pathname === "/game"}
            />
            <NavLink
              to="/color-picker"
              icon={FaEyeDropper}
              label="Color Picker"
              active={location.pathname === "/color-picker"}
            />
            <NavLink
              to="/groups"
              icon={FaUsers}
              label="Communities"
              active={location.pathname.startsWith("/groups")}
            />
            {isAuthenticated && (
              <NavLink
                to="/sketchbook"
                icon={FiPlus}
                label="Create"
                active={location.pathname === "/sketchbook"}
              />
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search */}
            <button
              onClick={() => navigate("/explore")}
              className={`md:hidden p-2.5 rounded-xl transition-all duration-300 hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark hover:scale-105`}
            >
              <FiSearch size={20} />
            </button>

            {/* Messages - only show when authenticated */}
            {isAuthenticated && (
              <button
                onClick={handleToggleChat}
                className="relative p-2.5 rounded-xl hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-all duration-300 hover:scale-105"
              >
                <FiMessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border border-background-light dark:border-background-dark">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications - only show when authenticated */}
            {isAuthenticated && <NotificationDropdown socket={socket} />}

            {isAuthenticated ? (
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center space-x-2 pl-2 pr-2 py-1.5 rounded-xl hover:bg-surface-light dark:hover:bg-surface-dark border border-transparent hover:border-border-light dark:hover:border-border-dark transition-all duration-300"
                >
                  <img
                    src={getProfilePicture(user?.profilePic)}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-light/20 hover:ring-primary-light/50 transition-all duration-300"
                  />
                  <FiSettings
                    className={`text-text-secondary-light dark:text-text-secondary-dark transition-transform duration-300 ${
                      isSettingsOpen ? "rotate-90" : ""
                    }`}
                    size={16}
                  />
                </button>

                {/* Dropdown */}
                {isSettingsOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border border-border-light dark:border-border-dark rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 py-2 animate-in fade-in slide-in-from-top-5 duration-200 z-50">
                    <div className="px-4 py-3 border-b border-border-light dark:border-border-dark mb-2">
                      <p className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate mt-0.5">
                        {user?.username}
                      </p>
                    </div>

                    <div className="md:hidden border-b border-border-light dark:border-border-dark mb-2 pb-2">
                      <Link
                        to="/"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full px-4 py-2 flex items-center space-x-3 text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                      >
                        <FiHome size={16} />
                        <span>Home</span>
                      </Link>
                      <Link
                        to="/game"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full px-4 py-2 flex items-center space-x-3 text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                      >
                        <FaGamepad size={16} />
                        <span>Game</span>
                      </Link>
                      <Link
                        to="/color-picker"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full px-4 py-2 flex items-center space-x-3 text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                      >
                        <FaEyeDropper size={16} />
                        <span>Color Picker</span>
                      </Link>
                      <Link
                        to="/groups"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full px-4 py-2 flex items-center space-x-3 text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                      >
                        <FaUsers size={16} />
                        <span>Communities</span>
                      </Link>
                      <Link
                        to="/sketchbook"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full px-4 py-2 flex items-center space-x-3 text-primary-light dark:text-primary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors font-medium"
                      >
                        <FiPlus size={16} />
                        <span>Create</span>
                      </Link>
                    </div>

                    <Link
                      to={`/profile/${user?._id}`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-light/10 flex items-center justify-center">
                        <img
                          src={getProfilePicture(user?.profilePic)}
                          className="w-full h-full rounded-full object-cover"
                          alt=""
                        />
                      </div>
                      <span>Your Profile</span>
                    </Link>

                    <Link
                      to="/groups"
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-light/10 flex items-center justify-center">
                        <FaUsers size={16} className="text-primary-light" />
                      </div>
                      <span>Communities</span>
                    </Link>

                    <Link
                      to="/favorites"
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-yellow-500"
                    >
                      <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <FiStar size={16} className="text-yellow-500" />
                      </div>
                      <span>Favorites</span>
                    </Link>

                    <Link
                      to="/liked"
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <FiHeart size={16} className="text-red-500" />
                      </div>
                      <span>Liked Posts</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-purple-500"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <FiSettings size={16} className="text-purple-500" />
                      </div>
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        toggleTheme();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                      </div>
                      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>

                    <div className="border-t border-border-light dark:border-border-dark my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <FiLogOut size={16} />
                      </div>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2.5 rounded-xl hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-all duration-300 hover:scale-105"
                  >
                    <FiSettings
                      size={20}
                      className={`transition-transform duration-300 ${isSettingsOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                  {isSettingsOpen && (
                    <div className="absolute right-0 mt-4 w-48 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border border-border-light dark:border-border-dark rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 py-2 animate-in fade-in slide-in-from-top-5 duration-200 z-50">
                      <div className="md:hidden border-b border-border-light dark:border-border-dark mb-2 pb-2">
                        <Link
                          to="/"
                          onClick={() => setIsSettingsOpen(false)}
                          className="w-full px-4 py-2 flex items-center space-x-3 text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                        >
                          <FiHome size={16} />
                          <span>Home</span>
                        </Link>
                        <Link
                          to="/game"
                          onClick={() => setIsSettingsOpen(false)}
                          className="w-full px-4 py-2 flex items-center space-x-3 text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                        >
                          <FaGamepad size={16} />
                          <span>Game</span>
                        </Link>
                        <Link
                          to="/groups"
                          onClick={() => setIsSettingsOpen(false)}
                          className="w-full px-4 py-2 flex items-center space-x-3 text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                        >
                          <FaUsers size={16} />
                          <span>Communities</span>
                        </Link>
                      </div>
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark"
                      >
                        <div className="w-8 h-8 rounded-full bg-surface-light dark:bg-background-dark flex items-center justify-center">
                          {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                        </div>
                        <span className="font-medium">
                          {isDark ? "Light Mode" : "Dark Mode"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
                <Link
                  to="/login"
                  className="hidden sm:block px-5 py-2 text-sm font-bold text-text-primary-light dark:text-text-primary-dark hover:bg-surface-light dark:hover:bg-surface-dark rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary-light to-secondary-light dark:from-primary-dark dark:to-secondary-dark hover:shadow-lg hover:shadow-primary-light/30 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Component */}
      <Chat
        socket={socket}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
