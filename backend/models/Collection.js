import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a collection name"],
      maxlength: [100, "Collection name cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    coverImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

collectionSchema.index({ userId: 1, createdAt: -1 });
collectionSchema.index({ userId: 1, isPublic: 1 });

const Collection = mongoose.model("Collection", collectionSchema);
export default Collection;
