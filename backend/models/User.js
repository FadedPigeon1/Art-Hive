import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profilePic: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    location: {
      type: String,
      maxlength: [50, "Location cannot exceed 50 characters"],
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    socialLinks: {
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    starredPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    // Progression System
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Daily Challenge Tracking
    dailyChallengeStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastChallengeCompletedAt: {
      type: Date,
      default: null,
    },
    completedChallenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DailyChallenge",
      },
    ],
    // Achievements
    achievements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        icon: { type: String, default: "" },
      },
    ],
    // Activity Statistics
    stats: {
      postsCreated: { type: Number, default: 0 },
      likesReceived: { type: Number, default: 0 },
      commentsReceived: { type: Number, default: 0 },
      commentsGiven: { type: Number, default: 0 },
      remixesCreated: { type: Number, default: 0 },
      remixesReceived: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      challengesCompleted: { type: Number, default: 0 },
      loginStreak: { type: Number, default: 0 },
      lastLoginDate: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add index for faster username searches
userSchema.index({ username: 1 });
// Add index for faster createdAt sorting (for suggested users)
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
