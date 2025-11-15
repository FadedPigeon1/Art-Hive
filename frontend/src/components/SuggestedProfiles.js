import React, { useState, useEffect } from "react";
import { authAPI } from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";

const DEFAULT_AVATAR = "/default-avatar.svg";

const SuggestedProfiles = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const response = await authAPI.getSuggestedUsers();
      setSuggestedUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      await authAPI.followUser(userId);

      // Update the following map to show "Following"
      setFollowingMap((prev) => ({ ...prev, [userId]: true }));

      toast.success("User followed!");
    } catch (error) {
      console.error("Error following user:", error);
      toast.error(error.response?.data?.message || "Failed to follow user");
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      await authAPI.unfollowUser(userId);

      // Update the following map to show "Follow"
      setFollowingMap((prev) => ({ ...prev, [userId]: false }));

      toast.success("User unfollowed!");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error(error.response?.data?.message || "Failed to unfollow user");
    }
  };

  if (loading) {
    return null; // Don't show loading state for suggested profiles
  }

  if (suggestedUsers.length === 0) {
    return null; // Don't show widget if no suggestions
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 hidden lg:block">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
        Suggested Profiles
      </h3>
      <div className="space-y-3">
        {suggestedUsers.map((suggestedUser) => (
          <div
            key={suggestedUser._id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img
                src={suggestedUser.profilePic || DEFAULT_AVATAR}
                alt={suggestedUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {suggestedUser.username}
                </p>
                {suggestedUser.bio && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {suggestedUser.bio}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() =>
                followingMap[suggestedUser._id]
                  ? handleUnfollow(suggestedUser._id)
                  : handleFollow(suggestedUser._id)
              }
              className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                followingMap[suggestedUser._id]
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {followingMap[suggestedUser._id] ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedProfiles;
