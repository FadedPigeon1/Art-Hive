import express from "express";
import {
  createGameSession,
  joinGameSession,
  getGameSession,
  submitDrawing,
  endGameSession,
} from "../controllers/gameController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/game/create
// @desc    Create a new game session
// @access  Public
router.post("/create", createGameSession);

// @route   POST /api/game/join
// @desc    Join a game session
// @access  Public
router.post("/join", joinGameSession);

// @route   GET /api/game/:code
// @desc    Get game session by code
// @access  Public
router.get("/:code", optionalAuth, getGameSession);

// @route   POST /api/game/:code/submit
// @desc    Submit a drawing/prompt
// @access  Public
router.post("/:code/submit", submitDrawing);

// @route   POST /api/game/:code/end
// @desc    End game session
// @access  Public
router.post("/:code/end", endGameSession);

export default router;
