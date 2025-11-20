import React, { useState, useEffect } from "react";
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import { getProfilePicture } from "../utils/imageHelpers";

const SuggestedProfiles = () => {
  const {
    followUser: authFollowUser,
    unfollowUser: authUnfollowUser,
    user,
  } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    // Only fetch if user is logged in
    if (user) {
      fetchSuggestedUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      // Check if token is valid
      if (!token || token === "null" || token === "undefined") {
        console.log("SuggestedProfiles: No valid token found");
        setLoading(false);
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("SuggestedProfiles: Fetching suggested users...");
      const response = await authAPI.getSuggestedUsers();
      console.log(
        "SuggestedProfiles: Received",
        response.data.length,
        "suggestions"
      );
      setSuggestedUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const result = await authFollowUser(userId);

      if (result.success) {
        // Update the following map to show "Following"
        setFollowingMap((prev) => ({ ...prev, [userId]: true }));
        toast.success("User followed!");
      } else {
        toast.error(result.message || "Failed to follow user");
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const result = await authUnfollowUser(userId);

      if (result.success) {
        // Update the following map to show "Follow"
        setFollowingMap((prev) => ({ ...prev, [userId]: false }));
        toast.success("User unfollowed!");
      } else {
        toast.error(result.message || "Failed to unfollow user");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  if (loading) {
    return null; // Don't show loading state for suggested profiles
  }

  if (!user) {
    return null; // Don't show if user is not logged in
  }

  if (suggestedUsers.length === 0) {
    return null; // Don't show widget if no suggestions
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 z-50 hidden lg:block">
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
                src={getProfilePicture(suggestedUser.profilePic)}
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
