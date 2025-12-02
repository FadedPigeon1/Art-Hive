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
} from "react-icons/fi";
import { FaPalette, FaGamepad } from "react-icons/fa";
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

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-all duration-200"
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

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
                  <FiSettings className="text-text-secondary-light dark:text-text-secondary-dark" size={16} />
                </button>

                {/* Dropdown */}
                {isSettingsOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-3 border-b border-border-light dark:border-border-dark mb-2">
                      <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Signed in as</p>
                      <p className="text-sm font-bold text-primary-light truncate">{user?.username}</p>
                    </div>
                    
                    <Link
                      to={`/profile/${user?._id}`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-light/10 flex items-center justify-center">
                        <img src={getProfilePicture(user?.profilePic)} className="w-full h-full rounded-full object-cover" alt="" />
                      </div>
                      <span>Your Profile</span>
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
      <div className={`absolute top-full left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark shadow-lg transition-all duration-300 origin-top ${isSearchOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
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
    </nav>
  );
};

export default Navbar;
