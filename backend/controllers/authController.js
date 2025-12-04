import { validationResult } from "express-validator";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { createNotification } from "./notificationController.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({
        message:
          userExists.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        dateJoined: user.dateJoined,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        dateJoined: user.dateJoined,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        dateJoined: user.dateJoined,
        followers: user.followers,
        following: user.following,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.profilePic = req.body.profilePic || user.profilePic;
      user.coverImage = req.body.coverImage || user.coverImage;
      user.location =
        req.body.location !== undefined ? req.body.location : user.location;
      user.website =
        req.body.website !== undefined ? req.body.website : user.website;

      if (req.body.socialLinks) {
        user.socialLinks = {
          ...user.socialLinks,
          ...req.body.socialLinks,
        };
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        coverImage: updatedUser.coverImage,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        socialLinks: updatedUser.socialLinks,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow a user
// @route   PUT /api/auth/follow/:userId
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
// @route   PUT /api/auth/unfollow/:userId
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
// @route   GET /api/auth/suggested
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
