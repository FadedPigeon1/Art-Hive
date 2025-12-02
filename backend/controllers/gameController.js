import GameSession from "../models/GameSession.js";
import { supabase } from "../config/supabaseClient.js";

// @desc    Create a new game session
// @route   POST /api/game/create
// @access  Public
export const createGameSession = async (req, res) => {
  const { nickname, totalRounds, maxPlayers, gameMode } = req.body;

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
      maxPlayers: maxPlayers || 12,
      gameMode: gameMode || "classic",
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

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (gameSession.status === "finished") {
      return res.status(400).json({ message: "Game already finished" });
    }

    if (gameSession.status === "in-progress" && gameSession.currentRound > 0) {
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

    // Check if game has started and chains are initialized
    if (!gameSession.chains || gameSession.chains.length === 0) {
      return res.status(400).json({
        message: "Game not started or chains not initialized",
      });
    }

    // Calculate which chain this player should work on
    // Chain rotates: each player gets a different chain each round
    const chainIndex = (playerIndex + round - 1) % gameSession.players.length;
    const chain = gameSession.chains[chainIndex];

    if (!chain) {
      return res.status(404).json({
        message: "Chain not found",
        debug: {
          chainIndex,
          totalChains: gameSession.chains.length,
          playerIndex,
          round,
        },
      });
    }

    // Determine task type: Round 1 = prompt, then alternates drawing/guessing
    let taskType;
    let previousEntry = null;

    if (round === 1) {
      taskType = "prompt";
    } else {
      // Get the last entry in this chain
      if (chain.entries && chain.entries.length > 0) {
        previousEntry = chain.entries[chain.entries.length - 1];
        taskType = previousEntry.type === "prompt" ? "drawing" : "prompt";
      } else {
        taskType = "prompt"; // Shouldn't happen but fallback
      }
    }

    const response = {
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
    };

    // Check if player already submitted for this round in this chain
    const playerChain = gameSession.chains[chainIndex];
    const alreadySubmitted = playerChain.entries.some(
      (e) => e.playerNickname === nickname && e.round === round
    );

    res.json({
      ...response,
      alreadySubmitted,
    });
  } catch (error) {
    console.error("[GET TASK ERROR]", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// @desc    Submit entry (prompt or drawing) for current round
// @route   POST /api/game/:code/submit-entry
// @access  Public
export const submitEntry = async (req, res) => {
  const { playerNickname, chainId, type } = req.body;
  let data = req.body.data;

  try {
    // Handle file upload if present
    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split(".").pop();
      const fileName = `game_${req.params.code}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from("post-images") // Using same bucket
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return res.status(500).json({ message: "Error uploading image" });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      data = publicUrlData.publicUrl;
    }

    // Validate required fields
    if (!playerNickname || chainId === undefined || !type || !data) {
      return res.status(400).json({
        message: "Missing required fields",
        received: { playerNickname, chainId, type, hasData: !!data },
      });
    }

    // Validate type
    if (type !== "prompt" && type !== "drawing") {
      return res.status(400).json({
        message: "Invalid entry type. Must be 'prompt' or 'drawing'",
      });
    }

    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!gameSession) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Check if game is in progress
    if (gameSession.status !== "in-progress") {
      return res.status(400).json({
        message: "Game is not in progress",
        status: gameSession.status,
      });
    }

    // Find player index
    const playerIndex = gameSession.players.findIndex(
      (p) => p.nickname === playerNickname
    );
    if (playerIndex === -1) {
      return res.status(404).json({ message: "Player not found in game" });
    }

    // Calculate expected chain
    // Note: currentRound is 1-based.
    // Formula from getPlayerTask: const chainIndex = (playerIndex + round - 1) % gameSession.players.length;
    const expectedChainIndex =
      (playerIndex + gameSession.currentRound - 1) % gameSession.players.length;

    if (chainId !== expectedChainIndex) {
      return res.status(400).json({
        message: "Invalid chain for this round",
        expected: expectedChainIndex,
        received: chainId,
      });
    }

    // Check if player already submitted for this round (globally)
    const alreadySubmittedGlobal = gameSession.chains.some((c) =>
      c.entries.some(
        (e) =>
          e.playerNickname === playerNickname &&
          e.round === gameSession.currentRound
      )
    );

    if (alreadySubmittedGlobal) {
      return res
        .status(400)
        .json({ message: "You have already submitted for this round" });
    }

    // Validate chainId (redundant but safe)
    if (chainId < 0 || chainId >= gameSession.chains.length) {
      return res.status(400).json({
        message: "Invalid chain ID",
        chainId,
        availableChains: gameSession.chains.length,
      });
    }

    const chain = gameSession.chains[chainId];
    if (!chain) {
      return res.status(404).json({ message: "Chain not found" });
    }

    // Add entry to chain
    const newEntry = {
      playerNickname,
      type,
      data: data,
      round: gameSession.currentRound,
    };

    chain.entries.push(newEntry);

    // If this is the first entry (original prompt), save it
    if (gameSession.currentRound === 1 && type === "prompt") {
      chain.originalPrompt = data;
    }

    await gameSession.save();

    // Check if all players have submitted for this round
    // We count unique players who have submitted for this round
    const submittedPlayersCount = new Set();
    gameSession.chains.forEach((c) => {
      c.entries.forEach((e) => {
        if (e.round === gameSession.currentRound) {
          submittedPlayersCount.add(e.playerNickname);
        }
      });
    });

    // Also count players who have left as "submitted" (to prevent stalling)
    gameSession.players.forEach((p) => {
      if (p.isLeft) {
        submittedPlayersCount.add(p.nickname);
      }
    });

    const submittedCount = submittedPlayersCount.size;
    const totalPlayers = gameSession.players.length;
    const allSubmitted = submittedCount === totalPlayers;

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

    // If game is in progress, mark player as left but keep them in the array
    // to preserve player indices for chain rotation logic
    if (gameSession.status === "in-progress") {
      const player = gameSession.players.find((p) => p.nickname === nickname);
      if (player) {
        player.isLeft = true;
        await gameSession.save();
      }
      return res.json({
        message: "Left game successfully (marked as left)",
        gameSession,
      });
    }

    // Remove player from the game if not in progress
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
