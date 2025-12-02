import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiMessageCircle,
  FiTrash2,
  FiPlus,
  FiEdit2,
  FiStar,
  FiX,
} from "react-icons/fi";
import { FaHeart, FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import Comments from "./Comments";
import EditPostModal from "./EditPostModal";
import { getProfilePicture } from "../utils/imageHelpers";

const PostDetailModal = ({
  isOpen,
  onClose,
  post,
  onLike,
  onDelete,
  onUpdate,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const deriveInitialLikes = (incomingPost) => {
    if (!incomingPost) return 0;
    if (typeof incomingPost.likesCount === "number") {
      return incomingPost.likesCount;
    }
    if (Array.isArray(incomingPost.likes)) {
      return incomingPost.likes.length;
    }
    return 0;
  };

  const deriveInitialStars = (incomingPost) => {
    if (!incomingPost) return 0;
    if (typeof incomingPost.starsCount === "number") {
      return incomingPost.starsCount;
    }
    if (Array.isArray(incomingPost.stars)) {
      return incomingPost.stars.length;
    }
    return 0;
  };

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isStarred, setIsStarred] = useState(false);
  const [starsCount, setStarsCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  useEffect(() => {
    if (post) {
      setCurrentPost(post);
      setIsLiked(post.likedByCurrentUser || false);
      setLikesCount(deriveInitialLikes(post));
      setIsStarred(post.starredByCurrentUser || false);
      setStarsCount(deriveInitialStars(post));
    }
  }, [post]);

  if (!isOpen || !post) return null;

  // Ensure we have a post object to display, falling back to prop if state is stale
  const displayPost = currentPost || post;

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newLiked);
    setLikesCount(newCount);

    // Notify parent to update the feed
    if (onLike) onLike({ likesCount: newCount, likedByCurrentUser: newLiked });

    try {
      if (newLiked) {
        await postsAPI.likePost(post._id);
      } else {
        await postsAPI.unlikePost(post._id);
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      if (onLike)
        onLike({
          likesCount: previousCount,
          likedByCurrentUser: previousLiked,
        });
      toast.error("Failed to update like");
    }
  };

  const handleStar = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to star posts");
      return;
    }

    const previousStarred = isStarred;
    const previousCount = starsCount;
    const newStarred = !isStarred;
    const newCount = newStarred ? starsCount + 1 : starsCount - 1;

    setIsStarred(newStarred);
    setStarsCount(newCount);

    try {
      if (newStarred) {
        await postsAPI.starPost(post._id);
        toast.success("Added to favorites!");
      } else {
        await postsAPI.unstarPost(post._id);
        toast.success("Removed from favorites");
      }
    } catch (error) {
      setIsStarred(previousStarred);
      setStarsCount(previousCount);
      toast.error("Failed to update favorite");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await postsAPI.deletePost(post._id);
        toast.success("Post deleted successfully");
        if (onDelete) onDelete(post._id);
        onClose();
      } catch (error) {
        toast.error("Failed to delete post");
      }
    }
  };

  const handleRemix = () => {
    if (!isAuthenticated) {
      toast.error("Please login to remix posts");
      return;
    }
    const remixUrl = encodeURIComponent(post.imageUrl);
    const remixId = encodeURIComponent(post._id);
    onClose();
    navigate(`/sketchbook?remix=${remixUrl}&remixId=${remixId}`);
  };

  const handleEditSuccess = (updatedPost) => {
    setCurrentPost(updatedPost);
    if (onUpdate) onUpdate(updatedPost);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="bg-background-light dark:bg-background-dark w-full max-w-6xl h-[90vh] flex flex-col md:flex-row rounded-lg overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white md:hidden"
        >
          <FiX size={24} />
        </button>

        {/* Left Side - Image */}
        <div className="w-full md:w-[60%] bg-black flex items-center justify-center h-[40vh] md:h-full">
          <img
            src={displayPost.imageUrl}
            alt={displayPost.title || "Post"}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Right Side - Details & Comments */}
        <div className="w-full md:w-[40%] flex flex-col h-full bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark">
          {/* Header */}
          <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <Link
                to={`/profile/${displayPost.userId?._id}`}
                onClick={onClose}
              >
                <img
                  src={getProfilePicture(displayPost.userId?.profilePic)}
                  alt={displayPost.userId?.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </Link>
              <div>
                <Link
                  to={`/profile/${displayPost.userId?._id}`}
                  onClick={onClose}
                  className="font-semibold text-text-primary-light dark:text-text-primary-dark hover:underline"
                >
                  {displayPost.userId?.username}
                </Link>
                {displayPost.remixedFrom && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Remixed from @{displayPost.remixedFrom.userId?.username}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {user?._id === displayPost.userId?._id && (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-blue-500 transition-colors"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="hidden md:block p-2 text-text-primary-light dark:text-text-primary-dark hover:opacity-70"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Scrollable Content (Caption + Comments) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Caption */}
            <div className="p-4 border-b border-border-light dark:border-border-dark">
              {displayPost.title && (
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                  {displayPost.title}
                </h2>
              )}
              {displayPost.caption && (
                <div className="flex items-start space-x-3">
                  <img
                    src={getProfilePicture(displayPost.userId?.profilePic)}
                    alt={displayPost.userId?.username}
                    className="w-8 h-8 rounded-full object-cover mt-1"
                  />
                  <div>
                    <span className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark mr-2">
                      {displayPost.userId?.username}
                    </span>
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap">
                      {displayPost.caption}
                    </span>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {new Date(displayPost.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Comments */}
            <Comments postId={displayPost._id} />
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
                >
                  {isLiked ? (
                    <FaHeart size={28} className="text-red-500" />
                  ) : (
                    <FiHeart size={28} />
                  )}
                </button>

                <button
                  onClick={() =>
                    document
                      .querySelector('input[placeholder="Add a comment..."]')
                      ?.focus()
                  }
                  className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
                >
                  <FiMessageCircle size={28} />
                </button>

                <button
                  onClick={handleRemix}
                  className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
                >
                  <FiPlus size={28} />
                </button>
              </div>

              <button
                onClick={handleStar}
                className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-yellow-500 transition-colors"
              >
                {isStarred ? (
                  <FaStar size={28} className="text-yellow-500" />
                ) : (
                  <FiStar size={28} />
                )}
              </button>
            </div>

            <div className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
              {likesCount} likes
            </div>
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">
              {new Date(displayPost.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={displayPost}
        onEditSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default PostDetailModal;
