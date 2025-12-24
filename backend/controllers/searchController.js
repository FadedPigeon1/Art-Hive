import User from "../models/User.js";
import Post from "../models/Post.js";
import Group from "../models/Group.js";

// @desc    Search across Users, Posts, and Groups
// @route   GET /api/search
// @access  Public
export const searchAll = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(q, "i"); // Case-insensitive search

    // Run searches in parallel
    const [users, posts, groups] = await Promise.all([
      User.find({
        $or: [{ username: regex }, { displayName: regex }],
      })
        .select("username displayName profilePicture bio followers")
        .limit(5),

      Post.find({
        $or: [{ caption: regex }, { tags: regex }],
      })
        .populate("user", "username displayName profilePicture")
        .sort({ createdAt: -1 })
        .limit(5),

      Group.find({
        $or: [{ name: regex }, { description: regex }],
      })
        .select("name description members coverImage")
        .limit(5),
    ]);

    res.json({
      users,
      posts,
      groups,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};
