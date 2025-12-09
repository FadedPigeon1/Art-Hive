import DailyChallenge from "../models/DailyChallenge.js";
import User from "../models/User.js";
import {
  awardXP,
  updateChallengeStreak,
  XP_REWARDS,
} from "../utils/progressionHelper.js";

// Predefined challenge prompts (same as frontend for consistency)
const CHALLENGE_PROMPTS = [
  "Cyberpunk Cat",
  "Floating Island",
  "Neon City",
  "Magical Forest",
  "Robot Musician",
  "Underwater Palace",
  "Space Garden",
  "Steampunk Airship",
  "Crystal Cave",
  "Desert Oasis",
  "Dragon's Lair",
  "Arctic Aurora",
  "Jungle Temple",
  "Cloud Castle",
  "Bioluminescent Beach",
];

/**
 * Get today's daily challenge
 * @route GET /api/challenges/today
 * @access Public
 */
export const getTodayChallenge = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let challenge = await DailyChallenge.findOne({
      date: today,
      isActive: true,
    });

    // If no challenge exists for today, create one
    if (!challenge) {
      const promptIndex =
        Math.floor(Date.now() / (1000 * 60 * 60 * 24)) %
        CHALLENGE_PROMPTS.length;
      const prompt = CHALLENGE_PROMPTS[promptIndex];

      challenge = await DailyChallenge.create({
        prompt,
        description: `Create your interpretation of: ${prompt}`,
        date: today,
        xpReward: XP_REWARDS.DAILY_CHALLENGE,
        difficulty: "medium",
      });
    }

    // Check if user has completed today's challenge
    let hasCompleted = false;
    if (req.user) {
      hasCompleted = challenge.completions.some(
        (completion) => completion.user.toString() === req.user._id.toString()
      );
    }

    res.json({
      success: true,
      challenge: {
        _id: challenge._id,
        prompt: challenge.prompt,
        description: challenge.description,
        date: challenge.date,
        xpReward: challenge.xpReward,
        difficulty: challenge.difficulty,
        completionsCount: challenge.completions.length,
        hasCompleted,
      },
    });
  } catch (error) {
    console.error("Error getting today's challenge:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Complete a daily challenge
 * @route POST /api/challenges/:challengeId/complete
 * @access Private
 */
export const completeChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { postId } = req.body;
    const userId = req.user._id;

    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    // Check if already completed
    const alreadyCompleted = challenge.completions.some(
      (completion) => completion.user.toString() === userId.toString()
    );

    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "You have already completed this challenge",
      });
    }

    // Check if challenge is still active (same day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const challengeDate = new Date(challenge.date);
    challengeDate.setHours(0, 0, 0, 0);

    if (challengeDate.getTime() !== today.getTime()) {
      return res.status(400).json({
        success: false,
        message: "This challenge is no longer active",
      });
    }

    // Add completion to challenge
    challenge.completions.push({
      user: userId,
      post: postId || null,
      completedAt: new Date(),
    });

    await challenge.save();

    // Update user
    const user = await User.findById(userId);

    // Update challenge streak
    const streakUpdated = updateChallengeStreak(user, new Date());

    if (!streakUpdated) {
      return res.status(400).json({
        success: false,
        message: "Challenge already completed today",
      });
    }

    // Add to completed challenges
    if (!user.completedChallenges.includes(challengeId)) {
      user.completedChallenges.push(challengeId);
    }

    // Update stats
    user.stats.challengesCompleted += 1;

    await user.save();

    // Award XP (includes level check and achievement check)
    const xpResult = await awardXP(
      userId,
      challenge.xpReward,
      "Completed daily challenge"
    );

    res.json({
      success: true,
      message: "Challenge completed!",
      xpAwarded: challenge.xpReward,
      streak: user.dailyChallengeStreak,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      newAchievements: xpResult.newAchievements,
      currentXP: xpResult.currentXP,
      xpForNextLevel: xpResult.xpForNextLevel,
    });
  } catch (error) {
    console.error("Error completing challenge:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get user's challenge history
 * @route GET /api/challenges/history
 * @access Private
 */
export const getChallengeHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "completedChallenges",
      options: { sort: { date: -1 }, limit: 30 },
    });

    res.json({
      success: true,
      completedChallenges: user.completedChallenges,
      streak: user.dailyChallengeStreak,
      totalCompleted: user.stats.challengesCompleted,
      lastCompletedAt: user.lastChallengeCompletedAt,
    });
  } catch (error) {
    console.error("Error getting challenge history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get challenge leaderboard
 * @route GET /api/challenges/leaderboard
 * @access Public
 */
export const getChallengeLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topUsers = await User.find()
      .sort({ "stats.challengesCompleted": -1 })
      .limit(limit)
      .select(
        "username profilePic stats.challengesCompleted dailyChallengeStreak level"
      );

    res.json({
      success: true,
      leaderboard: topUsers.map((user, index) => ({
        rank: index + 1,
        userId: user._id,
        username: user.username,
        profilePic: user.profilePic,
        challengesCompleted: user.stats.challengesCompleted,
        streak: user.dailyChallengeStreak,
        level: user.level,
      })),
    });
  } catch (error) {
    console.error("Error getting challenge leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get user progression stats
 * @route GET /api/challenges/progression
 * @access Private
 */
export const getProgression = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const xpForNextLevel = Math.floor(100 * Math.pow(user.level, 1.5));
    const progressPercent = Math.floor((user.xp / xpForNextLevel) * 100);

    res.json({
      success: true,
      progression: {
        level: user.level,
        xp: user.xp,
        totalXP: user.totalXP,
        xpForNextLevel,
        progressPercent,
        stats: user.stats,
        achievements: user.achievements,
        dailyChallengeStreak: user.dailyChallengeStreak,
        lastChallengeCompletedAt: user.lastChallengeCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error getting progression:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
