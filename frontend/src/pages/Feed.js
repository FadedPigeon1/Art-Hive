import React, { useState, useEffect } from "react";
import PostCard from "../components/PostCard";
import SuggestedProfiles from "../components/SuggestedProfiles";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      const { data } = await postsAPI.getAllPosts(page, 20);
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(page < data.pages);
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-text-primary-light dark:text-text-primary-dark">
          Loading feed...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
          Art Feed
        </h1>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              No posts yet. Be the first to share your art!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handlePostDeleted}
                onLike={fetchPosts}
              />
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 mt-4 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>

      {/* Suggested Profiles Widget */}
      <SuggestedProfiles />
    </div>
  );
};

export default Feed;
