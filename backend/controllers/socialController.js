import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// @desc    Follow a user
// @route   PUT /api/social/follow/:userId
// @access  Private
export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Can't follow yourself
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Add to following/followers
    currentUser.following.push(req.params.userId);
    userToFollow.followers.push(req.user._id);

    await currentUser.save();
    await userToFollow.save();

    // Create notification for followed user
    const notification = await createNotification({
      recipient: userToFollow._id,
      sender: req.user._id,
      type: "follow",
      message: `${req.user.username} started following you`,
    });

    // Emit real-time notification
    if (notification && global.io && global.userSockets) {
      const recipientSocketId = global.userSockets.get(
        userToFollow._id.toString()
      );
      if (recipientSocketId) {
        global.io.to(recipientSocketId).emit("new-notification", notification);
      }
    }

    res.json({ message: "User followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfollow a user
// @route   PUT /api/social/unfollow/:userId
// @access  Private
export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if not following
    if (!currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: "Not following this user" });
    }

    // Remove from following/followers
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.params.userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: "User unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/social/suggested
// @access  Private
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .select("following")
      .lean();

    // Find users that:
    // 1. Are not the current user
    // 2. Current user is not already following
    // 3. Have at least one post (optional, for quality suggestions)
    const suggestedUsers = await User.find({
      _id: {
        $ne: req.user._id,
        $nin: currentUser.following,
      },
    })
      .select("username profilePic bio")
      .sort({ createdAt: -1 }) // Show newer users first
      .limit(5)
      .lean();

    // Add cache headers
    res.setHeader("Cache-Control", "private, max-age=300"); // Cache for 5 minutes

    res.json(suggestedUsers);
  } catch (error) {
    console.error("Error in getSuggestedUsers:", error);
    res.status(500).json({ message: error.message });
  }
};
