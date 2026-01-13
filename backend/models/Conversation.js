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
    isGroup: {
      type: Boolean,
      default: false,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    groupName: {
      type: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only 2 participants (direct messaging)
conversationSchema.pre("save", function (next) {
  if (!this.isGroup && this.participants.length !== 2) {
    next(new Error("Direct conversations must have exactly 2 participants"));
  } else {
    next();
  }
});

// Index for efficient querying
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Compound index to prevent duplicate conversations
conversationSchema.index({ participants: 1 }, { unique: true });

export default mongoose.model("Conversation", conversationSchema);
