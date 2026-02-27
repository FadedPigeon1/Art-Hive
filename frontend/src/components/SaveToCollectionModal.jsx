import React, { useState, useEffect } from "react";
import {
  FiX,
  FiCheck,
  FiPlus,
  FiGrid,
  FiLock,
  FiGlobe,
  FiLoader,
} from "react-icons/fi";
import { collectionsAPI } from "../utils/api";
import { toast } from "react-toastify";

const SaveToCollectionModal = ({ isOpen, onClose, post }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      fetchCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, post]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const { data } = await collectionsAPI.getMyCollections();
      setCollections(data.collections || []);
    } catch {
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const isPostInCollection = (collection) => {
    if (!collection.posts || !post) return false;
    return collection.posts.some((id) => id.toString() === post._id.toString());
  };

  const handleTogglePost = async (collection) => {
    if (savingId) return;
    const alreadyIn = isPostInCollection(collection);
    setSavingId(collection._id);

    // Optimistic update
    setCollections((prev) =>
      prev.map((c) => {
        if (c._id !== collection._id) return c;
        return {
          ...c,
          posts: alreadyIn
            ? c.posts.filter((id) => id.toString() !== post._id.toString())
            : [...(c.posts || []), post._id],
          postsCount: alreadyIn
            ? Math.max(0, (c.postsCount || 0) - 1)
            : (c.postsCount || 0) + 1,
        };
      }),
    );

    try {
      if (alreadyIn) {
        await collectionsAPI.removePost(collection._id, post._id);
        toast.success(`Removed from "${collection.name}"`);
      } else {
        await collectionsAPI.addPost(collection._id, post._id);
        toast.success(`Saved to "${collection.name}"`);
      }
    } catch (error) {
      // Revert optimistic update
      setCollections((prev) =>
        prev.map((c) => {
          if (c._id !== collection._id) return c;
          return {
            ...c,
            posts: alreadyIn
              ? [...(c.posts || []), post._id]
              : c.posts.filter((id) => id.toString() !== post._id.toString()),
            postsCount: alreadyIn
              ? (c.postsCount || 0) + 1
              : Math.max(0, (c.postsCount || 0) - 1),
          };
        }),
      );
      toast.error(
        error.response?.data?.message || "Failed to update collection",
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAndSave = async () => {
    if (!newName.trim()) {
      toast.error("Collection name is required");
      return;
    }
    setCreating(true);
    try {
      const { data: newCollection } = await collectionsAPI.create({
        name: newName.trim(),
        isPublic: newIsPublic,
      });
      await collectionsAPI.addPost(newCollection._id, post._id);
      setCollections((prev) => [
        {
          ...newCollection,
          posts: [post._id],
          postsCount: 1,
        },
        ...prev,
      ]);
      toast.success(`Saved to "${newCollection.name}"`);
      setNewName("");
      setNewIsPublic(true);
      setShowCreateForm(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create collection",
      );
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background-light dark:bg-background-dark rounded-2xl shadow-2xl w-full max-w-sm border border-border-light dark:border-border-dark flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            Save to Collection
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Collection list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : collections.length === 0 && !showCreateForm ? (
            <div className="flex flex-col items-center py-10 px-4 text-center">
              <FiGrid
                size={36}
                className="text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                No collections yet. Create your first one!
              </p>
            </div>
          ) : (
            <ul>
              {collections.map((collection) => {
                const inCollection = isPostInCollection(collection);
                const isSaving = savingId === collection._id;
                return (
                  <li key={collection._id}>
                    <button
                      onClick={() => handleTogglePost(collection)}
                      disabled={!!savingId}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors disabled:opacity-60"
                    >
                      {/* Cover thumb */}
                      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                        {collection.coverImage ? (
                          <img
                            src={collection.coverImage}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiGrid
                              size={18}
                              className="text-gray-300 dark:text-gray-600"
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-text-primary-light dark:text-text-primary-dark text-sm truncate">
                          {collection.name}
                        </p>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
                          {!collection.isPublic && <FiLock size={10} />}
                          {collection.postsCount || 0} artwork
                          {collection.postsCount !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Checkmark */}
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : inCollection ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <FiCheck size={13} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-border-light dark:border-border-dark flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Create new collection */}
        <div className="border-t border-border-light dark:border-border-dark p-4 flex-shrink-0">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium py-1"
            >
              <FiPlus size={16} />
              New Collection
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={100}
                placeholder="Collection name"
                autoFocus
                className="w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-xl border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex rounded-xl overflow-hidden border border-border-light dark:border-border-dark text-xs">
                <button
                  type="button"
                  onClick={() => setNewIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-medium transition-colors ${
                    newIsPublic
                      ? "bg-blue-600 text-white"
                      : "bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark"
                  }`}
                >
                  <FiGlobe size={12} /> Public
                </button>
                <button
                  type="button"
                  onClick={() => setNewIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-medium transition-colors ${
                    !newIsPublic
                      ? "bg-blue-600 text-white"
                      : "bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark"
                  }`}
                >
                  <FiLock size={12} /> Private
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewName("");
                  }}
                  className="flex-1 py-2 text-sm bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-xl border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndSave}
                  disabled={creating || !newName.trim()}
                  className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 font-medium"
                >
                  {creating ? "Creating..." : "Create & Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveToCollectionModal;
