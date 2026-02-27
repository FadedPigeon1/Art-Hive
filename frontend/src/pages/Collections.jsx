import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiGrid } from "react-icons/fi";
import { collectionsAPI } from "../utils/api";
import { postsAPI } from "../utils/api";
import CollectionCard from "../components/CollectionCard";
import CreateCollectionModal from "../components/CreateCollectionModal";
import { toast } from "react-toastify";
import { getProfilePicture } from "../utils/imageHelpers";
import { useAuth } from "../context/AuthContext";

const Collections = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?._id === userId;

  const [collections, setCollections] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [collectionsRes, postsRes] = await Promise.all([
          collectionsAPI.getUserCollections(userId, 1, 20),
          postsAPI.getUserPosts(userId, 1, 1),
        ]);
        setCollections(collectionsRes.data.collections || []);
        setHasMore(collectionsRes.data.hasMore || false);
        setProfile(postsRes.data.user || null);
        setPage(1);
      } catch {
        toast.error("Failed to load collections");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchInitial();
  }, [userId]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data } = await collectionsAPI.getUserCollections(
        userId,
        nextPage,
        20,
      );
      setCollections((prev) => [...prev, ...(data.collections || [])]);
      setHasMore(data.hasMore || false);
      setPage(nextPage);
    } catch {
      toast.error("Failed to load more collections");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreateSuccess = (newCollection) => {
    setCollections((prev) => [newCollection, ...prev]);
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/profile/${userId}`)}
              className="p-2 rounded-full hover:bg-background-light dark:hover:bg-background-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark"
            >
              <FiArrowLeft size={20} />
            </button>

            {profile && (
              <button
                onClick={() => navigate(`/profile/${userId}`)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img
                  src={getProfilePicture(profile.profilePic)}
                  alt={profile.username}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-text-primary-light dark:text-text-primary-dark leading-tight">
                    {profile.username}
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {collections.length} collection
                    {collections.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            )}
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl shadow-md transition-all font-medium text-sm"
            >
              <FiPlus size={16} />
              New Collection
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-background-light dark:bg-background-dark animate-pulse"
              />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-background-light dark:bg-background-dark rounded-2xl border border-dashed border-border-light dark:border-border-dark">
            <div className="w-16 h-16 bg-surface-light dark:bg-surface-dark rounded-full flex items-center justify-center mb-4">
              <FiGrid size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
              No collections yet
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {isOwnProfile
                ? "Create your first collection to organize your artwork."
                : "This artist hasn't created any collections."}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Create Collection
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection._id}
                collection={collection}
                isOwner={isOwnProfile}
                onClick={() =>
                  navigate(`/collections/${userId}/${collection._id}`)
                }
              />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
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

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default Collections;
