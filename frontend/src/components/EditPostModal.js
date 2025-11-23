import React, { useState } from "react";
import { FiX, FiSave } from "react-icons/fi";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";

const EditPostModal = ({ isOpen, onClose, post, onEditSuccess }) => {
  const [caption, setCaption] = useState(post?.caption || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!caption.trim()) {
      toast.error("Caption cannot be empty");
      return;
    }

    setSaving(true);

    try {
      const updatedPost = await postsAPI.updatePost(post._id, {
        caption: caption.trim(),
      });

      toast.success("Post updated successfully!");

      // Call success callback
      if (onEditSuccess) {
        onEditSuccess(updatedPost.data);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setCaption(post?.caption || "");
      onClose();
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Edit Post
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Preview (non-editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image
            </label>
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full max-h-64 object-contain rounded-lg bg-gray-100 dark:bg-gray-900"
            />
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              rows={6}
              placeholder="Edit your caption..."
              disabled={saving}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              required
              style={{ whiteSpace: "pre-wrap" }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {caption.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave size={20} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
