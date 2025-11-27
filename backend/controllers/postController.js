import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

const mapPostSummaries = (posts, currentUserId) => {
  const currentUserStringId = currentUserId ? currentUserId.toString() : null;

  return posts.map((post) => {
    const likes = post.likes || [];
    const comments = post.comments || [];
    const likedByCurrentUser = currentUserStringId
      ? likes.some((id) => id.toString() === currentUserStringId)
      : false;

    const summary = {
      ...post,
      likesCount: likes.length,
      commentCount: comments.length,
      likedByCurrentUser,
    };

    delete summary.likes;
    delete summary.comments;

    return summary;
  });
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  const { title, imageUrl, caption, isGameArt, gameSessionId, remixedFrom } =
    req.body;

  try {
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const post = await Post.create({
      userId: req.user._id,
      title,
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
      .populate("remixedFrom", "userId imageUrl caption title")
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

      // Run user search in parallel with limit for performance
      const [matchingUsers] = await Promise.all([
        User.find({ username: regex }).select("_id").limit(50).lean(),
      ]);

      const userIds = matchingUsers.map((u) => u._id);

      filter = {
        $or: [{ caption: { $regex: regex } }, { userId: { $in: userIds } }],
      };
    }

    const [posts] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1) // Fetch one extra to check if there are more
        .select(
          "title imageUrl userId remixCount remixedFrom createdAt likes comments isGameArt"
        )
        .populate("userId", "username profilePic")
        .populate({
          path: "remixedFrom",
          select: "imageUrl title userId",
          populate: { path: "userId", select: "username profilePic" },
        })
        .lean(),
    ]);

    // Check if there are more posts
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop(); // Remove the extra post
    }

    const lightweightPosts = mapPostSummaries(posts, req.user?._id);

    // Add cache headers for better performance
    res.setHeader("Cache-Control", "private, max-age=60"); // Cache for 1 minute

    res.json({
      posts: lightweightPosts,
      page,
      hasMore,
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
      .populate("remixedFrom", "userId imageUrl caption title")
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
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const [user, posts, totalPosts] = await Promise.all([
      User.findById(userId)
        .select("username profilePic bio email dateJoined followers following")
        .lean(),
      Post.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1)
        .select("title imageUrl createdAt remixedFrom likes comments isGameArt")
        .populate({
          path: "remixedFrom",
          select: "imageUrl title userId",
          populate: { path: "userId", select: "username profilePic" },
        })
        .lean(),
      page === 1 ? Post.countDocuments({ userId }) : Promise.resolve(0), // Only count on first page
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    const sanitizedPosts = mapPostSummaries(posts, req.user?._id);

    const summarizedPosts = sanitizedPosts.map((post) => ({
      _id: post._id,
      title: post.title,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      likesCount: post.likesCount,
      commentCount: post.commentCount,
      remixedFrom: post.remixedFrom,
      isGameArt: post.isGameArt,
    }));

    const sanitizedUser = {
      _id: user._id,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio,
      email: user.email,
      dateJoined: user.dateJoined,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
    };

    // Add cache headers for profile data
    res.setHeader("Cache-Control", "private, max-age=120"); // Cache for 2 minutes

    res.json({
      user: sanitizedUser,
      posts: summarizedPosts,
      page,
      hasMore,
      totalPosts: page === 1 ? totalPosts : undefined, // Only send total on first page
    });
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
      .populate("remixedFrom", "userId imageUrl caption title")
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
    const post = await Post.findById(req.params.id).select("_id likes");

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
    const post = await Post.findById(req.params.id).select("_id likes");

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
      .populate("remixedFrom", "userId imageUrl caption title")
      .populate({
        path: "remixedFrom",
        populate: { path: "userId", select: "username profilePic" },
      });

    res.json(remixes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
