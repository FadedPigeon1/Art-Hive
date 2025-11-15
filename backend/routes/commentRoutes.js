import express from "express";
import {
  createComment,
  getCommentsByPost,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/comments
// @desc    Create a comment
// @access  Private
router.post("/", protect, createComment);

// @route   GET /api/comments/:postId
// @desc    Get comments for a post
// @access  Public
router.get("/:postId", getCommentsByPost);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete("/:id", protect, deleteComment);

export default router;
