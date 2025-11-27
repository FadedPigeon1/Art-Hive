import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../utils/api";
import PostCard from "../components/PostCard";
import UploadArtModal from "../components/UploadArtModal";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiEdit,
  FiPlus,
  FiCamera,
  FiUserPlus,
  FiUserMinus,
} from "react-icons/fi";
import { getProfilePicture } from "../utils/imageHelpers";

const Profile = () => {
  const { userId } = useParams();
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
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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
          POSTS_PER_PAGE
        );

        if (requestedPage === 1) {
          setProfile(data.user);
          setBio(data.user?.bio || "");
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
    [POSTS_PER_PAGE, userId]
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

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    setTotalPosts((prev) => Math.max(0, prev - 1));
  };

  const handleEditClick = () => {
    setEditBio(bio);
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({ bio: editBio });
      if (result.success) {
        setBio(editBio);
        setEditing(false);
        toast.success("Profile updated successfully!");
        setProfile((prev) => (prev ? { ...prev, bio: editBio } : prev));
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
    setEditBio(bio);
    setEditing(false);
  };

  const handleUploadSuccess = () => {
    setHasMore(true);
    setPage(1);
    fetchUserPosts(1);
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingProfilePic(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = await updateProfile({ profilePic: reader.result });
          if (result.success) {
            toast.success("Profile picture updated!");
            // Update local profile state
            if (profile) {
              setProfile({ ...profile, profilePic: reader.result });
            }
            // Refresh to get updated data
            fetchUserPosts(1);
          } else {
            toast.error(result.message || "Failed to update profile picture");
          }
        } catch (error) {
          toast.error("Failed to update profile picture");
        } finally {
          setUploadingProfilePic(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process image");
      setUploadingProfilePic(false);
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
        error.response?.data?.message || "Failed to update follow status"
      );
    } finally {
      setFollowLoading(false);
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-6 mb-6 border border-border-light dark:border-border-dark">
          <div className="flex items-start space-x-6">
            {/* Profile Picture with Edit Overlay */}
            <div className="relative group">
              <img
                src={getProfilePicture(profileData?.profilePic)}
                alt={profileData?.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-light"
              />
              {isOwnProfile && (
                <label
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Click to change profile picture"
                >
                  <div className="text-white text-center">
                    {uploadingProfilePic ? (
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      <>
                        <FiCamera size={32} className="mx-auto" />
                        <span className="text-xs mt-1 block">Change Photo</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleProfilePicChange}
                    disabled={uploadingProfilePic}
                  />
                </label>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {profileData?.username}
                </h1>
                {isOwnProfile ? (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-surface-light dark:bg-surface-dark rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
                  >
                    <FiEdit size={18} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isFollowing
                        ? "bg-surface-light dark:bg-surface-dark hover:bg-border-light dark:hover:bg-border-dark text-text-primary-light dark:text-text-primary-dark"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    } disabled:opacity-50`}
                  >
                    {followLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>
                          {isFollowing ? "Unfollowing..." : "Following..."}
                        </span>
                      </>
                    ) : (
                      <>
                        {isFollowing ? (
                          <FiUserMinus size={18} />
                        ) : (
                          <FiUserPlus size={18} />
                        )}
                        <span>{isFollowing ? "Unfollow" : "Follow"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                {profileData?.email}
              </p>

              {editing ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-surface-light dark:bg-surface-dark rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-primary-light dark:text-text-primary-dark mb-4">
                  {bio || "No bio yet"}
                </p>
              )}

              <div className="flex items-center space-x-2 text-text-secondary-light dark:text-text-secondary-dark">
                <FiCalendar size={16} />
                <span className="text-sm">
                  Joined{" "}
                  {profileData?.dateJoined
                    ? new Date(profileData.dateJoined).toLocaleDateString()
                    : "—"}
                </span>
              </div>

              <div className="flex items-center space-x-6 mt-4">
                <div>
                  <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    {totalPosts}
                  </span>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark ml-1">
                    Posts
                  </span>
                </div>
                <div>
                  <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    {profileData?.followersCount || 0}
                  </span>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark ml-1">
                    Followers
                  </span>
                </div>
                <div>
                  <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    {profileData?.followingCount || 0}
                  </span>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark ml-1">
                    Following
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Posts Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Artworks
            </h2>
            {isOwnProfile && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                title="Upload new artwork"
              >
                <FiPlus size={20} />
                <span>Upload Art</span>
              </button>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                No posts yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post, index) => (
                <div key={post._id} className="aspect-square">
                  <img
                    src={post.imageUrl}
                    alt={post.title || "Post"}
                    loading={index < 6 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      (window.location.href = `/?post=${post._id}`)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {posts.length > 0 && hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMorePosts}
                disabled={loadingMore}
                className="px-6 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Art Modal */}
      <UploadArtModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Profile;
