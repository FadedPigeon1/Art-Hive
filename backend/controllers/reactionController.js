import Post from "../models/Post.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";
import { updateStatsAndAwardXP } from "../utils/progressionHelper.js";

const mapPostSummaries = (posts, currentUserId) => {
  const currentUserStringId = currentUserId ? currentUserId.toString() : null;

  return posts.map((post) => {
    // Convert Mongoose document to plain object if needed
    const postObj = post.toObject ? post.toObject() : post;

    const likes = postObj.likes || [];
    const stars = postObj.stars || [];
    const comments = postObj.comments || [];

    const likedByCurrentUser = currentUserStringId
      ? likes.some((id) => id.toString() === currentUserStringId)
      : false;
    const starredByCurrentUser = currentUserStringId
      ? stars.some((id) => id.toString() === currentUserStringId)
      : false;

    return {
      _id: postObj._id,
      title: postObj.title,
      imageUrl: postObj.imageUrl,
      caption: postObj.caption,
      userId: postObj.userId,
      remixedFrom: postObj.remixedFrom,
      remixCount: postObj.remixCount || 0,
      isGameArt: postObj.isGameArt || false,
      gameSessionId: postObj.gameSessionId,
      createdAt: postObj.createdAt,
      updatedAt: postObj.updatedAt,
      likesCount: likes.length,
      starsCount: stars.length,
      commentCount: comments.length,
      likedByCurrentUser,
      starredByCurrentUser,
    };
  });
};

// @desc    Like a post
// @route   PUT /api/reactions/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .select("_id likes userId title")
      .populate("userId", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already liked - convert ObjectIds to strings for comparison
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(req.user._id);
    await post.save();

    // Award XP to post owner for receiving a like
    if (post.userId._id.toString() !== req.user._id.toString()) {
      await updateStatsAndAwardXP(post.userId._id, "likesReceived");
    }

    // Create notification for post owner
    if (post.userId._id.toString() !== req.user._id.toString()) {
      const notification = await createNotification({
        recipient: post.userId._id,
        sender: req.user._id,
        type: "like",
        post: post._id,
        message: `${req.user.username} liked your post`,
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

    res.json({ message: "Post liked", likes: post.likes.length });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlike a post
// @route   PUT /api/reactions/posts/:id/unlike
// @access  Private
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("_id likes");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if not liked - convert ObjectIds to strings for comparison
    const isLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isLiked) {
      return res.status(400).json({ message: "Post not liked yet" });
    }

    post.likes = post.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.json({ message: "Post unliked", likes: post.likes.length });
  } catch (error) {
    console.error("Unlike error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Star a post
// @route   PUT /api/reactions/posts/:id/star
// @access  Private
export const starPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("_id stars");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already starred - convert ObjectIds to strings for comparison
    const alreadyStarred = post.stars.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyStarred) {
      return res.status(400).json({ message: "Post already starred" });
    }

    post.stars.push(req.user._id);
    await post.save();

    // Also add to user's starred posts
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { starredPosts: req.params.id },
    });

    res.json({ message: "Post starred", stars: post.stars.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unstar a post
// @route   PUT /api/reactions/posts/:id/unstar
// @access  Private
export const unstarPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("_id stars");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if not starred - convert ObjectIds to strings for comparison
    const isStarred = post.stars.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isStarred) {
      return res.status(400).json({ message: "Post not starred yet" });
    }

    post.stars = post.stars.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    // Also remove from user's starred posts
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { starredPosts: req.params.id },
    });

    res.json({ message: "Post unstarred", stars: post.stars.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get starred posts by user
// @route   GET /api/reactions/posts/starred
// @access  Private
export const getStarredPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .select("starredPosts")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const starredPostIds = user.starredPosts || [];

    const posts = await Post.find({ _id: { $in: starredPostIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .select(
        "title imageUrl userId remixCount remixedFrom createdAt likes stars comments isGameArt"
      )
      .populate("userId", "username profilePic")
      .populate({
        path: "remixedFrom",
        select: "imageUrl title userId",
        populate: { path: "userId", select: "username profilePic" },
      })
      .lean();

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    const lightweightPosts = mapPostSummaries(posts, req.user._id);

    res.json({
      posts: lightweightPosts,
      page,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get liked posts by user
// @route   GET /api/reactions/posts/liked
// @access  Private
export const getLikedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ likes: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .select(
        "title imageUrl userId remixCount remixedFrom createdAt likes stars comments isGameArt"
      )
      .populate("userId", "username profilePic")
      .populate({
        path: "remixedFrom",
        select: "imageUrl title userId",
        populate: { path: "userId", select: "username profilePic" },
      })
      .lean();

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    const lightweightPosts = mapPostSummaries(posts, req.user._id);

    res.json({
      posts: lightweightPosts,
      page,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
