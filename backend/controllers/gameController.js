import GameSession from "../models/GameSession.js";

// @desc    Create a new game session
// @route   POST /api/game/create
// @access  Public
export const createGameSession = async (req, res) => {
  const { nickname, totalRounds } = req.body;

  try {
    // Generate unique code
    let code;
    let codeExists = true;

    while (codeExists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingSession = await GameSession.findOne({ code });
      codeExists = !!existingSession;
    }

    const gameSession = await GameSession.create({
      code,
      hostId: nickname,
      totalRounds: totalRounds || 3,
      players: [
        {
          nickname,
          isGuest: true,
        },
      ],
    });

    res.status(201).json(gameSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a game session
// @route   POST /api/game/join
// @access  Public
export const joinGameSession = async (req, res) => {
  const { code, nickname, userId } = req.body;

  try {
    const gameSession = await GameSession.findOne({
      code: code.toUpperCase(),
      status: "waiting",
    });

    if (!gameSession) {
      return res
        .status(404)
        .json({ message: "Game not found or already started" });
    }

    // Check if nickname already taken in this game
    const nicknameTaken = gameSession.players.some(
      (player) => player.nickname === nickname
    );

    if (nicknameTaken) {
      return res
        .status(400)
        .json({ message: "Nickname already taken in this game" });
    }

    // Add player
    gameSession.players.push({
      nickname,
      userId: userId || null,
      isGuest: !userId,
    });

    await gameSession.save();

    res.json(gameSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get game session by code
// @route   GET /api/game/:code
// @access  Public
export const getGameSession = async (req, res) => {
  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(gameSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start game session
// @route   POST /api/game/:code/start
// @access  Public
export const startGameSession = async (req, res) => {
  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    console.log(
      `[START GAME] Code: ${req.params.code}, Found:`,
      gameSession ? "Yes" : "No"
    );

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    console.log(
      `[START GAME] Current status: ${gameSession.status}, Round: ${gameSession.currentRound}, Players: ${gameSession.players.length}`
    );

    if (gameSession.status === "finished") {
      console.log("[START GAME] Failed: Game already finished");
      return res.status(400).json({ message: "Game already finished" });
    }

    if (gameSession.status === "in-progress" && gameSession.currentRound > 0) {
      console.log("[START GAME] Failed: Game already started");
      return res.status(400).json({ message: "Game already started" });
    }

    // Initialize chains for Gartic Phone
    // Total rounds = number of players (so everyone sees each chain once)
    gameSession.totalRounds = gameSession.players.length;
    gameSession.status = "in-progress";
    gameSession.currentRound = 1;

    // Create a chain for each player
    gameSession.chains = gameSession.players.map((player, index) => ({
      chainId: index,
      originalPlayer: player.nickname,
      originalPrompt: "",
      entries: [],
    }));

    await gameSession.save();

    console.log(
      "[START GAME] Success: Game started with",
      gameSession.players.length,
      "chains"
    );
    res.json({ message: "Game started", gameSession });
  } catch (error) {
    console.error("[START GAME] Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current task for player (what to draw or guess)
// @route   GET /api/game/:code/task/:nickname
// @access  Public
export const getPlayerTask = async (req, res) => {
  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    const { nickname } = req.params;
    const playerIndex = gameSession.players.findIndex(
      (p) => p.nickname === nickname
    );

    if (playerIndex === -1) {
      return res.status(404).json({ message: "Player not found in game" });
    }

    const round = gameSession.currentRound;

    // Calculate which chain this player should work on
    // Chain rotates: each player gets a different chain each round
    const chainIndex = (playerIndex + round - 1) % gameSession.players.length;
    const chain = gameSession.chains[chainIndex];

    // Determine task type: Round 1 = prompt, then alternates drawing/guessing
    let taskType;
    let previousEntry = null;

    if (round === 1) {
      taskType = "prompt";
    } else {
      // Get the last entry in this chain
      if (chain.entries.length > 0) {
        previousEntry = chain.entries[chain.entries.length - 1];
        taskType = previousEntry.type === "prompt" ? "drawing" : "prompt";
      } else {
        taskType = "prompt"; // Shouldn't happen but fallback
      }
    }

    res.json({
      chainId: chainIndex,
      round,
      taskType,
      previousEntry: previousEntry
        ? {
            type: previousEntry.type,
            data: previousEntry.data,
            playerNickname: previousEntry.playerNickname,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit entry (prompt or drawing) for current round
// @route   POST /api/game/:code/submit-entry
// @access  Public
export const submitEntry = async (req, res) => {
  const { playerNickname, chainId, type, data } = req.body;

  try {
    console.log("[SUBMIT ENTRY]", {
      playerNickname,
      chainId,
      type,
      dataLength: data?.length,
    });

    if (!playerNickname || chainId === undefined || !type || !data) {
      console.log("[SUBMIT ENTRY] Missing required fields");
      return res.status(400).json({
        message: "Missing required fields",
        received: { playerNickname, chainId, type, hasData: !!data },
      });
    }

    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      console.log("[SUBMIT ENTRY] Game not found:", req.params.code);
      return res.status(404).json({ message: "Game not found" });
    }

    const chain = gameSession.chains[chainId];
    if (!chain) {
      console.log(
        "[SUBMIT ENTRY] Chain not found:",
        chainId,
        "Available chains:",
        gameSession.chains.length
      );
      return res.status(404).json({ message: "Chain not found" });
    }

    // Add entry to chain
    chain.entries.push({
      playerNickname,
      type,
      data: data,
      round: gameSession.currentRound,
    });

    // If this is the first entry (original prompt), save it
    if (gameSession.currentRound === 1 && type === "prompt") {
      chain.originalPrompt = data;
    }

    await gameSession.save();

    // Check if all players have submitted for this round
    const submittedCount = gameSession.chains.filter((c) => {
      return c.entries.some((e) => e.round === gameSession.currentRound);
    }).length;
    const totalPlayers = gameSession.players.length;
    const allSubmitted = submittedCount === totalPlayers;

    console.log("[SUBMIT ENTRY] Submission status:", {
      submittedCount,
      totalPlayers,
      allSubmitted,
      round: gameSession.currentRound,
    });

    if (allSubmitted) {
      const io = req.app.get("io");

      // Move to next round or end game
      if (gameSession.currentRound >= gameSession.totalRounds) {
        gameSession.status = "finished";
        gameSession.endedAt = Date.now();
        await gameSession.save();

        // Emit game ended event
        io.to(gameSession.code).emit("game-ended", { code: gameSession.code });
      } else {
        gameSession.currentRound += 1;
        await gameSession.save();

        // Emit next round event
        io.to(gameSession.code).emit("next-round", {
          code: gameSession.code,
          round: gameSession.currentRound,
        });
      }
    }

    res.json({
      message: "Entry submitted",
      allSubmitted,
      submittedCount: submittedCount,
      totalPlayers: totalPlayers,
      gameSession,
    });
  } catch (error) {
    console.error("[SUBMIT ENTRY ERROR]", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// @desc    Submit a drawing/prompt
// @route   POST /api/game/:code/submit
// @access  Public
export const submitDrawing = async (req, res) => {
  const { playerNickname, type, data, round } = req.body;

  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Add drawing/prompt
    gameSession.drawings.push({
      round,
      playerNickname,
      type, // 'drawing' or 'prompt'
      data, // base64 image or text
    });

    await gameSession.save();

    res.json({ message: "Submission saved", gameSession });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End game session
// @route   POST /api/game/:code/end
// @access  Public
export const endGameSession = async (req, res) => {
  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    gameSession.status = "finished";
    gameSession.endedAt = Date.now();

    await gameSession.save();

    res.json({ message: "Game ended", gameSession });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave game session
// @route   POST /api/game/:code/leave
// @access  Public
export const leaveGameSession = async (req, res) => {
  const { nickname } = req.body;

  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Remove player from the game
    gameSession.players = gameSession.players.filter(
      (player) => player.nickname !== nickname
    );

    // If no players left, delete the game session
    if (gameSession.players.length === 0) {
      await GameSession.deleteOne({ _id: gameSession._id });
      return res.json({ message: "Game deleted - no players remaining" });
    }

    // If the host left, assign a new host
    if (gameSession.hostId === nickname && gameSession.players.length > 0) {
      gameSession.hostId = gameSession.players[0].nickname;
    }

    await gameSession.save();

    res.json({ message: "Left game successfully", gameSession });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get game results (chains)
// @route   GET /api/game/:code/results
// @access  Public
export const getGameResults = async (req, res) => {
  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (gameSession.status !== "finished") {
      return res.status(400).json({ message: "Game not finished yet" });
    }

    res.json({ chains: gameSession.chains, players: gameSession.players });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
