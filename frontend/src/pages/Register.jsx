import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password
    );

    if (result.success) {
      toast.success("Account created successfully!");
      navigate("/");
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background-light to-secondary-light/20 dark:from-primary-dark/20 dark:via-background-dark dark:to-secondary-dark/20 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20 dark:border-white/10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center transform hover:scale-105 transition-transform duration-300 relative">
              <img 
                src="/logo.png" 
                alt="ArtHive Logo" 
                className="w-full h-full object-contain drop-shadow-lg scale-[1.3]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full bg-gradient-to-br from-primary-light to-secondary-light rounded-2xl items-center justify-center shadow-lg transform rotate-3 hover:rotate-6">
                <FiUser className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent mb-2">
              Join ArtHive
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Create your account to start sharing art
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark ml-1"
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark group-focus-within:text-primary-light transition-colors" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={30}
                  className="block w-full pl-10 pr-3 py-3 bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all duration-200"
                  placeholder="artist_name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark ml-1"
              >
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark group-focus-within:text-primary-light transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark ml-1"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark group-focus-within:text-primary-light transition-colors" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-3 bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark ml-1"
              >
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark group-focus-within:text-primary-light transition-colors" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-3 bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-light to-secondary-light hover:from-primary-dark hover:to-secondary-dark text-white rounded-xl font-medium shadow-lg shadow-primary-light/30 hover:shadow-primary-light/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center group"
            >
              {loading ? (
                "Creating Account..."
              ) : (
                <>
                  Sign Up
                  <FiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-light hover:text-primary-dark font-semibold hover:underline transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
