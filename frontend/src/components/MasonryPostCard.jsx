import React from "react";
import { FiHeart } from "react-icons/fi";
import { getProfilePicture } from "../utils/imageHelpers";
import { toast } from "react-toastify";
import { postsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const MasonryPostCard = ({ post, onLike, onPostClick }) => {
  const { user } = useAuth();

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      const { data } = await postsAPI.toggleLike(post._id);
      if (onLike) onLike(post._id, data);
    } catch (err) {
      toast.error("Failed to like post");
    }
  };

  return (
    <div
      className="break-inside-avoid mb-4 relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-surface-light dark:bg-surface-dark"
      onClick={() => onPostClick && onPostClick(post)}
    >
      <img
        src={post.imageUrl}
        alt={post.prompt || "Artwork"}
        className="w-full h-auto object-cover"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
        {/* Top section: Actions */}
        <div className="flex justify-end">
          <button
            onClick={handleLike}
            className="p-2.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-colors text-white transform active:scale-95"
          >
            <FiHeart
              className={`w-5 h-5 ${post.likedByCurrentUser ? "fill-red-500 text-red-500" : ""}`}
            />
          </button>
        </div>

        {/* Bottom section: User Info & Title */}
        <div className="flex flex-col">
          {post.prompt && (
            <p className="text-white font-bold text-sm mb-2 line-clamp-2 drop-shadow-md">
              {post.prompt}
            </p>
          )}
          <div className="flex items-center space-x-2">
            <img
              src={getProfilePicture(post.user?.profilePic)}
              alt={post.user?.username}
              className="w-8 h-8 rounded-full border border-white/50 object-cover"
            />
            <span className="text-white text-sm font-semibold truncate drop-shadow-md">
              {post.user?.username}
            </span>
            <div className="flex-1"></div>
            {post.likesCount > 0 && (
              <div className="flex items-center text-white font-semibold text-xs space-x-1 drop-shadow-md">
                <FiHeart className="w-3.5 h-3.5 fill-current" />
                <span>{post.likesCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasonryPostCard;
