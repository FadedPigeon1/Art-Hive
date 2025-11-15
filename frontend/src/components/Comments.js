import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { commentsAPI } from "../utils/api";
import { toast } from "react-toastify";
import { FiSend, FiTrash2 } from "react-icons/fi";

const DEFAULT_AVATAR = "/default-avatar.svg";

const Comments = ({ postId }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data } = await commentsAPI.getCommentsByPost(postId);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { data } = await commentsAPI.createComment(postId, newComment);
      setComments([data, ...comments]);
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async (commentId) => {
    if (window.confirm("Delete this comment?")) {
      try {
        await commentsAPI.deleteComment(commentId);
        setComments(comments.filter((c) => c._id !== commentId));
        toast.success("Comment deleted");
      } catch (error) {
        toast.error("Failed to delete comment");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="border-t border-border-light dark:border-border-dark">
      {/* Comment Form */}
      {isAuthenticated && (
        <form
          onSubmit={handleSubmit}
          className="p-4 flex items-center space-x-2"
        >
          <img
            src={user?.profilePic || DEFAULT_AVATAR}
            alt={user?.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-full border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
            maxLength={300}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="p-2 text-primary-light hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend size={20} />
          </button>
        </form>
      )}

      {/* Comments List */}
      <div className="px-4 pb-4 space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-text-secondary-light dark:text-text-secondary-dark text-sm py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex items-start space-x-2">
              <img
                src={comment.userId?.profilePic || DEFAULT_AVATAR}
                alt={comment.userId?.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg px-3 py-2">
                  <p className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark">
                    {comment.userId?.username}
                  </p>
                  <p className="text-text-primary-light dark:text-text-primary-dark text-sm">
                    {comment.text}
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-1 px-3">
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {user?._id === comment.userId?._id && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
