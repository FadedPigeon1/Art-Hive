import React, { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "../components/PostCard";
import PostDetailModal from "../components/PostDetailModal";
import SuggestedProfiles from "../components/SuggestedProfiles";
import TrendingCarousel from "../components/TrendingCarousel";
import CreativeActions from "../components/CreativeActions";
import ActiveGamesWidget from "../components/ActiveGamesWidget";
import FeaturedGroupsWidget from "../components/FeaturedGroupsWidget";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import { useSearch } from "../context/SearchContext";
import { useAuth } from "../context/AuthContext";

const Feed = () => {
  const { searchQuery } = useSearch();
  const { loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const isFetchingRef = useRef(false);

  // Debounce search input from context
  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(searchQuery.trim()),
      300,
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
        // Preload first 3 images for faster perceived loading
        data.posts.slice(0, 3).forEach((post) => {
          const img = new Image();
          img.src = post.imageUrl;
        });
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (!authLoading) {
      fetchPosts();
    }
  }, [fetchPosts, authLoading]);

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
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

  const observer = useRef();
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Trending Section - Only show on first page and no search */}
        {!debouncedSearch && <TrendingCarousel />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed Column */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
              Art Feed
            </h1>

            {loading && page === 1 ? (
              // Skeleton loaders
              [1, 2, 3].map((i) => (
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
              ))
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  {debouncedSearch
                    ? `No posts found for "${debouncedSearch}"`
                    : "No posts yet. Be the first to share your art!"}
                </p>
              </div>
            ) : (
              <>
                {posts.map((post, index) => {
                  if (posts.length === index + 1) {
                    return (
                      <div ref={lastPostElementRef} key={post._id}>
                        <PostCard
                          post={post}
                          onDelete={handlePostDeleted}
                          onLike={(stats) => handlePostLiked(post._id, stats)}
                          onPostClick={setSelectedPost}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <PostCard
                        key={post._id}
                        post={post}
                        onDelete={handlePostDeleted}
                        onLike={(stats) => handlePostLiked(post._id, stats)}
                        onPostClick={setSelectedPost}
                      />
                    );
                  }
                })}

                {loading && (
                  <div className="w-full py-4 flex justify-center">
                    <div className="w-8 h-8 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-8 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 scrollbar-hide">
              <ActiveGamesWidget />
              <CreativeActions />
              <FeaturedGroupsWidget />
              <SuggestedProfiles />
            </div>
          </div>
        </div>
      </div>

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

export default Feed;
