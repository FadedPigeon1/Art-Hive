import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiPlus, FiGrid } from "react-icons/fi";
import { collectionsAPI } from "../utils/api";
import CollectionCard from "./CollectionCard";
import CreateCollectionModal from "./CreateCollectionModal";
import { toast } from "react-toastify";

const ProfileCollectionsTab = ({ userId, isOwnProfile }) => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const { data } = await collectionsAPI.getUserCollections(userId, 1, 20);
        setCollections(data.collections || []);
      } catch {
        toast.error("Failed to load collections");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchCollections();
  }, [userId]);

  const handleCreateSuccess = (newCollection) => {
    setCollections((prev) => [newCollection, ...prev]);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-surface-light dark:bg-surface-dark animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {isOwnProfile && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Collections
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl shadow-md transition-all font-medium text-sm"
          >
            <FiPlus size={16} />
            New Collection
          </button>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-background-light dark:bg-background-dark rounded-2xl border border-dashed border-border-light dark:border-border-dark">
          <div className="w-14 h-14 bg-surface-light dark:bg-surface-dark rounded-full flex items-center justify-center mb-4">
            <FiGrid size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
            No collections yet
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {isOwnProfile
              ? "Organize your artwork into named collections."
              : "This artist hasn't created any collections."}
          </p>
          {isOwnProfile && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create Collection
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

          <div className="mt-6 text-center">
            <Link
              to={`/collections/${userId}`}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View all collections →
            </Link>
          </div>
        </>
      )}

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default ProfileCollectionsTab;
