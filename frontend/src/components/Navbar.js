import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSearch } from "../context/SearchContext";
import {
  FiHome,
  FiUser,
  FiLogOut,
  FiSun,
  FiMoon,
  FiPlus,
  FiSettings,
  FiSearch,
  FiX,
  FiStar,
  FiHeart,
} from "react-icons/fi";
import { IoGameControllerOutline } from "react-icons/io5";
import { getProfilePicture } from "../utils/imageHelpers";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery, isSearchOpen, openSearch, closeSearch } =
    useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

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

  return (
    <nav className="sticky top-0 z-50 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
              ArtHive
            </span>
          </Link>

          {/* Center Navigation */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
            >
              <FiHome size={24} />
              <span className="hidden sm:inline">Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/sketchbook"
                  className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
                  title="Sketchbook"
                >
                  <FiPlus size={24} />
                  <span className="hidden sm:inline">Create</span>
                </Link>

                <Link
                  to="/game"
                  className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
                  title="Play Game"
                >
                  <IoGameControllerOutline size={24} />
                  <span className="hidden sm:inline">Game</span>
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/game"
                className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
                title="Play Game"
              >
                <IoGameControllerOutline size={24} />
                <span className="hidden sm:inline">Game</span>
              </Link>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search Icon */}
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              aria-label="Search"
            >
              <FiSearch size={20} />
            </button>

            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                aria-label="Settings"
              >
                <FiSettings size={20} />
              </button>

              {/* Dropdown Menu */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-2">
                  {isAuthenticated && (
                    <>
                      <Link
                        to="/favorites"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-primary-light dark:text-text-primary-dark"
                      >
                        <FiStar size={18} className="text-yellow-500" />
                        <span>Favorites</span>
                      </Link>
                      <div className="border-t border-border-light dark:border-border-dark my-1"></div>
                    </>
                  )}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    {isDark ? (
                      <>
                        <FiSun size={18} />
                        <span className="text-text-primary-light dark:text-text-primary-dark">
                          Light Mode
                        </span>
                      </>
                    ) : (
                      <>
                        <FiMoon size={18} />
                        <span className="text-text-primary-light dark:text-text-primary-dark">
                          Dark Mode
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  to={`/profile/${user?._id}`}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={getProfilePicture(user?.profilePic)}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden md:inline text-text-primary-light dark:text-text-primary-dark">
                    {user?.username}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
                  aria-label="Logout"
                >
                  <FiLogOut size={20} />
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:bg-surface-light dark:hover:bg-surface-dark rounded-full transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-light hover:bg-primary-dark rounded-full transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Popup */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2" ref={searchRef}>
              <FiSearch
                className="text-text-secondary-light dark:text-text-secondary-dark"
                size={20}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts or users..."
                className="flex-1 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
              <button
                onClick={closeSearch}
                className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                aria-label="Close search"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
