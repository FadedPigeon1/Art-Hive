import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiMessageCircle,
  FiTrash2,
  FiPlus,
  FiEdit2,
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import RemixModal from "./RemixModal";
import EditPostModal from "./EditPostModal";
import Comments from "./Comments";
import { getProfilePicture } from "../utils/imageHelpers";

const PostCard = ({ post, onDelete, onLike }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(
    post.likes?.includes(user?._id) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

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
    if (onLike) onLike(newCount);

    try {
      if (newLiked) {
        await postsAPI.likePost(post._id);
      } else {
        await postsAPI.unlikePost(post._id);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      if (onLike) onLike(previousCount);
      toast.error("Failed to update like");
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

  // Parse caption into title and description
  const parseCaption = (caption) => {
    if (!caption || !caption.trim()) {
      return { title: "", description: "" };
    }

    const parts = caption.split("\n\n");
    return {
      title: parts[0] || "",
      description: parts.slice(1).join("\n\n") || "",
    };
  };

  const { title, description } = parseCaption(currentPost.caption);

  return (
    <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg overflow-hidden mb-4">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <Link
          to={`/profile/${post.userId?._id}`}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <img
            src={getProfilePicture(post.userId?.profilePic)}
            alt={post.userId?.username}
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover"
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
              onClick={() => setShowEditModal(true)}
              className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-blue-500 transition-colors"
              title="Edit post"
            >
              <FiEdit2 size={18} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
              title="Delete post"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Post Title */}
      {title && (
        <div className="px-4 pb-3">
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            {title}
          </h2>
        </div>
      )}

      {/* Post Image */}
      <div className="w-full bg-surface-light dark:bg-surface-dark">
        <img
          src={post.imageUrl}
          alt="Post"
          loading="lazy"
          className="w-full max-h-[600px] object-contain"
        />
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-2">
          <button
            onClick={handleLike}
            className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
          >
            {isLiked ? (
              <FaHeart size={24} className="text-red-500" />
            ) : (
              <FiHeart size={24} />
            )}
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
          >
            <FiMessageCircle size={24} />
            <span>{post.comments?.length || 0}</span>
          </button>

          <button
            onClick={handleRemix}
            className="flex items-center space-x-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light transition-colors"
          >
            <FiPlus size={24} />
            <span>{post.remixCount || 0}</span>
          </button>
        </div>

        {/* Remix Attribution */}
        {post.remixedFrom && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
            Remixed from{" "}
            <Link
              to={`/profile/${post.remixedFrom.userId?._id}`}
              className="text-primary-light dark:text-primary-dark hover:underline"
            >
              @{post.remixedFrom.userId?.username}
            </Link>
            's artwork
          </p>
        )}

        {/* Description */}
        {description && (
          <div className="text-text-primary-light dark:text-text-primary-dark mt-2">
            <span className="font-semibold">
              {currentPost.userId?.username}
            </span>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{description}</span>
          </div>
        )}

        {/* View Comments */}
        {post.comments && post.comments.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2 hover:underline"
          >
            {showComments ? "Hide" : "View"} comments ({post.comments.length})
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && <Comments postId={post._id} />}

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

export default PostCard;
