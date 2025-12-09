import mongoose from "mongoose";

const dailyChallengeSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: [true, "Please add a challenge prompt"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    xpReward: {
      type: Number,
      default: 50,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    completions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster date queries
dailyChallengeSchema.index({ date: -1 });
dailyChallengeSchema.index({ isActive: 1, date: -1 });

const DailyChallenge = mongoose.model("DailyChallenge", dailyChallengeSchema);

export default DailyChallenge;
