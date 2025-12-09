import express from "express";
import {
  getTodayChallenge,
  completeChallenge,
  getChallengeHistory,
  getChallengeLeaderboard,
  getProgression,
} from "../controllers/challengeController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/today", optionalAuth, getTodayChallenge);
router.get("/leaderboard", getChallengeLeaderboard);

// Protected routes
router.post("/:challengeId/complete", protect, completeChallenge);
router.get("/history", protect, getChallengeHistory);
router.get("/progression", protect, getProgression);

export default router;
