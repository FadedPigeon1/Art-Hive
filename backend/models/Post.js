import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      trim: true,
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
    stars: [
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
postSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user posts sorted by date
postSchema.index({ caption: "text" });
postSchema.index({ remixedFrom: 1 }); // Index for remix queries

// Compound indexes for sorting by likes/stars (trending)
postSchema.index({ likes: 1, createdAt: -1 });
postSchema.index({ stars: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
