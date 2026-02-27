import express from "express";
import {
  createCollection,
  getUserCollections,
  getMyCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addPostToCollection,
  removePostFromCollection,
} from "../controllers/collectionController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Must be before /:id to prevent "my" being parsed as an ObjectId
router.get("/my", protect, getMyCollections);

router.get("/user/:userId", optionalAuth, getUserCollections);

router.post("/", protect, createCollection);

router
  .route("/:id")
  .get(optionalAuth, getCollectionById)
  .put(protect, updateCollection)
  .delete(protect, deleteCollection);

router
  .route("/:id/posts/:postId")
  .put(protect, addPostToCollection)
  .delete(protect, removePostFromCollection);

export default router;
