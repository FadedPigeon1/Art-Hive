import React, { useState, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import { FiHeart } from "react-icons/fi";

const LikedPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLikedPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await postsAPI.getLikedPosts(page, 10);
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error("Failed to load liked posts");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLikedPosts();
  }, [fetchLikedPosts]);

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handlePostLiked = (postId, stats) => {
    if (stats.likedByCurrentUser === false) {
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-2 mb-6">
            <FiHeart className="text-red-500" size={28} />
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Liked Posts
            </h1>
          </div>
          {/* Skeleton loaders */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-background-light dark:bg-background-dark rounded-lg p-4 mb-4 animate-pulse"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-surface-light dark:bg-surface-dark rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-surface-light dark:bg-surface-dark rounded w-1/6"></div>
                </div>
              </div>
              <div className="w-full h-96 bg-surface-light dark:bg-surface-dark rounded-lg mb-3"></div>
              <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-surface-light dark:bg-surface-dark rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center space-x-2 mb-6">
          <FiHeart className="text-red-500" size={28} />
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Liked Posts
          </h1>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
            <FiHeart
              className="mx-auto mb-4 text-text-secondary-light dark:text-text-secondary-dark"
              size={48}
            />
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-lg">
              No liked posts yet
            </p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
              Like posts you love to save them here!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handlePostDeleted}
                onLike={(stats) => handlePostLiked(post._id, stats)}
              />
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-3 mt-4 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More</span>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LikedPosts;
