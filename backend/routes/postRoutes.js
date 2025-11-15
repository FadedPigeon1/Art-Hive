import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  deletePost,
  likePost,
  unlikePost,
  getPostRemixes,
} from "../controllers/postController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post("/", protect, createPost);

// @route   GET /api/posts
// @desc    Get all posts (feed)
// @access  Public (optional auth to see if user liked)
router.get("/", optionalAuth, getAllPosts);

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get("/:id", optionalAuth, getPostById);

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user
// @access  Public
router.get("/user/:userId", getUserPosts);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete("/:id", protect, deletePost);

// @route   PUT /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.put("/:id/like", protect, likePost);

// @route   PUT /api/posts/:id/unlike
// @desc    Unlike a post
// @access  Private
router.put("/:id/unlike", protect, unlikePost);

// @route   GET /api/posts/:id/remixes
// @desc    Get remixes of a post
// @access  Public
router.get("/:id/remixes", getPostRemixes);

export default router;
