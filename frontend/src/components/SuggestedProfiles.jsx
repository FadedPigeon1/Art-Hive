import React, { useState, useEffect } from "react";
import { authAPI, socialAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
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
      // Delay loading suggested profiles to prioritize feed loading (2s delay)
      const timer = setTimeout(() => {
        fetchSuggestedUsers();
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      // Check if token is valid
      if (!token || token === "null" || token === "undefined") {
        setLoading(false);
        return;
      }

      const response = await socialAPI.getSuggestedUsers();
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
    <div className="bg-background-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 transition-colors">
      <h3 className="text-lg font-bold mb-4 text-text-primary-light dark:text-text-primary-dark">
        Suggested Profiles
      </h3>
      <div className="space-y-4">
        {suggestedUsers.map((suggestedUser) => (
          <div
            key={suggestedUser._id}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img
                src={getProfilePicture(suggestedUser.profilePic)}
                alt={suggestedUser.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-light/30 transition-all duration-300"
              />
              <div className="flex-1 min-w-0 max-w-[120px] sm:max-w-[150px]">
                <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate transition-colors group-hover:text-primary-light dark:group-hover:text-primary-light">
                  {suggestedUser.username}
                </p>
                {suggestedUser.bio && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">
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
              className={`ml-2 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 transform active:scale-95 ${
                followingMap[suggestedUser._id]
                  ? "bg-surface-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                  : "bg-text-primary-light dark:bg-text-primary-dark text-background-light dark:text-background-dark hover:bg-gray-800 dark:hover:bg-gray-200"
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
