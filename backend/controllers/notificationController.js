import Notification from "../models/Notification.js";

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username profilePic")
      .populate("post", "imageUrl title")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await notification.deleteOne();

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to create a notification (used by other controllers)
export const createNotification = async ({
  recipient,
  sender,
  type,
  post,
  comment,
  gameCode,
  message,
}) => {
  try {
    // Don't notify yourself
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    // Check for duplicate notification (avoid spam)
    const existingNotification = await Notification.findOne({
      recipient,
      sender,
      type,
      post,
      comment,
      createdAt: { $gte: new Date(Date.now() - 60000) }, // Within last minute
    });

    if (existingNotification) {
      return existingNotification;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
      gameCode,
      message,
    });

    // Populate for real-time emission
    await notification.populate("sender", "username profilePic");
    if (post) await notification.populate("post", "imageUrl title");

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
