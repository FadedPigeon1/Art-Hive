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
