import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  FiHome,
  FiUser,
  FiLogOut,
  FiSun,
  FiMoon,
  FiPlus,
} from "react-icons/fi";
import { IoGameControllerOutline } from "react-icons/io5";

const DEFAULT_AVATAR = "/default-avatar.svg";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to={`/profile/${user?._id}`}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={user?.profilePic || DEFAULT_AVATAR}
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
    </nav>
  );
};

export default Navbar;
