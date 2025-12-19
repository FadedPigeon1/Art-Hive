import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
  },
  socketId: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isGuest: {
    type: Boolean,
    default: true,
  },
  isLeft: {
    type: Boolean,
    default: false,
  },
});

const drawingSchema = new mongoose.Schema({
  round: Number,
  playerNickname: String,
  chainId: Number, // Which chain this belongs to
  type: {
    type: String,
    enum: ["drawing", "prompt"],
  },
  data: String, // Base64 image or text prompt
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const entrySchema = new mongoose.Schema({
  playerNickname: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["prompt", "drawing"],
  },
  data: {
    type: String,
    required: true,
  },
  round: {
    type: Number,
    required: true,
  },
});

const chainSchema = new mongoose.Schema({
  chainId: Number,
  originalPrompt: String,
  originalPlayer: String,
  entries: [entrySchema],
});

const gameSessionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    hostId: String,
    players: [playerSchema],
    chains: [chainSchema], // Store chains for Gartic Phone style
    drawings: [drawingSchema], // Keep for backwards compatibility
    status: {
      type: String,
      enum: ["waiting", "in-progress", "finished"],
      default: "waiting",
    },
    currentRound: {
      type: Number,
      default: 0,
    },
    totalRounds: {
      type: Number,
      default: 3,
    },
    maxPlayers: {
      type: Number,
      default: 10,
    },
    gameMode: {
      type: String,
      enum: ["classic", "speed", "relaxed"],
      default: "classic",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Auto-generate game code
gameSessionSchema.pre("save", function (next) {
  if (!this.code) {
    this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

const GameSession = mongoose.model("GameSession", gameSessionSchema);

export default GameSession;
