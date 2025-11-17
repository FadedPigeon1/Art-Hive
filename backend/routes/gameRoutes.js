import express from "express";
import {
  createGameSession,
  joinGameSession,
  getGameSession,
  startGameSession,
  getPlayerTask,
  submitEntry,
  submitDrawing,
  endGameSession,
  leaveGameSession,
  getGameResults,
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

// @route   POST /api/game/:code/start
// @desc    Start game session
// @access  Public
router.post("/:code/start", startGameSession);

// @route   GET /api/game/:code/task/:nickname
// @desc    Get current task for player
// @access  Public
router.get("/:code/task/:nickname", getPlayerTask);

// @route   POST /api/game/:code/submit-entry
// @desc    Submit entry for current round
// @access  Public
router.post("/:code/submit-entry", submitEntry);

// @route   POST /api/game/:code/submit
// @desc    Submit a drawing/prompt (legacy)
// @access  Public
router.post("/:code/submit", submitDrawing);

// @route   POST /api/game/:code/end
// @desc    End game session
// @access  Public
router.post("/:code/end", endGameSession);

// @route   POST /api/game/:code/leave
// @desc    Leave game session
// @access  Public
router.post("/:code/leave", leaveGameSession);

// @route   GET /api/game/:code/results
// @desc    Get game results
// @access  Public
router.get("/:code/results", getGameResults);

// @route   GET /api/game/:code
// @desc    Get game session by code
// @access  Public
router.get("/:code", optionalAuth, getGameSession);

export default router;
