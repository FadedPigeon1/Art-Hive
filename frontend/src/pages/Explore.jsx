import React, { useState, useEffect, useRef, useCallback } from "react";
import MasonryPostCard from "../components/MasonryPostCard";
import PostDetailModal from "../components/PostDetailModal";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import { useSearch } from "../context/SearchContext";
import { useAuth } from "../context/AuthContext";
import { FiSearch } from "react-icons/fi";

const Explore = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const { loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false); // Initially false until search starts
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

    // Fetch posts even if there's no search query
    fetchPosts(true);
  }, [debouncedSearch]);

  const fetchPosts = useCallback(
    async (isReset = false) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setLoading(true);

      try {
        const currentPage = isReset ? 1 : page;
        const { data } = await postsAPI.getAllPosts(
          currentPage,
          10,
          debouncedSearch,
        );

        if (currentPage === 1) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }
        setHasMore(data.hasMore);
      } catch (error) {
        toast.error("Failed to load search results");
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [page, debouncedSearch],
  );

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

  useEffect(() => {
    if (page > 1) {
      fetchPosts(false);
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Header for Mobile / Page Context */}
        <div className="mb-8 p-6 bg-background-light dark:bg-background-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
          <h1 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark mb-4 drop-shadow-sm">
            Explore ArtHive
          </h1>
          <div className="relative">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark"
              size={22}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists, tags, or styles..."
              className="w-full pl-12 pr-4 py-4 bg-surface-light dark:bg-surface-dark rounded-xl border-2 border-transparent focus:border-primary-light dark:focus:border-primary-dark outline-none text-lg text-text-primary-light dark:text-text-primary-dark transition-all focus:shadow-[0_0_0_4px_rgba(29,161,242,0.1)]"
              autoFocus
            />
          </div>
        </div>

        <div className="w-full">
          {/* Main Feed Column */}
          <div className="w-full">
            {loading && page === 1 ? (
              // Skeleton loaders
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-light dark:bg-surface-dark rounded-2xl animate-pulse break-inside-avoid w-full"
                    style={{ height: `${Math.random() * 200 + 150}px` }}
                  ></div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-background-light dark:bg-background-dark rounded-2xl border border-border-light dark:border-border-dark max-w-2xl mx-auto">
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-lg font-medium">
                  {debouncedSearch
                    ? `No posts found for "${debouncedSearch}"`
                    : "No posts found"}
                </p>
              </div>
            ) : (
              <>
                {debouncedSearch && (
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-6 pl-3 border-l-4 border-primary-light">
                    Search Results for "{debouncedSearch}"
                  </h3>
                )}
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                  {posts.map((post, index) => {
                    const isLast = posts.length === index + 1;
                    return (
                      <div
                        ref={isLast ? lastPostElementRef : null}
                        key={post._id}
                        className="break-inside-avoid"
                      >
                        <MasonryPostCard
                          post={post}
                          onLike={(stats) => handlePostLiked(post._id, stats)}
                          onPostClick={setSelectedPost}
                        />
                      </div>
                    );
                  })}
                </div>

                {loading && (
                  <div className="w-full py-8 flex justify-center">
                    <div className="w-8 h-8 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            )}
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

export default Explore;
