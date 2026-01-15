import Group from "../models/Group.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  try {
    const { name, description, icon, banner, isPrivate } = req.body;

    const groupExists = await Group.findOne({ name });

    if (groupExists) {
      return res.status(400).json({ message: "Group already exists" });
    }

    const group = await Group.create({
      name,
      description,
      icon,
      banner,
      isPrivate,
      creator: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
    });

    // Automatically create a conversation for this group
    await Conversation.create({
      participants: [req.user._id],
      isGroup: true,
      group: group._id,
      groupName: group.name,
      admin: req.user._id,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Public
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({});
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Public
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "username profilePic")
      .populate("admins", "username profilePic");

    if (group) {
      res.json(group);
    } else {
      res.status(404).json({ message: "Group not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a group
// @route   PUT /api/groups/:id/join
// @access  Private
const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User already in group" });
    }

    group.members.push(req.user._id);
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a group
// @route   PUT /api/groups/:id/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User not in group" });
    }

    // Remove user from members
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );

    // Remove user from admins if they are one
    group.admins = group.admins.filter(
      (adminId) => adminId.toString() !== req.user._id.toString()
    );

    await group.save();

    res.json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts for a specific group
// @route   GET /api/groups/:id/posts
// @access  Public
const getGroupPosts = async (req, res) => {
  try {
    const posts = await Post.find({ group: req.params.id })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a group
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res) => {
  try {
    const { name, description, icon, banner } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (!group.admins.includes(req.user._id)) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this group" });
    }

    group.name = name || group.name;
    group.description = description || group.description;
    group.icon = icon || group.icon;
    group.banner = banner || group.banner;

    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trending groups (most members)
// @route   GET /api/groups/trending
// @access  Public
const getTrendingGroups = async (req, res) => {
  try {
    const groups = await Group.aggregate([
      {
        $project: {
          name: 1,
          description: 1,
          icon: 1,
          membersCount: { $size: "$members" },
          isPrivate: 1,
        },
      },
      { $sort: { membersCount: -1 } },
      { $limit: 5 },
    ]);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  updateGroup,
  getTrendingGroups,
};
