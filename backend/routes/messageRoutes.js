import express from "express";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  deleteConversation,
  getUnreadCount,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, getOrCreateConversation);
router.delete("/conversations/:conversationId", protect, deleteConversation);
router.get("/unread-count", protect, getUnreadCount);
router.get("/:conversationId", protect, getMessages);
router.post("/:conversationId", protect, sendMessage);

export default router;
