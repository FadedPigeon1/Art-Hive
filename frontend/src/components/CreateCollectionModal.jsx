import React, { useState, useEffect } from "react";
import { FiX, FiGlobe, FiLock } from "react-icons/fi";
import { collectionsAPI } from "../utils/api";
import { toast } from "react-toastify";

const CreateCollectionModal = ({
  isOpen,
  onClose,
  onSuccess,
  existingCollection,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingCollection) {
        setName(existingCollection.name || "");
        setDescription(existingCollection.description || "");
        setIsPublic(existingCollection.isPublic !== false);
      } else {
        setName("");
        setDescription("");
        setIsPublic(true);
      }
    }
  }, [isOpen, existingCollection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Collection name is required");
      return;
    }

    setSaving(true);
    try {
      let result;
      if (existingCollection) {
        const { data } = await collectionsAPI.update(existingCollection._id, {
          name: name.trim(),
          description: description.trim(),
          isPublic,
        });
        result = data;
        toast.success("Collection updated!");
      } else {
        const { data } = await collectionsAPI.create({
          name: name.trim(),
          description: description.trim(),
          isPublic,
        });
        result = data;
        toast.success("Collection created!");
      }
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save collection");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background-light dark:bg-background-dark rounded-2xl shadow-2xl w-full max-w-md border border-border-light dark:border-border-dark">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-light dark:border-border-dark">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {existingCollection ? "Edit Collection" : "New Collection"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Character Art, Landscapes..."
              className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-xl border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
              Description{" "}
              <span className="text-text-secondary-light dark:text-text-secondary-dark text-xs">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What's this collection about?"
              className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-xl border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Visibility toggle */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Visibility
            </label>
            <div className="flex rounded-xl overflow-hidden border border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  isPublic
                    ? "bg-blue-600 text-white"
                    : "bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <FiGlobe size={15} />
                Public
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  !isPublic
                    ? "bg-blue-600 text-white"
                    : "bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <FiLock size={15} />
                Private
              </button>
            </div>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1.5">
              {isPublic
                ? "Anyone can view this collection on your profile."
                : "Only you can see this collection."}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-xl border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 shadow-md"
            >
              {saving
                ? "Saving..."
                : existingCollection
                  ? "Save Changes"
                  : "Create Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal;
