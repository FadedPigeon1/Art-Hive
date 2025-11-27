import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

const mapPostSummaries = (posts, currentUserId) => {
  const currentUserStringId = currentUserId ? currentUserId.toString() : null;

  return posts.map((post, index) => {
    const likes = post.likes || [];
    const stars = post.stars || [];
    const comments = post.comments || [];

    const likedByCurrentUser = currentUserStringId
      ? likes.some((id) => id.toString() === currentUserStringId)
      : false;
    const starredByCurrentUser = currentUserStringId
      ? stars.some((id) => id.toString() === currentUserStringId)
      : false;

    const summary = {
      ...post,
      likesCount: likes.length,
      starsCount: stars.length,
      commentCount: comments.length,
      likedByCurrentUser,
      starredByCurrentUser,
    };

    delete summary.likes;
    delete summary.stars;
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
    const sortType = req.query.sort; // 'trending' or undefined

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

    let posts;

    if (sortType === "trending") {
      posts = await Post.aggregate([
        { $match: filter },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ["$likes", []] } },
          },
        },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit + 1 },
        // Lookup userId
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        { $unwind: "$userId" },
        // Lookup remixedFrom
        {
          $lookup: {
            from: "posts",
            localField: "remixedFrom",
            foreignField: "_id",
            as: "remixedFrom",
          },
        },
        {
          $unwind: { path: "$remixedFrom", preserveNullAndEmptyArrays: true },
        },
        // Lookup remixedFrom.userId
        {
          $lookup: {
            from: "users",
            localField: "remixedFrom.userId",
            foreignField: "_id",
            as: "remixedFrom.userId",
          },
        },
        {
          $unwind: {
            path: "$remixedFrom.userId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            imageUrl: 1,
            remixCount: 1,
            createdAt: 1,
            likes: 1,
            stars: 1,
            comments: 1,
            isGameArt: 1,
            "userId.username": 1,
            "userId.profilePic": 1,
            "userId._id": 1,
            "remixedFrom._id": 1,
            "remixedFrom.imageUrl": 1,
            "remixedFrom.title": 1,
            "remixedFrom.userId.username": 1,
            "remixedFrom.userId.profilePic": 1,
            "remixedFrom.userId._id": 1,
          },
        },
      ]);
    } else {
      posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1) // Fetch one extra to check if there are more
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
    }

    // Check if there are more posts
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop(); // Remove the extra post
    }

    console.log("getAllPosts - User ID:", req.user?._id);
    console.log("Sample post likes (first post):", posts[0]?.likes);

    const lightweightPosts = mapPostSummaries(posts, req.user?._id);

    console.log("Sample mapped post (first post):", {
      id: lightweightPosts[0]?._id,
      likesCount: lightweightPosts[0]?.likesCount,
      likedByCurrentUser: lightweightPosts[0]?.likedByCurrentUser,
    });

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
        .select(
          "title imageUrl createdAt remixedFrom likes stars comments isGameArt"
        )
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
    console.log(
      "Like request - Post ID:",
      req.params.id,
      "User ID:",
      req.user._id
    );
    const post = await Post.findById(req.params.id).select("_id likes");

    if (!post) {
      console.log("Post not found:", req.params.id);
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("Post likes array:", post.likes);

    // Check if already liked - convert ObjectIds to strings for comparison
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    console.log("Already liked?", alreadyLiked);

    if (alreadyLiked) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(req.user._id);
    await post.save();

    console.log("Post liked successfully, new count:", post.likes.length);
    res.json({ message: "Post liked", likes: post.likes.length });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlike a post
// @route   PUT /api/posts/:id/unlike
// @access  Private
export const unlikePost = async (req, res) => {
  try {
    console.log(
      "Unlike request - Post ID:",
      req.params.id,
      "User ID:",
      req.user._id
    );
    const post = await Post.findById(req.params.id).select("_id likes");

    if (!post) {
      console.log("Post not found:", req.params.id);
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("Post likes array:", post.likes);

    // Check if not liked - convert ObjectIds to strings for comparison
    const isLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    console.log("Is liked?", isLiked);

    if (!isLiked) {
      return res.status(400).json({ message: "Post not liked yet" });
    }

    post.likes = post.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    console.log("Post unliked successfully, new count:", post.likes.length);
    res.json({ message: "Post unliked", likes: post.likes.length });
  } catch (error) {
    console.error("Unlike error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Star a post
// @route   PUT /api/posts/:id/star
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
// @route   PUT /api/posts/:id/unstar
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

// @desc    Get starred posts by user
// @route   GET /api/posts/starred
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
// @route   GET /api/posts/liked
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
