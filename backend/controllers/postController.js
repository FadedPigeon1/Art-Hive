import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { supabase } from "../config/supabaseClient.js";
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

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  const { title, caption, isGameArt, gameSessionId, remixedFrom } = req.body;
  let imageUrl = req.body.imageUrl;

  try {
    // Handle file upload if present
    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${req.user._id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      // Make sure you have a bucket named 'artworks' in your Supabase project
      // and it is set to public.
      const { data, error } = await supabase.storage
        .from("artworks")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        if (
          error.statusCode === "403" ||
          (error.message && error.message.includes("row-level security"))
        ) {
          return res.status(500).json({
            message:
              "Supabase RLS Policy Error: Please configure storage policies.",
          });
        }
        return res
          .status(500)
          .json({ message: "Error uploading image: " + error.message });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("artworks")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    } else if (imageUrl && imageUrl.startsWith("data:image")) {
      // Handle base64 image upload (e.g. from Game mode)
      try {
        const matches = imageUrl.match(
          /^data:image\/([a-zA-Z0-9]+);base64,(.+)$/
        );

        if (matches && matches.length === 3) {
          const fileExt = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `${req.user._id}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await supabase.storage
            .from("artworks")
            .upload(filePath, buffer, {
              contentType: `image/${fileExt}`,
            });

          if (error) {
            console.error("Supabase upload error (base64):", error);
            return res.status(500).json({ message: "Error uploading image" });
          }

          const { data: publicUrlData } = supabase.storage
            .from("artworks")
            .getPublicUrl(filePath);

          imageUrl = publicUrlData.publicUrl;
        }
      } catch (error) {
        console.error("Error processing base64 image:", error);
        return res.status(500).json({ message: "Error processing image" });
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ message: "Image is required" });
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
      group: req.body.group || null,
    });

    // If this is a remix, increment the original post's remix count
    if (remixedFrom) {
      await Post.findByIdAndUpdate(remixedFrom, { $inc: { remixCount: 1 } });

      // Award XP to the user creating the remix
      await updateStatsAndAwardXP(req.user._id, "remixesCreated");

      // Award XP to the original post owner for being remixed
      const originalPost = await Post.findById(remixedFrom);
      if (originalPost && originalPost.userId) {
        await updateStatsAndAwardXP(originalPost.userId, "remixesReceived");
      }
    } else {
      // Award XP for creating a post
      await updateStatsAndAwardXP(req.user._id, "postsCreated");
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
            caption: 1,
            remixCount: 1,
            createdAt: 1,
            updatedAt: 1,
            likes: 1,
            stars: 1,
            comments: 1,
            isGameArt: 1,
            gameSessionId: 1,
            "userId.username": 1,
            "userId.profilePic": 1,
            "userId._id": 1,
            "remixedFrom._id": 1,
            "remixedFrom.imageUrl": 1,
            "remixedFrom.title": 1,
            "remixedFrom.caption": 1,
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
          "title caption imageUrl userId remixCount remixedFrom createdAt updatedAt isGameArt gameSessionId"
        )
        .populate("userId", "username profilePic")
        .populate({
          path: "remixedFrom",
          select: "imageUrl title caption userId",
          populate: { path: "userId", select: "username profilePic" },
        })
        .lean();

      // Efficiently get likes, stars, and comments counts using aggregation
      const postIds = posts.map((p) => p._id);
      const counts = await Post.aggregate([
        { $match: { _id: { $in: postIds } } },
        {
          $project: {
            _id: 1,
            likesCount: { $size: { $ifNull: ["$likes", []] } },
            starsCount: { $size: { $ifNull: ["$stars", []] } },
            commentsCount: { $size: { $ifNull: ["$comments", []] } },
            likes: 1,
            stars: 1,
          },
        },
      ]);

      // Create a map for quick lookup
      const countsMap = new Map(counts.map((c) => [c._id.toString(), c]));

      // Merge counts with posts
      posts.forEach((post) => {
        const postCounts = countsMap.get(post._id.toString());
        if (postCounts) {
          post.likes = postCounts.likes || [];
          post.stars = postCounts.stars || [];
          post.comments = Array(postCounts.commentsCount || 0); // Placeholder array for count
        } else {
          post.likes = [];
          post.stars = [];
          post.comments = [];
        }
      });
    }

    // Check if there are more posts
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop(); // Remove the extra post
    }

    const lightweightPosts = mapPostSummaries(posts, req.user?._id);

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
        .select(
          "username profilePic coverImage bio location website socialLinks email dateJoined level xp totalXP achievements stats dailyChallengeStreak"
        )
        .lean(),
      Post.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1)
        .select("title imageUrl caption createdAt remixedFrom isGameArt")
        .populate({
          path: "remixedFrom",
          select: "imageUrl title userId",
          populate: { path: "userId", select: "username profilePic" },
        })
        .lean(),
      page === 1 ? Post.countDocuments({ userId }) : Promise.resolve(0), // Only count on first page
    ]);

    // Get likes, stars, and comments counts efficiently
    const postIds = posts.map((p) => p._id);
    const counts = await Post.aggregate([
      { $match: { _id: { $in: postIds } } },
      {
        $project: {
          _id: 1,
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          starsCount: { $size: { $ifNull: ["$stars", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
          likes: 1,
          stars: 1,
        },
      },
    ]);

    const countsMap = new Map(counts.map((c) => [c._id.toString(), c]));

    // Merge counts with posts
    posts.forEach((post) => {
      const postCounts = countsMap.get(post._id.toString());
      if (postCounts) {
        post.likes = postCounts.likes || [];
        post.stars = postCounts.stars || [];
        post.comments = Array(postCounts.commentsCount || 0);
      } else {
        post.likes = [];
        post.stars = [];
        post.comments = [];
      }
    });

    // Get followers/following counts efficiently
    const userCounts = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $project: {
          followersCount: { $size: { $ifNull: ["$followers", []] } },
          followingCount: { $size: { $ifNull: ["$following", []] } },
        },
      },
    ]);

    const userCountsData = userCounts[0] || {
      followersCount: 0,
      followingCount: 0,
    };

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
      caption: post.caption,
      createdAt: post.createdAt,
      likesCount: post.likesCount,
      commentCount: post.commentCount,
      remixedFrom: post.remixedFrom,
      isGameArt: post.isGameArt,
      userId: {
        _id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
    }));

    const sanitizedUser = {
      _id: user._id,
      username: user.username,
      profilePic: user.profilePic,
      coverImage: user.coverImage,
      bio: user.bio,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
      email: user.email,
      dateJoined: user.dateJoined,
      followersCount: userCountsData.followersCount,
      followingCount: userCountsData.followingCount,
      level: user.level,
      xp: user.xp,
      totalXP: user.totalXP,
      achievements: user.achievements,
      stats: user.stats,
      dailyChallengeStreak: user.dailyChallengeStreak,
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
