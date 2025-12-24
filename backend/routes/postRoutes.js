import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  getPostRemixes,
} from "../controllers/postController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post("/", protect, upload.single("image"), createPost);

// @route   GET /api/posts
// @desc    Get all posts (feed)
// @access  Public (optional auth to see if user liked)
router.get("/", optionalAuth, getAllPosts);

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

export default router;
