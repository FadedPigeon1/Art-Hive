import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'system'],
      default: 'text'
    },
    attachments: [{
      url: String,
      fileType: String
    }],
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: String
    }],
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }],
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
