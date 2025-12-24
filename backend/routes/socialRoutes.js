import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  followUser,
  unfollowUser,
  getSuggestedUsers,
} from "../controllers/socialController.js";

const router = express.Router();

router.put("/follow/:userId", protect, followUser);
router.put("/unfollow/:userId", protect, unfollowUser);
router.get("/suggested", protect, getSuggestedUsers);

export default router;
