import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  starPost,
  unstarPost,
  getPostRemixes,
  getStarredPosts,
  getLikedPosts,
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

// @route   GET /api/posts/starred
// @desc    Get starred posts
// @access  Private
router.get("/starred", protect, getStarredPosts);

// @route   GET /api/posts/liked
// @desc    Get liked posts
// @access  Private
router.get("/liked", protect, getLikedPosts);

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user
// @access  Public (optional auth for liked flag)
router.get("/user/:userId", optionalAuth, getUserPosts);

// @route   GET /api/posts/:id/remixes
// @desc    Get remixes of a post
// @access  Public
router.get("/:id/remixes", getPostRemixes);

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get("/:id", optionalAuth, getPostById);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put("/:id", protect, updatePost);

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

// @route   PUT /api/posts/:id/star
// @desc    Star a post
// @access  Private
router.put("/:id/star", protect, starPost);

// @route   PUT /api/posts/:id/unstar
// @desc    Unstar a post
// @access  Private
router.put("/:id/unstar", protect, unstarPost);

export default router;
