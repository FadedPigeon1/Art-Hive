import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  likePost,
  unlikePost,
  starPost,
  unstarPost,
  getLikedPosts,
  getStarredPosts,
} from "../controllers/reactionController.js";

const router = express.Router();

// Post reactions
router.put("/posts/:id/like", protect, likePost);
router.put("/posts/:id/unlike", protect, unlikePost);
router.put("/posts/:id/star", protect, starPost);
router.put("/posts/:id/unstar", protect, unstarPost);

// User collections
router.get("/posts/liked", protect, getLikedPosts);
router.get("/posts/starred", protect, getStarredPosts);

export default router;
