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
});

const drawingSchema = new mongoose.Schema({
  round: Number,
  playerId: String,
  playerNickname: String,
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
    drawings: [drawingSchema],
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
