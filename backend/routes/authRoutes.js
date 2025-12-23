import express from "express";
import { body } from "express-validator";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  updatePassword,
  followUser,
  unfollowUser,
  getSuggestedUsers,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3, max: 30 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  registerUser
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  loginUser
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", protect, updateProfile);

// @route   PUT /api/auth/password
// @desc    Update user password
// @access  Private
router.put(
  "/password",
  protect,
  [body("newPassword").isLength({ min: 6 })],
  updatePassword
);

// @route   PUT /api/auth/follow/:userId
// @desc    Follow a user
// @access  Private
router.put("/follow/:userId", protect, followUser);

// @route   PUT /api/auth/unfollow/:userId
// @desc    Unfollow a user
// @access  Private
router.put("/unfollow/:userId", protect, unfollowUser);

// @route   GET /api/auth/suggested
// @desc    Get suggested users to follow
// @access  Private
router.get("/suggested", protect, getSuggestedUsers);

export default router;
