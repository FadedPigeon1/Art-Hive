import React, { useEffect, useMemo, useState, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiMessageCircle,
  FiTrash2,
  FiPlus,
  FiEdit2,
  FiStar,
} from "react-icons/fi";
import { FaHeart, FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import RemixModal from "./RemixModal";
import EditPostModal from "./EditPostModal";
import Comments from "./Comments";
import { getProfilePicture } from "../utils/imageHelpers";

const PostCard = ({ post, onDelete, onLike, onPostClick }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const deriveInitialLikes = (incomingPost) => {
    if (typeof incomingPost.likesCount === "number") {
      return incomingPost.likesCount;
    }
    if (Array.isArray(incomingPost.likes)) {
      return incomingPost.likes.length;
    }
    return 0;
  };

  const deriveInitialStars = (incomingPost) => {
    if (typeof incomingPost.starsCount === "number") {
      return incomingPost.starsCount;
    }
    if (Array.isArray(incomingPost.stars)) {
      return incomingPost.stars.length;
    }
    return 0;
  };

  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(deriveInitialLikes(post));
  const [isStarred, setIsStarred] = useState(
    post.starredByCurrentUser || false
  );
  const [starsCount, setStarsCount] = useState(deriveInitialStars(post));
  const [showComments, setShowComments] = useState(false);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  useEffect(() => {
    setCurrentPost(post);
    setIsLiked(post.likedByCurrentUser || false);
    setLikesCount(deriveInitialLikes(post));
    setIsStarred(post.starredByCurrentUser || false);
    setStarsCount(deriveInitialStars(post));
  }, [post]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }

    // Optimistic update - update UI immediately
    const previousLiked = isLiked;
    const previousCount = likesCount;

    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newLiked);
    setLikesCount(newCount);
    if (onLike) onLike({ likesCount: newCount, likedByCurrentUser: newLiked });

    try {
      if (newLiked) {
        await postsAPI.likePost(post._id);
      } else {
        await postsAPI.unlikePost(post._id);
      }
    } catch (error) {
      // Revert on error
      console.error("Like error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Post ID:", post._id);
      console.error(
        "Current state - isLiked:",
        previousLiked,
        "newLiked:",
        newLiked
      );
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      if (onLike)
        onLike({
          likesCount: previousCount,
          likedByCurrentUser: previousLiked,
        });
      const errorMsg = error.response?.data?.message || "Failed to update like";
      toast.error(errorMsg);
    }
  };

  const handleStar = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to star posts");
      return;
    }

    // Optimistic update - update UI immediately
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
      // Revert on error
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
    navigate(`/sketchbook?remix=${remixUrl}&remixId=${remixId}`);
  };

  const handleEditSuccess = (updatedPost) => {
    setCurrentPost(updatedPost);
  };

  const legacyCaption = useMemo(() => {
    if (!currentPost.caption) {
      return { title: "", description: "" };
    }
    const parts = currentPost.caption.split("\n\n");
    return {
      title: parts[0] || "",
      description: parts.slice(1).join("\n\n") || "",
    };
  }, [currentPost.caption]);

  const displayTitle = currentPost.title || legacyCaption.title;
  const displayDescription = currentPost.title
    ? currentPost.caption
    : legacyCaption.description;

  return (
    <div
      className="bg-background-light dark:bg-background-dark rounded-xl overflow-hidden mb-6 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border border-border-light dark:border-border-dark"
      onClick={() => onPostClick && onPostClick(post)}
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-transparent to-surface-light/30 dark:to-surface-dark/30">
        <Link
          to={`/profile/${post.userId?._id}`}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={getProfilePicture(post.userId?.profilePic)}
            alt={post.userId?.username}
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-light dark:ring-primary-dark p-0.5"
          />
          <div>
            <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
              {post.userId?.username}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Link>

        {user?._id === post.userId?._id && (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-blue-500 transition-colors"
              title="Edit post"
            >
              <FiEdit2 size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
              title="Delete post"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Post Title */}
      {displayTitle && (
        <div className="px-4 pb-3">
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            {displayTitle}
          </h2>
        </div>
      )}

      {/* Post Image */}
      <div className="w-full bg-surface-light dark:bg-surface-dark">
        <img
          src={post.imageUrl}
          alt={displayTitle || "Post"}
          loading="lazy"
          decoding="async"
          className="w-full max-h-[600px] object-contain"
        />
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                isLiked
                  ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                  : "text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}
            >
              {isLiked ? (
                <FaHeart size={20} className="text-red-500" />
              ) : (
                <FiHeart size={20} />
              )}
              <span className="font-medium">{likesCount}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              <FiMessageCircle size={20} />
              <span className="font-medium">
                {post.commentCount !== undefined
                  ? post.commentCount
                  : post.comments?.length || 0}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemix();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
            >
              <FiPlus size={20} />
              <span className="font-medium">{post.remixCount || 0}</span>
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStar();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              isStarred
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-text-secondary-light dark:text-text-secondary-dark hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            }`}
            title={isStarred ? "Remove from favorites" : "Add to favorites"}
          >
            {isStarred ? (
              <FaStar size={20} className="text-yellow-500" />
            ) : (
              <FiStar size={20} />
            )}
            <span className="font-medium">{starsCount}</span>
          </button>
        </div>

        {/* Remix Attribution */}
        {post.remixedFrom && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
            Remixed from{" "}
            <Link
              to={`/profile/${post.remixedFrom.userId?._id}`}
              className="text-primary-light dark:text-primary-dark hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              @{post.remixedFrom.userId?.username}
            </Link>
            's artwork
          </p>
        )}

        {/* Description */}
        {displayDescription && (
          <div className="text-text-primary-light dark:text-text-primary-dark mt-2">
            <span className="font-semibold">
              {currentPost.userId?.username}
            </span>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{displayDescription}</span>
          </div>
        )}

        {/* View Comments */}
        {(post.commentCount > 0 ||
          (post.comments && post.comments.length > 0)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2 hover:underline"
          >
            {showComments ? "Hide" : "View"} comments (
            {post.commentCount !== undefined
              ? post.commentCount
              : post.comments?.length}
            )
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div onClick={(e) => e.stopPropagation()}>
          <Comments postId={post._id} />
        </div>
      )}

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={currentPost}
        onEditSuccess={handleEditSuccess}
      />

      {/* Remix Modal removed in favor of Sketchbook Pro-based remixing */}
    </div>
  );
};

export default memo(PostCard, (prevProps, nextProps) => {
  // Only re-render if the post ID changes or key props change
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.post.likesCount === nextProps.post.likesCount &&
    prevProps.post.likedByCurrentUser === nextProps.post.likedByCurrentUser &&
    prevProps.post.starsCount === nextProps.post.starsCount &&
    prevProps.post.starredByCurrentUser ===
      nextProps.post.starredByCurrentUser &&
    prevProps.post.commentCount === nextProps.post.commentCount
  );
});
