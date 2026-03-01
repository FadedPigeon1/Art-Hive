import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success("Welcome back!");
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
              <div className="hidden w-full h-full bg-gradient-to-br from-primary-light to-secondary-light rounded-2xl items-center justify-center shadow-lg transform rotate-3">
                <span className="text-4xl text-white font-bold">Ah</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Login to continue your creative journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark ml-1"
              >
                Email Address
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
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-3 bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-primary-light hover:text-primary-dark transition-colors"
                >
                  Forgot password?
                </a>
              </div>
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
                  autoComplete="current-password"
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
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark text-center">
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary-light hover:text-primary-dark transition-colors hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
