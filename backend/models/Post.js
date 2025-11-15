import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Please add an image URL"],
    },
    caption: {
      type: String,
      maxlength: [500, "Caption cannot exceed 500 characters"],
      default: "",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isGameArt: {
      type: Boolean,
      default: false,
    },
    gameSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameSession",
    },
    remixCount: {
      type: Number,
      default: 0,
    },
    remixedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
