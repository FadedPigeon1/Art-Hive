import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username profilePic")
      .populate("group", "name icon")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get or create a conversation with a user
// @route   POST /api/messages/conversations
// @access  Private
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (userId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    })
      .populate("participants", "username profilePic")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "username profilePic")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "username" },
        });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Build query
    const query = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messagesPromise = Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("sender", "username profilePic")
      .lean();

    // Mark messages as read - Fire and forget
    Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    ).catch((err) => console.error("Error marking messages as read:", err));

    const messages = await messagesPromise;

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages/:conversationId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, type, attachments } = req.body;

    if ((!text || !text.trim()) && (!attachments || attachments.length === 0)) {
      return res
        .status(400)
        .json({ message: "Message text or attachment is required" });
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text: text ? text.trim() : "",
      type: type || "text",
      attachments: attachments || [],
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate message
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username profilePic"
    );

    // Emit real-time message to the conversation room
    if (global.io) {
      global.io.to(conversationId).emit("new-message", populatedMessage);

      // Also emit notification to participants if they are online but not in the chat room
      // (This part depends on how you track "in chat room" vs "online".
      // For simplicity, we just emit 'new-message' to the room which handles active chatters.
      // You might want a separate 'notification' event for others.)
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/messages/conversations/:conversationId
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete all messages
    await Message.deleteMany({ conversationId });

    // Delete conversation
    await conversation.deleteOne();

    res.json({ message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    });

    const conversationIds = conversations.map((c) => c._id);

    const count = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      sender: { $ne: req.user._id },
      read: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
