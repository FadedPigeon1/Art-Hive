import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  FiUser,
  FiLock,
  FiBell,
  FiShield,
  FiSave,
  FiCamera,
} from "react-icons/fi";
import { getProfilePicture } from "../utils/imageHelpers";

const Settings = () => {
  const { user, login } = useAuth(); // login is used to update local user state
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    username: "",
    bio: "",
    website: "",
    location: "",
    email: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification Settings (Mock)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });

  // Privacy Settings (Mock)
  const [privacy, setPrivacy] = useState({
    isPrivate: false,
    showActivity: true,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      // Update local user context (assuming login function can handle user object update or we need a dedicated updateUser function in context)
      // For now, we might need to reload or just trust the backend response
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const renderSidebar = () => (
    <div className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden h-fit">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="font-bold text-xl text-gray-800 dark:text-white">
          Settings
        </h2>
      </div>
      <nav className="flex flex-col">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            activeTab === "profile"
              ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-l-4 border-purple-600"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <FiUser size={20} />
          <span>Edit Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            activeTab === "password"
              ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-l-4 border-purple-600"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <FiLock size={20} />
          <span>Change Password</span>
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            activeTab === "notifications"
              ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-l-4 border-purple-600"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <FiBell size={20} />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            activeTab === "privacy"
              ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-l-4 border-purple-600"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <FiShield size={20} />
          <span>Privacy & Security</span>
        </button>
      </nav>
    </div>
  );

  const renderProfileContent = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <img
            src={getProfilePicture(user?.profilePic)}
            alt={user?.username}
            className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700"
          />
          <button className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full hover:bg-purple-700 transition-colors shadow-md">
            <FiCamera size={14} />
          </button>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {user?.username}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Update your photo and personal details
          </p>
        </div>
      </div>

      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={profileForm.username}
              onChange={(e) =>
                setProfileForm({ ...profileForm, username: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileForm.email}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            rows="4"
            value={profileForm.bio}
            onChange={(e) =>
              setProfileForm({ ...profileForm, bio: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={profileForm.website}
              onChange={(e) =>
                setProfileForm({ ...profileForm, website: e.target.value })
              }
              placeholder="https://your-portfolio.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={profileForm.location}
              onChange={(e) =>
                setProfileForm({ ...profileForm, location: e.target.value })
              }
              placeholder="New York, USA"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderPasswordContent = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Change Password
      </h3>
      <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Password
          </label>
          <input
            type="password"
            required
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })
            }
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value,
              })
            }
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderNotificationsContent = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Notification Preferences
      </h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Email Notifications
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive emails about your account activity
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) =>
                setNotifications({ ...notifications, email: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Push Notifications
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive push notifications on your device
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={(e) =>
                setNotifications({ ...notifications, push: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Marketing Emails
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive emails about new features and special offers
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.marketing}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  marketing: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPrivacyContent = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Privacy & Security
      </h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Private Account
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only people you approve can see your photos and videos
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.isPrivate}
              onChange={(e) =>
                setPrivacy({ ...privacy, isPrivate: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Activity Status
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allow accounts you follow and anyone you message to see when you
              were last active
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.showActivity}
              onChange={(e) =>
                setPrivacy({ ...privacy, showActivity: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {renderSidebar()}
        <div className="flex-1">
          {activeTab === "profile" && renderProfileContent()}
          {activeTab === "password" && renderPasswordContent()}
          {activeTab === "notifications" && renderNotificationsContent()}
          {activeTab === "privacy" && renderPrivacyContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
