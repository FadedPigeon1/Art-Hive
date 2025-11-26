import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  const { imageUrl, caption, isGameArt, gameSessionId, remixedFrom } = req.body;

  try {
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const post = await Post.create({
      userId: req.user._id,
      imageUrl,
      caption: caption || "",
      isGameArt: isGameArt || false,
      gameSessionId: gameSessionId || null,
      remixedFrom: remixedFrom || null,
    });

    // If this is a remix, increment the original post's remix count
    if (remixedFrom) {
      await Post.findByIdAndUpdate(remixedFrom, { $inc: { remixCount: 1 } });
    }

    const populatedPost = await Post.findById(post._id)
      .populate("userId", "username profilePic")
      .populate("remixedFrom", "userId imageUrl caption")
      .populate({
        path: "remixedFrom",
        populate: { path: "userId", select: "username profilePic" },
      })
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username profilePic" },
      });

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Public
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Support simple search via `q` query param. Search caption text
    // and usernames. This is a basic implementation using regex and
    // an extra lookup for matching users.
    const q = req.query.q ? req.query.q.trim() : null;
    let filter = {};
    if (q && q.length > 0) {
      const regex = new RegExp(q, "i");
      const matchingUsers = await User.find({ username: regex }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      filter = {
        $or: [{ caption: { $regex: regex } }, { userId: { $in: userIds } }],
      };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "username profilePic")
      .populate("remixedFrom", "userId imageUrl caption")
      .populate({
        path: "remixedFrom",
        populate: { path: "userId", select: "username profilePic" },
      })
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username profilePic" },
        options: { sort: { createdAt: -1 }, limit: 3 },
      });

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "username profilePic bio")
      .populate("remixedFrom", "userId imageUrl caption")
      .populate({
        path: "remixedFrom",
        populate: { path: "userId", select: "username profilePic" },
      })
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username profilePic" },
        options: { sort: { createdAt: -1 } },
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts by user
// @route   GET /api/posts/user/:userId
// @access  Public
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate(
        "userId",
        "username profilePic bio email dateJoined followers following"
      );

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
  try {
    const { caption } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this post" });
    }

    // Update caption
    if (caption !== undefined) {
      post.caption = caption;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("userId", "username profilePic")
      .populate("remixedFrom", "userId imageUrl caption")
      .populate({
        path: "remixedFrom",
        populate: { path: "userId", select: "username profilePic" },
      })
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username profilePic" },
      });

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ postId: post._id });

    await post.deleteOne();

    res.json({ message: "Post removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already liked
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(req.user._id);
    await post.save();

    res.json({ message: "Post liked", likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlike a post
// @route   PUT /api/posts/:id/unlike
// @access  Private
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if not liked
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "Post not liked yet" });
    }

    post.likes = post.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.json({ message: "Post unliked", likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get remixes of a post
// @route   GET /api/posts/:id/remixes
// @access  Public
export const getPostRemixes = async (req, res) => {
  try {
    const remixes = await Post.find({ remixedFrom: req.params.id })
      .sort({ createdAt: -1 })
      .populate("userId", "username profilePic")
      .populate("remixedFrom", "userId imageUrl caption")
      .populate({
        path: "remixedFrom",
        populate: { path: "userId", select: "username profilePic" },
      });

    res.json(remixes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
