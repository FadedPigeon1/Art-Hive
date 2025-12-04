import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only 2 participants (direct messaging)
conversationSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Conversation must have exactly 2 participants"));
  }
  next();
});

// Index for efficient querying
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Compound index to prevent duplicate conversations
conversationSchema.index({ participants: 1 }, { unique: true });

export default mongoose.model("Conversation", conversationSchema);
