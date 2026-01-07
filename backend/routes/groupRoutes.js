import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  updateGroup,
  getTrendingGroups,
} from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/trending", getTrendingGroups);
router.route("/").post(protect, createGroup).get(getGroups);
router.route("/:id").get(getGroupById).put(protect, updateGroup);
router.route("/:id/join").put(protect, joinGroup);
router.route("/:id/leave").put(protect, leaveGroup);
router.route("/:id/posts").get(getGroupPosts);

export default router;
