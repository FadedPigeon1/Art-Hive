import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../utils/api";
import PostCard from "../components/PostCard";
import UploadArtModal from "../components/UploadArtModal";
import { toast } from "react-toastify";
import { FiCalendar, FiEdit, FiPlus, FiCamera } from "react-icons/fi";
import { getProfilePicture } from "../utils/imageHelpers";

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const isOwnProfile = currentUser?._id === userId;

  useEffect(() => {
    fetchUserPosts();
  }, [userId]);

  // Update bio when currentUser changes (after profile update)
  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setBio(currentUser.bio || "");
      setProfile(currentUser);
    }
  }, [currentUser, isOwnProfile]);

  const fetchUserPosts = async () => {
    try {
      const { data } = await postsAPI.getUserPosts(userId);
      if (data.length > 0) {
        const userFromPost = data[0].userId;
        setProfile(userFromPost);
        // Only set bio from posts if it's not own profile or if we don't have currentUser yet
        if (!isOwnProfile || !currentUser) {
          setBio(userFromPost.bio || "");
        }
      } else {
        // If no posts, fetch user data directly
        if (isOwnProfile && currentUser) {
          setProfile(currentUser);
        }
      }
      setPosts(data);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
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
    fetchUserPosts(); // Refresh posts after successful upload
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
            fetchUserPosts();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-text-primary-light dark:text-text-primary-dark">
          Loading profile...
        </div>
      </div>
    );
  }

  const profileData = profile || currentUser;

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
                {isOwnProfile && (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-surface-light dark:bg-surface-dark rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
                  >
                    <FiEdit size={18} />
                    <span>Edit Profile</span>
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
                  {new Date(profileData?.dateJoined).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center space-x-6 mt-4">
                <div>
                  <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    {posts.length}
                  </span>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark ml-1">
                    Posts
                  </span>
                </div>
                <div>
                  <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    {profileData?.followers?.length || 0}
                  </span>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark ml-1">
                    Followers
                  </span>
                </div>
                <div>
                  <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    {profileData?.following?.length || 0}
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
              {posts.map((post) => (
                <div key={post._id} className="aspect-square">
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      (window.location.href = `/?post=${post._id}`)
                    }
                  />
                </div>
              ))}
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
