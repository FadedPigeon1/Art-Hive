import React, { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "../components/PostCard";
import SuggestedProfiles from "../components/SuggestedProfiles";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import { useSearch } from "../context/SearchContext";

const Feed = () => {
  const { searchQuery } = useSearch();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isFetchingRef = useRef(false);

  // Debounce search input from context
  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(searchQuery.trim()),
      300
    );
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset paging when search changes
  useEffect(() => {
    setPage(1);
    setPosts([]);
    setHasMore(true);
  }, [debouncedSearch]);

  const fetchPosts = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const { data } = await postsAPI.getAllPosts(page, 10, debouncedSearch);
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
      isFetchingRef.current = false;
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handlePostLiked = (postId, newLikesCount) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? { ...post, likes: Array(newLikesCount).fill(null) }
          : post
      )
    );
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
          <div className="text-text-primary-light dark:text-text-primary-dark">
            Loading feed...
          </div>
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
              {debouncedSearch
                ? `No posts found for "${debouncedSearch}"`
                : "No posts yet. Be the first to share your art!"}
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handlePostDeleted}
                onLike={(likesCount) => handlePostLiked(post._id, likesCount)}
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

      {/* Suggested Profiles Widget - Only show after posts load */}
      {!loading && posts.length > 0 && <SuggestedProfiles />}
    </div>
  );
};

export default Feed;
