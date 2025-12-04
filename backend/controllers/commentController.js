import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { createNotification } from "./notificationController.js";

// @desc    Create a comment
// @route   POST /api/comments
// @access  Private
export const createComment = async (req, res) => {
  const { postId, text } = req.body;

  try {
    if (!text || !postId) {
      return res.status(400).json({ message: "Post ID and text are required" });
    }

    // Check if post exists
    const post = await Post.findById(postId).populate("userId", "username");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create comment
    const comment = await Comment.create({
      userId: req.user._id,
      postId,
      text,
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Populate user info
    const populatedComment = await Comment.findById(comment._id).populate(
      "userId",
      "username profilePic"
    );

    // Create notification for post owner
    if (post.userId._id.toString() !== req.user._id.toString()) {
      const notification = await createNotification({
        recipient: post.userId._id,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        comment: comment._id,
        message: `${req.user.username} commented on your post`,
      });

      // Emit real-time notification
      if (notification && global.io && global.userSockets) {
        const recipientSocketId = global.userSockets.get(
          post.userId._id.toString()
        );
        if (recipientSocketId) {
          global.io
            .to(recipientSocketId)
            .emit("new-notification", notification);
        }
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public
export const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .sort({ createdAt: -1 })
      .populate("userId", "username profilePic");

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.postId, {
      $pull: { comments: comment._id },
    });

    await comment.deleteOne();

    res.json({ message: "Comment removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
