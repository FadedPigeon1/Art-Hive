import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit2,
  FiGlobe,
  FiLock,
  FiX,
  FiImage,
  FiTrash2,
} from "react-icons/fi";
import { collectionsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import PostDetailModal from "../components/PostDetailModal";
import CreateCollectionModal from "../components/CreateCollectionModal";
import { toast } from "react-toastify";
import { getProfilePicture } from "../utils/imageHelpers";

const CollectionDetail = () => {
  const { userId, collectionId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?._id === userId;

  const [collection, setCollection] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCollection = useCallback(
    async (requestedPage = 1) => {
      if (requestedPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const { data } = await collectionsAPI.getCollectionById(
          collectionId,
          requestedPage,
          12,
        );
        setCollection(data.collection);
        if (requestedPage === 1) {
          setPosts(data.posts || []);
        } else {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        }
        setHasMore(data.hasMore || false);
        setPage(requestedPage);
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error("This collection is private");
          navigate(`/profile/${userId}`);
        } else if (error.response?.status === 404) {
          toast.error("Collection not found");
          navigate(`/profile/${userId}`);
        } else {
          toast.error("Failed to load collection");
        }
      } finally {
        if (requestedPage === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [collectionId, navigate, userId],
  );

  useEffect(() => {
    fetchCollection(1);
  }, [fetchCollection]);

  const handleVisibilityToggle = async () => {
    const newVisibility = !collection.isPublic;
    setCollection((prev) => ({ ...prev, isPublic: newVisibility }));
    try {
      await collectionsAPI.update(collection._id, { isPublic: newVisibility });
      toast.success(
        newVisibility
          ? "Collection is now public"
          : "Collection is now private",
      );
    } catch {
      setCollection((prev) => ({ ...prev, isPublic: !newVisibility }));
      toast.error("Failed to update visibility");
    }
  };

  const handleRemovePost = async (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setCollection((prev) => ({
      ...prev,
      postsCount: Math.max(0, (prev.postsCount || 0) - 1),
    }));
    try {
      await collectionsAPI.removePost(collection._id, postId);
      toast.success("Removed from collection");
    } catch {
      toast.error("Failed to remove post");
      fetchCollection(1);
    }
  };

  const handleDeleteCollection = async () => {
    if (
      !window.confirm(
        `Delete "${collection.name}"? This cannot be undone. Your artworks will not be deleted.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      await collectionsAPI.delete(collection._id);
      toast.success("Collection deleted");
      navigate(`/profile/${userId}`);
    } catch {
      toast.error("Failed to delete collection");
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = (updated) => {
    setCollection((prev) => ({ ...prev, ...updated }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="h-8 w-48 bg-background-light dark:bg-background-dark rounded-lg animate-pulse mb-6" />
          <div className="h-28 bg-background-light dark:bg-background-dark rounded-2xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-background-light dark:bg-background-dark animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back nav */}
        <button
          onClick={() => navigate(`/profile/${userId}`)}
          className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors mb-6 text-sm"
        >
          <FiArrowLeft size={16} />
          Back to profile
        </button>

        {/* Collection header */}
        <div className="bg-background-light dark:bg-background-dark rounded-2xl p-6 mb-8 border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {collection.isPublic ? (
                  <FiGlobe size={14} className="text-green-500 flex-shrink-0" />
                ) : (
                  <FiLock size={14} className="text-yellow-500 flex-shrink-0" />
                )}
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide font-medium">
                  {collection.isPublic ? "Public" : "Private"} Collection
                </span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2 leading-relaxed">
                  {collection.description}
                </p>
              )}
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-3 flex items-center gap-2">
                {collection.userId && (
                  <>
                    <img
                      src={getProfilePicture(collection.userId.profilePic)}
                      alt={collection.userId.username}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <Link
                      to={`/profile/${collection.userId._id}`}
                      className="hover:underline font-medium text-text-primary-light dark:text-text-primary-dark"
                    >
                      {collection.userId.username}
                    </Link>
                    <span>·</span>
                  </>
                )}
                {collection.postsCount || 0} artwork
                {collection.postsCount !== 1 ? "s" : ""}
              </p>
            </div>

            {isOwnProfile && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-primary-light dark:text-text-primary-dark font-medium"
                >
                  <FiEdit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={handleVisibilityToggle}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-primary-light dark:text-text-primary-dark font-medium"
                >
                  {collection.isPublic ? (
                    <>
                      <FiLock size={14} />
                      Make Private
                    </>
                  ) : (
                    <>
                      <FiGlobe size={14} />
                      Make Public
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeleteCollection}
                  disabled={isDeleting}
                  className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  title="Delete collection"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background-light dark:bg-background-dark rounded-2xl border border-dashed border-border-light dark:border-border-dark">
            <div className="w-14 h-14 bg-surface-light dark:bg-surface-dark rounded-full flex items-center justify-center mb-4">
              <FiImage size={28} className="text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
              No artworks yet
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {isOwnProfile
                ? "Save posts using the bookmark button to add them here."
                : "This collection has no artworks yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <div
                key={post._id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-surface-light dark:bg-surface-dark shadow-md hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={post.imageUrl}
                  alt={post.title || "Post"}
                  loading={index < 6 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onClick={() => setSelectedPost(post)}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <h3 className="text-white font-bold truncate">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                    <span>❤️ {post.likes?.length || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>

                {/* Remove button (own collections only) */}
                {isOwnProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePost(post._id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Remove from collection"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => fetchCollection(page + 1)}
              disabled={loadingMore}
              className="px-8 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium text-text-primary-light dark:text-text-primary-dark"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Post detail modal */}
      <PostDetailModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        onLike={() => {}}
        onDelete={(postId) => {
          setPosts((prev) => prev.filter((p) => p._id !== postId));
          setSelectedPost(null);
        }}
        onUpdate={(updatedPost) => {
          setPosts((prev) =>
            prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)),
          );
          if (selectedPost?._id === updatedPost._id)
            setSelectedPost(updatedPost);
        }}
      />

      {/* Edit collection modal */}
      <CreateCollectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        existingCollection={collection}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default CollectionDetail;
