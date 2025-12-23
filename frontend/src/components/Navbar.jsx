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
    if (!isSearchOpen) {
      openSearch();
      if (location.pathname !== "/") {
        navigate("/");
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
        active
          ? "bg-primary-light/10 text-primary-light dark:text-primary-dark font-medium"
          : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-light dark:hover:bg-surface-dark hover:text-primary-light dark:hover:text-primary-dark"
      }`}
    >
      <Icon size={20} />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-primary-light to-purple-600 rounded-xl shadow-lg shadow-primary-light/20 group-hover:shadow-primary-light/40 transition-all duration-300 transform group-hover:scale-105">
              <FaPalette className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-text-primary-light to-primary-light dark:from-white dark:to-primary-dark bg-clip-text text-transparent">
              ArtHive
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLink
              to="/"
              icon={FiHome}
              label="Home"
              active={location.pathname === "/"}
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
          <div className="flex items-center space-x-3">
            {/* Search */}
            <button
              onClick={handleSearchClick}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                isSearchOpen
                  ? "bg-primary-light text-white shadow-lg shadow-primary-light/30"
                  : "hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark"
              }`}
            >
              <FiSearch size={20} />
            </button>

            {/* Messages - only show when authenticated */}
            {isAuthenticated && (
              <button
                onClick={handleToggleChat}
                className="relative p-2.5 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-all duration-200"
              >
                <FiMessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
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
                  className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark border border-transparent hover:border-border-light dark:hover:border-border-dark transition-all duration-200"
                >
                  <img
                    src={getProfilePicture(user?.profilePic)}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-light/20"
                  />
                  <FiSettings
                    className="text-text-secondary-light dark:text-text-secondary-dark"
                    size={16}
                  />
                </button>

                {/* Dropdown */}
                {isSettingsOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-3 border-b border-border-light dark:border-border-dark mb-2">
                      <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-primary-light truncate">
                        {user?.username}
                      </p>
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
              <div className="flex items-center space-x-3">
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2.5 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-all duration-200"
                  >
                    <FiSettings size={20} />
                  </button>
                  {isSettingsOpen && (
                    <div className="absolute right-0 mt-4 w-48 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-5 duration-200">
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
                    </div>
                  )}
                </div>
                <Link
                  to="/login"
                  className="hidden sm:block px-5 py-2.5 text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:bg-surface-light dark:hover:bg-surface-dark rounded-full transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-light to-primary-dark hover:shadow-lg hover:shadow-primary-light/30 rounded-full transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <div
        className={`absolute top-full left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark shadow-lg transition-all duration-300 origin-top ${
          isSearchOpen
            ? "opacity-100 scale-y-100"
            : "opacity-0 scale-y-0 pointer-events-none"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative flex items-center" ref={searchRef}>
            <FiSearch
              className="absolute left-4 text-primary-light"
              size={24}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for artists, artworks, or tags..."
              className="w-full pl-12 pr-12 py-4 text-lg bg-surface-light dark:bg-surface-dark rounded-2xl border-2 border-transparent focus:border-primary-light focus:bg-background-light dark:focus:bg-background-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light focus:outline-none transition-all shadow-inner"
            />
            <button
              onClick={closeSearch}
              className="absolute right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-text-secondary-light transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      </div>
      <Chat
        socket={socket}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
