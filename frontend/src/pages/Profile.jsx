import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postsAPI, messagesAPI } from "../utils/api";
import PostCard from "../components/PostCard";
import PostDetailModal from "../components/PostDetailModal";
import UploadArtModal from "../components/UploadArtModal";
import ProgressBar from "../components/ProgressBar";
import AchievementBadge from "../components/AchievementBadge";
import ProfileCollectionsTab from "../components/ProfileCollectionsTab";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiEdit,
  FiPlus,
  FiCamera,
  FiUserPlus,
  FiUserMinus,
  FiMapPin,
  FiLink,
  FiInstagram,
  FiTwitter,
  FiGlobe,
  FiImage,
  FiMessageCircle,
  FiGrid,
} from "react-icons/fi";
import { getProfilePicture } from "../utils/imageHelpers";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const {
    user: currentUser,
    updateProfile,
    followUser,
    unfollowUser,
    loading: authLoading,
  } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);

  // Edit Mode State
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    portfolio: "",
  });

  // Form State
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editSocialLinks, setEditSocialLinks] = useState({
    instagram: "",
    twitter: "",
    portfolio: "",
  });

  const [saving, setSaving] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState("artworks");

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    setTotalPosts((prev) => Math.max(0, prev - 1));
  };

  const handlePostLiked = (postId, stats) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? {
              ...post,
              likesCount:
                typeof stats.likesCount === "number"
                  ? stats.likesCount
                  : post.likesCount,
              likedByCurrentUser:
                typeof stats.likedByCurrentUser === "boolean"
                  ? stats.likedByCurrentUser
                  : post.likedByCurrentUser,
            }
          : post,
      ),
    );
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post,
      ),
    );
    if (selectedPost && selectedPost._id === updatedPost._id) {
      setSelectedPost(updatedPost);
    }
  };

  const POSTS_PER_PAGE = 9;
  const isOwnProfile = currentUser?._id === userId;

  const fetchUserPosts = useCallback(
    async (requestedPage = 1) => {
      try {
        if (requestedPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const { data } = await postsAPI.getUserPosts(
          userId,
          requestedPage,
          POSTS_PER_PAGE,
        );

        if (requestedPage === 1) {
          setProfile(data.user);
          setBio(data.user?.bio || "");
          setLocation(data.user?.location || "");
          setWebsite(data.user?.website || "");
          setSocialLinks(
            data.user?.socialLinks || {
              instagram: "",
              twitter: "",
              portfolio: "",
            },
          );
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setPage(requestedPage);
        setHasMore(data.hasMore);
        if (data.totalPosts !== undefined) {
          setTotalPosts(data.totalPosts);
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        if (requestedPage === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [POSTS_PER_PAGE, userId],
  );

  useEffect(() => {
    if (!authLoading) {
      setPosts([]);
      setPage(1);
      setHasMore(true);
      setTotalPosts(0);
      fetchUserPosts(1);
    }
  }, [fetchUserPosts, authLoading]);

  // Check if currently following this user
  useEffect(() => {
    if (currentUser && !isOwnProfile) {
      setIsFollowing(currentUser.following?.includes(userId) || false);
    } else if (isOwnProfile) {
      setIsFollowing(false);
    }
  }, [currentUser, userId, isOwnProfile]);

  // Sync profile data with currentUser for real-time updates (XP, Level)
  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          level: currentUser.level,
          xp: currentUser.xp,
          totalXP: currentUser.totalXP,
          achievements: currentUser.achievements,
          stats: currentUser.stats,
        };
      });
    }
  }, [currentUser, isOwnProfile]);

  const handleEditClick = () => {
    setEditBio(bio);
    setEditLocation(location);
    setEditWebsite(website);
    setEditSocialLinks({ ...socialLinks });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updates = {
        bio: editBio,
        location: editLocation,
        website: editWebsite,
        socialLinks: editSocialLinks,
      };

      const result = await updateProfile(updates);
      if (result.success) {
        setBio(editBio);
        setLocation(editLocation);
        setWebsite(editWebsite);
        setSocialLinks(editSocialLinks);
        setEditing(false);
        toast.success("Profile updated successfully!");
        setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleUploadSuccess = () => {
    setHasMore(true);
    setPage(1);
    fetchUserPosts(1);
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, GIF, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const setLoading =
      type === "cover" ? setUploadingCover : setUploadingProfilePic;
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const update =
            type === "cover"
              ? { coverImage: reader.result }
              : { profilePic: reader.result };
          const result = await updateProfile(update);

          if (result.success) {
            toast.success(
              `${type === "cover" ? "Cover image" : "Profile picture"} updated!`,
            );
            if (profile) {
              setProfile({ ...profile, ...update });
            }
          } else {
            toast.error(result.message || "Failed to update image");
          }
        } catch (error) {
          toast.error("Failed to update image");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process image");
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }

    setFollowLoading(true);
    try {
      let result;
      if (isFollowing) {
        result = await unfollowUser(userId);
        if (result.success) {
          setIsFollowing(false);
          toast.success("Unfollowed successfully");
          // Update follower count in profile
          if (profile) {
            setProfile({
              ...profile,
              followersCount: Math.max(0, (profile.followersCount || 0) - 1),
            });
          }
        } else {
          toast.error(result.message || "Failed to unfollow user");
        }
      } else {
        result = await followUser(userId);
        if (result.success) {
          setIsFollowing(true);
          toast.success("Following successfully");
          // Update follower count in profile
          if (profile) {
            setProfile({
              ...profile,
              followersCount: (profile.followersCount || 0) + 1,
            });
          }
        } else {
          toast.error(result.message || "Failed to follow user");
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update follow status",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessageUser = async () => {
    if (!currentUser) {
      toast.error("Please login to send messages");
      return;
    }

    try {
      // Create or get conversation with this user
      await messagesAPI.getOrCreateConversation(userId);
      // Open chat (this will be handled by the ChatButton component)
      toast.info("Opening chat...");
    } catch (error) {
      toast.error("Failed to open chat");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Header Skeleton */}
          <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-6 mb-6 border border-border-light dark:border-border-dark animate-pulse">
            <div className="flex items-start space-x-6">
              <div className="w-32 h-32 rounded-full bg-surface-light dark:bg-surface-dark"></div>
              <div className="flex-1">
                <div className="h-8 bg-surface-light dark:bg-surface-dark rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-2/3 mb-4"></div>
                <div className="flex items-center space-x-6">
                  <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-20"></div>
                  <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-20"></div>
                  <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Posts Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-surface-light dark:bg-surface-dark rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const fallbackProfile =
    !profile && isOwnProfile && currentUser
      ? {
          ...currentUser,
          followersCount: currentUser.followers?.length || 0,
          followingCount: currentUser.following?.length || 0,
        }
      : null;

  const profileData = profile || fallbackProfile;

  if (!profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-text-primary-light dark:text-text-primary-dark">
          Profile not found.
        </div>
      </div>
    );
  }

  const loadMorePosts = () => {
    if (hasMore && !loadingMore) {
      fetchUserPosts(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Cover Image Banner */}
      <div className="relative h-48 md:h-64 bg-gray-300 dark:bg-gray-700 overflow-hidden group">
        {profileData?.coverImage ? (
          <img
            src={profileData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-75"></div>
        )}

        {isOwnProfile && (
          <label className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full cursor-pointer text-white transition-colors opacity-0 group-hover:opacity-100">
            {uploadingCover ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiCamera size={20} />
            )}
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => handleImageUpload(e, "cover")}
              disabled={uploadingCover}
            />
          </label>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-6">
          <div className="bg-background-light dark:bg-background-dark rounded-xl shadow-lg p-6 border border-border-light dark:border-border-dark">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Profile Picture */}
              <div className="relative -mt-20 md:-mt-24 flex-shrink-0">
                <div className="relative group">
                  <img
                    src={getProfilePicture(profileData?.profilePic)}
                    alt={profileData?.username}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-background-light dark:border-background-dark shadow-md bg-surface-light dark:bg-surface-dark"
                  />
                  {isOwnProfile && (
                    <label
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
                      title="Change Profile Picture"
                    >
                      <div className="text-white text-center">
                        {uploadingProfilePic ? (
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                        ) : (
                          <FiCamera size={24} />
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => handleImageUpload(e, "profile")}
                        disabled={uploadingProfilePic}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* User Info & Actions */}
              <div className="flex-1 w-full md:w-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                      {profileData?.username}
                    </h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {profileData?.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOwnProfile ? (
                      <button
                        onClick={handleEditClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-primary-light dark:text-text-primary-dark font-medium"
                      >
                        <FiEdit size={16} />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleMessageUser}
                          className="flex items-center space-x-2 px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-primary-light dark:text-text-primary-dark font-medium"
                        >
                          <FiMessageCircle size={18} />
                          <span>Message</span>
                        </button>
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors font-medium ${
                            isFollowing
                              ? "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                          } disabled:opacity-50`}
                        >
                          {followLoading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : isFollowing ? (
                            <>
                              <FiUserMinus size={18} />
                              <span>Unfollow</span>
                            </>
                          ) : (
                            <>
                              <FiUserPlus size={18} />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 md:gap-8 border-t border-border-light dark:border-border-dark pt-4 mt-4">
                  <div className="text-center md:text-left">
                    <span className="block text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                      {totalPosts}
                    </span>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Artworks
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="block text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                      {profileData?.followersCount || 0}
                    </span>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Followers
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="block text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                      {profileData?.followingCount || 0}
                    </span>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Following
                    </span>
                  </div>
                </div>

                {/* Level & XP Progress */}
                {profileData && (
                  <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
                    <div className="mb-4">
                      <ProgressBar
                        currentXP={profileData.xp || 0}
                        xpForNextLevel={Math.floor(
                          100 * Math.pow(profileData.level || 1, 1.5),
                        )}
                        level={profileData.level || 1}
                        showLabel={true}
                      />
                    </div>

                    {/* Challenge Streak */}
                    {(profileData.dailyChallengeStreak || 0) > 0 && (
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <span className="text-orange-500 text-xl">🔥</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {profileData.dailyChallengeStreak} Day Streak
                        </span>
                      </div>
                    )}

                    {/* Achievements */}
                    {profileData.achievements &&
                      profileData.achievements.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            🏆 Achievements ({profileData.achievements.length})
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {profileData.achievements
                              .slice(0, 8)
                              .map((achievement, index) => (
                                <AchievementBadge
                                  key={index}
                                  achievement={achievement}
                                  size="md"
                                />
                              ))}
                            {profileData.achievements.length > 8 && (
                              <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full text-sm font-semibold text-gray-600 dark:text-gray-400">
                                +{profileData.achievements.length - 8}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Bio & Details Section */}
            <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
              {editing ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                      Bio
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                        Location
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FiMapPin size={16} />
                        </div>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          maxLength={50}
                          className="w-full pl-10 pr-3 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                        Website
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FiGlobe size={16} />
                        </div>
                        <input
                          type="url"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://your-portfolio.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      Social Links
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FiInstagram size={16} />
                        </div>
                        <input
                          type="text"
                          value={editSocialLinks.instagram}
                          onChange={(e) =>
                            setEditSocialLinks({
                              ...editSocialLinks,
                              instagram: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-3 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Instagram username"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FiTwitter size={16} />
                        </div>
                        <input
                          type="text"
                          value={editSocialLinks.twitter}
                          onChange={(e) =>
                            setEditSocialLinks({
                              ...editSocialLinks,
                              twitter: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-3 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Twitter username"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FiLink size={16} />
                        </div>
                        <input
                          type="url"
                          value={editSocialLinks.portfolio}
                          onChange={(e) =>
                            setEditSocialLinks({
                              ...editSocialLinks,
                              portfolio: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-3 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Portfolio URL"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {bio && (
                    <p className="text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap leading-relaxed">
                      {bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {location && (
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-gray-400" />
                        <span>{location}</span>
                      </div>
                    )}

                    {website && (
                      <div className="flex items-center gap-2">
                        <FiGlobe className="text-gray-400" />
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline truncate max-w-[200px]"
                        >
                          {website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-400" />
                      <span>
                        Joined{" "}
                        {profileData?.dateJoined
                          ? new Date(profileData.dateJoined).toLocaleDateString(
                              undefined,
                              { month: "long", year: "numeric" },
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {(socialLinks?.instagram ||
                    socialLinks?.twitter ||
                    socialLinks?.portfolio) && (
                    <div className="flex gap-3 pt-2">
                      {socialLinks.instagram && (
                        <a
                          href={`https://instagram.com/${socialLinks.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:text-pink-500 transition-colors"
                          title="Instagram"
                        >
                          <FiInstagram size={18} />
                        </a>
                      )}
                      {socialLinks.twitter && (
                        <a
                          href={`https://twitter.com/${socialLinks.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:text-blue-400 transition-colors"
                          title="Twitter"
                        >
                          <FiTwitter size={18} />
                        </a>
                      )}
                      {socialLinks.portfolio && (
                        <a
                          href={socialLinks.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:text-purple-500 transition-colors"
                          title="Portfolio"
                        >
                          <FiLink size={18} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          {/* Tab navigation */}
          <div className="flex border-b border-border-light dark:border-border-dark mb-6">
            <button
              onClick={() => setActiveTab("artworks")}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "artworks"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
              }`}
            >
              <FiImage size={15} />
              Artworks
              {totalPosts > 0 && (
                <span className="text-xs bg-surface-light dark:bg-surface-dark px-1.5 py-0.5 rounded-full">
                  {totalPosts}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("collections")}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "collections"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
              }`}
            >
              <FiGrid size={15} />
              Collections
            </button>
          </div>

          {/* Artworks tab */}
          {activeTab === "artworks" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                  <FiImage className="text-blue-500" />
                  <span>Artworks</span>
                </h2>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 font-medium"
                  >
                    <FiPlus size={20} />
                    <span>Upload Art</span>
                  </button>
                )}
              </div>

              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-background-light dark:bg-background-dark rounded-2xl border border-border-light dark:border-border-dark border-dashed">
                  <div className="w-16 h-16 bg-surface-light dark:bg-surface-dark rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <FiImage size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                    No artworks yet
                  </h3>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    {isOwnProfile
                      ? "Upload your first masterpiece to get started!"
                      : "This user hasn't posted any artwork yet."}
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Upload Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => (
                    <div
                      key={post._id}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-surface-light dark:bg-surface-dark shadow-md hover:shadow-xl transition-all duration-300"
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.title || "Post"}
                        loading={index < 6 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onClick={() => setSelectedPost(post)}
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 cursor-pointer"
                        onClick={() => setSelectedPost(post)}
                      >
                        <h3 className="text-white font-bold truncate">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                          <span>❤️ {post.likesCount || 0}</span>
                          <span>💬 {post.commentCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {posts.length > 0 && hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium text-text-primary-light dark:text-text-primary-dark shadow-sm"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading more art...</span>
                      </>
                    ) : (
                      <span>Load More Artworks</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Collections tab */}
          {activeTab === "collections" && (
            <ProfileCollectionsTab
              userId={userId}
              isOwnProfile={isOwnProfile}
            />
          )}
        </div>
      </div>

      {/* Upload Art Modal */}
      <UploadArtModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        onLike={(stats) =>
          selectedPost && handlePostLiked(selectedPost._id, stats)
        }
        onDelete={(postId) => {
          handlePostDeleted(postId);
          setSelectedPost(null);
        }}
        onUpdate={handlePostUpdate}
      />
    </div>
  );
};

export default Profile;
